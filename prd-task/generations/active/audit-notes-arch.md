# Audit Notes — Architecture Analysis (Task 2.0)

## Version Metadata
- Report date: 2026-05-22
- Build: success (12.43s)
- Pages: 32 | Hooks: 31 | Lib: 14 | Components: 113 | Types: 4 | Store: 1
- Migrations: 40 files (001–040)
- Edge Functions: invitation-manager
- Dir timestamps:
  - src/pages: 2026-05-10 09:28
  - src/hooks: 2026-05-10 09:29
  - src/lib: 2026-05-18 14:12
  - src/components: 2026-05-09 20:25
  - supabase/migrations: 2026-05-10 09:27
  - supabase/functions: 2026-04-29 20:22

---

## 2.1 Route Map (React Router config)

Source: `src/App.tsx`

QueryClient global config: `retry: 1`, `refetchOnWindowFocus: false`

| Path | Component | Guard | Allowed Roles |
|---|---|---|---|
| `/login` | `Login` | none | — |
| `/register` | `Register` | none | — |
| `/email-confirmation` | `EmailConfirmation` | none | — |
| `/forgot-password` | `ForgotPassword` | none | — |
| `/reset-password` | `ResetPassword` | none | — |
| `/` | redirect → `/dashboard` | — | — |
| `/dashboard` | `Dashboard` | ProtectedRoute | all |
| `/muzakki` | `Muzakki` | ProtectedRoute | admin, petugas |
| `/penerimaan-uang` | `PemasukanUang` | ProtectedRoute | admin, petugas |
| `/penerimaan-beras` | `PemasukanBeras` | ProtectedRoute | admin, petugas |
| `/pemasukan` | redirect → `/penerimaan-uang` | — | — |
| `/pemasukan-beras` | redirect → `/penerimaan-beras` | — | — |
| `/mustahik` | `Mustahik` (default export) | ProtectedRoute | admin, petugas |
| `/distribusi` | `Distribusi` (default export) | ProtectedRoute | admin, petugas |
| `/laporan` | `Laporan` (default export) | ProtectedRoute | all |
| `/settings` | `Settings` (default export) | ProtectedRoute | admin |
| `/dashboard-settings` | `DashboardSettings` | ProtectedRoute | admin |
| `/sedekah-receipt` | `SedekahReceiptPage` | ProtectedRoute | admin, petugas |
| `/surat-pengantar` | `SuratPengantarPage` | ProtectedRoute | admin |
| `/accounts` | `AccountsManagement` | ProtectedRoute | admin, petugas |
| `/qurban` | `Qurban` (default export) | ProtectedRoute | admin, petugas |
| `/qurban/dashboard` | `QurbanDashboard` | ProtectedRoute | admin, petugas |
| `/qurban/events` | `QurbanEvents` | ProtectedRoute | admin, petugas |
| `/qurban/peserta` | `QurbanPeserta` | ProtectedRoute | admin, petugas |
| `/qurban/distribusi` | `QurbanDistribusi` | ProtectedRoute | admin, petugas |
| `/qurban/scan` | `QurbanScan` | ProtectedRoute | admin, petugas |
| `/data-master` | redirect → `/data-master/warga` | — | — |
| `/data-master/warga` | `DataMasterWarga` | ProtectedRoute | all |
| `/data-master/mustahik` | `DataMasterMustahik` | ProtectedRoute | all |
| `/data-master/pengguna` | `DataMasterPengguna` | ProtectedRoute | admin |
| `/data-master/upz-settings` | `DataMasterUPZSettings` | ProtectedRoute | admin |

All page components (except 5 auth pages) are **lazy-loaded** via `React.lazy`.

---

## 2.2 Pages Reference

| Route | File | Hooks Used | Description |
|---|---|---|---|
| `/dashboard` | `Dashboard.tsx` | `useDashboardStats`, `useTahunZakatList`, `useMonthlyPemasukan`, `useDashboardConfigs`, `useDashboardWidgets`, `useAuth` | Configurable dashboard with year selector, stat widgets (stat_card, chart, distribusi_progress, hak_amil), and monthly trend charts. Widget types driven by `dashboard_configs`/`dashboard_widgets` tables. |
| `/login` | `Login.tsx` | `useAuth`, `useNavigate`, `useLocation`, `useForm` (Zod) | Email/password login form. Calls `auth.login()`. Shows offline mode mock credentials banner when `VITE_OFFLINE_MODE=true`. |
| `/register` | `Register.tsx` | `useSearchParams`, `useNavigate`, `useForm` (Zod) | Token-based invitation registration. Validates token via Edge Function (`validateInvitationToken`), then registers via `registerUserWithInvitation`. |
| `/email-confirmation` | `EmailConfirmation.tsx` | `useSearchParams`, `useNavigate` | Confirms email using Supabase `auth.verifyOtp()` with `token_hash` URL param. |
| `/forgot-password` | `ForgotPassword.tsx` | `useForm` (Zod) | Sends password reset email via `supabase.auth.resetPasswordForEmail()`. |
| `/reset-password` | `ResetPassword.tsx` | `useSearchParams`, `useNavigate`, `useForm` (Zod) | Two-step: verify OTP token, then set new password via `supabase.auth.updateUser()`. |
| `/muzakki` | `Muzakki.tsx` | `useMuzakkiList`, `useCreateMuzakki`, `useUpdateMuzakki`, `useDeleteMuzakki`, `useMuzakkiTransactionHistory`, `useTahunZakatList`, `useTransactionTags` | Full muzakki (payer) CRUD with 500ms debounced search, pagination, transaction history dialog, and print dialog. |
| `/penerimaan-uang` | `PemasukanUang.tsx` | `useTahunZakatList`, `usePemasukanUangList`, `useCreatePemasukanUang`, `useUpdatePemasukanUang`, `useDeletePemasukanUang`, `useAccountsList`, `useTransactionTags` | Cash/money income management with year/category/account/tag filters, pagination, bulk CSV import mode, and receipt printing. |
| `/penerimaan-beras` | `PemasukanBeras.tsx` | `useTahunZakatList`, `usePemasukanBerasList`, `useCreatePemasukanBeras`, `useUpdatePemasukanBeras`, `useDeletePemasukanBeras`, `useTransactionTags` | Rice income management, similar pattern to PemasukanUang. |
| `/mustahik` | `Mustahik.tsx` | `useMustahikList`, `useKategoriMustahik`, `useCreateMustahik`, `useUpdateMustahik`, `useToggleMustahikActive`, `useBulkToggleMustahik`, `usePreviousYearMustahik`, `useImportMustahik`, `useDeleteMustahik`, `useMustahikHistory`, `useTahunZakatList` | Full mustahik (recipient) CRUD with search, category filter, bulk activate/deactivate, import from previous year, and distribution history. Also queries `distribusi_zakat` directly in a useEffect. |
| `/distribusi` | `Distribusi.tsx` | `useTahunZakatList`, `useDistribusiList`, `useStokCheck`, `useCreateDistribusi`, `useUpdateDistribusiStatus`, `useDeleteDistribusi` | Zakat distribution management. Shows rice/money stock summary, full distribution CRUD. Prevents over-distribution via stock check. |
| `/laporan` | `Laporan.tsx` | `useTahunZakatList` | Report page with tabs for Pemasukan, Distribusi, Mustahik, Hak Amil, and Year Comparison. Each tab renders a dedicated report component. Responsive: uses `<Select>` on mobile, `<Tabs>` on desktop. |
| `/settings` | `Settings.tsx` | `useAuth`, inline `useQuery`/`useMutation` (hak_amil, hak_amil_configs), `useTahunZakatList`, `useCreateTahunZakat`, `useUpdateTahunZakat`, `useToggleTahunZakatActive`, `useUsersList`, `useCreateUser`, `useUpdateUser`, `useToggleUserActive`, `useAllTransactionTags`, `useAddTransactionTag`, `useDeactivateTransactionTag` | Multi-tab admin settings: Hak Amil config, Tahun Zakat management, User management, Transaction Tags. |
| `/dashboard-settings` | `DashboardSettings.tsx` | `useDashboardConfigs` | Admin page to create/manage named dashboard configurations via `dashboard_configs` table. |
| `/sedekah-receipt` | `SedekahReceipt.tsx` | `useSedekahReceiptsList`, `useDeleteSedekahReceipt` | Lists sedekah/donation receipts (`bukti_sedekah` table). Create and download PDF receipts. |
| `/surat-pengantar` | `SuratPengantar.tsx` | none | Static page with hardcoded letter date (2026-02-25). Generates a formal introduction letter PDF via `downloadSuratPengantarDomain`/`generateSuratPengantarDomainPDF` utility. No Supabase calls. |
| `/accounts` | `AccountsManagement.tsx` | `useAccountsList`, `useAccountLedger`, `useCreateAccount`, `useUpdateAccount`, `useDeleteAccount`, `useCreateManualLedgerEntry` | Account (kas/bank) CRUD and ledger entry viewer. Supports manual ledger entries for reconciliation. |
| `/qurban` | `Qurban.tsx` | `useQurbanEventList`, `useQurbanAnimalList`, `useDeleteQurbanAnimal`, `useAuth` | Qurban animal grid per selected event. Add/edit/delete animals via `QurbanAnimalForm` dialog. |
| `/qurban/dashboard` | `QurbanDashboard.tsx` | `useQurbanDashboardStats`, `useQurbanEventList` | Qurban dashboard with stat cards (total animals, participants, payment status) and a payment trend bar chart. |
| `/qurban/events` | `QurbanEvents.tsx` | `useQurbanEventList`, `useDeleteQurbanEvent`, `useAuth`, inline `useQuery` (counts from `qurban_animals`, `qurban_shares`) | Event management table for Qurban campaigns. |
| `/qurban/peserta` | `QurbanPeserta.tsx` | `useQurbanEventList`, `useQurbanShareListFlat`, `useUpdateSharePayment`, `useRemoveQurbanShare`, `useGenerateMuzakkiCoupon`, `useAuth`, `useQueryClient` | Participant (peserta) list with payment status toggle, coupon generation, and 300ms debounced search. Also fetches animal+event data directly from `qurban_animals`. |
| `/qurban/distribusi` | `QurbanDistribusi.tsx` | `useQurbanEventList`, `useKategoriMustahik`, `useMustahikList`, `useQurbanCouponsByEvent`, `useRedeemCouponManually`, `useCancelCoupon`, `useUpdateCouponExpiry`, `useNavigate` | Qurban coupon distribution management. Assign coupons to mustahik, manually redeem, cancel, and extend expiry. |
| `/qurban/scan` | `QurbanScan.tsx` | `useSearchParams`, `useNavigate`, `useQurbanEventList`, `useCouponByToken`, `useRedeemCouponByToken`, `useQurbanCouponsByEvent` | Mobile-optimized QR scan page using `html5-qrcode` library. Validates and redeems coupon tokens on camera scan. |
| `/data-master/warga` | `DataMasterWarga.tsx` | `useMuzakkiList`, `useDeleteMuzakki`, `useAuth` | Warga (citizen) registry CRUD. 300ms debounced search, 20-per-page pagination, history sheet, and CSV/Excel import. |
| `/data-master/mustahik` | `DataMasterMustahik.tsx` | `useMustahikList`, `useKategoriMustahik`, `useCreateMustahik`, `useUpdateMustahik`, `useToggleMustahikActive`, `useDeleteMustahik` | Mustahik data-master view with inline Zod form. Simpler version of the full `/mustahik` page. |
| `/data-master/pengguna` | `DataMasterPengguna.tsx` | `useUsersList`, `useUpdateUser`, `useInvitationsList`, `useCreateInvitation`, `useRevokeInvitation`, `useAuth` | Two-tab page: active users list (edit/toggle) and invitation management (create/revoke). |
| `/data-master/upz-settings` | `DataMasterUPZSettings.tsx` | `useOrgSettings`, `useUpdateOrgSettings`, `useUPZUnitList`, `useDeleteUPZUnit` | Org info form (`org_settings` table) + UPZ unit table (`upz_units` table). |
| — | `MuzakkiPage.tsx` | none | Stub page ("dalam pengembangan"). Not in router. |
| — | `MustahikPage.tsx` | none | Stub page. Not in router. |
| — | `DistribusiPage.tsx` | none | Stub page. Not in router. |
| — | `LaporanPage.tsx` | none | Stub page. Not in router. |
| — | `SettingsPage.tsx` | inline `useQuery`/`useMutation` | Older version of Settings page. Uses direct queries for hak_amil and rekonsiliasi. Not in main router; superseded by `Settings.tsx`. |

---

## 2.3 Hooks Reference

### `useDashboard.ts`
- **Tables:** `tahun_zakat`, `pembayaran_zakat`, `mustahik`, `distribusi_zakat`, `pemasukan_uang`, `pemasukan_beras`, `rekonsiliasi`, `hak_amil`, `hak_amil_configs`
- **Fetches:** `useDashboardStats(tahunZakatId?)` — aggregates all income/distribution stats, hak amil totals; `useTahunZakatList()` — list all years; `useMonthlyPemasukan(tahunZakatId?)` — monthly income grouped by month
- **Mutations:** none
- **Side effects:** 30-second `refetchInterval` on `useDashboardStats`

### `useDashboardConfig.ts`
- **Tables:** `dashboard_configs`, `dashboard_widgets`
- **Fetches:** `useDashboardConfigs()`, `useDashboardWidgets(dashboardId)`
- **Mutations:** `useCreateDashboard`, `useUpdateDashboard`, `useDeleteDashboard`, `useDuplicateDashboard`, `useCreateWidget`, `useUpdateWidget`, `useDeleteWidget`, `useReorderWidgets(dashboardId)`
- **Side effects:** toast on all mutations; invalidates `dashboard-configs`, `dashboard-widgets` query keys

### `usePemasukanUang.ts`
- **Tables:** `pemasukan_uang`, `account_ledger_entries`, `hak_amil_snapshots`, `accounts`, `hak_amil_configs`
- **Fetches:** `usePemasukanUangList(params)` — paginated, filterable by year/kategori/account/tag/search
- **Mutations:** `useCreatePemasukanUang`, `useUpdatePemasukanUang`, `useDeletePemasukanUang` — each also writes a linked `account_ledger_entries` record and calls `createHakAmilSnapshot`/`upsertHakAmilSnapshot`
- **Side effects:** toast; invalidates `pemasukan-uang`, `dashboard-stats`, `monthly-pemasukan`, `hak-amil-monthly-summary`, `hak-amil-yearly-summary`

### `usePemasukanBeras.ts`
- **Tables:** `pemasukan_beras`, `account_ledger_entries`, `hak_amil_snapshots`, `accounts`, `tahun_zakat`, `hak_amil_configs`
- **Fetches:** `usePemasukanBerasList(params)` — paginated, filterable by year/kategori/tag/search
- **Mutations:** `useCreatePemasukanBeras`, `useUpdatePemasukanBeras`, `useDeletePemasukanBeras` — same ledger entry + snapshot pattern as PemasukanUang
- **Side effects:** same invalidation pattern as `usePemasukanUang`

### `useMuzakki.ts`
- **Tables:** `muzakki`, `pembayaran_zakat`, `pemasukan_uang`, `pemasukan_beras`, `qurban_shares`
- **Fetches:** `useMuzakkiList(params)`, `useMuzakkiTransactionHistory(params)`, `usePembayaranList(params)` (has N+1 pattern — loops to fetch sedekah per row), `usePembayaranDetail(id)`, `useMuzakkiHistory(muzakkiId)`
- **Mutations:** `useCreateMuzakki`, `useUpdateMuzakki`, `useDeleteMuzakki`, `useCreatePembayaran`, `useUpdatePembayaran`, `useDeletePembayaran`
- **Side effects:** toast; invalidates `muzakki-list`, `muzakki-detail`, `pembayaran-list`; `createMuzakkiRecord`/`updateMuzakkiRecord` are exported helper functions

### `useMustahik.ts`
- **Tables:** `mustahik`, `kategori_mustahik`, `distribusi_zakat`, `tahun_zakat`
- **Fetches:** `useMustahikList(params)`, `useMustahikDetail(id)`, `useKategoriMustahik()`, `useMustahikHistory(mustahikId)`, `usePreviousYearMustahik(tahunMasehi)`
- **Mutations:** `useCreateMustahik`, `useUpdateMustahik`, `useToggleMustahikActive`, `useBulkToggleMustahik`, `useImportMustahik`, `useDeleteMustahik`
- **Side effects:** toast; invalidates `mustahik-list`, `mustahik-detail`

### `useAccountsLedger.ts`
- **Tables:** `accounts`, `account_ledger_entries`
- **Fetches:** `useAccountsList(filters?)`, `useAccountLedger(accountId?, filters?)`
- **Mutations:** `useCreateAccount`, `useUpdateAccount`, `useDeleteAccount` (checks for existing ledger entries first), `useCreateManualLedgerEntry` (manually computes running balance before insert)
- **Side effects:** toast; invalidates `accounts-list`, `account-ledger`; offline mode throws error for all mutations

### `useBulkPembayaran.ts`
- **Tables:** `pemasukan_uang`, `pemasukan_beras`, `bulk_submission_logs`, `hak_amil_snapshots`
- **Exports:** `submitBulk(rows, meta)` — plain async function (not a hook). Inserts one `pemasukan_uang`/`pemasukan_beras` row per muzakki per category, calls `createHakAmilSnapshot` for each row, logs to `bulk_submission_logs`.
- **Side effects:** non-blocking hak amil snapshot creation; partial saves on error (errors logged per-row but processing continues)

### `useDistribusi.ts`
- **Tables:** `distribusi_zakat`, `mustahik`, `tahun_zakat`, `pembayaran_zakat`, `transaction_tags`
- **Fetches:** `useDistribusiList(params)`, `useDistribusiDetail(id)`, `useStokCheck(tahunZakatId)` — stok check queries both `pembayaran_zakat` and `distribusi_zakat` to compute remaining stock
- **Mutations:** `useCreateDistribusi` (validates no duplicate, checks stock), `useUpdateDistribusiStatus`, `useDeleteDistribusi`
- **Side effects:** toast; invalidates `distribusi-list`, `stok-check`, `dashboard-stats`; offline mode uses `offlineStore`

### `useDonor.ts`
- **Tables:** `muzakki`
- **Fetches:** `useSearchDonor(params)` (ilike search on `nama_kk` + `no_telp`), `useDonor(donorId)`
- **Mutations:** `useUpsertDonor` — checks by name, updates existing or creates new
- **Side effects:** invalidates `search-donor`, `donor`; no toast on success

### `useHakAmil.ts`
- **Tables:** `hak_amil_configs`, `tahun_zakat`, `pembayaran_zakat`, `pemasukan_uang`, `pemasukan_beras`
- **Fetches:** `useHakAmilConfig(tahunZakatId?)`, `useHakAmilMonthlySummary(...)`, `useHakAmilYearlySummary(tahunZakatId?)`, `useHakAmilDateRangeSummary(...)`, `useHakAmilMonthlyTrend(tahunZakatId?, year?)`; helper `getDateRangeForPeriod(period)` exported
- **Mutations:** `useCreateHakAmilConfig`, `useUpdateHakAmilConfig`
- **Side effects:** toast on config mutations; invalidates `hak-amil-config`; summaries compute in-memory from all three source tables; offline mode uses `offlineStore`

### `useInvitations.ts`
- **Tables:** `user_invitations`
- **Fetches:** `useInvitationsList()`; plain async `validateInvitationToken(token)` — calls `invitation-manager` Edge Function
- **Mutations:** `useCreateInvitation` (calls `invitation-manager` Edge Function with `action: 'createInvitation'`), `useRevokeInvitation` (direct DB update), `useReInvite`; plain async `registerUserWithInvitation` — calls Edge Function
- **Side effects:** toast; invalidates `invitations`; helper `getInvitationStatus(invitation)` exported

### `useNilaiZakat.ts`
- **Tables:** `tahun_zakat`, `pembayaran_zakat`, `distribusi_zakat`
- **Fetches:** `useTahunZakatList()`, `useCheckTahunHasTransactions(tahunId)`
- **Mutations:** `useCreateTahunZakat`, `useUpdateTahunZakat`, `useToggleTahunZakatActive` — all deactivate other years before activating the selected one
- **Side effects:** toast; invalidates `tahun-zakat-list`, `dashboard-stats`; offline mode uses `offlineStore`

### `useOrgSettings.ts`
- **Tables:** `org_settings`, `upz_units`
- **Fetches:** `useOrgSettings()` (queries row with `id='org'`), `useUPZUnitList()`
- **Mutations:** `useUpdateOrgSettings` (upsert), `useCreateUPZUnit`, `useUpdateUPZUnit`, `useDeleteUPZUnit`
- **Side effects:** toast; invalidates `org_settings`, `upz_units`

### `useProfile.ts`
- **Tables:** `users`
- **Fetches:** none
- **Mutations:** `useUpdateProfile` — updates `nama_lengkap`, `address`, `phone` fields in `users` table for the current user
- **Side effects:** toast; invalidates `user` query key

### `use-mobile.ts`
- **Tables:** none
- **Exports:** `useIsMobile()` — uses `window.matchMedia` with breakpoint 768px; no Supabase interaction

### `useQurban.ts`
- **Tables:** `qurban_registrations`, `qurban_participants`
- **Fetches:** `useQurbanList(params)`, `useQurbanDetail(id)` — both join with `qurban_participants`
- **Mutations:** `useCreateQurban` (inserts registration + participants atomically), `useUpdateQurban` (delete-then-reinsert participants), `useDeleteQurban`
- **Side effects:** toast; invalidates `qurban` query key; Note: `qurban_registrations` is an older schema, distinct from the newer `qurban_events`/`qurban_animals`/`qurban_shares` tables

### `useQurbanAnimals.ts`
- **Tables:** `qurban_animals`, `qurban_shares`, Supabase Storage bucket `qurban-photos`
- **Fetches:** `useQurbanAnimalList(eventId)`, `useQurbanAnimalDetail(animalId)`
- **Mutations:** `useCreateQurbanAnimal` (optionally uploads photo to Storage), `useUpdateQurbanAnimal`, `useDeleteQurbanAnimal` (checks for shares, deletes photo from Storage)
- **Side effects:** toast; invalidates `qurban-animals`, `qurban-animal-detail`; photo upload/delete via `supabase.storage.from('qurban-photos')`

### `useQurbanCoupons.ts`
- **Tables:** `qurban_coupons`, `qurban_events`, `qurban_shares`, `qurban_animals`
- **Fetches:** `useQurbanCouponsByEvent(eventId, params)` (paginated), `useCouponByToken(token)`
- **Mutations:** `useGenerateMuzakkiCoupon` (cancels existing active coupon for share, creates new), `useGenerateMustahikCoupons` (bulk insert), `useRedeemCouponByToken` (validates event, expiry, status then redeems; caller handles error display — no auto-toast on error), `useRedeemCouponManually`, `useCancelCoupon`, `useUpdateCouponExpiry`
- **Side effects:** toast on most mutations (except `useRedeemCouponByToken` suppresses error toast); invalidates `qurban-coupons` query key

### `useQurbanDashboard.ts`
- **Tables:** `qurban_animals`, `qurban_shares`, `qurban_coupons`, `qurban_events`
- **Fetches:** `useQurbanDashboardStats(eventId?)` — 4 parallel queries, computes per-event breakdown; slots: sapi=7/head, kambing=1/head
- **Mutations:** none
- **Side effects:** none

### `useQurbanEvents.ts`
- **Tables:** `qurban_events`, `qurban_animals`
- **Fetches:** `useQurbanEventList()`
- **Mutations:** `useCreateQurbanEvent`, `useUpdateQurbanEvent`, `useDeleteQurbanEvent` (checks for animals first)
- **Side effects:** toast; invalidates `qurban-events`

### `useQurbanShares.ts`
- **Tables:** `qurban_shares`, `qurban_animals`, `qurban_events`, `muzakki`, `qurban_coupons`
- **Fetches:** `useQurbanShareList(animalId)`, `useQurbanShareListFlat(params)` (multi-join, paginated), `useMuzakkiSearch(query)`, `useAvailableAnimalSlots(eventId?)`
- **Mutations:** `useAssignQurbanShare` (checks max slots: sapi=7, kambing=1), `useUpdateSharePayment` (uses optimistic update via `onMutate`), `useRemoveQurbanShare`
- **Side effects:** toast; invalidates `qurban-shares`; `useUpdateSharePayment` rolls back optimistic update on error

### `useRekonsiliasi.ts`
- **Tables:** `rekonsiliasi`, `tahun_zakat`, `accounts`, `account_ledger_entries`, `users`
- **Fetches:** `useRekonsiliasiList(tahunZakatId?)`, `useRekonsiliasiSummary(tahunZakatId)`
- **Mutations:** `useCreateRekonsiliasi` (admin-only; resolves account by name, inserts rekonsiliasi + ledger entry atomically; rolls back rekonsiliasi if ledger entry fails), `useDeleteRekonsiliasi` (admin-only; deletes ledger entry first, then rekonsiliasi)
- **Exports:** helper functions `createRekonsiliasiLedgerEntry`, `deleteRekonsiliasiLedgerEntry`
- **Side effects:** toast; invalidates `rekonsiliasi-list`, `rekonsiliasi-summary`, `dashboard-stats`

### `useSedekahReceipts.ts`
- **Tables:** `bukti_sedekah`
- **Fetches:** `useSedekahReceiptsList()` — top 100, ordered by created_at desc
- **Mutations:** `useUpdateSedekahReceipt`, `useDeleteSedekahReceipt`
- **Side effects:** invalidates `bukti-sedekah-list` (no toast)

### `useTransactionTags.ts`
- **Tables:** `transaction_tags`
- **Fetches:** `useTransactionTags()` (active only), `useAllTransactionTags()` (all including inactive)
- **Mutations:** `useAddTransactionTag` (max 50 chars), `useDeactivateTransactionTag` (soft delete — sets `is_active=false`)
- **Side effects:** toast; invalidates `transaction_tags`; offline mode uses `offlineStore`

### `useUsers.ts`
- **Tables:** `users`
- **Fetches:** `useUsersList()` — all users ordered by created_at; returns `[]` on 403
- **Mutations:** `useCreateUser` (currently throws — placeholder comment says to use Supabase Dashboard or Edge Function), `useUpdateUser`, `useToggleUserActive`; all mutations guard against demoting last active admin via `mapUserMutationError`
- **Side effects:** toast; invalidates `users-list`

---

## 2.4 Lib Modules Reference

| Module | Purpose | Key Exports |
|---|---|---|
| `supabase.ts` | Creates and exports the typed Supabase client | `supabase` (typed `SupabaseClient<Database>`). Config: `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true` |
| `auth.tsx` | React Auth context with session management | `AuthProvider`, `useAuth()` → `{ user, session, loading, login, logout, hasRole }`. 8-hour session timeout. Supports offline mock via `VITE_OFFLINE_MODE`. |
| `offlineStore.ts` | In-memory seed data store for offline/demo mode | `offlineStore` singleton. Seeds: tahun_zakat (1447H/2026), muzakki, pembayaran, mustahik, distribusi, hak_amil_configs, transaction_tags. Full CRUD methods: `addDistribusi`, `updateDistribusiStatus`, `deleteDistribusi`, `getStokSummary`, etc. |
| `mockAuth.ts` | Mock authentication for offline mode | `mockAuthService.signInWithPassword`, `.getSession`, `.signOut`. 3 mock users: admin@masjid.com (admin), bendahara@masjid.com (petugas), panitia@masjid.com (petugas). Session stored in `localStorage` key `mock_auth_session_v2`. |
| `hakAmilSnapshot.ts` | Creates/upserts hak_amil_snapshots records | `mapKategoriToHakAmil(kategori)`, `createHakAmilSnapshot(input)`, `upsertHakAmilSnapshot(input)`, `fetchBasisModeForTahun(tahunZakatId)`. Snapshot failures are non-blocking (logged but not thrown). |
| `aggregationRules.ts` | Maps widget rule IDs to DashboardStats fields | `AGGREGATION_RULES: AggregationRule[]`, `AGGREGATION_RULE_MAP`. 19 rules covering all stat dimensions (muzakki, mustahik, pemasukan, distribusi, hak amil). |
| `dashboardDefaults.ts` | Default dashboard config and `createDefaultDashboard()` | `DEFAULT_DASHBOARD_CONFIG`, `DEFAULT_DASHBOARD_WIDGETS` (27 widgets in order), `createDefaultDashboard()` — inserts config + widgets in bulk |
| `dashboardTemplates.ts` | Dashboard template definitions for the create wizard | `DASHBOARD_TEMPLATE_OPTIONS`, `getTemplateWidgets(templateId)`. Templates: `scratch`, `full`, `monitoring`, `hak_amil_focus` |
| `couponExport.ts` | Exports coupon HTML element to PNG image | `exportCouponImage(element)` (returns Blob), `shareCouponImage(element, filename)` — tries Web Share API (mobile) then falls back to download link. Uses `html2canvas` with scale=2. |
| `thermalCouponPrint.ts` | Generates 58mm thermal printer HTML for coupon | `printThermalCoupon(data: ThermalCouponData)` — opens a new window with print-ready HTML. Uses `XMLSerializer` to embed QR SVG. |
| `terbilang.ts` | Converts numbers to Indonesian written-out words | `numberToTerbilang(num)`, `formatRupiah(amount)`, `getTerbilangText(amount)`. Supports units/tens/hundreds/thousands/millions. |
| `branding.ts` | Centralized branding constants | `BRANDING` const object with: `ORGANIZATION_FULL`, `ORGANIZATION_SHORT`, `MOSQUE_NAME`, `APP_TITLE`, `LOGO_PATH`, etc. Also `getBrandingValue(key)` helper. |
| `constants.ts` | Simple app-wide string constants | `APP_NAME`, `ORG_NAME`, `ORG_SERVICE` (with WhatsApp number) |
| `utils.ts` | General utility functions | `cn(...inputs)` (Tailwind class merge using `clsx` + `tailwind-merge`), `isUuid(value)` (UUID v1–v5 regex validation) |

---

## 2.5 Module Map

Full dependency chain: Page → Hooks used → Lib modules → Supabase tables

| Page | Hooks | Lib | Tables |
|---|---|---|---|
| Dashboard | useDashboardStats, useTahunZakatList, useMonthlyPemasukan, useDashboardConfigs, useDashboardWidgets | aggregationRules, supabase | tahun_zakat, pembayaran_zakat, mustahik, distribusi_zakat, pemasukan_uang, pemasukan_beras, rekonsiliasi, hak_amil, hak_amil_configs, dashboard_configs, dashboard_widgets |
| Login | useAuth | auth, supabase, mockAuth, offlineStore | users |
| Register | (useInvitations helpers) | supabase | user_invitations (via Edge Fn) |
| Muzakki | useMuzakkiList, useCreateMuzakki, useUpdateMuzakki, useDeleteMuzakki, useMuzakkiTransactionHistory, useTahunZakatList, useTransactionTags | supabase, offlineStore | muzakki, pembayaran_zakat, pemasukan_uang, pemasukan_beras, qurban_shares, tahun_zakat, transaction_tags |
| PemasukanUang | usePemasukanUangList, useCreatePemasukanUang, useUpdatePemasukanUang, useDeletePemasukanUang, useAccountsList, useTahunZakatList, useTransactionTags | supabase, hakAmilSnapshot, offlineStore | pemasukan_uang, account_ledger_entries, hak_amil_snapshots, accounts, tahun_zakat, transaction_tags |
| PemasukanBeras | usePemasukanBerasList, useCreatePemasukanBeras, useUpdatePemasukanBeras, useDeletePemasukanBeras, useTahunZakatList, useTransactionTags | supabase, hakAmilSnapshot, offlineStore | pemasukan_beras, account_ledger_entries, hak_amil_snapshots, accounts, tahun_zakat, transaction_tags |
| Mustahik | useMustahikList, useKategoriMustahik, useCreateMustahik, useUpdateMustahik, useToggleMustahikActive, useBulkToggleMustahik, usePreviousYearMustahik, useImportMustahik, useDeleteMustahik, useMustahikHistory, useTahunZakatList | supabase, offlineStore | mustahik, kategori_mustahik, distribusi_zakat, tahun_zakat |
| Distribusi | useDistribusiList, useStokCheck, useCreateDistribusi, useUpdateDistribusiStatus, useDeleteDistribusi, useTahunZakatList | supabase, offlineStore | distribusi_zakat, mustahik, tahun_zakat, pembayaran_zakat, transaction_tags |
| Laporan | useTahunZakatList | supabase | tahun_zakat (child components add more) |
| Settings | useAuth, useHakAmilConfig, useTahunZakatList, useCreateTahunZakat, useUpdateTahunZakat, useToggleTahunZakatActive, useUsersList, useCreateUser, useUpdateUser, useToggleUserActive, useAllTransactionTags, useAddTransactionTag, useDeactivateTransactionTag | supabase, auth | hak_amil, hak_amil_configs, tahun_zakat, users, transaction_tags |
| AccountsManagement | useAccountsList, useAccountLedger, useCreateAccount, useUpdateAccount, useDeleteAccount, useCreateManualLedgerEntry | supabase | accounts, account_ledger_entries |
| Qurban | useQurbanEventList, useQurbanAnimalList, useDeleteQurbanAnimal, useAuth | supabase | qurban_events, qurban_animals, qurban_shares |
| QurbanDashboard | useQurbanDashboardStats, useQurbanEventList | supabase | qurban_animals, qurban_shares, qurban_coupons, qurban_events |
| QurbanEvents | useQurbanEventList, useDeleteQurbanEvent | supabase | qurban_events, qurban_animals |
| QurbanPeserta | useQurbanShareListFlat, useUpdateSharePayment, useRemoveQurbanShare, useGenerateMuzakkiCoupon, useQurbanEventList | supabase | qurban_shares, qurban_animals, qurban_events, muzakki, qurban_coupons |
| QurbanDistribusi | useQurbanEventList, useKategoriMustahik, useMustahikList, useQurbanCouponsByEvent, useRedeemCouponManually, useCancelCoupon, useUpdateCouponExpiry | supabase | qurban_events, qurban_coupons, qurban_shares, qurban_animals, mustahik, kategori_mustahik |
| QurbanScan | useQurbanEventList, useCouponByToken, useRedeemCouponByToken, useQurbanCouponsByEvent | supabase | qurban_events, qurban_coupons, qurban_shares, qurban_animals |
| SedekahReceipt | useSedekahReceiptsList, useDeleteSedekahReceipt | supabase | bukti_sedekah |
| DataMasterWarga | useMuzakkiList, useDeleteMuzakki, useAuth | supabase, auth | muzakki |
| DataMasterMustahik | useMustahikList, useKategoriMustahik, useCreateMustahik, useUpdateMustahik, useToggleMustahikActive, useDeleteMustahik | supabase | mustahik, kategori_mustahik |
| DataMasterPengguna | useUsersList, useUpdateUser, useInvitationsList, useCreateInvitation, useRevokeInvitation, useAuth | supabase, auth | users, user_invitations |
| DataMasterUPZSettings | useOrgSettings, useUpdateOrgSettings, useUPZUnitList, useDeleteUPZUnit | supabase | org_settings, upz_units |
| DashboardSettings | useDashboardConfigs | supabase | dashboard_configs |

---

## 2.6 Zakat Payment Data Flow Diagram

Complete lifecycle of a zakat payment from collection to distribution.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ZAKAT PAYMENT LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────────────┘

COLLECTION (Penerimaan)
═══════════════════════

  Petugas/Admin
       │
       ├─── Legacy path (Muzakki page) ──────────────────────────────────┐
       │    usePembayaranList / useCreatePembayaran                       │
       │    ↓                                                             │
       │    INSERT pembayaran_zakat                                       │
       │    (jenis_zakat: 'uang'|'beras', jumlah_uang_rp|beras_kg)       │
       │                                                                  │
       └─── New path (PemasukanUang / PemasukanBeras pages) ─────────────┤
            useCreatePemasukanUang / useCreatePemasukanBeras             │
            ↓                                                             │
            INSERT pemasukan_uang (kategori, jumlah_uang_rp)             │
            INSERT pemasukan_beras (kategori, jumlah_beras_kg)           │
            │                                                             │
            ├──→ createPemasukanUangLedgerEntry                          │
            │    INSERT account_ledger_entries (IN entry)                │
            │    (running_balance_before/after computed in-app)          │
            │                                                             │
            └──→ createHakAmilSnapshot / upsertHakAmilSnapshot           │
                 (from lib/hakAmilSnapshot.ts)                           │
                 INSERT/UPDATE hak_amil_snapshots                        │
                 (persen from hak_amil_configs, bruto/neto/nominal)     │
                                                                          │
  ┌───────────────────────────────────────────────────────────────────────┘
  │
  │  Bulk path (PemasukanUang bulk mode)
  │  useBulkPembayaran.submitBulk(rows, meta)
  │  ↓
  │  for each muzakki × category:
  │    INSERT pemasukan_uang / pemasukan_beras
  │    → createHakAmilSnapshot (non-blocking)
  │  INSERT bulk_submission_logs
  └──────────────────────────────────────────────────────────────────────

SETTINGS & CONFIGURATION
════════════════════════

  Settings page (admin only)
       │
       ├──→ tahun_zakat (nilai_beras_kg, nilai_uang_rp)
       │    used to convert rice to rupiah for hak amil calc
       │
       └──→ hak_amil_configs (per-year percentages)
            persen_zakat_fitrah, persen_zakat_maal,
            persen_infak, persen_fidyah, persen_beras

HAK AMIL CALCULATION
════════════════════

  Two sources feed useHakAmil summaries:

  Source A: hak_amil_snapshots (snapshot per transaction)
            ↑ written by createHakAmilSnapshot / useBulkPembayaran

  Source B: Live computation in useHakAmilYearlySummary /
            useHakAmilMonthlySummary (queries all three
            pemasukan tables + hak_amil_configs directly)

  Formula:
    gross_amount = Σ pemasukan_uang + (pemasukan_beras_kg × nilai_uang_rp/nilai_beras_kg)
    neto = gross - rekonsiliasi
    nominal_hak_amil = neto × persen_hak_amil / 100

RECONCILIATION
══════════════

  Settings page / SettingsPage
       │
       └──→ useCreateRekonsiliasi
            (admin-only, checks role in DB before insert)
            │
            ├── INSERT rekonsiliasi (jenis, jumlah, tanggal)
            │
            └── createRekonsiliasiLedgerEntry
                INSERT account_ledger_entries
                (entry_type: 'REKONSILIASI', source_rekonsiliasi_id)

DISTRIBUTION (Distribusi)
═════════════════════════

  Admin/Petugas
       │
       └──→ Distribusi page: useCreateDistribusi
            │
            ├── Check no duplicate (mustahik × tahun in distribusi_zakat)
            │
            ├── Stock check (stok from pembayaran_zakat - selesai distribusi)
            │   [Note: stock reads from legacy pembayaran_zakat, not pemasukan_* tables]
            │
            └── INSERT distribusi_zakat
                (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah, status: 'pending')
                │
                └── useUpdateDistribusiStatus → UPDATE status to 'selesai'
                    invalidates: distribusi-list, stok-check, dashboard-stats

DASHBOARD AGGREGATION
═════════════════════

  useDashboardStats queries:
       ├── muzakki (count)
       ├── mustahik (count, active/inactive)
       ├── pemasukan_uang (SUM per kategori)
       ├── pemasukan_beras (SUM per kategori)
       ├── pembayaran_zakat (legacy, included in totals)
       ├── distribusi_zakat (SUM beras/uang selesai)
       ├── rekonsiliasi (adjustments)
       ├── hak_amil + hak_amil_configs (amil share)
       └── → DashboardStats object
            → rendered by configurable widgets in dashboard_widgets

QUERY CACHE INVALIDATION TREE
══════════════════════════════

  pemasukan_uang/beras insert/update/delete
    → pemasukan-uang / pemasukan-beras
    → dashboard-stats
    → monthly-pemasukan
    → hak-amil-monthly-summary
    → hak-amil-yearly-summary

  distribusi_zakat insert/update/delete
    → distribusi-list
    → stok-check
    → dashboard-stats

  rekonsiliasi insert/delete
    → rekonsiliasi-list
    → rekonsiliasi-summary
    → dashboard-stats

  tahun_zakat insert/update
    → tahun-zakat-list
    → dashboard-stats
```

---
