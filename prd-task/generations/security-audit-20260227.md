# Security Audit Report — Zakat Fitrah Al-Fajar

**Date:** 2026-02-27
**Auditors:** Security Agent Team (4 agents in parallel)
**Scope:** Credentials, Database/RLS, Frontend Auth, Edge Functions & API
**Branch:** `feat/revamp-menu-account-ledger`

---

## Executive Summary

| Severity | Count |
|---|---|
| CRITICAL | 7 |
| HIGH | 10 |
| MEDIUM | 8 |
| LOW | 4 |
| **Total** | **29** |

**Overall Risk Level: HIGH**

The most dangerous issues are a **privilege escalation vulnerability** in the `invitation-manager` Edge Function (any authenticated user can create admin accounts) and a **production Supabase service role key** sitting in a plaintext `.env` file on disk. These two issues alone represent an active, exploitable attack surface.

---

## Scope & Agent Assignments

| Agent | Area Covered |
|---|---|
| Agent 1 — Credentials | `.env` files, hardcoded secrets, git history, gitignore |
| Agent 2 — Database/RLS | SQL migrations, RLS policies, SECURITY DEFINER functions |
| Agent 3 — Frontend Auth | Route protection, session management, RBAC, XSS, hooks |
| Agent 4 — Edge Functions | Supabase Edge Functions, CORS, rate limiting, input validation |

---

## CRITICAL Findings

### C1 — Supabase Service Role Key Exposed on Disk

**Severity:** CRITICAL
**Agent:** Credentials
**File:** `zakat-fitrah-app/.env`

The `.env` file contains the production **service role key** (`VITE_SUPABASE_SERVICE_ROLE_KEY`). This key bypasses all Row Level Security and grants full unrestricted database access to anyone who reads the file.

```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  (production JWT)
VITE_SUPABASE_SERVICE_ROLE_KEY=sb_secret_...  ← CRITICAL: Full DB access
```

**Risk:**
- If the development machine is compromised, stolen, or backed up to iCloud/Google Drive/Time Machine, the entire production database is exposed
- The service role key should **never** appear in a `VITE_*` variable — Vite would bundle it into the browser build
- Anyone with these keys can read, write, and delete all data bypassing RLS

**Immediate Actions:**
1. Rotate keys immediately in Supabase Dashboard → Settings → API
2. Move all secrets to Vercel Environment Variables — delete the local `.env` file
3. Never assign the service role key to a `VITE_*` prefixed variable

---

### C2 — Privilege Escalation: No Admin Role Check in Edge Function

**Severity:** CRITICAL
**Agent:** Edge Functions
**File:** `supabase/functions/invitation-manager/index.ts:72–128`

The `createInvitation` action only verifies a Bearer token exists but **never checks if the caller is an admin**. Any authenticated user (including `petugas` role) can call this endpoint and create new accounts with the `admin` role.

**Vulnerable Code:**
```typescript
if (action === 'createInvitation') {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  // ← NO ROLE CHECK HERE. Proceeds to create invitation for any role including 'admin'
```

**Attack Flow:**
1. Attacker authenticates as a `petugas` user
2. Calls `invitation-manager` with `action: 'createInvitation'` and `role: 'admin'`
3. Edge Function never validates the caller's role
4. New admin account is created, attacker has full system access

**Fix — Add role check immediately after user retrieval:**
```typescript
const { data: userData } = await supabaseAdmin
  .from('users')
  .select('role, is_active')
  .eq('id', currentUser.id)
  .single();

if (!userData || userData.role !== 'admin' || !userData.is_active) {
  return new Response(
    JSON.stringify({ error: 'Forbidden: admin access required' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

### C3 — Wildcard CORS Configuration in Edge Function

**Severity:** CRITICAL
**Agent:** Edge Functions
**File:** `supabase/functions/invitation-manager/index.ts:29–31`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Any website can call this API
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

When combined with C2, any malicious website can trigger privilege escalation against logged-in users via cross-site requests.

**Fix:**
```typescript
const allowedOrigins = [
  'https://zakat-fitrah-al-fajar.vercel.app',
  'http://localhost:5173', // dev only
];
const origin = req.headers.get('origin') ?? '';
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

### C4 — No HTTP Method Restriction in Edge Function

**Severity:** CRITICAL
**Agent:** Edge Functions
**File:** `supabase/functions/invitation-manager/index.ts:42–46`

The function only handles `OPTIONS` explicitly. All other HTTP methods (`GET`, `DELETE`, `PUT`, `HEAD`) are processed identically to `POST`. State-changing operations (registration, invitation creation) can be triggered via `GET` requests, which may be cached, logged in browser history, or sent via `<img src="...">` tags.

**Fix — Add method guard before action routing:**
```typescript
if (req.method !== 'POST') {
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

### C5 — Vercel OIDC Token Stored in `.env.local`

**Severity:** CRITICAL
**Agent:** Credentials
**File:** `zakat-fitrah-app/.env.local:9`

A Vercel OIDC token for your project owner account is stored in plaintext. The token payload reveals:
- Owner: `dimy-ferdiana's-projects-f5ad759d`
- Project: `zakat-fitrah-al-fajar`
- Environment: `development`
- Team ID: `team_5FNTC9ufnkdfuIj3PXHKcHO9`

Even if expired, this is a dangerous pattern — tokens get refreshed and a future valid token could end up here.

**Actions:**
1. Delete the `VERCEL_OIDC_TOKEN` line from `.env.local`
2. Use `vercel login` for CLI authentication — tokens are managed by the CLI, not `.env` files
3. Verify this file was never synced to a cloud backup service

---

### C6 — Demo Credentials Displayed on Login Page

**Severity:** CRITICAL
**Agent:** Frontend
**File:** `src/pages/Login.tsx:103–108`

When `VITE_OFFLINE_MODE=true`, all role credentials are rendered in plaintext in the browser for every visitor:

```tsx
{OFFLINE_MODE && (
  <AlertDescription>
    <div>Admin: {MOCK_CREDENTIALS.admin.email} / {MOCK_CREDENTIALS.admin.password}</div>
    <div>Bendahara: {MOCK_CREDENTIALS.bendahara.email} / {MOCK_CREDENTIALS.bendahara.password}</div>
    <div>Panitia: {MOCK_CREDENTIALS.panitia.email} / {MOCK_CREDENTIALS.panitia.password}</div>
  </AlertDescription>
)}
```

Passwords follow the predictable pattern: `role + "123"` (e.g., `admin123`, `bendahara123`).

**Actions:**
1. Ensure `VITE_OFFLINE_MODE` is never `true` in Vercel production environment variables
2. Add a build-time assertion in `vite.config.ts`:
   ```typescript
   if (process.env.VITE_OFFLINE_MODE === 'true' && process.env.NODE_ENV === 'production') {
     throw new Error('VITE_OFFLINE_MODE must not be enabled in production');
   }
   ```

---

### C7 — `account_latest_balances` View Bypasses RLS

**Severity:** CRITICAL
**Agent:** Database
**File:** `supabase/migrations/034_account_latest_balances_view.sql`

The view uses `security_invoker = true` but has **no RLS policies defined on it**. The `account_ledger_entries` table has proper RLS, but the view creates a bypass path — any authenticated user can query the view and see all account balances regardless of their role.

```sql
CREATE OR REPLACE VIEW public.account_latest_balances
WITH (security_invoker = true)  -- RLS runs as caller, but NO policies on view itself
AS
SELECT DISTINCT ON (account_id)
  account_id,
  running_balance_after_rp AS current_balance,
  entry_date AS last_entry_date
FROM public.account_ledger_entries
ORDER BY account_id, effective_at DESC, created_at DESC;
```

**Fix:**
```sql
-- Views cannot have RLS directly, convert to a function or add filtering
CREATE OR REPLACE VIEW public.account_latest_balances
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (ale.account_id)
  ale.account_id,
  ale.running_balance_after_rp AS current_balance,
  ale.entry_date               AS last_entry_date
FROM public.account_ledger_entries ale
WHERE public.get_current_user_is_active()
  AND public.get_current_user_role() IN ('admin', 'bendahara', 'petugas')
ORDER BY ale.account_id, ale.effective_at DESC, ale.created_at DESC;
```

---

## HIGH Findings

### H1 — Audit Log INSERT Policy Is Fully Permissive

**Severity:** HIGH
**Agent:** Database
**File:** `supabase/migrations/002_rls_policies.sql:252–258`

Any authenticated user (including `viewer` role) can insert arbitrary records into the audit log, compromising the integrity of your audit trail.

```sql
CREATE POLICY "System can insert audit_logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- No role or active-status validation
```

**Fix:**
```sql
DROP POLICY "System can insert audit_logs" ON public.audit_logs;
CREATE POLICY "System can insert audit_logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_current_user_is_active());
```

---

### H2 — No Input Validation in SECURITY DEFINER Functions

**Severity:** HIGH
**Agent:** Database
**File:** `supabase/migrations/009_sedekah_receipt_numbers.sql:22–50`

The `next_bukti_sedekah_number()` and `peek_bukti_sedekah_number()` functions silently fall through to a default `'LAI'` prefix for any unrecognized `category_key`. This masks data entry bugs and could corrupt receipt numbering sequences.

```sql
prefix := CASE p_category_key
  WHEN 'infak' THEN 'INF'
  WHEN 'zakat' THEN 'ZKT'
  -- ...
  ELSE 'LAI'  -- Silently accepts ANY input, including garbage
END;
```

**Fix — Add explicit validation at the start of both functions:**
```sql
IF p_category_key NOT IN ('infak', 'zakat', 'sahabat quran', 'bank infak', 'santunan yatim dan dhuafa', 'lainnya') THEN
  RAISE EXCEPTION 'Invalid category_key: %', p_category_key
    USING ERRCODE = 'P0001';
END IF;
```

---

### H3 — Client-Side-Only Role Enforcement

**Severity:** HIGH
**Agent:** Frontend
**File:** `src/components/auth/ProtectedRoute.tsx:32–43`

Route protection and role gating happen entirely in the browser. An attacker can modify React state or Zustand store in browser DevTools to bypass all access checks:

```typescript
// Any role can be bypassed by modifying browser state
if (allowedRoles && !allowedRoles.includes(user.role)) {
  return <div>Access Denied</div>;
}
```

**Note:** The Supabase RLS policies serve as the real authorization layer. Client-side checks are UI-only. The risk is acceptable **if** RLS is correctly configured, but C2 shows the server-side checks are also missing in the Edge Function.

**Action:** Add server-side role verification in all Edge Functions. Never rely solely on client-side checks for security.

---

### H4 — Error Messages Leak Database Structure

**Severity:** HIGH
**Agent:** Frontend
**File:** `src/hooks/useMuzakki.ts:866–868`, `src/hooks/useAccountsLedger.ts`

Raw database error messages (constraint names, table names, column names) are passed directly to users via toast notifications:

```typescript
console.error('Split payment transaction error:', error);
const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
throw new Error(`Transaksi gagal: ${errorMessage}`); // ← DB internals shown to user
```

**Fix — Generic user-facing messages, detailed server-side logging:**
```typescript
console.error('Payment error:', error); // Keep for debugging
toast.error('Transaksi gagal. Silakan coba lagi.'); // Generic message to user
```

---

### H5 — No CSRF Protection on State-Changing Operations

**Severity:** HIGH
**Agent:** Frontend
**Files:** All mutation hooks (`usePembayaran`, `useCreateAccount`, etc.)

React Query mutations have no CSRF token validation. A malicious website can trigger financial transactions against a logged-in user.

**Mitigation:** Supabase's use of Bearer tokens in the `Authorization` header provides some CSRF protection (simple form-based CSRF can't set custom headers). However, if the app is ever vulnerable to XSS, CSRF becomes exploitable. Confirm that all Supabase calls use Bearer token authentication and not cookie-based sessions.

---

### H6 — Edge Function Returns Sensitive Auth Error Messages

**Severity:** HIGH
**Agent:** Edge Functions
**File:** `supabase/functions/invitation-manager/index.ts:337–342`

Auth error details are returned directly to the client, enabling user enumeration:

```typescript
return new Response(
  JSON.stringify({ error: `Failed to create account: ${authError.message}` }), // ← Leaks internals
  { status: 500 }
);
```

**Fix:**
```typescript
console.error('[invitation-manager] Auth creation error:', authError); // Server log
return new Response(
  JSON.stringify({ error: 'Failed to create account. Please try again.' }), // Generic
  { status: 500 }
);
```

---

### H7 — No Request Body Size Limit in Edge Function

**Severity:** HIGH
**Agent:** Edge Functions
**File:** `supabase/functions/invitation-manager/index.ts:67`

No payload size validation before parsing JSON — an attacker can send a 100MB+ body to exhaust memory or trigger timeouts:

```typescript
const { action, email, role, token, password } = await req.json(); // No size check
```

**Fix:**
```typescript
const contentLength = req.headers.get('content-length');
if (contentLength && parseInt(contentLength) > 10_000) { // 10KB limit
  return new Response(
    JSON.stringify({ error: 'Request body too large' }),
    { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

---

### H8 — Predictable Session Tokens in Offline Mode

**Severity:** HIGH
**Agent:** Frontend
**File:** `src/lib/mockAuth.ts:67`

Mock session tokens are generated as `mock-token-${Date.now()}` — a predictable, timestamp-based value. Any attacker knowing the approximate login time can forge a valid session token.

```typescript
token: `mock-token-${Date.now()}` // Predictable format
localStorage.setItem(SESSION_KEY, JSON.stringify(session)); // Stored unencrypted
```

This is mitigated by the offline mode being a demo feature, but if accidentally enabled in production it becomes a critical vulnerability.

---

### H9 — Missing NOT NULL Constraint on `users.email`

**Severity:** HIGH
**Agent:** Database
**File:** `supabase/migrations/001_initial_schema_safe.sql:42`

The `email` column has a `UNIQUE` constraint but no `NOT NULL`. PostgreSQL's UNIQUE constraint allows multiple `NULL` values, meaning user records can exist with no email address.

```sql
email TEXT UNIQUE  -- Missing NOT NULL
```

**Fix:**
```sql
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;
```

---

### H10 — Auth Check in Ledger Mutations Has Silent Failure Path

**Severity:** HIGH
**Agent:** Frontend
**File:** `src/hooks/useAccountsLedger.ts:252–267`

If `supabase.auth.getUser()` fails (network error, expired session), the code catches the `null` user but the flow may still reach downstream Supabase calls with `userId = null`:

```typescript
const { data: auth } = await supabase.auth.getUser();
const userId = auth.user?.id ?? null;

if (!userId) {
  throw new Error('User tidak terautentikasi');
}
// But: if the throw isn't caught properly, downstream code runs with null userId
```

**Action:** Wrap in a try-catch that prevents any further execution and forces re-authentication.

---

## MEDIUM Findings

| ID | Area | Issue | File |
|---|---|---|---|
| M1 | Database | `audit_logs` schema has `old_data`/`new_data` columns added late (migration 025) — schema drift risk | `migrations/025` |
| M2 | Database | Three inconsistent RLS helper functions: `get_user_role()`, `get_current_user_role()`, `is_admin()` | `migrations/002, 018, 027` |
| M3 | Database | `bukti_sedekah_counters` has RLS enabled but zero policies defined — relies on implicit deny | `migrations/009:20-21` |
| M4 | Database | `dashboard_configs` uses custom `is_admin()` function instead of standard `get_current_user_role()` | `migrations/027:78-84` |
| M5 | Database | Missing composite index on `account_ledger_entries(account_id, entry_date DESC)` | `migrations/028:79-94` |
| M6 | Edge Function | Email validation regex too permissive — allows `a@b.c`, `@domain.com` | `functions/.../utils.ts:33-35` |
| M7 | Edge Function | Minimum password length is 8 — NIST SP 800-63B recommends 12+ with no complexity bypass | `functions/index.ts:322-328` |
| M8 | Edge Function | No rate limiting on token validation — invitation tokens can be brute-forced without penalty | `functions/index.ts` |

---

## LOW Findings

| ID | Area | Issue |
|---|---|---|
| L1 | Frontend | `console.error()` with full error objects in production build leaks DB details in browser console |
| L2 | Frontend | Session timer is fixed 8 hours — not reset on user activity, causes mid-operation logouts |
| L3 | Frontend | `@ts-expect-error` in `useProfile.ts` suppresses type safety on the users update payload |
| L4 | Frontend | No Content Security Policy headers configured (Vercel may provide defaults but unverified) |

---

## What Is Done Well

| Area | Positive Finding |
|---|---|
| Git hygiene | No secrets committed to git history. `.env` and `.env*.local` are properly gitignored |
| RLS coverage | 27/27 tables have RLS enabled (100%) |
| Token security | Invitation tokens use SHA-256 hashing — plaintext tokens never stored in DB |
| XSS prevention | Zero uses of `dangerouslySetInnerHTML` or `innerHTML` — React JSX escapes all output |
| Admin protection | Trigger-based guard prevents deactivating the last active admin account |
| Audit trail | JSONB `old_data`/`new_data` columns capture before/after state on sensitive records |
| Security headers | `vercel.json` configures `X-Content-Type-Options`, `X-Frame-Options`, and XSS protection headers |
| Auth SDK | Supabase Auth SDK used correctly — session tokens injected via Bearer header, not exposed in URLs |
| Parameterized queries | All Supabase SDK calls use parameterized queries — no raw SQL injection vectors in application code |

---

## Remediation Plan

### Phase 1 — Deploy within 24 hours

> Stop the bleeding. These issues are actively exploitable.

- [ ] Rotate Supabase production anon key and service role key in dashboard
- [ ] Move secrets to Vercel Environment Variables — remove `.env` file from disk
- [ ] Add admin role check to `createInvitation` in Edge Function **(C2)**
- [ ] Restrict Edge Function CORS to frontend domain **(C3)**
- [ ] Enforce POST-only in Edge Function **(C4)**
- [ ] Delete `VERCEL_OIDC_TOKEN` from `.env.local` **(C5)**
- [ ] Verify `VITE_OFFLINE_MODE` is not set in Vercel production environment **(C6)**

### Phase 2 — This sprint

> Core hardening. Fixes high-impact issues before next release.

- [ ] Fix `account_latest_balances` view — add `WHERE` clause enforcing role check **(C7)**
- [ ] Fix `audit_logs` INSERT policy — replace `WITH CHECK (true)` with `get_current_user_is_active()` **(H1)**
- [ ] Add input validation to `next_bukti_sedekah_number()` and `peek_bukti_sedekah_number()` **(H2)**
- [ ] Add request body size limit to Edge Function **(H7)**
- [ ] Replace raw `${error.message}` in Edge Function responses with generic strings **(H6)**
- [ ] Add `NOT NULL` constraint to `users.email` **(H9)**
- [ ] Replace raw `${error.message}` in mutation hooks toasts with generic strings **(H4)**

### Phase 3 — Next sprint

> Defense in depth. Reduces attack surface and improves maintainability.

- [ ] Add CSRF defense review — confirm all state-changing calls use Bearer auth header **(H5)**
- [ ] Consolidate RLS helper functions — replace `is_admin()` and `get_user_role()` with `get_current_user_role()` **(M2, M4)**
- [ ] Add explicit RLS policies to `bukti_sedekah_counters` **(M3)**
- [ ] Add composite index: `account_ledger_entries(account_id, entry_date DESC)` **(M5)**
- [ ] Strengthen password validation: min 12 chars, reject common passwords **(M7)**
- [ ] Add rate limiting to invitation token validation **(M8)**
- [ ] Improve email validation regex in Edge Function utils **(M6)**
- [ ] Fix session timer: reset on user activity, not just on login **(L2)**
- [ ] Add build-time assertion preventing `VITE_OFFLINE_MODE=true` in production builds

---

## Files Referenced

| File | Issues |
|---|---|
| `zakat-fitrah-app/.env` | C1 |
| `zakat-fitrah-app/.env.local` | C5 |
| `supabase/functions/invitation-manager/index.ts` | C2, C3, C4, H6, H7 |
| `supabase/functions/invitation-manager/utils.ts` | M6 |
| `supabase/migrations/001_initial_schema_safe.sql` | H9 |
| `supabase/migrations/002_rls_policies.sql` | H1, M2 |
| `supabase/migrations/009_sedekah_receipt_numbers.sql` | H2, M3 |
| `supabase/migrations/010_sedekah_receipt_number_preview.sql` | H2 |
| `supabase/migrations/027_dashboard_configs.sql` | M4 |
| `supabase/migrations/028_accounts_and_account_ledger_schema.sql` | M5 |
| `supabase/migrations/034_account_latest_balances_view.sql` | C7 |
| `src/lib/mockAuth.ts` | C6, H8 |
| `src/pages/Login.tsx` | C6 |
| `src/components/auth/ProtectedRoute.tsx` | H3 |
| `src/lib/auth.tsx` | L2 |
| `src/hooks/useMuzakki.ts` | H4 |
| `src/hooks/useAccountsLedger.ts` | H10 |
| `src/hooks/useProfile.ts` | L3 |

---

*Generated by Security Agent Team — 2026-02-27*
*Agents: Credentials Auditor · Database/RLS Auditor · Frontend Auth Auditor · Edge Functions Auditor*
