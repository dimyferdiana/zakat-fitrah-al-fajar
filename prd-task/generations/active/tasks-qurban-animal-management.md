## Relevant Files

### New Files to Create
- `zakat-fitrah-app/supabase/migrations/035_qurban_animal_management.sql` - New tables: `qurban_events`, `qurban_animals`, `qurban_shares` with RLS policies and share-limit constraint.
- `zakat-fitrah-app/supabase/migrations/036_qurban_data_migration.sql` - Script to migrate existing `qurban_registrations` and `qurban_participants` into the new schema.
- `zakat-fitrah-app/src/hooks/useQurbanEvents.ts` - React Query hooks for CRUD on `qurban_events`.
- `zakat-fitrah-app/src/hooks/useQurbanAnimals.ts` - React Query hooks for CRUD on `qurban_animals` including photo upload.
- `zakat-fitrah-app/src/hooks/useQurbanShares.ts` - React Query hooks for CRUD on `qurban_shares` and muzakki creation.
- `zakat-fitrah-app/src/components/qurban/QurbanEventDialog.tsx` - Dialog for creating/editing a Qurban event.
- `zakat-fitrah-app/src/components/qurban/AnimalForm.tsx` - Form for creating/editing an animal profile (replaces `QurbanForm.tsx`).
- `zakat-fitrah-app/src/components/qurban/AnimalCard.tsx` - Card component showing photo, code, type, slot fill progress, and payment summary.
- `zakat-fitrah-app/src/components/qurban/AnimalGrid.tsx` - Responsive card grid listing all animals for a selected event.
- `zakat-fitrah-app/src/components/qurban/AnimalDetailDialog.tsx` - Dialog showing all slots for an animal with assign/remove/payment actions.
- `zakat-fitrah-app/src/components/qurban/SlotAssignDialog.tsx` - Dialog to search existing muzakki or add a new person inline, with nominal pre-fill.

### Files to Modify
- `zakat-fitrah-app/src/types/qurban.ts` - Add TypeScript interfaces for `QurbanEvent`, `QurbanAnimal`, `QurbanShare`.
- `zakat-fitrah-app/src/types/database.types.ts` - Add generated types for new tables (or regenerate via Supabase CLI).
- `zakat-fitrah-app/src/components/qurban/BuktiQurban.tsx` - Adapt to render a per-slot receipt using the new data model.
- `zakat-fitrah-app/src/pages/Qurban.tsx` - Refactor page to orchestrate event selector → animal grid → dialogs.
- `zakat-fitrah-app/src/hooks/useQurban.ts` - Keep for backward compatibility reference; functionality replaced by new hooks.

### Files to Remove (or retire)
- `zakat-fitrah-app/src/components/qurban/QurbanForm.tsx` - Replaced by `AnimalForm.tsx`.
- `zakat-fitrah-app/src/components/qurban/QurbanTable.tsx` - Replaced by `AnimalGrid.tsx` + `AnimalCard.tsx`.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Run `npm run build` from `zakat-fitrah-app/` before marking any task complete.
- Apply migrations using Supabase CLI: `supabase db push` (remote) or `supabase db reset` (local Docker).
- Max slots: `sapi = 7`, `kambing = 1`. This is a core business rule — enforce it in both DB and application code.
- The `@/` import alias maps to `zakat-fitrah-app/src/`.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/qurban-animal-management`

---

- [ ] 1.0 Database: new schema + migrate existing data
  - [ ] 1.1 Create migration file `035_qurban_animal_management.sql`. Add the `qurban_events` table with columns: `id` (uuid PK), `nama` (text, required), `tanggal` (date, required), `catatan` (text, nullable), `created_by` (uuid FK auth.users), `created_at`, `updated_at`.
  - [ ] 1.2 In the same migration, add the `qurban_animals` table with columns: `id` (uuid PK), `event_id` (uuid FK `qurban_events`, required), `jenis` (text, CHECK IN ('sapi','kambing')), `sumber_hewan` (text, DEFAULT 'beli', CHECK IN ('beli','titipan')), `nomor` (text, required — e.g. SAP-001), `berat_kg` (numeric, nullable), `harga` (numeric, required), `biaya_perawatan` (numeric, nullable), `foto_url` (text, nullable), `catatan` (text, nullable), `created_by`, `created_at`, `updated_at`.
  - [ ] 1.3 In the same migration, add the `qurban_shares` table with columns: `id` (uuid PK), `animal_id` (uuid FK `qurban_animals`, required), `muzakki_id` (uuid FK `muzakki`, required), `urutan` (integer, required — slot number 1-7 for sapi, 1 for kambing), `nominal` (numeric, required), `status_pembayaran` (text, DEFAULT 'belum_bayar', CHECK IN ('belum_bayar','lunas')), `catatan` (text, nullable), `created_by`, `created_at`, `updated_at`.
  - [ ] 1.4 Add a DB-level constraint to enforce share limits: create a trigger function that checks the current share count for an animal before each insert into `qurban_shares`. If `jenis = 'sapi'` and count >= 7, raise an exception. If `jenis = 'kambing'` and count >= 1, raise an exception.
  - [ ] 1.5 Add a UNIQUE constraint on `(animal_id, urutan)` in `qurban_shares` to prevent duplicate slot numbers.
  - [ ] 1.6 Write RLS policies for all three new tables following the existing pattern in the codebase:
    - `qurban_events`: SELECT for all authenticated active users; INSERT/UPDATE/DELETE for admin only.
    - `qurban_animals`: SELECT for all authenticated active users; INSERT/UPDATE/DELETE for admin and petugas.
    - `qurban_shares`: SELECT for all authenticated active users; INSERT/UPDATE/DELETE for admin and petugas.
  - [ ] 1.7 Create migration file `036_qurban_data_migration.sql`. Insert one legacy event row into `qurban_events` (nama = 'Qurban (Arsip Lama)', tanggal = current date). Then, for each row in `qurban_registrations`: (a) look up or create a `muzakki` record using the registration's `nama`, `alamat`, `no_hp`; (b) insert one row into `qurban_animals` mapping all matching fields; (c) for each row in `qurban_participants` linked to this registration, look up or create a `muzakki` record from participant `nama`, then insert one row into `qurban_shares` with `muzakki_id`, `urutan`, `nominal` (from registration), and `status_pembayaran` mapped from the registration's `status` field.
  - [ ] 1.8 Apply both migrations to the local Supabase instance and verify: query `qurban_events`, `qurban_animals`, `qurban_shares` to confirm data looks correct. Fix any SQL errors.

---

- [ ] 2.0 TypeScript types + React Query hooks
  - [ ] 2.1 Open `src/types/qurban.ts`. Add interfaces: `QurbanEvent` (matches `qurban_events` table), `QurbanAnimal` (matches `qurban_animals` table, include a computed `max_slots: number` helper = jenis === 'sapi' ? 7 : 1), `QurbanShare` (matches `qurban_shares` table). Also add `QurbanShareWithMuzakki` (QurbanShare + nested muzakki name/phone) for display purposes.
  - [ ] 2.2 Update `src/types/database.types.ts` to include Row/Insert/Update types for `qurban_events`, `qurban_animals`, `qurban_shares`. (Either run `supabase gen types typescript` via CLI, or add manually following the existing pattern in the file.)
  - [ ] 2.3 Create `src/hooks/useQurbanEvents.ts`. Export: `useQurbanEventList()` — fetches all events ordered by `tanggal` desc; `useCreateQurbanEvent()` — insert; `useUpdateQurbanEvent()` — update; `useDeleteQurbanEvent()` — delete (check for linked animals before deletion and throw a friendly error if any exist).
  - [ ] 2.4 Create `src/hooks/useQurbanAnimals.ts`. Export: `useQurbanAnimalList(eventId)` — fetches all animals for a given event, ordered by `nomor`; `useQurbanAnimalDetail(animalId)` — single animal; `useCreateQurbanAnimal()` — insert + photo upload (reuse the existing `qurban-photos` bucket pattern from `useQurban.ts`); `useUpdateQurbanAnimal()` — update + optional new photo; `useDeleteQurbanAnimal()` — check for linked shares and throw a friendly error if any exist.
  - [ ] 2.5 Create `src/hooks/useQurbanShares.ts`. Export: `useQurbanShareList(animalId)` — fetches all shares for an animal, joined with muzakki (nama_kk, no_telp), ordered by `urutan`; `useAssignQurbanShare()` — insert (application-level check: count existing shares, compare to max_slots before calling insert); `useUpdateSharePayment()` — toggle `status_pembayaran`; `useRemoveQurbanShare()` — delete a share row. Also export `useMuzakkiSearch(query)` — searches muzakki by nama_kk or no_telp (reuse the pattern from the existing Muzakki module).

---

- [x] 3.0 Qurban Event management UI
  - [x] 3.1 Create `src/components/qurban/QurbanEventDialog.tsx`. This is a Dialog (shadcn/ui) with a form inside. Fields: `nama` (text input, required), `tanggal` (date picker, required), `catatan` (textarea, optional). Supports both create mode (no initial data) and edit mode (pre-filled). On submit, calls `useCreateQurbanEvent` or `useUpdateQurbanEvent`. Show loading state on submit button.
  - [x] 3.2 In `src/pages/Qurban.tsx`, add an event selector at the top of the page. Fetch events using `useQurbanEventList()`. Display as a dropdown (Select from shadcn/ui) or a tab list. Store the selected `eventId` in local state. Show a "Buat Event" button (admin/petugas only) that opens `QurbanEventDialog` in create mode.
  - [x] 3.3 Next to each event in the selector, add an edit icon that opens `QurbanEventDialog` in edit mode. Add a delete icon that shows a confirmation alert before calling `useDeleteQurbanEvent`. If the delete fails (animals exist), show the error message from the hook.
  - [x] 3.4 Handle empty state: if no events exist yet, hide the animal grid and show a centered empty state message (e.g., "Belum ada event Qurban. Buat event terlebih dahulu.") with a "Buat Event Pertama" button.

---

- [x] 4.0 Animal Profile management UI (form, card grid, photo)
  - [x] 4.1 Create `src/components/qurban/AnimalForm.tsx`. A form component (react-hook-form + zod) with fields: `jenis` (radio or select: Sapi / Kambing), `sumber_hewan` (radio: Beli / Titipan — show `biaya_perawatan` field only when 'Titipan' is selected), `nomor` (text input — auto-filled but editable; see task 4.2), `berat_kg` (number input, optional), `harga` (number input, required — label: "Harga Total Hewan (Rp)"), `biaya_perawatan` (number input, shown only for titipan), `catatan` (textarea, optional), plus the photo upload area (task 4.3).
  - [x] 4.2 Implement auto-generated `nomor` inside `AnimalForm.tsx`. When the user selects `jenis`, query the current count of animals with that jenis in the selected event (use `useQurbanAnimalList`), then set `nomor` to e.g. `SAP-001` (prefix SAP for sapi, KAM for kambing, zero-padded to 3 digits). Allow the user to override the value manually.
  - [x] 4.3 Integrate the existing `PhotoUpload.tsx` component into `AnimalForm.tsx` for the `foto` field. On create, upload on form submit and store the URL. On edit, show the existing photo and allow replacement.
  - [x] 4.4 Create `src/components/qurban/AnimalCard.tsx`. A shadcn/ui Card component showing: photo thumbnail (or a placeholder icon if no photo), `nomor` badge, `jenis` badge (Sapi / Kambing), `sumber_hewan` badge (Beli / Titipan), `berat_kg` (if set), `harga` formatted as Rp currency. Below: slot fill progress (e.g. "5 / 7 peserta" with a Progress bar), payment summary badge (e.g. "3 lunas"). When all slots are filled AND all paid, show a green "Selesai" badge on the card.
  - [x] 4.5 Create `src/components/qurban/AnimalGrid.tsx`. Renders a responsive CSS grid of `AnimalCard` components using the result of `useQurbanAnimalList(eventId)`. Pass an `onSelect(animal)` callback so clicking a card opens the detail dialog. Show a loading skeleton while fetching. Handle empty state (no animals) with a message and a "Tambah Hewan" button.
  - [x] 4.6 In `Qurban.tsx`, add a "Tambah Hewan" button (admin/petugas only) that opens a Dialog containing `AnimalForm` in create mode. On each `AnimalCard`, show a kebab menu (3-dot icon) with "Edit" and "Hapus" options. "Edit" opens `AnimalForm` in edit mode pre-filled with existing data. "Hapus" shows a confirmation alert before calling `useDeleteQurbanAnimal`.
  - [x] 4.7 If delete fails because shares exist, show the error toast: "Tidak bisa menghapus hewan yang sudah memiliki peserta."

---

- [x] 5.0 Participant Slot & Payment UI
  - [x] 5.1 Create `src/components/qurban/AnimalDetailDialog.tsx`. Opens when a user clicks an `AnimalCard`. Shows animal info at the top (nomor, jenis, harga, berat, foto). Below: a list of all slots (max_slots rows). Each row shows its slot number (urutan). If a share exists for that slot, show participant name + nominal + payment badge. If no share exists, show a dashed placeholder row with an "Assign" button.
  - [x] 5.2 In `AnimalDetailDialog.tsx`, show the payment summary at the bottom: "X dari Y peserta sudah lunas — Rp X terkumpul dari Rp Y." Compute this from `useQurbanShareList(animalId)`.
  - [x] 5.3 Create `src/components/qurban/SlotAssignDialog.tsx`. A Dialog that opens when petugas clicks an empty slot's "Assign" button. Contains two modes toggled by a tab or radio: (A) "Pilih dari data" — a Combobox (shadcn/ui) that searches muzakki by nama_kk or no_telp using `useMuzakkiSearch`; (B) "Tambah peserta baru" — an inline mini-form with fields nama_kk, alamat, no_hp. Below the muzakki selector: a `nominal` number input pre-filled with `animal.harga / max_slots` (editable). A "Simpan" button that: if mode B, first creates the muzakki record then links it; calls `useAssignQurbanShare`.
  - [x] 5.4 In `AnimalDetailDialog.tsx`, disable the slot rows' "Assign" buttons when all slots are filled. Show a tooltip or message: "Semua slot sudah terisi." The "Tambah Peserta" action should also be hidden/disabled.
  - [x] 5.5 On each filled slot row in `AnimalDetailDialog.tsx`, add a "Hapus" icon button. Clicking it shows a small confirmation popover/alert: "Yakin hapus peserta ini?" On confirm, call `useRemoveQurbanShare`. The slot becomes empty again.
  - [x] 5.6 On each filled slot row, add a payment toggle button. If status is "Belum Bayar" show an amber badge with a "Tandai Lunas" button. If status is "Lunas" show a green badge with a "Batal Lunas" button. Clicking either calls `useUpdateSharePayment` to toggle the status.

---

- [x] 6.0 Per-participant receipt (BuktiQurban adaptation)
  - [x] 6.1 Read the existing `src/components/qurban/BuktiQurban.tsx` carefully to understand its current props interface, PDF generation method (jsPDF or similar), and layout structure.
  - [x] 6.2 Update the props interface of `BuktiQurban.tsx` to accept the new data: `event: QurbanEvent`, `animal: QurbanAnimal`, `share: QurbanShareWithMuzakki`. Remove any props that reference the old `qurban_registrations` model.
  - [x] 6.3 Update the receipt layout content to display: masjid name/header, event name (from `event.nama`), animal code (from `animal.nomor`), animal type (`animal.jenis`), participant name (`share.muzakki.nama_kk`), slot number (`share.urutan`), nominal (`share.nominal` formatted as Rp currency), payment status (`share.status_pembayaran`), and generation date.
  - [x] 6.4 In `AnimalDetailDialog.tsx`, add a printer icon button to each filled slot row. Clicking it calls `BuktiQurban` with the relevant event, animal, and share data to trigger the print/PDF download.
  - [x] 6.5 Verify the print output renders correctly (open browser print dialog or download PDF) and all fields are populated.

---

- [ ] 7.0 Role-based visibility, page integration & build verification
  - [ ] 7.1 In `AnimalDetailDialog.tsx`: check the current user's role. If the role is `viewer`, replace participant name and nominal cells with "—" (dash). Only show slot counts (e.g., "5/7 terisi"). Hide the payment toggle, assign, and remove buttons entirely for viewers.
  - [ ] 7.2 In `AnimalCard.tsx`: viewer role sees the slot count and payment summary badge, but not individual participant names (these aren't on the card anyway — confirm no PII leaks on the card).
  - [ ] 7.3 Review `Qurban.tsx` and confirm all new components are wired together correctly: event selector at top → `AnimalGrid` filtered by selected event → `AnimalDetailDialog` on card click → `SlotAssignDialog` on slot assign → `BuktiQurban` on print.
  - [ ] 7.4 Check the sidebar navigation in `AppLayout.tsx`: ensure the Qurban nav section still renders correctly and links to `/qurban`.
  - [ ] 7.5 Run `npm run build` from the `zakat-fitrah-app/` directory. Fix all TypeScript errors and build warnings until the build passes cleanly.
  - [ ] 7.6 Smoke test the full flow manually in the browser:
    - Create a new Qurban event.
    - Add a Sapi animal (with photo).
    - Add a Kambing animal.
    - Assign 7 participants to the Sapi (mix of existing muzakki and new inline additions).
    - Verify the 8th slot is blocked.
    - Toggle payment status on two slots.
    - Print a receipt for one participant.
    - Verify a viewer role account sees only slot counts.
