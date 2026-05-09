## Relevant Files

### New Files
- `zakat-fitrah-app/src/pages/DataMasterWarga.tsx` - Main Warga (Muzakki) management page
- `zakat-fitrah-app/src/pages/DataMasterMustahik.tsx` - Mustahik management page
- `zakat-fitrah-app/src/pages/DataMasterPengguna.tsx` - User/Petugas management page
- `zakat-fitrah-app/src/pages/DataMasterUPZSettings.tsx` - Organization settings + UPZ units page
- `zakat-fitrah-app/src/components/data-master/WargaForm.tsx` - Add/Edit warga dialog form
- `zakat-fitrah-app/src/components/data-master/WargaImportDialog.tsx` - CSV/Excel import dialog
- `zakat-fitrah-app/src/components/data-master/WargaHistorySheet.tsx` - Slide-over showing zakat + qurban history for a warga
- `zakat-fitrah-app/src/hooks/useOrgSettings.ts` - Hooks for org_settings and upz_units tables
- `zakat-fitrah-app/supabase/migrations/039_data_master_tables.sql` - Creates org_settings and upz_units tables

### Modified Files
- `zakat-fitrah-app/src/store/appStore.ts` - Add `'data-master'` to `AppMode` union type
- `zakat-fitrah-app/src/components/layouts/AppSwitcher.tsx` - Add Data Master entry to apps array
- `zakat-fitrah-app/src/components/layouts/AppLayout.tsx` - Add `dataMasterNavSections` and handle `'data-master'` in sidebar logic
- `zakat-fitrah-app/src/App.tsx` - Add lazy imports and routes for all 4 Data Master pages
- `zakat-fitrah-app/src/lib/branding.ts` - Note: keep as fallback; org settings page will write to DB; PDF generation can be updated later

### Notes

- No unit test files listed — the project has no test suite. Manual verification steps are included in task 7.0.
- Use `npm run build` (from `zakat-fitrah-app/`) after each task group to catch TypeScript errors early.
- The `muzakki` table (not "warga") is the correct table name. Hooks already exist in `src/hooks/useMuzakki.ts`.
- Mustahik is a **separate entity** from muzakki — do not conflate them.
- Run migrations via `supabase db push` or the Supabase SQL editor.
- `papaparse` and `xlsx` (SheetJS) may need to be installed: `npm install papaparse xlsx` + `npm install -D @types/papaparse`.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch: `git checkout -b feature/data-master`

---

- [ ] 1.0 Add Data Master to app switcher, sidebar, and router
  - [ ] 1.1 Open `src/store/appStore.ts`. Change `type AppMode = 'zakat' | 'qurban'` to `type AppMode = 'zakat' | 'qurban' | 'data-master'`. This is the only change needed in this file.
  - [ ] 1.2 Open `src/components/layouts/AppSwitcher.tsx`. Add `Database` to the lucide-react import. Add a third entry to the `apps` array:
    ```ts
    {
      mode: 'data-master',
      name: 'Data Master',
      description: 'Manajemen Data Induk',
      icon: Database,
      defaultPath: '/data-master/warga',
    }
    ```
  - [ ] 1.3 Open `src/components/layouts/AppLayout.tsx`. After the `qurbanNavSections` array (around line 205), add a new `dataMasterNavSections` array with these 4 items (follow the exact same `NavSection` / `NavItem` structure used by `zakatNavSections`):
    - Section title: `"Data Master"`, items:
      - Warga: path `/data-master/warga`, icon `Users`
      - Mustahik: path `/data-master/mustahik`, icon `Heart`
      - Pengguna: path `/data-master/pengguna`, icon `UserCog`, roles `['admin']`
      - Pengaturan UPZ: path `/data-master/upz-settings`, icon `Settings2`, roles `['admin']`

    Then update line 218 from:
    ```ts
    const allNavSections = activeApp === 'zakat' ? zakatNavSections : qurbanNavSections
    ```
    to:
    ```ts
    const allNavSections =
      activeApp === 'zakat' ? zakatNavSections :
      activeApp === 'qurban' ? qurbanNavSections :
      dataMasterNavSections
    ```
  - [ ] 1.4 Create 4 stub page files (minimal placeholder — just enough to export a component so the build passes):
    - `src/pages/DataMasterWarga.tsx` → `export function DataMasterWarga() { return <div>Warga</div> }`
    - `src/pages/DataMasterMustahik.tsx` → `export function DataMasterMustahik() { return <div>Mustahik</div> }`
    - `src/pages/DataMasterPengguna.tsx` → `export function DataMasterPengguna() { return <div>Pengguna</div> }`
    - `src/pages/DataMasterUPZSettings.tsx` → `export function DataMasterUPZSettings() { return <div>UPZ Settings</div> }`
  - [ ] 1.5 Open `src/App.tsx`. Add 4 lazy imports at the top (follow the same pattern as existing lazy imports):
    ```ts
    const DataMasterWarga = lazy(() => import('@/pages/DataMasterWarga').then(m => ({ default: m.DataMasterWarga })))
    const DataMasterMustahik = lazy(() => import('@/pages/DataMasterMustahik').then(m => ({ default: m.DataMasterMustahik })))
    const DataMasterPengguna = lazy(() => import('@/pages/DataMasterPengguna').then(m => ({ default: m.DataMasterPengguna })))
    const DataMasterUPZSettings = lazy(() => import('@/pages/DataMasterUPZSettings').then(m => ({ default: m.DataMasterUPZSettings })))
    ```
    Add 4 new protected routes inside the existing `<AppLayout>` route group:
    ```tsx
    <Route path="/data-master/warga" element={<ProtectedRoute><DataMasterWarga /></ProtectedRoute>} />
    <Route path="/data-master/mustahik" element={<ProtectedRoute><DataMasterMustahik /></ProtectedRoute>} />
    <Route path="/data-master/pengguna" element={<ProtectedRoute roles={['admin']}><DataMasterPengguna /></ProtectedRoute>} />
    <Route path="/data-master/upz-settings" element={<ProtectedRoute roles={['admin']}><DataMasterUPZSettings /></ProtectedRoute>} />
    ```
    Also add a redirect: `<Route path="/data-master" element={<Navigate to="/data-master/warga" replace />} />`.
  - [ ] 1.6 Run `npm run build` from `zakat-fitrah-app/`. Fix any TypeScript errors (most likely from the expanded `AppMode` union — check any exhaustive switch or ternary on `activeApp`).
  - [ ] 1.7 Manual check: open the app, click the app switcher — confirm "Data Master" appears as a third option. Click it and confirm the sidebar shows Warga, Mustahik, Pengguna, Pengaturan UPZ.

---

- [ ] 2.0 DB migrations (org_settings and upz_units tables)
  - [ ] 2.1 Read `src/lib/branding.ts` to get the current hardcoded organization values (ORGANIZATION_FULL, ADDRESS, etc.) — these will be used as seed data in the migration.
  - [ ] 2.2 Create `zakat-fitrah-app/supabase/migrations/039_data_master_tables.sql` with the following content:

    ```sql
    BEGIN;

    -- Organization settings (single-row table, id = 'org')
    CREATE TABLE IF NOT EXISTS public.org_settings (
      id           TEXT PRIMARY KEY DEFAULT 'org',
      nama_lembaga TEXT NOT NULL DEFAULT '',
      alamat       TEXT NOT NULL DEFAULT '',
      no_telp      TEXT,
      email        TEXT,
      logo_url     TEXT,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Seed with current hardcoded values
    INSERT INTO public.org_settings (id, nama_lembaga, alamat)
    VALUES ('org', 'YAYASAN AL-FAJAR PERMATA PAMULANG', 'Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan')
    ON CONFLICT (id) DO NOTHING;

    -- RLS for org_settings
    ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "org_settings_select_active" ON public.org_settings
      FOR SELECT TO authenticated USING (public.get_current_user_is_active());
    CREATE POLICY "org_settings_upsert_admin" ON public.org_settings
      FOR ALL TO authenticated
      USING (public.get_current_user_is_active() AND public.get_current_user_role() = 'admin')
      WITH CHECK (public.get_current_user_is_active() AND public.get_current_user_role() = 'admin');

    -- UPZ collection units
    CREATE TABLE IF NOT EXISTS public.upz_units (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nama_unit    TEXT NOT NULL,
      petugas_amil TEXT,
      lokasi       TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE OR REPLACE TRIGGER update_upz_units_updated_at
      BEFORE UPDATE ON public.upz_units
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    -- RLS for upz_units
    ALTER TABLE public.upz_units ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "upz_units_select_active" ON public.upz_units
      FOR SELECT TO authenticated USING (public.get_current_user_is_active());
    CREATE POLICY "upz_units_write_admin_petugas" ON public.upz_units
      FOR ALL TO authenticated
      USING (public.get_current_user_is_active() AND public.get_current_user_role() IN ('admin', 'petugas'))
      WITH CHECK (public.get_current_user_is_active() AND public.get_current_user_role() IN ('admin', 'petugas'));

    COMMIT;
    ```
  - [ ] 2.3 Apply the migration to Supabase (`supabase db push` or paste into the SQL editor).

---

- [ ] 3.0 Build Warga (Muzakki) management page
  - [ ] 3.1 Read `src/hooks/useMuzakki.ts` in full to understand the existing query/mutation hooks, types (`MuzakkiMaster`, `CreateMuzakkiInput`, `UpdateMuzakkiInput`), and how pagination/search are already implemented.
  - [ ] 3.2 Read `src/pages/Muzakki.tsx` to understand the existing page — you will build on top of the same hooks but create a richer standalone page at `/data-master/warga`.
  - [ ] 3.3 Add a `useMuzakkiHistory(muzakkiId: string | null)` hook to `src/hooks/useMuzakki.ts`. It should run two parallel queries when `muzakkiId` is non-null:
    - Query 1: zakat records — select from `pembayaran_zakat` (or whichever table stores zakat payments) where `muzakki_id = muzakkiId`, join `tahun_zakat`. Return year, jenis_zakat, jumlah.
    - Query 2: qurban records — select from `qurban_shares` joined with `qurban_animals` and `qurban_events` where the share's `muzakki_id = muzakkiId`. Return event name, animal nomor, jenis, status_pembayaran.
  - [ ] 3.4 Replace the stub `src/pages/DataMasterWarga.tsx` with the full implementation:
    - Page header: "Warga" title + "Tambah Warga" button + "Import CSV/Excel" button (admin only)
    - Search input (debounced) + pagination controls (reuse the pagination pattern from QurbanPeserta or existing Muzakki page)
    - Table columns: No., Nama KK, No. Telp, Alamat, Actions (Edit icon button, Delete icon button, History icon button)
    - Use `useMuzakkiList` from `useMuzakki.ts` for data fetching (check if such a hook exists — if only individual queries exist, add a paginated list query)
    - Clicking the history icon opens `WargaHistorySheet` for that warga
    - Delete button shows `AlertDialog`; if the delete fails with a foreign key constraint error, display: *"Data warga tidak dapat dihapus karena memiliki riwayat transaksi."*
  - [ ] 3.5 Create `src/components/data-master/WargaForm.tsx` — a `Dialog` form for adding and editing a warga. Fields: Nama KK (required), No. Telp, Alamat (required), RT, RW, Keterangan. Use React Hook Form + Zod. Submit calls `useCreateMuzakki` or `useUpdateMuzakki` from `useMuzakki.ts`.
    - Note: Check if `rt`, `rw`, `keterangan` columns exist on the `muzakki` table. If they don't, only include the columns that exist (nama_kk, alamat, no_telp). Add a code comment noting the missing columns.
  - [ ] 3.6 Create `src/components/data-master/WargaHistorySheet.tsx` — a `Sheet` (from `@/components/ui/sheet`) that receives a `muzakkiId` prop and calls `useMuzakkiHistory`. Display:
    - Warga name as the sheet title
    - **Riwayat Zakat** section: a small table showing year, type (Beras/Uang), and amount. Show "Belum ada riwayat zakat" if empty.
    - **Riwayat Qurban** section: a small table showing event name, animal nomor, jenis (Sapi/Kambing), status pembayaran. Show "Belum ada riwayat qurban" if empty.
  - [ ] 3.7 Check `package.json` for `papaparse` and `xlsx`. If missing, run `npm install papaparse xlsx` and `npm install -D @types/papaparse` from `zakat-fitrah-app/`.
  - [ ] 3.8 Create `src/components/data-master/WargaImportDialog.tsx` — a `Dialog` for CSV/Excel import:
    - Step 1 (Upload): File picker for `.csv` and `.xlsx`. On file selection, parse with `papaparse` (CSV) or `xlsx` (Excel). Expected columns: `nama_kk`, `no_telp`, `alamat`, `rt`, `rw`, `keterangan` (make `nama_kk` and `alamat` required).
    - Step 2 (Preview): Show a table of parsed rows. Highlight rows with validation errors in red. Show row count: "X baris valid, Y baris gagal."
    - Step 3 (Confirm): "Import X Baris" button that batch-inserts valid rows using the Supabase client directly (or a new `useBulkCreateMuzakki` mutation). Show final success/failure summary.
  - [ ] 3.9 Wire the "Import CSV/Excel" button in `DataMasterWarga.tsx` to open `WargaImportDialog`. On import success, invalidate the muzakki list query.
  - [ ] 3.10 Run `npm run build` and fix any TypeScript errors.

---

- [ ] 4.0 Build Mustahik management page
  - [ ] 4.1 Read `src/hooks/useMustahik.ts` in full to understand available hooks and types (especially the Mustahik type shape, CRUD mutations, and any category/kategori data).
  - [ ] 4.2 Read `src/pages/Mustahik.tsx` to understand the existing implementation — the new Data Master page is an enhanced standalone version.
  - [ ] 4.3 Replace the stub `src/pages/DataMasterMustahik.tsx` with the full implementation:
    - Page header: "Mustahik" title + "Tambah Mustahik" button
    - Search input + pagination
    - Table columns: No., Nama, Alamat, Kategori, Jumlah Anggota, No. Telp, Status (Aktif/Nonaktif badge), Actions (Edit, Delete/Nonaktifkan)
    - Use existing hooks from `useMustahik.ts` for data fetching
    - "Tambah Mustahik" and Edit buttons open a form dialog with fields: Nama (required), Alamat (required), Kategori (dropdown from `kategori_mustahik` table), Jumlah Anggota (number), No. Telp, Catatan, Is Active (toggle)
    - Delete/Nonaktifkan: use `is_active = false` rather than hard delete where possible (check existing hook behavior)
  - [ ] 4.4 Run `npm run build` and fix errors.

---

- [ ] 5.0 Build Pengguna (User) management page
  - [ ] 5.1 Read `src/hooks/useUsers.ts` and `src/hooks/useInvitations.ts` in full. Also read `src/pages/AccountsManagement.tsx` to understand what user management already exists — reuse as much as possible.
  - [ ] 5.2 Replace the stub `src/pages/DataMasterPengguna.tsx` with the full implementation:
    - Page header: "Pengguna" title + "Undang Pengguna" button
    - Table columns: Nama, Email, Role (badge: Admin/Petugas/Viewer), Status (Aktif/Nonaktif badge), Terakhir Login, Actions
    - Use `useUsers` (or equivalent) to fetch the user list. If `last_sign_in_at` is not returned by the existing hook, update it to include this field from the auth users join.
    - Display "Terakhir Login" as relative time using `formatDistanceToNow` from `date-fns` with `{ locale: id, addSuffix: true }` (e.g., "3 hari lalu"). Show "Belum pernah login" if null.
    - **Undang Pengguna** dialog: Email (required), Nama, Role select (admin/petugas/viewer). On submit, call the existing invitation mutation from `useInvitations.ts`.
    - **Edit Role** per row: a small dialog or inline select to change the user's role. Use the existing update-role mutation.
    - **Nonaktifkan / Aktifkan** toggle: calls `useToggleUserActive` (or existing equivalent). The button for the currently logged-in user must be disabled with a tooltip: *"Tidak dapat menonaktifkan akun sendiri."*
  - [ ] 5.3 Run `npm run build` and fix errors.

---

- [ ] 6.0 Build Pengaturan UPZ page
  - [ ] 6.1 Create `src/hooks/useOrgSettings.ts` with the following hooks (follow the existing hook pattern with React Query):
    - `useOrgSettings()` — SELECT from `org_settings` where `id = 'org'`. Returns the single row.
    - `useUpdateOrgSettings()` — UPSERT mutation for `org_settings`. Invalidates `['org_settings']` on success.
    - `useUPZUnitList()` — SELECT all from `upz_units` ordered by `created_at`.
    - `useCreateUPZUnit()` — INSERT mutation. Invalidates `['upz_units']`.
    - `useUpdateUPZUnit()` — UPDATE mutation. Invalidates `['upz_units']`.
    - `useDeleteUPZUnit()` — DELETE mutation with confirmation. Invalidates `['upz_units']`.
  - [ ] 6.2 Replace the stub `src/pages/DataMasterUPZSettings.tsx` with the full implementation. The page has two sections inside a single scrollable layout:

    **Section 1 — Informasi Organisasi:**
    - A `Card` containing a React Hook Form + Zod form with fields: Nama Lembaga (required), Alamat (required), No. Telp / WhatsApp, Email, Logo (image upload using the same pattern as `PhotoUpload.tsx` in the qurban module — upload to Supabase Storage bucket `org-assets`, store URL in `logo_url`).
    - Populated from `useOrgSettings()` on load.
    - A "Simpan" button calls `useUpdateOrgSettings()`. Show a success toast on save.

    **Section 2 — Unit UPZ / Amil:**
    - A `Card` with a table: Nama Unit, Petugas Amil, Lokasi, Actions (Edit pencil icon, Delete trash icon).
    - "Tambah Unit" button opens a `Dialog` form with fields: Nama Unit (required), Petugas Amil, Lokasi.
    - Edit button opens the same form pre-filled.
    - Delete button shows `AlertDialog` confirmation before calling `useDeleteUPZUnit()`.
    - Populated from `useUPZUnitList()`.

  - [ ] 6.3 Create the `org-assets` Supabase Storage bucket if it doesn't already exist. Add a storage policy allowing admin users to upload (INSERT) and all authenticated users to read (SELECT). Do this via the Supabase dashboard or add it to the migration SQL.
  - [ ] 6.4 Run `npm run build` and fix errors.

---

- [ ] 7.0 Final verification
  - [ ] 7.1 Run `npm run build` — confirm zero errors.
  - [ ] 7.2 App switcher: confirm 3 apps shown; clicking "Data Master" navigates to `/data-master/warga` and sidebar shows the 4 correct nav items.
  - [ ] 7.3 Warga page: add a new warga, edit it, view history panel (even if empty), attempt delete.
  - [ ] 7.4 CSV import: create a CSV with 3+ rows matching the expected columns. Import it and confirm the rows appear in the warga table.
  - [ ] 7.5 Mustahik page: add, edit, and deactivate a mustahik record.
  - [ ] 7.6 Pengguna page: invite a user (confirm email is sent or at least no error), edit a role, confirm deactivate is disabled for own account.
  - [ ] 7.7 Pengaturan UPZ: update Nama Lembaga, save, reload — confirm the value persists. Add a UPZ unit, edit it, delete it.
  - [ ] 7.8 Switching back to UPZ Al-Fajar or Qurban from the app switcher still works correctly and shows the right sidebar.
