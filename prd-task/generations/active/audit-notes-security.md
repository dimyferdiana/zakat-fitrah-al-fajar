# Audit Notes — Security Analysis (Task 3.0)

## Severity Guide
- Critical: Data leak, credential in shipped bundle, auth bypass, injection path
- High: Unvalidated input to DB, XSS, missing auth on sensitive page, mass assignment
- Medium: Missing debounce causing excessive queries, partial validation, permissive CORS
- Low: Missing trim/max on low-risk fields, informational RLS notes

## 3.1 Credential Exposure — Source Files

**Finding 1 — Low: Mock credentials exposed in Login.tsx UI (demo-mode only)**

File: `src/pages/Login.tsx:104-106`

When `VITE_OFFLINE_MODE=true`, the Login page renders the mock credentials (email + plaintext password) directly in the UI:

```tsx
<div>Admin: {MOCK_CREDENTIALS.admin.email} / {MOCK_CREDENTIALS.admin.password}</div>
<div>Bendahara: {MOCK_CREDENTIALS.bendahara.email} / {MOCK_CREDENTIALS.bendahara.password}</div>
<div>Panitia: {MOCK_CREDENTIALS.panitia.email} / {MOCK_CREDENTIALS.panitia.password}</div>
```

The `MOCK_CREDENTIALS` object is exported from `src/lib/mockAuth.ts:109-113` and the passwords are derived via `getDemoPassword(role) = \`${role}123\`` (e.g., `admin123`). These are trivially guessable.

**Risk:** These credentials are bundled into the production build (`dist/`) regardless of whether `VITE_OFFLINE_MODE` is true or false, because the import is unconditional. Any attacker who reverse-engineers the bundle finds the mock passwords even if the UI code-path is guarded by a runtime check.

**Finding 2 — Low: No hardcoded Supabase URL or JWT in source files**

The grep for `supabase.co` and `eyJ[A-Za-z0-9]` in `src/` and `supabase/functions/` returned no hits. The Supabase client is correctly initialized from `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (`src/lib/supabase.ts:4-5`). The Edge Function reads `Deno.env.get('SUPABASE_URL')`, `Deno.env.get('SUPABASE_ANON_KEY')`, and `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` — all via environment injection, not hardcoded.

## 3.2 Credential Exposure — Built Bundle

**Finding — Low (informational): Supabase project URL present in bundle (expected)**

The built bundle `dist/assets/index-CifjZBZO.js` contains:

```
zuykdhqdklsskgrtwejg.supabase.co
```

This is the Supabase project URL derived from `VITE_SUPABASE_URL`. This is **expected and not a vulnerability**. Vite intentionally inlines `VITE_*` environment variables at build time. The URL is the project's public hostname; it is not a secret.

**No JWT or service_role key found in the bundle.** The grep for `eyJ[A-Za-z0-9_-]{50,}` returned no results, meaning neither the anon key (which would be acceptable) nor any service_role key (which would be critical) was found embedded in the JavaScript bundle.

The `SUPABASE_SERVICE_ROLE_KEY` is only accessed server-side inside the Edge Function via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` and never reaches the client bundle.

## 3.3 Input Validation Gaps (Zod schemas)

**Finding 1 — Low: MuzakkiForm — `alamat` and `no_telp` missing `.max()` and `.trim()`**

File: `src/components/muzakki/MuzakkiForm.tsx:25-29`

```ts
const formSchema = z.object({
  nama_kk: z.string().min(3, ...).max(100),      // max present, no .trim()
  alamat: z.string().min(5, ...),                  // no .max(), no .trim()
  no_telp: z.string().optional(),                  // no .max(), no .trim()
});
```

`alamat` has no upper bound — a user could submit a 100,000-character string that passes validation and goes to the DB. No `.trim()` means leading/trailing whitespace is stored.

**Finding 2 — Low: WargaForm — most optional fields missing `.max()` and `.trim()`**

File: `src/components/data-master/WargaForm.tsx:20-33`

```ts
const schema = z.object({
  nama_kk: z.string().min(1, ...),              // no .max(), no .trim()
  alamat: z.string().min(1, ...),               // no .max(), no .trim()
  rt: z.string().optional(),                     // no .max(), no .trim()
  rw: z.string().optional(),                     // no .max(), no .trim()
  no_telp: z.string().optional(),                // no .max(), no .trim()
  keterangan: z.string().optional(),             // no .max(), no .trim()
});
```

**Finding 3 — Low: MustahikForm — `nama`, `alamat`, `catatan` missing `.max()` and `.trim()`**

File: `src/components/mustahik/MustahikForm.tsx:34-41`

```ts
const formSchema = z.object({
  nama: z.string().min(3, ...),         // no .max(), no .trim()
  alamat: z.string().min(5, ...),       // no .max(), no .trim()
  no_telp: z.string().optional(),       // no .max(), no .trim()
  catatan: z.string().optional(),       // no .max(), no .trim()
});
```

**Finding 4 — Low: QurbanEventDialog — `nama`, `catatan` missing `.max()` and `.trim()`**

File: `src/components/qurban/QurbanEventDialog.tsx:26-30`

```ts
const eventSchema = z.object({
  nama: z.string().min(1, ...),     // no .max(), no .trim()
  catatan: z.string().optional(),   // no .max(), no .trim()
});
```

**Finding 5 — Low: Login schema — `password` missing `.max()`**

File: `src/pages/Login.tsx:31-34`

```ts
const loginSchema = z.object({
  email: z.string().email(...),
  password: z.string().min(6, ...),   // no .max() — allows arbitrarily long bcrypt-DoS payload
});
```

No `.max()` on a password field enables a long-password DoS where bcrypt computation time scales with input size. Recommended limit: `.max(72)` (bcrypt truncates at 72 bytes anyway).

**Finding 6 — Low: UserForm — `nama_lengkap`, `email` missing `.max()` and `.trim()`**

File: `src/components/settings/UserForm.tsx:33-44`

```ts
const formSchema = z.object({
  nama_lengkap: z.string().min(3, ...),   // no .max(), no .trim()
  email: z.string().email(...),            // no .max(), no .trim()
  ...
});
```

**Finding 7 — Low: DataMasterMustahik inline schema — same gaps**

File: `src/pages/DataMasterMustahik.tsx:37-45`

Parallel Zod schema to `MustahikForm` — same fields, same missing `.max()` and `.trim()`.

## 3.4 URL Parameter Injection

**Finding 1 — Low: Register.tsx — `token` from URL passed to Edge Function without pre-validation**

File: `src/pages/Register.tsx:33-35`, `59`

```ts
const token = searchParams.get('token');
...
validateInvitationToken(token)    // token passed directly — any string accepted
```

The raw URL token is passed to `validateInvitationToken`. The Edge Function (`supabase/functions/invitation-manager/index.ts:190`) hashes it with SHA-256 before a DB lookup, so there is no SQL injection path. However, there is no client-side length check or character allowlist on `token` before it is sent over the network. A very large token value would still be hashed server-side (no server-side length check either). **Risk: low** — hashing mitigates injection; no direct DB query exposure.

**Finding 2 — Low: Dashboard.tsx — `?d=` URL param used as dashboard ID without UUID validation**

File: `src/pages/Dashboard.tsx:33-38`

```ts
const urlDashboardId = searchParams.get('d') ?? undefined;
const activeDashboardId = urlDashboardId ?? dashboards[0]?.id;
```

`urlDashboardId` is used as the argument to `useDashboardWidgets(activeDashboardId)`. Inside that hook, it flows into a Supabase `.eq('dashboard_id', id)` call. Since Supabase's PostgREST layer type-checks UUID columns and rejects non-UUID strings at the DB level, there is no injection path. **Risk: low** — recommend adding `isUuid(urlDashboardId)` guard for defensive clarity.

**Finding 3 — Low: QurbanScan.tsx — `?eventId=` passed to state without UUID validation**

File: `src/pages/QurbanScan.tsx:240-241`

```ts
const initialEventId = searchParams.get('eventId')
const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId)
```

Used downstream in `useRedeemCouponByToken` and coupon validation. Same mitigation as above — PostgREST rejects non-UUID values at the DB level. No injection path identified.

## 3.5 Missing Debounce — Security Angle

**Finding 1 — Medium: DataMasterWarga.tsx — debounce implemented incorrectly (leaky timer)**

File: `src/pages/DataMasterWarga.tsx:44-50`

```ts
const handleSearchChange = useCallback((val: string) => {
  setSearch(val)
  setPage(1)
  // Simple debounce via setTimeout
  const timer = setTimeout(() => setDebouncedSearch(val), 300)
  return () => clearTimeout(timer)   // return value from useCallback is IGNORED by callers
}, [])
```

The cleanup function is returned from `handleSearchChange`, but `handleSearchChange` is called from an `onChange` handler (`onChange={(e) => handleSearchChange(e.target.value)}`). The returned cleanup is discarded — the timer is **never cancelled**. Every keystroke creates a new 300ms timer that fires unconditionally, meaning rapid typing fires N separate Supabase queries (one per keystroke after 300ms each). This defeats the intended debounce.

**Impact:** Under fast typing, each character produces one query to `muzakki` table after 300ms. A 20-character search fires 20 queries in quick succession rather than 1.

**Finding 2 — No debounce issue found on other search inputs:**
- `MustahikTable.tsx:76-81` — proper `useEffect` + `setTimeout` debounce (500ms)
- `Muzakki.tsx (Muzakki page):92-103` — proper `useEffect` + `setTimeout` debounce (500ms)
- `DataMasterMustahik.tsx:81-85` — debounce via inline `setTimeout` inside state setter (similar leak pattern but uses `setDebouncedSearch` through `handleSearchChange` at line 82-85 — also leaky, same pattern as DataMasterWarga)
- `QurbanTable.tsx` — search only fires on Enter key or button click, no debounce needed
- `AddPesertaDialog.tsx:67-69` — search fires when `searchQuery.length >= 2` as a `useQuery` dependency; no debounce, but the query is gated by minimum length. Each character past 2 fires a query. **Medium** risk — excessive queries to `muzakki` table.

**Finding 3 — Medium: AddPesertaDialog.tsx — no debounce on muzakki search**

File: `src/components/qurban/AddPesertaDialog.tsx:67-68`

```ts
const { data: searchResults = [], isLoading: isSearching } = useMuzakkiSearch(
  searchQuery.length >= 2 ? searchQuery : ''
)
```

`searchQuery` state is updated on every `onChange` event (line 176). No debounce — every keystroke after the 2nd character fires a Supabase query via `useMuzakkiSearch`.

## 3.6 Authentication Bypass

**All sensitive routes are protected. No auth bypass found.**

Analysis of `src/App.tsx`:

Public routes (no `ProtectedRoute`):
- `/login` — `Login` page (intentionally public)
- `/register` — `Register` page (intentionally public; requires valid invitation token to proceed)
- `/email-confirmation` — `EmailConfirmation` page (intentionally public)
- `/forgot-password` — `ForgotPassword` page (intentionally public)
- `/reset-password` — `ResetPassword` page (intentionally public)

All other routes are wrapped in `<ProtectedRoute>`. The `ProtectedRoute` component (`src/components/auth/ProtectedRoute.tsx`) correctly:
1. Shows a spinner while `loading` is true (prevents flash of protected content)
2. Redirects to `/login` if `user` is null
3. Redirects to `/login` if `user.is_active` is false
4. Shows an "Access Denied" screen if `allowedRoles` is specified and user's role is not in the list

**Note — Low: `/data-master/warga` and `/data-master/mustahik` have no `allowedRoles` restriction**

```tsx
// App.tsx:262-280
<Route path="/data-master/warga" element={<ProtectedRoute>...DataMasterWarga /></ProtectedRoute>} />
<Route path="/data-master/mustahik" element={<ProtectedRoute>...DataMasterMustahik /></ProtectedRoute>} />
```

Any authenticated user (including a `viewer` role if one existed) can reach these pages. The write operations within these pages call hooks that rely on Supabase RLS to enforce role checks at the DB level. The front-end `hasRole(['admin'])` check on line 77 of `DataMasterWarga.tsx` hides the "Import" button for non-admin users but does not prevent direct API calls. This is acceptable given RLS is enforced server-side, but should be noted.

## 3.7 XSS Surface

**Finding 1 — Low: `thermalCouponPrint.ts` uses `document.write` into a new window with SVG content**

File: `src/lib/thermalCouponPrint.ts:88`

```ts
win.document.write(html)
```

The HTML string is written to a popup window for thermal printing. All user-supplied strings are passed through the `esc()` function (defined at lines 95-101) which escapes `&`, `<`, `>`, and `"`:

```ts
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

The one un-escaped value in the template is `${svgStr}` (line 72), which is the serialized output of `new XMLSerializer().serializeToString(svgClone)`. This SVG is generated server-side from a QR code element — it is not user-controlled text.

**Verdict:** The XSS risk here is mitigated. The `esc()` function is applied to all fields derived from DB records, and the SVG is generated from application logic, not user input. However, `document.write` is an outdated API. The correct modern approach is to use `document.open()` / `document.write()` / `document.close()` is acceptable for a print popup, but recommend replacing with `win.document.body.innerHTML = html` using proper DOM APIs or a Blob URL approach.

**No `dangerouslySetInnerHTML` found anywhere in the codebase.** No raw `innerHTML` assignments found. XSS attack surface is very small.

## 3.8 Mass Assignment

**Finding 1 — Medium: `WargaImportDialog.tsx` — bulk import uses `as any` type cast on insert payload**

File: `src/components/data-master/WargaImportDialog.tsx:117`

```ts
const { error } = await supabase.from('muzakki').insert(toInsert as any)
```

The `toInsert` array is built from validated CSV rows (lines 105-115), but the `as any` cast bypasses TypeScript's column allowlist checking. An attacker who can manipulate the CSV file could in theory inject additional fields (e.g., `user_id`, `id`). However, Supabase's PostgREST will ignore unknown columns, and RLS policies restrict which rows can be inserted. The `as any` is a code quality issue that removes compile-time safety — not a direct runtime vulnerability because RLS is enforced.

**Recommendation:** Build an explicit typed object or use Zod parse to strip unexpected fields before insert.

**Finding 2 — Low: `useDashboardConfig.ts` — `.update(rest)` spreads form fields directly**

File: `src/hooks/useDashboardConfig.ts:201-204`

```ts
const { id, ...rest } = input;
const { data, error } = await db
  .from('dashboard_configs')
  .update(rest)
  .eq('id', id)
```

`rest` is derived from the form input object. If the `input` type definition is loose or the form is manipulated, extra fields would be sent to the update. However, the TypeScript type system constrains `input` to known fields, and Supabase ignores unrecognized columns. The RLS policy ensures only admins can update. Risk is low but the spread pattern is worth noting.

**No pure `{...formData}` spread-all-fields patterns found** in hooks examined. Most insert/update calls explicitly list columns rather than spreading raw form objects. The Supabase client library also strips unrecognized columns at the DB level.

## 3.9 RLS Coverage Matrix

Tables found across all 40 migrations, and their RLS coverage:

| Table | Has RLS + Policy | Migration(s) | Notes |
|-------|-----------------|--------------|-------|
| `users` | Yes | 002, 015, 017, 018 | Multiple policy revisions; final: SECURITY DEFINER functions |
| `tahun_zakat` | Yes | 002 | Admin write + all-read |
| `kategori_mustahik` | Yes | 002 | Admin write + all-read |
| `muzakki` | Yes | 002, 019 | Revised in 019 with is_active check |
| `pembayaran_zakat` | Yes | 002, 019 | Revised in 019 |
| `mustahik` | Yes | 002, 019 | Revised in 019 |
| `distribusi_zakat` | Yes | 002, 019 | Revised in 019 |
| `audit_logs` | Yes | 002 | Admin full + own-logs read |
| `pemasukan_uang` | Yes | 005, 019 | Revised in 019 |
| `hak_amil` | Yes | 005 | Admin insert/update |
| `rekonsiliasi` | Yes | 005, 019 | Revised in 019 |
| `bukti_sedekah` | Yes | 008 | Admin + petugas CRUD |
| `pemasukan_beras` | Yes | 012 | Uses older `get_user_role()` function (not the SECURITY DEFINER version) |
| `user_invitations` | Yes | 014, 015, 016 | Admin-only CRUD |
| `hak_amil_configs` | Yes | 024 | Admin write, admin+petugas read |
| `hak_amil_snapshots` | Yes | 024 | Admin write, admin+petugas read |
| `bulk_submission_logs` | Yes | 026 | Admin full + petugas insert-own |
| `dashboard_configs` | Yes | 027 | Admin write, public-visibility read |
| `dashboard_widgets` | Yes | 027 | Follows dashboard_configs visibility |
| `accounts` | Yes | 029 | Admin + bendahara write |
| `account_ledger_entries` | Yes | 029 | Admin + bendahara write |
| `transaction_tags` | Yes | 032 | Admin write, all-authenticated read |
| `qurban_registrations` | Yes | 033 | Admin + petugas write |
| `qurban_participants` | **Partial** | 033 (RLS enabled, no explicit policy) | RLS enabled but no policy found — effectively **DENY ALL**. See note below. |
| `qurban_events` | Yes | 035 | Admin write only |
| `qurban_animals` | Yes | 035 | Admin + petugas write |
| `qurban_shares` | Yes | 035 | Admin + petugas write |
| `qurban_coupons` | Yes | 037 | Admin + petugas write |
| `org_settings` | Yes | 039 | Admin write, active-user read |
| `upz_units` | Yes | 039 | Admin + petugas write |

**Critical Finding — `qurban_participants` table: RLS enabled but no SELECT/INSERT/UPDATE/DELETE policies defined**

Migration 033 (`033_create_qurban_tables.sql`) calls:
```sql
ALTER TABLE public.qurban_participants ENABLE ROW LEVEL SECURITY;
```
But **no `CREATE POLICY` statement appears for `qurban_participants`** in any of the 40 migration files. When RLS is enabled without any permissive policy, PostgreSQL defaults to DENY ALL — no authenticated user can read or write to this table, and the application silently returns empty results or insert errors.

This is likely a configuration oversight (the policy was forgotten when the table was created). The application probably works because Supabase may have a default permissive policy for the project, or this table is not heavily queried in production yet.

**Severity: High** — if RLS is actively blocking reads, participants data is silently invisible. If there is a fallback permissive policy, the table is unprotected.

## 3.10 Edge Function Security

**Function: `supabase/functions/invitation-manager/index.ts`**

### (a) Secrets — Deno.env.get used correctly
All secrets are accessed via environment injection:
- `Deno.env.get('SUPABASE_URL')` (line 52)
- `Deno.env.get('SUPABASE_ANON_KEY')` (line 53)
- `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` (line 64)
- `Deno.env.get('FRONTEND_URL')` (line 160)

No hardcoded credentials found. `FRONTEND_URL` defaults to `'http://localhost:5173'` when the env var is missing — in production this must be set correctly or invitation links point to localhost.

### (b) CORS — Permissive wildcard `*` present
File: `index.ts:29-32`

```ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

`Access-Control-Allow-Origin: *` allows any origin to call this Edge Function from a browser. Since the function requires a valid `Authorization: Bearer <token>` JWT for sensitive actions (`createInvitation`), the risk is mitigated for privileged operations. However, `validateInvitation` and `registerUser` actions do NOT require an Authorization header — they only need a token from the URL. A malicious website could probe token validation from any origin.

**Severity: Medium** — recommend restricting to the production frontend origin (e.g., `FRONTEND_URL` env var).

### (c) Request body validation — Present but incomplete
- `createInvitation`: validates `email` format (via `isValidEmail`) and `role` enum. Good.
- `validateInvitation`: validates token presence. Good.
- `registerUser`: validates token, email, password presence and password length. Good.

**Gap:** No explicit check that the HTTP method is POST before parsing the body (other than handling `OPTIONS` for CORS preflight). A GET request would attempt `await req.json()` which would fail with an unhandled error caught by the outer try/catch, returning a 500. Not exploitable, but bad practice.

### (d) HTTP method check — Missing
File: `index.ts:42-47`

```ts
serve(async (req: RequestEvent) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  // No check for req.method === 'POST'
```

Non-POST requests (GET, PUT, DELETE) will fall through to `await req.json()`, causing a parsing error. This is caught and returns a 500 JSON error. Not exploitable but should be guarded with an explicit `if (req.method !== 'POST') return 405`.

### (e) FRONTEND_URL default — Low risk
File: `index.ts:160`

```ts
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';
```

If `FRONTEND_URL` is not set in the Supabase Edge Function environment, invitation links would contain `http://localhost:5173/register?token=...`. These links would be sent by email and be non-functional in production. This is a configuration risk, not a security vulnerability, but should be validated on deploy.

## 3.11 Severity Assignments

| ID | Section | Description | Severity |
|----|---------|-------------|----------|
| SEC-01 | 3.9 | `qurban_participants` table: RLS enabled, no policies defined — table may be inaccessible or unprotected | **High** |
| SEC-02 | 3.10 | Edge Function: `Access-Control-Allow-Origin: *` allows any origin to call token validation endpoints | **Medium** |
| SEC-03 | 3.5 | `DataMasterWarga.tsx`: debounce implemented incorrectly — every keystroke fires a Supabase query (timer leak) | **Medium** |
| SEC-04 | 3.5 | `DataMasterMustahik.tsx`: same leaky debounce pattern as DataMasterWarga | **Medium** |
| SEC-05 | 3.5 | `AddPesertaDialog.tsx`: no debounce on muzakki search — every keystroke ≥ 2 chars fires a query | **Medium** |
| SEC-06 | 3.8 | `WargaImportDialog.tsx`: `as any` cast on bulk insert bypasses TypeScript column allowlist | **Medium** |
| SEC-07 | 3.10 | Edge Function: no HTTP method check — non-POST requests reach body parsing | **Low** |
| SEC-08 | 3.10 | Edge Function: `FRONTEND_URL` env var missing fallback warning — defaults to localhost in production if unset | **Low** |
| SEC-09 | 3.1 | `src/lib/mockAuth.ts` + `Login.tsx`: mock credentials in bundle (offline mode only); passwords are `role123` | **Low** |
| SEC-10 | 3.3 | Multiple Zod schemas missing `.max()` on text fields — allows arbitrarily large strings to DB | **Low** |
| SEC-11 | 3.3 | Multiple Zod schemas missing `.trim()` — leading/trailing whitespace stored in DB | **Low** |
| SEC-12 | 3.3 | `Login.tsx`: password field missing `.max(72)` — enables bcrypt long-password computation attack | **Low** |
| SEC-13 | 3.4 | `Register.tsx`, `Dashboard.tsx`, `QurbanScan.tsx`: URL params used in queries without UUID format validation (mitigated by PostgREST) | **Low** |
| SEC-14 | 3.6 | `/data-master/warga` and `/data-master/mustahik` routes have no `allowedRoles` restriction — any authenticated user can access | **Low** |
| SEC-15 | 3.7 | `thermalCouponPrint.ts`: uses `document.write` (deprecated API) but correctly escapes user data | **Low** |
| SEC-16 | 3.8 | `useDashboardConfig.ts`: `.update(rest)` spreads form fields — TypeScript mitigates but no runtime column filtering | **Low** |

## 3.12 Remediation Code Examples (Critical + High)

### SEC-01 — High: Add missing RLS policies for `qurban_participants`

**Problem:** `qurban_participants` has RLS enabled (`033_create_qurban_tables.sql`) but zero policies. When RLS is on with no policies, PostgreSQL denies all access from the authenticated role. The table stores participant names for each qurban registration.

**Before (migration 033 — missing block):**
```sql
ALTER TABLE public.qurban_participants ENABLE ROW LEVEL SECURITY;
-- No policies defined
```

**After (add as a new migration, e.g. `041_qurban_participants_rls.sql`):**
```sql
-- RLS policies for qurban_participants
-- Follows the same pattern as qurban_registrations in migration 033

ALTER TABLE public.qurban_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qurban_participants_select_admin_petugas_viewer_active" ON public.qurban_participants;
DROP POLICY IF EXISTS "qurban_participants_insert_admin_petugas_active" ON public.qurban_participants;
DROP POLICY IF EXISTS "qurban_participants_update_admin_petugas_active" ON public.qurban_participants;
DROP POLICY IF EXISTS "qurban_participants_delete_admin_petugas_active" ON public.qurban_participants;

CREATE POLICY "qurban_participants_select_admin_petugas_viewer_active"
  ON public.qurban_participants FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas', 'viewer')
  );

CREATE POLICY "qurban_participants_insert_admin_petugas_active"
  ON public.qurban_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_participants_update_admin_petugas_active"
  ON public.qurban_participants FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_participants_delete_admin_petugas_active"
  ON public.qurban_participants FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );
```

---

### SEC-02 — Medium: Restrict Edge Function CORS to production origin

**Problem:** `Access-Control-Allow-Origin: *` allows any website to call the invitation validation endpoint, which is unauthenticated.

**Before (`supabase/functions/invitation-manager/index.ts:29-32`):**
```ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**After:**
```ts
// Read allowed origin from env, fall back to localhost for local dev
const allowedOrigin = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Vary': 'Origin',
};
```

Also add a missing HTTP method guard before body parsing:

**Before (no method check after OPTIONS handler):**
```ts
serve(async (req: RequestEvent) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  // immediately tries req.json() regardless of method
  const { action, ... } = await req.json();
```

**After:**
```ts
serve(async (req: RequestEvent) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Now safe to parse body
  const { action, ... } = await req.json();
```

---

### SEC-03/04 — Medium: Fix leaky debounce in DataMasterWarga and DataMasterMustahik

**Problem:** Debounce inside `useCallback` returns a cleanup that is never called by the `onChange` handler.

**Before (`src/pages/DataMasterWarga.tsx:44-50`):**
```ts
const handleSearchChange = useCallback((val: string) => {
  setSearch(val)
  setPage(1)
  const timer = setTimeout(() => setDebouncedSearch(val), 300)
  return () => clearTimeout(timer)  // caller ignores this return value
}, [])
```

**After (use `useRef` to hold the timer, or a proper `useEffect` pattern):**
```ts
const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

const handleSearchChange = useCallback((val: string) => {
  setSearch(val)
  setPage(1)
  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current)
  }
  debounceTimerRef.current = setTimeout(() => setDebouncedSearch(val), 300)
}, [])
```

---

### SEC-05 — Medium: Add debounce to muzakki search in AddPesertaDialog

**Problem:** `searchQuery` state updates on every keystroke, triggering `useMuzakkiSearch` on each character.

**Before (`src/components/qurban/AddPesertaDialog.tsx:63-69`):**
```ts
const [searchQuery, setSearchQuery] = useState('')

const { data: searchResults = [], isLoading: isSearching } = useMuzakkiSearch(
  searchQuery.length >= 2 ? searchQuery : ''
)
```

**After (add a debounced search term):**
```ts
const [searchQuery, setSearchQuery] = useState('')
const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300)
  return () => clearTimeout(timer)
}, [searchQuery])

const { data: searchResults = [], isLoading: isSearching } = useMuzakkiSearch(
  debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : ''
)
```
