## Relevant Files

### Modified Files

- `zakat-fitrah-app/src/pages/QurbanPeserta.tsx` - Add "Tambah Peserta" button + fix action button mobile layout
- `zakat-fitrah-app/src/pages/Qurban.tsx` - Remove event CRUD actions + fix action button mobile layout
- `zakat-fitrah-app/src/pages/QurbanDashboard.tsx` - Update layout to render new separate Sapi/Domba stat cards
- `zakat-fitrah-app/src/components/qurban/MustahikCouponPicker.tsx` - Expand recipient list to all warga (not mustahik-only)
- `zakat-fitrah-app/src/components/qurban/AnimalForm.tsx` - Conditional field rendering for Titipan and Al Fajar types
- `zakat-fitrah-app/src/components/qurban/dashboard/QurbanStatCards.tsx` - Replace combined nominal card with separate Sapi + Domba cards
- `zakat-fitrah-app/src/hooks/useQurbanCoupons.ts` - Allow multiple coupons per person; add duplicate-coupon check helper
- `zakat-fitrah-app/src/hooks/useQurbanShares.ts` - Add query for available hewan slots (for slot picker dropdown)
- `zakat-fitrah-app/src/hooks/useQurbanDashboard.ts` - Return per-type (sapi/domba) breakdown in stats
- `zakat-fitrah-app/src/types/qurban.ts` - Add `'al_fajar'` to `sumber_hewan` union; extend `QurbanDashboardStats` with per-type fields

### New Files

- `zakat-fitrah-app/src/components/qurban/AddPesertaDialog.tsx` - New dialog form: select muzakki + select available slot
- `zakat-fitrah-app/supabase/migrations/038_qurban_enhancements.sql` - DB migration: drop mustahik-per-event unique coupon constraint; add `al_fajar` to `sumber_hewan` enum

### Notes

- No unit test files are listed because the project currently has no test suite. Manual verification steps are included in the tasks instead.
- Use `npm run build` (from `zakat-fitrah-app/`) after each task group to catch TypeScript errors early.
- Run migrations against the remote Supabase project with: `supabase db push` or apply via the Supabase dashboard SQL editor.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch: `git checkout -b feature/qurban-enhancements`

---

- [X] 1.0 Expand coupon eligibility and add duplicate-coupon warning
  - [X] 1.1 Open `supabase/migrations/037_qurban_coupons.sql` and identify the unique constraint that enforces one coupon per mustahik per event (look for a `UNIQUE` constraint or index on `(recipient_id, event_id)` or similar).
  - [X] 1.2 Create `supabase/migrations/038_qurban_enhancements.sql`. In this file, write an `ALTER TABLE qurban_coupons DROP CONSTRAINT <constraint_name>` statement to remove the mustahik-per-event uniqueness rule. (Keep the muzakki-per-share constraint — that one is correct.)
  - [X] 1.3 Apply the migration to the Supabase project (via `supabase db push` or the SQL editor).
  - [X] 1.4 In `src/types/qurban.ts`, verify `recipient_type` includes both `'muzakki'` and `'mustahik'`. No changes needed here unless a type is missing.
  - [X] 1.5 Open `src/hooks/useQurbanCoupons.ts`. Find `generateMustahikCoupons` (or the equivalent function used for bulk mustahik coupon generation). Update the query that fetches recipients so it queries the `warga` table for **all active warga**, not just those with `is_mustahik = true`.
  - [X] 1.6 Open `src/components/qurban/MustahikCouponPicker.tsx`. Find the query or prop that filters the recipient list to mustahik only. Remove that filter so all warga appear as selectable recipients.
  - [X] 1.7 In `MustahikCouponPicker.tsx` (or `useQurbanCoupons.ts`, wherever the individual coupon assignment call is made), add a pre-check: before generating a coupon for a person, query `qurban_coupons` to count existing active/redeemed coupons for that `recipient_id` in the current event. If count > 0, store this in local state.
  - [X] 1.8 Display a warning `AlertDialog` (from `@/components/ui/alert-dialog`) when the count > 0: show the message *"Orang ini sudah memiliki X kupon. Lanjutkan?"* with Cancel and Lanjutkan buttons. Only proceed with coupon generation if the user confirms.

---

- [X] 2.0 Fix mobile action button layout (stack vertically)
  - [X] 2.1 Open `src/pages/QurbanPeserta.tsx`. Find every cell or `div` that contains multiple action buttons in a row. Replace the flex container class with `flex flex-col gap-2 md:flex-row md:gap-1` so buttons stack on mobile and sit side-by-side on medium screens and up.
  - [X] 2.2 Open `src/pages/Qurban.tsx`. Find the action button groups for the animal list rows (edit, delete per animal). Apply the same `flex flex-col gap-2 md:flex-row md:gap-1` pattern.
  - [X] 2.3 Check `src/pages/QurbanDistribusi.tsx` for any horizontal action button groups in list/table rows. Apply the same fix if present.
  - [X] 2.4 Manual check: open the app on a 375px-wide viewport (or use browser DevTools device emulation) and confirm that no action button area triggers horizontal scroll.

---

- [ ] 3.0 Add "Tambah Peserta" form with slot picker on `/qurban/peserta`
  - [ ] 3.1 In `src/hooks/useQurbanShares.ts`, add a new query hook `useAvailableAnimalSlots(eventId?)` that fetches `qurban_animals` joined with the count of assigned shares, filtered to animals where `assigned_count < max_slots`. Return each animal's `id`, `nomor`, `jenis`, and remaining slot count. If no `eventId` is provided, fetch across all active events.
  - [ ] 3.2 Create `src/components/qurban/AddPesertaDialog.tsx`. Build a modal dialog using `Dialog` from `@/components/ui/dialog` with a form (React Hook Form + Zod) containing:
    - A searchable select/combobox for **Muzakki** (search warga by name).
    - A **Slot** dropdown (using `Select` from `@/components/ui/select`) populated by `useAvailableAnimalSlots`. Each option displays: `{nomor_hewan} — {jenis} ({sisa_slot} slot tersisa)`.
    - A **Status Pembayaran** toggle: `belum_bayar` (default) or `lunas`.
  - [ ] 3.3 In `AddPesertaDialog.tsx`, handle the empty-slots state: if `useAvailableAnimalSlots` returns an empty array, disable the submit button and show the message *"Tidak ada slot tersedia"* inside the dialog.
  - [ ] 3.4 Wire the form submit to call the existing `useAssignQurbanShare` mutation (from `useQurbanShares.ts`). On success, call `onSuccess()` callback to close the dialog and invalidate the shares list query so the table refreshes.
  - [ ] 3.5 In `src/pages/QurbanPeserta.tsx`, import `AddPesertaDialog`. Add a **"Tambah Peserta"** button near the top of the page (next to filters). The button opens `AddPesertaDialog` by setting a boolean `open` state to `true`.
  - [ ] 3.6 Manual check: open `/qurban/peserta`, click "Tambah Peserta", select a muzakki and a slot, submit — confirm the new row appears in the list without a page reload.

---

- [X] 4.0 Simplify Titipan and Al Fajar contribution forms
  - [X] 4.1 In `supabase/migrations/038_qurban_enhancements.sql` (the file created in task 1.2), add an `ALTER TYPE` statement (or equivalent check constraint update) to add `'al_fajar'` as a valid value for the `sumber_hewan` column in `qurban_animals`. Example: `ALTER TABLE qurban_animals ADD CONSTRAINT chk_sumber_hewan CHECK (sumber_hewan IN ('beli', 'titipan', 'al_fajar'));` — adjust based on whether the column uses a PostgreSQL `ENUM` type or a `CHECK` constraint.
  - [ ] 4.2 Apply the updated migration to Supabase.
  - [X] 4.3 In `src/types/qurban.ts`, update the `sumber_hewan` field type on `QurbanAnimal` from `'beli' | 'titipan'` to `'beli' | 'titipan' | 'al_fajar'`.
  - [X] 4.4 Open `src/components/qurban/AnimalForm.tsx`. Add `al_fajar` as a third option in the `sumber_hewan` `<Select>` field with the label *"Al Fajar"*.
  - [X] 4.5 In `AnimalForm.tsx`, add conditional rendering based on the watched `sumber_hewan` value:
    - `sumber_hewan === 'titipan'`: **hide** `harga` field, **show** `biaya_perawatan` field.
    - `sumber_hewan === 'al_fajar'`: **show** a `jumlah_hewan` (number input, min 1) field for how many animals Al Fajar is providing; **hide** both `harga` and `biaya_perawatan` fields.
    - `sumber_hewan === 'beli'` (default): show all fields as they are today.
  - [X] 4.6 Update the Zod validation schema in `AnimalForm.tsx` so that `harga` is only required when `sumber_hewan` is `'beli'`, and `biaya_perawatan` is only required when `sumber_hewan` is `'titipan'`. Use `z.discriminatedUnion` or a `superRefine` check to achieve this.
  - [X] 4.7 Run `npm run build` from `zakat-fitrah-app/` and fix any TypeScript errors caused by the new `'al_fajar'` type (e.g., exhaustive switch statements or type guards that need updating).

---

- [X] 5.0 Refactor dashboard to show separate Sapi and Domba stat cards
  - [X] 5.1 Open `src/hooks/useQurbanDashboard.ts`. Inspect the existing stats query. Update it (or add a parallel query) to group aggregates by `jenis` (`sapi` vs `kambing`/`domba`), returning separate totals: `totalSapi`, `totalDomba`, `pesertaSapi`, `pesertaDomba`, `nominalSapi`, `nominalDomba`, `sisaSlotSapi`, `sisaSlotDomba`.
  - [X] 5.2 In `src/types/qurban.ts`, extend `QurbanDashboardStats` to include the new per-type fields from step 5.1.
  - [X] 5.3 Open `src/components/qurban/dashboard/QurbanStatCards.tsx`. Locate the combined "Total Nominal" card. **Replace it** with two separate cards rendered in a `<div className="grid grid-cols-2 gap-4">` wrapper:
    - **Left card — Sapi:** shows total Sapi slots, peserta Sapi, sisa slot Sapi, and nominal terkumpul Sapi.
    - **Right card — Domba:** shows the same fields for Domba/Kambing.
  - [X] 5.4 In `src/pages/QurbanDashboard.tsx`, verify that the updated `QurbanStatCards` component receives the correct props from the hook. Adjust prop passing if the component signature changed.
  - [X] 5.5 Manual check: open `/qurban/dashboard` and confirm both cards are visible with correct labels and non-zero data (assuming events exist).

---

- [X] 6.0 Remove event actions from Data Hewan page
  - [X] 6.1 Open `src/pages/Qurban.tsx`. Find the JSX elements for the **"Tambah Event"**, **"Edit Event"**, and **"Hapus Event"** buttons (or icon buttons). Remove only these elements and any `onClick` handlers that exist solely for them.
  - [X] 6.2 Do **not** delete the `QurbanEventDialog` import or component — it is still used on the `QurbanEvents.tsx` page. Only remove the references inside `Qurban.tsx`.
  - [X] 6.3 Remove any `useState` variables in `Qurban.tsx` that were only used to control the open/close state of the event dialog (e.g., `isEventDialogOpen`, `editingEvent`). Leave any state that is still used.
  - [X] 6.4 Run `npm run build` from `zakat-fitrah-app/`. Fix any TypeScript warnings about unused variables or imports left behind by step 6.3.
  - [X] 6.5 Manual check: navigate to `/qurban` (Data Hewan page) and confirm no add/edit/delete event buttons are visible. Then navigate to the dedicated Events page and confirm event management still works there.

---

- [X] 7.0 Final verification
  - [X] 7.1 Run `npm run build` from `zakat-fitrah-app/` and confirm a clean build with zero errors.
  - [X] 7.2 On a 375px-wide viewport, verify that no Qurban list page requires horizontal scrolling to reach action buttons.
  - [X] 7.3 Assign a coupon to a non-mustahik warga and confirm it succeeds.
  - [X] 7.4 Assign a second coupon to the same person and confirm the warning dialog appears before proceeding.
  - [X] 7.5 Use the "Tambah Peserta" button on `/qurban/peserta` to add a new participant and confirm the list refreshes.
  - [X] 7.6 Create a Titipan animal and confirm only `biaya_perawatan` is shown. Create an Al Fajar animal and confirm only `jumlah_hewan` is shown.
  - [X] 7.7 Open the dashboard and confirm Sapi card is on the left, Domba card on the right, with independent totals.
  - [X] 7.8 Open Data Hewan page and confirm no event add/edit/delete actions are present.
