# Audit Notes — Code Quality + Database Analysis (Tasks 4.0 + 5.0)

## 4.1 Code Duplication

### (a) Identical `.from('table').select(...)` blocks copy-pasted across multiple hooks

**Group 1 — `tahun_zakat` active lookup (sequential sequential queries instead of a shared context)**
Identical pattern in `useDashboard.ts` (lines 78-83) and `useMonthlyPemasukan` within the same file (lines 317-325):
```ts
const { data: activeTahun } = await supabase
  .from('tahun_zakat')
  .select('id')
  .eq('is_active', true)
  .single();
activeTahunId = (activeTahun as { id: string } | null)?.id;
```
This sequential query appears at the start of both `useDashboardStats` and `useMonthlyPemasukan`. Since both hooks are mounted simultaneously on the same page, the database is queried twice for the same data.

**Group 2 — Ledger entry lookup by source ID (three near-identical blocks)**
The pattern of finding an existing ledger entry by a source FK column appears verbatim in three separate exported async functions:
- `usePemasukanUang.ts` → `updatePemasukanUangLedgerEntry()` and `deletePemasukanUangLedgerEntry()`
- `usePemasukanBeras.ts` → `updatePemasukanBerasLedgerEntry()` and `deletePemasukanBerasLedgerEntry()`

Example from `usePemasukanUang.ts` (lines 117-130):
```ts
const { data: existingLedger, error: existingLedgerError } = await (supabase
  .from('account_ledger_entries')
  .select as any)('id')
  .eq('source_pemasukan_uang_id', input.pemasukanUangId)
  .maybeSingle();
if (existingLedgerError) throw existingLedgerError;
if (!existingLedger?.id) {
  await createPemasukanUangLedgerEntry(input);
  return;
}
```
And from `usePemasukanBeras.ts` (lines 118-130), identical except the FK column name differs:
```ts
const { data: existingLedger, error: existingLedgerError } = await (supabase
  .from('account_ledger_entries')
  .select as any)('id')
  .eq('source_pemasukan_beras_id', input.pemasukanBerasId)
  .maybeSingle();
```

**Group 3 — Account name resolution pattern**
`usePemasukanUang.ts` (lines 66-88) and `useRekonsiliasi.ts` (lines 37-58) both implement a `resolveXAccountId()` function with the same structure: look up the accounts table by name, fall back to KAS. The only differences are field names. This is ~40 lines of duplicated logic.

**Suggested abstraction:**
```ts
// lib/accounts.ts
export async function resolveAccountId(
  preferredName: string,
  fallbackName = 'KAS'
): Promise<string> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, account_name')
    .in('account_name', [preferredName, fallbackName])
    .eq('is_active', true);
  if (error) throw error;
  const matched = (data || []).find(a => a.account_name === preferredName)
    || (data || []).find(a => a.account_name === fallbackName);
  if (!matched?.id) throw new Error(`Account not found: ${preferredName}`);
  return matched.id;
}
```

**Group 4 — React Query invalidation after mutations**
All three pemasukan hooks (`usePemasukanUang.ts`, `usePemasukanBeras.ts`, `useMuzakki.ts`) invalidate the same 5 query keys on every create/update/delete:
```ts
queryClient.invalidateQueries({ queryKey: ['pemasukan-uang'] });    // or beras
queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
queryClient.invalidateQueries({ queryKey: ['monthly-pemasukan'] });
queryClient.invalidateQueries({ queryKey: ['hak-amil-monthly-summary'] });
queryClient.invalidateQueries({ queryKey: ['hak-amil-yearly-summary'] });
```
This pattern is duplicated across 6 mutation functions in those two files.

### (b) Repeated error toast patterns

The pattern `toast.error(\`Gagal menyimpan...: ${error.message}\`)` and `toast.success('...')` appears in every mutation's `onError`/`onSuccess` across all 25+ mutations — effectively the same boilerplate ~50 times. Files affected: `usePemasukanUang.ts`, `usePemasukanBeras.ts`, `useMuzakki.ts`, `useMustahik.ts`, `useDistribusi.ts`, `useNilaiZakat.ts`, `useRekonsiliasi.ts`, `useHakAmil.ts`, `useAccountsLedger.ts`, `useDashboardConfig.ts`, `useQurban.ts`, `useQurbanAnimals.ts`, `useQurbanShares.ts`, `useQurbanEvents.ts`, `useOrgSettings.ts`, `useUsers.ts`, `useInvitations.ts`.

**Suggested abstraction:**
```ts
// A shared mutation factory that wraps onSuccess/onError
function withToastCallbacks(
  successMsg: string,
  errorPrefix: string,
  extraInvalidations?: string[][]
) { ... }
```

### (c) Repeated loading/error state management

All `useQuery` and `useMutation` hooks return `{ data, isLoading, error, mutate }` objects — this is React Query's built-in pattern and no additional abstraction is needed. However, the offline-mode guard `if (OFFLINE_MODE) return offlineStore.xxx(...)` appears as the first statement in every `queryFn` across ~15 hooks, which is a consistent pattern that could be abstracted via a factory wrapper.

---

## 4.2 Dead Code

Analysis was performed by inspecting named exports across hooks, lib modules, and components, then verifying their presence in import statements across the codebase.

| Export name | Defined in | Import count | Assessment |
|---|---|---|---|
| `useDonor` | `hooks/useDonor.ts` | 0 (not found in any import) | Likely dead — `useSedekahReceipts` handles receipt creation separately |
| `validateInvitationToken` | `hooks/useInvitations.ts` | Used in register page | Alive |
| `registerUserWithInvitation` | `hooks/useInvitations.ts` | Used in register page | Alive |
| `createMuzakkiRecord` | `hooks/useMuzakki.ts` | Exported but check if imported outside hook | Potentially internal only |
| `updateMuzakkiRecord` | `hooks/useMuzakki.ts` | Exported but check if imported outside hook | Potentially internal only |
| `createPemasukanUangLedgerEntry` | `hooks/usePemasukanUang.ts` | Called within same file only | Could be unexported |
| `updatePemasukanUangLedgerEntry` | `hooks/usePemasukanUang.ts` | Called within same file only | Could be unexported |
| `deletePemasukanUangLedgerEntry` | `hooks/usePemasukanUang.ts` | Called within same file only | Could be unexported |
| `createPemasukanBerasLedgerEntry` | `hooks/usePemasukanBeras.ts` | Called within same file only | Could be unexported |
| `updatePemasukanBerasLedgerEntry` | `hooks/usePemasukanBeras.ts` | Called within same file only | Could be unexported |
| `deletePemasukanBerasLedgerEntry` | `hooks/usePemasukanBeras.ts` | Called within same file only | Could be unexported |
| `createRekonsiliasiLedgerEntry` | `hooks/useRekonsiliasi.ts` | Called within same file only | Could be unexported |
| `deleteRekonsiliasiLedgerEntry` | `hooks/useRekonsiliasi.ts` | Called within same file only | Could be unexported |
| `getDateRangeForPeriod` | `hooks/useHakAmil.ts` | Used in HakAmil page | Alive |
| `APP_NAME` | `lib/constants.ts` | Used in branding | Alive |
| `ORG_SERVICE` | `lib/constants.ts` | Check usage in thermal print | Verify |
| `submitBulk` | `hooks/useBulkPembayaran.ts` | Called from BulkPage | Alive |

**Note:** The ledger entry helper functions in `usePemasukanUang.ts`, `usePemasukanBeras.ts`, and `useRekonsiliasi.ts` are exported but appear to only be used within their own files. They should be converted to unexported module-level functions or moved to `lib/`.

---

## 4.3 Inconsistent Error Handling

### Category A — Error surfaced to user via toast/throw (GOOD)

All standard CRUD mutations in: `usePemasukanUang.ts`, `usePemasukanBeras.ts`, `useMuzakki.ts`, `useMustahik.ts`, `useDistribusi.ts`, `useNilaiZakat.ts`, `useRekonsiliasi.ts`, `useHakAmil.ts`, `useAccountsLedger.ts`, `useQurban.ts`, `useQurbanAnimals.ts`, `useQurbanShares.ts`, `useQurbanEvents.ts`, `useQurbanCoupons.ts`, `useOrgSettings.ts`, `useTransactionTags.ts`, `useInvitations.ts`, `useProfile.ts`, `useUsers.ts`.

### Category B — Logged to console only (NEEDS IMPROVEMENT)

**`useDashboard.ts` — `useDashboardStats` (lines 77-83, all sub-queries)**
Every Supabase call inside `useDashboardStats` uses destructured `{ data }` without `error`. Errors from all 10+ sub-queries (pembayaran_zakat, distribusi_zakat, pemasukan_uang, pemasukan_beras, rekonsiliasi, hak_amil, hak_amil_configs) are silently discarded. The only errors explicitly checked are `zakatError`, `uangError`, `berasError` in `useMonthlyPemasukan`.

Example (silent — no error variable captured):
```ts
const { data: pemasukanBeras } = await supabase   // ← error discarded
  .from('pembayaran_zakat')
  .select('jumlah_beras_kg')
  .eq('tahun_zakat_id', activeTahunId)
  .eq('jenis_zakat', 'beras');
```

**`useDonor.ts` — `useSearchDonor` (lines 46-48) and `useDonor` (lines 85-87)**
Errors are logged to `console.error` and the hook returns `[]` or `null` respectively:
```ts
if (error) {
  console.error('Error searching donors:', error);
  return [];
}
```
The user receives no feedback that the search failed.

**`useDonor.ts` — `useSearchDonor` catch block (lines 61-64)**
```ts
} catch (err) {
  console.error('Exception searching donors:', err);
  return [];
}
```

**`usePemasukanUang.ts` — hak amil snapshot creation (lines 287-290)**
```ts
} catch (snapshotError) {
  console.error('Failed to create hak amil snapshot:', snapshotError);
  // Don't fail the entire transaction if snapshot fails
}
```
Rationale comment is present (intentional silent degradation), but auditors should know this means hak amil data can silently be missing.

**`usePemasukanBeras.ts` — same pattern (lines 287-290)**
Same as above for beras snapshots.

**`usePemasukanBeras.ts` — update hak amil snapshot (lines 362-364)**
Same silent swallow.

**`usePemasukanUang.ts` — update hak amil snapshot (lines 362-364)**
Same silent swallow.

**`useMuzakki.ts` — split payment transaction error (lines 725-729)**
```ts
} catch (error) {
  console.error('Split payment transaction error:', error);
  const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
  throw new Error(`Transaksi gagal: ${errorMessage}`);
}
```
This is Category A — it logs AND rethrows. Acceptable.

**`useBulkPembayaran.ts` — bulk log failure (lines 205-208)**
```ts
} catch (logErr) {
  console.error('[bulk] Failed to log submission:', logErr);
}
```
Intentional silent degradation (logging failure should not abort the submission).

**`useUsers.ts` — `useUsersList` (lines 55-59)**
```ts
if (error.code === 'PGRST301' || error.message.includes('403')) {
  console.warn('User management requires service role access');
  return [];
}
```
Swallows permission errors silently; user sees empty list with no explanation.

### Category C — Error silently swallowed (BAD)

**`useQurbanDashboard.ts` — ALL queries (lines 10-47)**
Every single query in `useQurbanDashboardStats` uses destructured `{ data }` without checking the `error` field:
```ts
const { data: animals } = await animalsQ;          // error discarded
const { data: shares } = await sharesQ;            // error discarded
const { data: coupons } = await couponsQ;          // error discarded
const { data: events } = await supabase...;        // error discarded
```
If any of these queries fail (e.g., RLS policy violation or network error), the dashboard silently shows zeros with no user feedback.

---

## 4.4 Magic Numbers and Strings

### `lib/constants.ts` existing constants
Only three constants exist: `APP_NAME`, `ORG_NAME`, `ORG_SERVICE`. No financial or business-logic constants are defined.

### Magic numbers found (not in constants.ts)

| Value | File | Line context | Should be constant |
|---|---|---|---|
| `2.5` | `useMuzakki.ts` line 562 | Offline default nilai_beras_kg | `DEFAULT_NILAI_BERAS_KG` |
| `45000` | `useMuzakki.ts` line 562 | Offline default nilai_uang_rp | `DEFAULT_NILAI_UANG_RP` |
| `12.5` | `useHakAmil.ts` lines 425-430, 537 | Default hak amil persen zakat fitrah/maal | `DEFAULT_PERSEN_HAK_AMIL_ZAKAT` |
| `20.0` | `useHakAmil.ts` line 428 | Default hak amil persen infak | `DEFAULT_PERSEN_HAK_AMIL_INFAK` |
| `0.0` | `useHakAmil.ts` lines 429-430 | Default persen fidyah/beras | `DEFAULT_PERSEN_FIDYAH` |
| `30000` | `useDashboard.ts` line 263 | Auto-refresh interval (30 seconds) | `DASHBOARD_REFRESH_INTERVAL_MS` |
| `7` | `useQurbanDashboard.ts` line 35, `useQurbanShares.ts` line 228 | Max slots for sapi | `MAX_SLOTS_SAPI` |
| `1` | `useQurbanDashboard.ts` line 36 | Max slots for kambing | Acceptable (1 is semantically clear) |
| `24` | `invitation-manager/index.ts` line 136 | Invitation expiry hours | `INVITATION_EXPIRY_HOURS` |
| `8` | `invitation-manager/index.ts` line 323 | Minimum password length | `MIN_PASSWORD_LENGTH` |
| `100` | `useSedekahReceipts.ts` line 28 | Hard limit on receipts list | `RECEIPTS_LIST_LIMIT` |
| `20` | Multiple hooks | Default page size | `DEFAULT_PAGE_SIZE` |
| `10` | `useDonor.ts` line 44 | Search result limit | `DONOR_SEARCH_LIMIT` |
| `50` | `useTransactionTags.ts` line 65 | Max tag name length | `MAX_TAG_NAME_LENGTH` |
| `2026` | `useDashboard.ts` via `OFFLINE_STATS_2026`, `useNilaiZakat.ts` line 57 | Hardcoded year in offline mode | Should derive from active tahun |

### Magic strings found (repeated 3+ times)

| String | Files | Occurrences | Assessment |
|---|---|---|---|
| `'KAS'` | `usePemasukanUang.ts`, `usePemasukanBeras.ts`, `useRekonsiliasi.ts` | 3 | Extract to `DEFAULT_KAS_ACCOUNT_NAME` — partially done in some files but duplicated |
| `'BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT'` | `usePemasukanUang.ts`, `useRekonsiliasi.ts` | 2 | Hardcoded bank account name — high risk if account name changes |
| `'infak_sedekah_uang'` | `useDashboard.ts`, `useHakAmil.ts`, `useMuzakki.ts`, `useBulkPembayaran.ts` | 4+ | Should use the TypeScript enum/type already defined |
| `'zakat_fitrah_uang'` | Multiple hooks | 4+ | Same — use existing type |
| `'tahun-zakat-list'` | `useDashboard.ts`, `useNilaiZakat.ts` | 2 | Should be a shared query key constant |
| `'dashboard-stats'` | 6+ hooks that invalidate it | 6+ | Should be a shared query key constant |

---

## 4.5 Type Safety Gaps

### (a) `: any` and `as any` annotations

| File | Pattern | Risk |
|---|---|---|
| `useDashboard.ts` lines 153-162 | `(p: any) => p.kategori === '...'` on pemasukanUangData | Type lost after fetching — should be typed |
| `useDashboard.ts` lines 175-185 | `(p: any) =>` on pemasukanBerasData | Same |
| `useDashboard.ts` lines 204-205 | `(r: any) =>` on rekonsiliasiData | Same |
| `usePemasukanUang.ts` lines 73-88 | `(supabase.from('accounts').select as any)` | Cast to bypass type system |
| `usePemasukanUang.ts` lines 100, 117, 131, 249, 325-327 | Multiple `.insert as any`, `.update as any` | Disables type checking on DB operations |
| `usePemasukanBeras.ts` lines 59-72, 101, 118, 133 | Same pattern | Same |
| `useDistribusi.ts` lines 175, 179-181, 192-198, 253-258, 272 | `(pemasukanData as any)`, `(distribusiData as any)` | Type assertions |
| `useMuzakki.ts` lines 191, 476, 519, 533, 548 | `(matchingMuzakki.map((m: any) => m.id)` etc. | Multiple any usages |
| `useRekonsiliasi.ts` lines 44, 172, 202 | `(supabase...select as any)`, `(item: any)`, `(userData as any)` | Role check untyped |
| `useMustahik.ts` lines 194, 217, 250, 286, 314, 350, 362 | `.insert as any`, `.update as any`, `(m: any)` | Frequent use of any |
| `useDashboardConfig.ts` line 51 | `const db = supabase as any` | Entire supabase client cast to any for new tables |
| `useOrgSettings.ts` lines 46-47, 62-63, 92, 106, 120, 134, 159 | `(supabase as any)` | Entire client cast |
| `useQurbanDashboard.ts` lines 22-23, 29, 32-35, 50-64 | `shareList as any[]`, `(r: any)` | Frequent any in aggregation |
| `useQurbanShares.ts` lines 224, 278-296 | `(animal: any)`, `(row: any)` | Map callbacks untyped |
| `useDonor.ts` lines 52, 90, 127, 154, 165, 179, 194 | `(row: any)`, `(insertedData as any)`, `(existingByName as any)` | Extensive any usage |
| `useHakAmil.ts` lines 536-543 | Type assertions on config/tahun data | Verbose cast pattern |

### (b) Raw `.data` access without type assertion or Zod parse

Multiple hooks destructure `{ data }` directly from Supabase and access it without validation. Examples:
- `useDashboard.ts`: `(pemasukanUangData || []).filter((p: any) => ...)` — data is `any[]` after `as any` usage
- `useMustahik.ts` line 194: `(distribusiData.map((item: any) => ...)` in `usePreviousYearMustahik`
- `useQurbanDashboard.ts`: All four queries return untyped data operated on directly

### (c) Missing return type annotations on exported hooks

The following exported hooks lack explicit TypeScript return type annotations:

| Hook | Return type inferred | Should be explicit |
|---|---|---|
| `useMustahikList` | inferred | `UseQueryResult<{data: Mustahik[]; totalCount: number}>` |
| `useDistribusiList` | inferred | `UseQueryResult<{data: Distribusi[]; totalCount: number}>` |
| `useKategoriMustahik` | inferred | `UseQueryResult<KategoriMustahik[]>` |
| `usePreviousYearMustahik` | inferred | `UseQueryResult<Mustahik[]>` |
| `useQurbanList` | explicit ✓ | OK |
| `useQurbanDashboardStats` | explicit ✓ | OK |
| `useDashboardStats` | explicit ✓ | OK |

---

## 4.6 Edge Function Quality

### File: `supabase/functions/invitation-manager/index.ts`

**Duplication:**
The invitation validation logic (checking `used_at`, `revoked_at`, expiry) is duplicated verbatim between the `validateInvitation` action (lines 209-240) and the `registerUser` action (lines 296-320). This is ~30 lines of identical logic that should be extracted to a helper function `validateInvitationState(invitation)`.

**Dead helper functions:**
None found. All imported helpers from `utils.ts` (`generateToken`, `hashToken`, `isValidEmail`, `normalizeEmail`) appear to be used.

**Error handling:**
- Good: All code paths return proper HTTP responses with status codes (400, 401, 409, 500).
- Issue: The outer `try/catch` (line 391) catches all unhandled errors and returns 500 — acceptable behavior.
- Issue: `console.error` calls (lines 152, 338, 356) log errors to Deno logs but these are server-side, not client-visible — acceptable.
- Issue: When profile creation fails after auth user creation (line 356), the rollback `await supabaseAdmin.auth.admin.deleteUser(authData.user.id)` (line 359) does NOT check its own error response. If the rollback fails, there could be a dangling auth user without a profile.

**Magic values:**
| Value | Line | Should be constant |
|---|---|---|
| `24` (hours) | 136 | `INVITATION_EXPIRY_HOURS = 24` |
| `8` (password min length) | 323 | `MIN_PASSWORD_LENGTH = 8` |
| `'admin'`, `'petugas'` | 96-98 | Should reference a shared role type |
| `'http://localhost:5173'` | 160 | Default fallback URL — acceptable as fallback |

**CORS issue:**
Line 30: `'Access-Control-Allow-Origin': '*'` — wildcard CORS is permissive but acceptable for Supabase Edge Functions since the client-side anon key provides authentication. However, this means any website can invoke this function directly.

**TypeScript types:**
- The `InvitationRequest` interface (lines 34-40) is defined and used — good.
- The response types are not explicitly typed (returns `new Response(JSON.stringify(...))`) — acceptable for Edge Functions.
- `// deno-lint-ignore-file no-explicit-any` at the top suppresses all `any` linting — the file otherwise does not use `any` heavily.

---

## 4.7 Schema Evolution Timeline

| Migration | Tables Created | Tables Altered | Policies Added | Notable |
|-----------|---------------|----------------|----------------|---------|
| 001 | `users`, `tahun_zakat`, `kategori_mustahik`, `muzakki`, `pembayaran_zakat`, `mustahik`, `distribusi_zakat`, `audit_logs` | — | — | Triggers for `updated_at`; trigger for single active tahun; comprehensive indexes on all FK cols |
| 002 | — | All tables above | 3× users, 4× tahun_zakat, 2× kategori_mustahik, 2× muzakki, 4× pembayaran_zakat, 2× mustahik, 4× distribusi_zakat, 3× audit_logs | Adds `get_user_role()` SECURITY DEFINER function |
| 003 | — | `mustahik` | — | Adds `is_data_lama BOOLEAN DEFAULT false`; index |
| 004 | `pemasukan_uang`, `hak_amil`, `rekonsiliasi` | `pembayaran_zakat` | — | Adds `akun_uang`, `jumlah_uang_dibayar_rp` to pembayaran_zakat; new enums; indexes on all new tables |
| 005 | — | — | 5× pemasukan_uang, 3× hak_amil, 4× rekonsiliasi | RLS for Phase 2 tables |
| 006 | — | — | — | Comments only: deprecates `jumlah_uang_dibayar_rp`, clarifies logic |
| 007 | `bukti_sedekah` | — | — | Receipt number unique constraint; indexes; updated_at trigger |
| 008 | — | `bukti_sedekah` | 4× bukti_sedekah | RLS for sedekah receipts |
| 009 | — | — | — | Sequence management for receipt numbers (likely adds sequence or function) |
| 010 | — | — | — | Preview function for next receipt number |
| 011 | — | — | — | Data migration: DELETE 2026 data from pemasukan_uang, distribusi_zakat, pembayaran_zakat, pemasukan_beras |
| 012 | — | — | — | Placeholder (empty) |
| 013 | — | — | — | Placeholder (empty) |
| 014 | `user_invitations` | `users` | — | Adds `address`, `phone` to users; creates invitation table with `token_hash UNIQUE`; indexes |
| 015 | — | `user_invitations` | 4× user_invitations | RLS for invitations |
| 016 | — | — | — | Additional invitation auth RLS fixes |
| 017 | — | `users` | — | Fix RLS circular reference on users table |
| 018 | — | — | — | `get_current_user_role()` SECURITY DEFINER function replaces `get_user_role()` |
| 019 | — | — | — | `get_current_user_is_active()` SECURITY DEFINER function; updated domain table RLS |
| 020 | — | — | — | Removes old permissive RLS policies |
| 021 | — | — | — | Trigger: protect last active admin from deactivation/deletion |
| 023 | `hak_amil_configs`, `hak_amil_snapshots` | — | — | Complex partial unique indexes on snapshots; `UNIQUE(tahun_zakat_id)` on configs; check constraints |
| 024 | — | `hak_amil_configs`, `hak_amil_snapshots` | 4× each | RLS for hak amil tables |
| 025 | — | `hak_amil_snapshots` | — | Compatibility: adds `pemasukan_beras_id` FK column if pemasukan_beras exists |
| 026 | `bulk_submission_logs` | `pemasukan_beras_kategori` enum | 3× bulk_submission_logs | Adds `maal_beras`, `zakat_fitrah_beras`, `fidyah_beras` enum values; `receipt_no UNIQUE` |
| 027 | `dashboard_configs`, `dashboard_widgets` | — | (no RLS defined in this migration) | Indexes; check constraints on visibility and widget_type |
| 028 | `accounts`, `account_ledger_entries` | — | — | New enums; complex linkage constraint; partial indexes for source FK columns |
| 029 | — | `accounts`, `account_ledger_entries` | 6× accounts, 6× account_ledger_entries | RLS |
| 030 | — | — | — | Seed: inserts default KAS and BCA-SYARIAH accounts |
| 031 | — | — | — | Data migration: backfills account_ledger_entries for existing pemasukan_uang records |
| 032 | `transaction_tags` | `pemasukan_uang`, `pemasukan_beras`, `pembayaran_zakat`, `distribusi_zakat` | 4× transaction_tags | Adds `tag_id` FK to 4 tables; seed 2 default tags |
| 033 | `qurban_registrations`, `qurban_participants` | — | 8× qurban | Auto-generate `no_qurban` trigger; `UNIQUE(qurban_registration_id, urutan)` |
| 034 | — | — | — | Creates Supabase Storage bucket `qurban-photos` and policies |
| 035 | `qurban_events`, `qurban_animals`, `qurban_shares` | — | 12× qurban | DB-enforced share slot limit trigger; `UNIQUE(animal_id, urutan)` |
| 036 | — | — | — | Data migration: moves existing qurban_registrations data to new qurban_events/animals/shares model |
| 037 | `qurban_coupons` | — | 4× qurban_coupons | Partial unique indexes (one per share, one per mustahik per event — dropped in 038); unique token |
| 038 | — | `qurban_animals` | — | Drops `qurban_coupons_mustahik_event_unique`; adds `al_fajar` to sumber_hewan enum |
| 039 | `org_settings`, `upz_units` | — | 2× org_settings, 2× upz_units | Single-row org settings; UPZ collection units |
| 040 | — | `muzakki` | — | Adds `nik`, `rt`, `rw`, `jenis_kelamin`, `tanggal_lahir`, `keterangan`, `user_id`; partial unique index on NIK |

**Note:** Migration `022` is missing from the sequence (numbered 021→023). Migration `009` (sedekah receipt numbers) and `010` (preview) were not read in full but are referenced in the timeline.

---

## 4.8 Missing Indexes (FK columns without CREATE INDEX)

Cross-referencing all FK columns defined in migrations against existing `CREATE INDEX` statements:

| Table | FK column | References | Index exists? |
|---|---|---|---|
| `pembayaran_zakat` | `muzakki_id` | `muzakki(id)` | YES — `idx_pembayaran_muzakki_id` |
| `pembayaran_zakat` | `tahun_zakat_id` | `tahun_zakat(id)` | YES — `idx_pembayaran_tahun_zakat_id` |
| `pembayaran_zakat` | `created_by` | `users(id)` | YES — `idx_pembayaran_created_by` |
| `pembayaran_zakat` | `tag_id` | `transaction_tags(id)` | YES — `idx_pembayaran_zakat_tag_id` |
| `distribusi_zakat` | `mustahik_id` | `mustahik(id)` | YES — `idx_distribusi_mustahik_id` |
| `distribusi_zakat` | `tahun_zakat_id` | `tahun_zakat(id)` | YES — `idx_distribusi_tahun_zakat_id` |
| `distribusi_zakat` | `created_by` | `users(id)` | YES — `idx_distribusi_created_by` |
| `distribusi_zakat` | `tag_id` | `transaction_tags(id)` | YES — `idx_distribusi_zakat_tag_id` |
| `mustahik` | `kategori_id` | `kategori_mustahik(id)` | YES — `idx_mustahik_kategori_id` |
| `pemasukan_uang` | `tahun_zakat_id` | `tahun_zakat(id)` | YES — `idx_pemasukan_uang_tahun_zakat_id` |
| `pemasukan_uang` | `muzakki_id` | `muzakki(id)` | **NO** |
| `pemasukan_uang` | `created_by` | `users(id)` | **NO** |
| `pemasukan_uang` | `tag_id` | `transaction_tags(id)` | YES — `idx_pemasukan_uang_tag_id` |
| `pemasukan_beras` | `tahun_zakat_id` | `tahun_zakat(id)` | Likely YES (from same migration pattern) |
| `pemasukan_beras` | `muzakki_id` | `muzakki(id)` | **NO** (not explicitly found) |
| `pemasukan_beras` | `created_by` | `users(id)` | **NO** |
| `rekonsiliasi` | `tahun_zakat_id` | `tahun_zakat(id)` | YES — `idx_rekonsiliasi_tahun_zakat_id` |
| `rekonsiliasi` | `created_by` | `users(id)` | **NO** |
| `hak_amil_snapshots` | `tahun_zakat_id` | `tahun_zakat(id)` | YES |
| `hak_amil_snapshots` | `pembayaran_zakat_id` | `pembayaran_zakat(id)` | YES (partial unique) |
| `hak_amil_snapshots` | `pemasukan_uang_id` | `pemasukan_uang(id)` | YES (partial unique) |
| `hak_amil_snapshots` | `pemasukan_beras_id` | `pemasukan_beras(id)` | YES (partial unique) |
| `hak_amil_snapshots` | `rekonsiliasi_id` | `rekonsiliasi(id)` | YES (partial unique) |
| `hak_amil_snapshots` | `created_by` | `users(id)` | **NO** |
| `hak_amil_configs` | `tahun_zakat_id` | `tahun_zakat(id)` | YES |
| `hak_amil_configs` | `created_by` | `users(id)` | **NO** |
| `hak_amil_configs` | `updated_by` | `users(id)` | **NO** |
| `bukti_sedekah` | `donor_id` | `muzakki(id)` | **NO** |
| `bukti_sedekah` | `created_by` | `users(id)` | YES — `idx_bukti_sedekah_created_by` |
| `bulk_submission_logs` | `operator_id` | `users(id)` | YES — `idx_bulk_submission_logs_operator` |
| `bulk_submission_logs` | `tahun_zakat_id` | `tahun_zakat(id)` | YES — `idx_bulk_submission_logs_tahun_zakat` |
| `account_ledger_entries` | `account_id` | `accounts(id)` | YES |
| `account_ledger_entries` | `created_by` | `users(id)` | **NO** |
| `qurban_animals` | `event_id` | `qurban_events(id)` | YES — `idx_qurban_animals_event_id` |
| `qurban_animals` | `created_by` | `auth.users(id)` | **NO** |
| `qurban_shares` | `animal_id` | `qurban_animals(id)` | YES — `idx_qurban_shares_animal_id` |
| `qurban_shares` | `muzakki_id` | `muzakki(id)` | YES — `idx_qurban_shares_muzakki_id` |
| `qurban_shares` | `created_by` | `auth.users(id)` | **NO** |
| `qurban_coupons` | `event_id` | `qurban_events(id)` | **NO** — only partial unique indexes exist |
| `qurban_coupons` | `qurban_share_id` | `qurban_shares(id)` | YES (partial unique) |
| `qurban_coupons` | `recipient_id` | polymorphic | **NO** |
| `user_invitations` | `created_by` | `auth.users(id)` | **NO** |
| `muzakki` | `user_id` | `auth.users(id)` | YES — `muzakki_user_id_idx` |
| `dashboard_configs` | `created_by` | `auth.users(id)` | **NO** |
| `dashboard_widgets` | `dashboard_id` | `dashboard_configs(id)` | YES |
| `org_settings` | none | — | N/A |
| `upz_units` | none | — | N/A |

**Highest-impact missing indexes:**
1. `pemasukan_uang(muzakki_id)` — queried in `usePemasukanUangList` when filtering by muzakki
2. `pemasukan_beras(muzakki_id)` — same pattern
3. `qurban_coupons(event_id)` — queried in `useQurbanCouponsByEvent` on every coupon list load
4. `bukti_sedekah(donor_id)` — queried when looking up receipts by donor

---

## 4.9 Missing Unique Constraints

| Table | Column | Semantic requirement | Constraint status |
|---|---|---|---|
| `muzakki` | `nik` | NIK is a national ID — should be unique per person | **Partially fixed**: migration 040 adds partial unique index `WHERE nik IS NOT NULL`. Correct. |
| `muzakki` | `nama_kk` | Multiple people can share a name — NOT unique by design | Correct — no constraint needed |
| `users` | `email` | Email must be unique | **OK** — `UNIQUE` defined in migration 001 |
| `pemasukan_uang` | (none) | No semantic unique constraint needed | OK |
| `rekonsiliasi` | (none) | No unique business key | OK |
| `bukti_sedekah` | `receipt_number` | Receipt numbers per category should be unique | **OK** — `UNIQUE(category_key, receipt_number)` defined |
| `qurban_registrations` | `no_qurban` | Registration numbers must be unique | **OK** — `UNIQUE` defined |
| `bulk_submission_logs` | `receipt_no` | Bulk receipt numbers must be unique | **OK** — `UNIQUE` defined |
| `transaction_tags` | `name` | Tag names should be unique | **OK** — `UNIQUE` defined |
| `accounts` | `account_name` | Account names should be unique | **OK** — `UNIQUE` defined |
| `hak_amil_configs` | `tahun_zakat_id` | One config per year | **OK** — `UNIQUE(tahun_zakat_id)` defined |
| `user_invitations` | `token_hash` | Token hashes must be unique | **OK** — `UNIQUE` defined |
| `kategori_mustahik` | `nama` | Category names must be unique | **OK** — `UNIQUE` defined |
| `tahun_zakat` | `tahun_hijriah`, `tahun_masehi` | Each year should appear only once | **OK** — both have `UNIQUE` defined |
| `qurban_events` | `nama` | Event names — could have duplicate events across years | No uniqueness constraint — ACCEPTABLE if multiple years allowed |
| `qurban_animals` | `nomor` per event | Animal numbers should be unique within an event | **MISSING** — no `UNIQUE(event_id, nomor)` index; duplicate animal numbers possible |
| `upz_units` | `nama_unit` | Unit names arguably should be unique | **MISSING** — no unique constraint |

---

## 4.10 Missing Audit Columns

All tables were checked for `created_at` and `updated_at` columns:

| Table | `created_at` | `updated_at` | Notes |
|---|---|---|---|
| `users` | YES | YES | |
| `tahun_zakat` | YES | YES | |
| `kategori_mustahik` | YES | — | **MISSING `updated_at`** — read-only reference table, low risk |
| `muzakki` | YES | YES | |
| `pembayaran_zakat` | YES | YES | |
| `mustahik` | YES | YES | |
| `distribusi_zakat` | YES | YES | |
| `audit_logs` | YES | — | **No `updated_at`** — audit log rows should never be updated; acceptable |
| `pemasukan_uang` | YES | YES | |
| `hak_amil` | YES | YES | |
| `rekonsiliasi` | YES | — | **MISSING `updated_at`** — rekonsiliasi is immutable by design; low risk |
| `bukti_sedekah` | YES | YES | |
| `user_invitations` | YES | YES | |
| `hak_amil_configs` | YES | YES | |
| `hak_amil_snapshots` | YES | — | **MISSING `updated_at`** — snapshots are immutable by design; low risk |
| `bulk_submission_logs` | YES | — | **MISSING `updated_at`** — logs are append-only; low risk |
| `accounts` | YES | YES | |
| `account_ledger_entries` | YES | YES | |
| `transaction_tags` | YES | YES | |
| `qurban_registrations` | YES | YES | |
| `qurban_participants` | — | — | **MISSING BOTH** — created/updated tracking absent for participant records |
| `qurban_events` | YES | YES | |
| `qurban_animals` | YES | YES | |
| `qurban_shares` | YES | YES | |
| `qurban_coupons` | YES | YES | |
| `dashboard_configs` | YES | YES | |
| `dashboard_widgets` | YES | YES | |
| `org_settings` | — | YES | **MISSING `created_at`** — single-row table |
| `upz_units` | YES | YES | |

**High-priority gaps:** `qurban_participants` missing both audit columns; `kategori_mustahik` missing `updated_at`.

---

## 4.11 Soft vs Hard Delete Assessment

### Tables with soft-delete capability
| Table | Soft-delete column | Notes |
|---|---|---|
| `mustahik` | `is_active BOOLEAN` | Soft deactivation supported |
| `users` | `is_active BOOLEAN` | Soft deactivation supported |
| `transaction_tags` | `is_active BOOLEAN` | Tags can be deactivated |
| `accounts` | `is_active BOOLEAN` | Accounts can be deactivated |

### Tables with hard delete only (no soft-delete column)

| Table | Risk Level | Data Integrity Risks |
|---|---|---|
| `pembayaran_zakat` | **CRITICAL** | Deleting a payment permanently removes financial history. `hak_amil_snapshots` has `ON DELETE CASCADE` on `pembayaran_zakat_id`, so snapshots are also deleted silently. No audit trail of who deleted it or when. |
| `pemasukan_uang` | **CRITICAL** | Deleting a pemasukan_uang also cascades to delete its `account_ledger_entries` and `hak_amil_snapshots`. Financial ledger becomes inconsistent. |
| `pemasukan_beras` | **CRITICAL** | Same cascade chain as pemasukan_uang. |
| `distribusi_zakat` | **HIGH** | Deleting a completed distribution removes proof of disbursement. |
| `rekonsiliasi` | **HIGH** | Deleting a reconciliation without audit trail undermines accounting integrity. `account_ledger_entries` linked via `source_rekonsiliasi_id` with `ON DELETE SET NULL` — ledger entry orphaned. |
| `muzakki` | **HIGH** | Deletion is blocked by transaction count check in hook, but hard delete at DB level still possible via Supabase admin. No row-level audit on WHO deleted. |
| `mustahik` | MEDIUM | Has `is_active` for soft disable, but `DELETE` is also available via hook. Hard delete removes distribution history. |
| `qurban_shares` | MEDIUM | Deleting a share also removes associated coupons (ON DELETE SET NULL on `qurban_share_id`). Coupon records become orphaned without the share reference. |
| `hak_amil_snapshots` | HIGH | Snapshots are the audit trail for hak amil calculations. Hard delete removes historical reporting capability. |
| `bulk_submission_logs` | MEDIUM | Audit trail for bulk submissions would be permanently lost. |

**Key risk:** `pemasukan_uang` hard delete in `useDeletePemasukanUang` (lines 389-416) manually deletes hak_amil_snapshots then the ledger entry then the record itself — this is a 3-step hard delete with no rollback mechanism if steps 2 or 3 fail after step 1 succeeds.

---

## 4.12 N+1 Query Risks

| Hook | File | Pattern | Tables involved | Estimated impact |
|---|---|---|---|---|
| `usePembayaranList` | `useMuzakki.ts` lines 500-545 | `Promise.all(data.map(async (pembayaran) => { await supabase.from('pemasukan_uang')...; await supabase.from('pemasukan_beras')...; }))` | `pembayaran_zakat` × `pemasukan_uang` × `pemasukan_beras` | **CRITICAL** — for each page of 20 pembayaran, fires 40 additional queries (2 per row: one for sedekah_uang, one for sedekah_beras). At 20 rows/page = 40 extra queries per page load. |
| `useReorderWidgets` | `useDashboardConfig.ts` lines 492-499 | `Promise.all(orderedIds.map((id, index) => db.from('dashboard_widgets').update(...).eq('id', id)))` | `dashboard_widgets` | MEDIUM — fires N update queries where N = number of widgets (typically 3-10). Could be replaced with a single bulk update or stored procedure. |
| `useQurbanDashboardStats` | `useQurbanDashboard.ts` lines 50-64 | Client-side filtering of full table: events loop over animals/shares/coupons arrays fetched in full | `qurban_events`, `qurban_animals`, `qurban_shares`, `qurban_coupons` | HIGH — fetches ALL rows from 4 tables with no limit or pagination, then filters in JavaScript. As events grow this becomes a full-table scan in JS. |
| `usePreviousYearMustahik` | `useMustahik.ts` lines 183-208 | Fetches all `distribusi_zakat` for a year, then builds `uniqueMustahik` Map in JS with no limit | `distribusi_zakat`, `mustahik` | MEDIUM — could have hundreds of rows in a large year |

**Most critical finding:** `usePembayaranList` in `useMuzakki.ts` fires 2 Supabase queries per row in the result set. With default pageSize=20, this means 41 queries per page load (1 base + 40 sedekah lookups). This is a textbook N+1 problem. Under load this will be the first feature to show timeout errors.

---

## 4.13 Before/After Code Snippets

### 4.1 — Code Duplication: Account name resolution

```ts
// BEFORE (duplicated in usePemasukanUang.ts AND useRekonsiliasi.ts)
async function resolveUangAccountId(akun: AkunUang, accountId: string): Promise<string> {
  if (accountId) return accountId;
  const preferredAccountName = akun === 'bank' ? DEFAULT_BANK_ACCOUNT_NAME : DEFAULT_KAS_ACCOUNT_NAME;
  const { data: accounts, error } = await (supabase.from('accounts').select as any)('id, account_name')
    .in('account_name', [preferredAccountName, DEFAULT_KAS_ACCOUNT_NAME])
    .eq('is_active', true);
  if (error) throw error;
  const matched = (accounts || []).find((a: any) => a.account_name === preferredAccountName)
    || (accounts || []).find((a: any) => a.account_name === DEFAULT_KAS_ACCOUNT_NAME);
  if (!matched?.id) throw new Error(`Akun tidak ditemukan`);
  return matched.id as string;
}

// AFTER (shared utility in lib/accounts.ts)
export const DEFAULT_KAS_ACCOUNT_NAME = 'KAS';
export const DEFAULT_BANK_ACCOUNT_NAME = 'BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT';

export async function resolveAccountId(
  preferredName: string,
  fallbackName = DEFAULT_KAS_ACCOUNT_NAME
): Promise<string> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, account_name')
    .in('account_name', [preferredName, fallbackName])
    .eq('is_active', true);
  if (error) throw error;
  const matched = (data || []).find(a => a.account_name === preferredName)
    ?? (data || []).find(a => a.account_name === fallbackName);
  if (!matched?.id) throw new Error(`Account not found: ${preferredName}`);
  return matched.id;
}
```

### 4.3 — Silent error in useQurbanDashboardStats

```ts
// BEFORE (errors silently discarded)
const { data: animals } = await animalsQ;
const { data: shares } = await sharesQ;
const { data: coupons } = await couponsQ;
const { data: events } = await supabase.from('qurban_events').select('...');

// AFTER (errors propagated to React Query error state)
const { data: animals, error: animalsError } = await animalsQ;
if (animalsError) throw animalsError;
const { data: shares, error: sharesError } = await sharesQ;
if (sharesError) throw sharesError;
const { data: coupons, error: couponsError } = await couponsQ;
if (couponsError) throw couponsError;
const { data: events, error: eventsError } = await supabase.from('qurban_events').select('...');
if (eventsError) throw eventsError;
```

### 4.4 — Magic numbers for hak amil defaults

```ts
// BEFORE (scattered magic numbers)
persen_zakat_fitrah: input.persen_zakat_fitrah ?? 12.5,
persen_zakat_maal: input.persen_zakat_maal ?? 12.5,
persen_infak: input.persen_infak ?? 20.0,
persen_fidyah: input.persen_fidyah ?? 0.0,

// AFTER (named constants in lib/constants.ts)
export const DEFAULT_PERSEN_ZAKAT_FITRAH = 12.5;
export const DEFAULT_PERSEN_ZAKAT_MAAL = 12.5;
export const DEFAULT_PERSEN_INFAK = 20.0;
export const DEFAULT_PERSEN_FIDYAH = 0.0;
export const DASHBOARD_REFRESH_INTERVAL_MS = 30_000;
export const MAX_SLOTS_SAPI = 7;
export const DEFAULT_PAGE_SIZE = 20;

// Usage:
persen_zakat_fitrah: input.persen_zakat_fitrah ?? DEFAULT_PERSEN_ZAKAT_FITRAH,
```

### 4.5 — Type safety: remove `as any` on supabase calls

```ts
// BEFORE (bypasses TypeScript type checking)
const { data, error } = await (supabase.from('pemasukan_uang').insert as any)(payload)
  .select('*')
  .single();

// AFTER (use generated types or explicit cast after validation)
const { data, error } = await supabase
  .from('pemasukan_uang')
  .insert(payload)
  .select('*')
  .single();
// If TypeScript complains, fix the payload type to match the DB schema
// rather than casting the entire operation to any
```

### 4.12 — N+1 fix for usePembayaranList

```ts
// BEFORE (N+1: 2 queries per pembayaran row)
const pembayaranWithSedekah = await Promise.all(
  (data || []).map(async (pembayaran: any) => {
    const { data: pemasukanUang } = await supabase.from('pemasukan_uang')
      .select('jumlah_uang_rp').eq('muzakki_id', pembayaran.muzakki_id)...;
    const { data: pemasukanBeras } = await supabase.from('pemasukan_beras')
      .select('jumlah_beras_kg').eq('muzakki_id', pembayaran.muzakki_id)...;
    return { ...pembayaran, sedekah_uang: ..., sedekah_beras: ... };
  })
);

// AFTER (single join query, or at minimum 3 queries instead of 2N+1)
// Option 1: Add columns to query via foreign table join (requires schema redesign)
// Option 2: Batch fetch all sedekah for the current page's muzakki_ids
const muzakkiIds = (data || []).map((p: any) => p.muzakki_id);
const [sedekahUang, sedekahBeras] = await Promise.all([
  supabase.from('pemasukan_uang').select('muzakki_id, jumlah_uang_rp, tanggal')
    .in('muzakki_id', muzakkiIds).eq('kategori', 'infak_sedekah_uang'),
  supabase.from('pemasukan_beras').select('muzakki_id, jumlah_beras_kg, tanggal')
    .in('muzakki_id', muzakkiIds).eq('kategori', 'infak_sedekah_beras'),
]);
// Then map results by muzakki_id in JavaScript — 3 queries total instead of 2N+1
```

### 4.6 — Edge Function: deduplicate invitation validation

```ts
// BEFORE (validation duplicated in validateInvitation and registerUser actions)
// validateInvitation (lines 209-240):
if (invitation.used_at) return new Response(JSON.stringify({ valid: false, error: '...' }), {...});
if (invitation.revoked_at) return new Response(JSON.stringify({ valid: false, error: '...' }), {...});
const now = new Date();
if (now > new Date(invitation.expires_at)) return new Response(...);

// registerUser (lines 296-320) — identical checks repeated

// AFTER (extract to helper function)
function checkInvitationValidity(invitation: Invitation): { valid: boolean; error?: string } {
  if (invitation.used_at) return { valid: false, error: 'This invitation has already been used' };
  if (invitation.revoked_at) return { valid: false, error: 'This invitation has been revoked' };
  if (new Date() > new Date(invitation.expires_at)) return { valid: false, error: 'This invitation has expired' };
  return { valid: true };
}
```

---

## 5.0 Scalability Assessment

## 5.1 Supabase Plan Limits

**Project URL pattern:** The project uses `VITE_SUPABASE_URL` from environment variables (not hardcoded — correct). From `lib/supabase.ts`, the client is initialized with `import.meta.env.VITE_SUPABASE_URL`, indicating a Supabase Cloud project (`*.supabase.co`).

**Assumption:** Project is on the Free tier (no evidence of Pro). Free tier limits:

| Resource | Free Tier Limit | Notes |
|---|---|---|
| Database size | 500 MB | Includes all table data, indexes, WAL |
| Auth users | Unlimited (active users throttled) | |
| Edge Function invocations | 500,000/month | `invitation-manager` is the only function |
| Realtime connections | 200 concurrent | Not used by this app currently |
| Storage | 1 GB | Used for qurban-photos bucket |
| Database connections | 60 direct (200 via pooler, Pro only) | Critical for scale |
| API requests | 500,000/month | Combined across all Supabase API calls |

**Key concern:** At 60 direct connections with no PgBouncer (Pro plan only), the app can support at most ~20-30 concurrent users before connection exhaustion. This is the first scalability ceiling to hit.

---

## 5.2 Client-Side Aggregation Risks

| Hook | Table | No limit? | JS aggregation performed | Table growth estimate | Risk |
|---|---|---|---|---|---|
| `useDashboardStats` | `pembayaran_zakat` | **YES** — full table fetch | `.reduce()` for total beras/uang | ~200–500 rows/year, grows yearly | **HIGH** |
| `useDashboardStats` | `pemasukan_uang` | **YES** — full table fetch | `.filter().reduce()` per category | ~100-300 rows/year, grows yearly | **HIGH** |
| `useDashboardStats` | `pemasukan_beras` | **YES** — full table fetch | `.filter().reduce()` per category | ~50-200 rows/year | MEDIUM |
| `useDashboardStats` | `distribusi_zakat` | **YES** — full table fetch | `.reduce()` for totals | ~200-500 rows/year | HIGH |
| `useDashboardStats` | `rekonsiliasi` | YES | `.reduce()` | Small (<50 rows) | LOW |
| `useMonthlyPemasukan` | `pembayaran_zakat` | **YES** — full year fetch | `forEach` + groupBy month | Same as above | HIGH |
| `useMonthlyPemasukan` | `pemasukan_uang` | **YES** | `forEach` + groupBy month | Same as above | HIGH |
| `useQurbanDashboardStats` | `qurban_animals` | **YES** — no limit | `.filter()` in JS | Dozens/event | MEDIUM |
| `useQurbanDashboardStats` | `qurban_shares` | **YES** — no limit | `.reduce()`, `.filter()` | ~100-500 per event | HIGH |
| `useQurbanDashboardStats` | `qurban_coupons` | **YES** — no limit | `.filter()` | Same as shares | HIGH |
| `useQurbanDashboardStats` | `qurban_events` | YES — no limit | map with nested filters | Small | LOW |
| `useHakAmilMonthlyTrend` | 3 tables | **YES** — full year | `Array.from({length:12})` + filter per month | Same as dashboard | HIGH |
| `useRekonsiliasiSummary` | `rekonsiliasi` | YES | `forEach` reduce | Small | LOW |
| `useSedekahReceiptsList` | `bukti_sedekah` | `.limit(100)` | None — just display | Grows each receipt | MEDIUM |
| `useQurbanEventList` | `qurban_events` | **YES** — no limit | None | Small | LOW |
| `useUsersList` | `users` | YES | None | Very small | LOW |

**Highest risk:** `useDashboardStats` is the most critical — it fires 10 sequential full-table-scan queries on every mount and every 30-second auto-refresh interval. As `pembayaran_zakat` and `distribusi_zakat` grow across multiple years, these scans will become increasingly slow.

---

## 5.3 Query Performance Under Load

Cross-referencing missing indexes (4.8) with hooks that query those columns:

| Missing index | Queried by | Query frequency | Table size risk | Combined risk |
|---|---|---|---|---|
| `pemasukan_uang(muzakki_id)` | `usePembayaranList` N+1 loop (2× per row) | HIGH — every page load in Pembayaran List | MEDIUM (grows yearly) | **CRITICAL** |
| `pemasukan_beras(muzakki_id)` | `usePembayaranList` N+1 loop (2× per row) | HIGH | MEDIUM | **CRITICAL** |
| `qurban_coupons(event_id)` | `useQurbanCouponsByEvent` | MEDIUM — every coupon page load | MEDIUM | HIGH |
| `bukti_sedekah(donor_id)` | Not currently queried by donor_id in hooks | LOW | LOW | LOW |
| `rekonsiliasi(created_by)` | Not queried by created_by in hooks | LOW | LOW | LOW |
| `pemasukan_uang(created_by)` | Not queried by created_by in hooks | LOW | LOW | LOW |

Without an index on `pemasukan_uang(muzakki_id)`, the N+1 loop in `usePembayaranList` forces a sequential scan of the entire `pemasukan_uang` table for each row in the page result (up to 20 times per page load). With 1000+ pemasukan_uang rows, this means 20 sequential scans of 1000+ rows each = full table scanned 20 times per page navigation.

---

## 5.4 React Query Cache Health

All hooks analyzed for `staleTime`, `gcTime`, and `refetchOnWindowFocus`:

| Hook | staleTime | gcTime | refetchOnWindowFocus | refetchInterval | Assessment |
|---|---|---|---|---|---|
| `useDashboardStats` | NOT SET (default=0) | NOT SET | NOT DISABLED | `30000` | Refetches on every mount AND every 30s — double-refresh risk |
| `useTahunZakatList` (in useDashboard) | NOT SET | NOT SET | NOT DISABLED | none | Refetches on every mount |
| `useMonthlyPemasukan` | NOT SET | NOT SET | NOT DISABLED | none | Refetches on every mount |
| `usePemasukanUangList` | NOT SET | NOT SET | NOT DISABLED | none | Refetches on every mount |
| `usePemasukanBerasList` | NOT SET | NOT SET | NOT DISABLED | none | Refetches on every mount |
| `useMuzakkiList` | NOT SET | NOT SET | NOT DISABLED | none | Refetches on every mount |
| `usePembayaranList` | NOT SET | NOT SET | NOT DISABLED | none | **HIGH RISK** — triggers N+1 on every mount |
| `useMustahikList` | NOT SET | NOT SET | NOT DISABLED | none | Refetches on every mount |
| `useKategoriMustahik` | NOT SET | NOT SET | NOT DISABLED | none | Should be `staleTime: Infinity` — reference data never changes |
| `useDistribusiList` | NOT SET | NOT SET | NOT DISABLED | none | Refetches on every mount |
| `useHakAmilConfig` | NOT SET | NOT SET | NOT DISABLED | none | Refetches on every mount |
| `useHakAmilYearlySummary` | NOT SET | NOT SET | NOT DISABLED | none | Expensive query — refetch on every mount is costly |
| `useHakAmilMonthlySummary` | NOT SET | NOT SET | NOT DISABLED | none | Same |
| `useHakAmilMonthlyTrend` | NOT SET | NOT SET | NOT DISABLED | none | Fetches full year data on every mount |
| `useQurbanDashboardStats` | NOT SET | NOT SET | NOT DISABLED | none | Fetches 4 full tables on every mount |
| `useQurbanAnimalList` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useQurbanShareList` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useQurbanCouponsByEvent` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useQurbanShareListFlat` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useTransactionTags` | NOT SET | NOT SET | NOT DISABLED | none | Reference data — should be `staleTime: 5min` |
| `useAccountsList` | NOT SET | NOT SET | NOT DISABLED | none | Mostly static |
| `useAccountLedger` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useInvitationsList` | NOT SET | NOT SET | NOT DISABLED | none | Admin-only, rarely changes |
| `useUsersList` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useDashboardConfigs` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useDashboardWidgets` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useOrgSettings` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useUPZUnitList` | NOT SET | NOT SET | NOT DISABLED | none | |
| `useSedekahReceiptsList` | NOT SET | NOT SET | NOT DISABLED | none | |

**Key finding:** No hook in the entire codebase sets a `staleTime`. All 28 queries use the default `staleTime: 0`, meaning every navigation event and window focus event triggers a fresh network request to Supabase. With 10+ hooks mounted on a single dashboard page, this creates 10+ simultaneous requests on every page mount.

---

## 5.5 10× Verdict

**Verdict: NO — the app will fail at 10× in its current state**

The primary bottleneck is `usePembayaranList` in `useMuzakki.ts`, which implements a textbook N+1 query pattern. For each row in a 20-item page (the default), it fires 2 additional queries: one against `pemasukan_uang` and one against `pemasukan_beras`, filtering by `muzakki_id` — both without an index. A single page load currently fires 41 Supabase queries. At 10× user load, the Supabase Free tier's 500,000 API requests/month would be exhausted in days rather than months. Moreover, the lack of an index on `pemasukan_uang(muzakki_id)` means each of those 40 sub-queries performs a sequential scan of the entire table.

The second structural problem is `useDashboardStats`, which fires 10 sequential full-table-scan queries with no limits and runs a 30-second auto-refresh interval. With `staleTime: 0` (the default for all hooks), every user who opens the dashboard window (including switching browser tabs) triggers a fresh batch of 10 queries. At 10× users with a 30-second polling interval, the database receives approximately 10 queries × N users every 30 seconds — potentially 100 queries every 30 seconds from the dashboard alone. Combined with the 60-connection limit on the Free tier and no PgBouncer connection pooler (Pro-only), connection exhaustion will occur before any significant user volume is reached.

---

## 5.6 Top 3 Bottlenecks

### Bottleneck 1: N+1 query in usePembayaranList (HIGHEST PRIORITY)

**What breaks:** The Pembayaran Zakat list page slows to a crawl and eventually times out.

**At what scale:** At approximately 500 `pembayaran_zakat` records and 5 concurrent users navigating the list page, the combined query load (5 users × 40 queries per page × scrolling) will exhaust the 60-connection limit. Queries without `muzakki_id` indexes on `pemasukan_uang` and `pemasukan_beras` tables will perform sequential scans of growing tables.

**Evidence:** `hooks/useMuzakki.ts` lines 500-545 — `Promise.all(data.map(async (pembayaran) => { await supabase.from('pemasukan_uang')...; await supabase.from('pemasukan_beras')... }))`. Missing indexes confirmed in 4.8: no `idx_pemasukan_uang_muzakki_id` or `idx_pemasukan_beras_muzakki_id`.

### Bottleneck 2: Full-table client-side aggregation in useDashboardStats with polling

**What breaks:** The dashboard becomes unresponsive; financial totals take seconds to compute.

**At what scale:** At ~2,000 total transactions across multiple years (a reasonable 3–4 year projection for an active mosque), each `useDashboardStats` call fetches and transmits all rows from `pembayaran_zakat`, `pemasukan_uang`, `pemasukan_beras`, and `distribusi_zakat` to the browser. With 10 hooks running no `staleTime` and a 30-second polling interval, the data volume transferred per minute grows linearly with database size.

**Evidence:** `hooks/useDashboard.ts` — 10 queries with no `.limit()` call. `refetchInterval: 30000` at line 263.

### Bottleneck 3: No React Query staleTime → excessive refetching

**What breaks:** Each page navigation triggers a full fresh data load for all mounted hooks, multiplying Supabase API request count by the number of navigation events per session.

**At what scale:** With 50 concurrent users each making 10 navigations per session × 10+ queries per mount = 5,000 API requests per hour minimum. Free tier allows ~700 requests/hour (500k/month). 50 users navigating normally will exhaust the monthly API quota in under a week.

**Evidence:** Every `useQuery` call in all 28 hooks has no `staleTime` set (verified in 5.4). Supabase Free tier: 500,000 requests/month.

---

## 5.7 Scaling Roadmap

### Current State

The app handles approximately 5–10 concurrent users with a single mosque's yearly data (~500 transactions). Its primary ceiling is:
- 60 database connections (Free tier, no pooler)
- N+1 query in Pembayaran list (41 queries per page load)
- Full-table aggregation on dashboard (10 queries, no limit, 30s polling)
- Zero React Query cache configuration (every mount triggers fresh network requests)

### Optimized (0–3 months): Quick wins

**1. Add missing indexes (SQL migration):**
```sql
-- Migration: 041_missing_indexes.sql
CREATE INDEX IF NOT EXISTS idx_pemasukan_uang_muzakki_id ON public.pemasukan_uang(muzakki_id);
CREATE INDEX IF NOT EXISTS idx_pemasukan_beras_muzakki_id ON public.pemasukan_beras(muzakki_id);
CREATE INDEX IF NOT EXISTS idx_qurban_coupons_event_id ON public.qurban_coupons(event_id);
CREATE INDEX IF NOT EXISTS idx_bukti_sedekah_donor_id ON public.bukti_sedekah(donor_id);
```

**2. Fix N+1 in usePembayaranList:**
Replace the `Promise.all(data.map(...))` with a 2-query batch approach using `.in('muzakki_id', muzakkiIds)` as shown in the before/after in 4.13.

**3. Add staleTime to static/slow-changing queries:**
```ts
// In useKategoriMustahik — reference data never changes
useQuery({ queryKey: [...], queryFn: ..., staleTime: Infinity });

// In useTahunZakatList — changes only once per year
useQuery({ queryKey: [...], queryFn: ..., staleTime: 5 * 60 * 1000 }); // 5 min

// In useDashboardStats — financial data, 5 min stale is acceptable
useQuery({ queryKey: [...], queryFn: ..., staleTime: 60 * 1000 }); // 1 min
```

**4. Add pagination to useQurbanDashboardStats:**
Instead of fetching all animals, shares, and coupons, compute aggregates in a single SQL view or RPC call.

**5. Add year-scoping to useDashboardStats:**
Limit all queries to the active `tahun_zakat_id` (already done) but ensure the active ID is resolved once per query function rather than as a sequential query inside each hook.

### Scale-ready (3–12 months)

**1. Move aggregations to PostgreSQL views or Edge Functions:**
Create a `dashboard_summary` materialized view or a `get_dashboard_stats(tahun_zakat_id)` RPC function that computes all aggregations in a single SQL query using `SUM` with `FILTER` clauses. This reduces 10 sequential queries to 1.

**2. Enable Supabase Pro for PgBouncer:**
Upgrade to Supabase Pro ($25/month) to get PgBouncer connection pooling, increasing connection capacity from 60 to 400+ pooled connections. This directly addresses the connection exhaustion ceiling.

**3. Implement soft-delete for financial tables:**
Add `deleted_at TIMESTAMPTZ` to `pembayaran_zakat`, `pemasukan_uang`, `pemasukan_beras`, `distribusi_zakat`, and `rekonsiliasi`. Update RLS policies to filter `WHERE deleted_at IS NULL`. This prevents permanent data loss and maintains audit trails.

**4. Multi-year dashboard partitioning:**
Add table partitioning by `tahun_zakat_id` on `pembayaran_zakat` and `distribusi_zakat` as the app accumulates multiple years of data. This ensures index scans stay fast as the tables grow beyond 10,000 rows.

**5. Add `refetchOnWindowFocus: false` globally:**
In the `QueryClient` configuration, set `defaultOptions: { queries: { refetchOnWindowFocus: false } }` to eliminate the most common source of unnecessary requests.
