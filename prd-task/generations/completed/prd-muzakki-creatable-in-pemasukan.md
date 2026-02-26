# PRD: Muzakki Creatable Inline in Pemasukan Forms

## Document Control
- **Version:** V1.6.0
- **Created Date:** 2026-02-25
- **Last Updated:** 2026-02-26
- **Feature Name:** Muzakki Creatable Combobox
- **Status:** Draft
- **Summary of Addition/Adjustment:** Menambahkan creatable combobox agar muzakki baru dapat dibuat inline langsung dari form pemasukan tanpa pindah halaman.

---

## 1. Introduction / Overview

### Problem

When recording a cash income (Pemasukan Uang) or rice income (Pemasukan Beras), the amil must select a muzakki from a pre-populated dropdown. If the muzakki does not already exist in the system, the amil must first navigate to the **Muzakki** page, create the record there, then come back to the Pemasukan page to record the transaction. This multi-step interruption slows down data entry — especially during peak collection periods (before Idul Fitri) when transactions happen quickly.

### Goal

Allow the amil to **type a new muzakki name directly inside the Pemasukan Uang and Pemasukan Beras forms** and have the muzakki record auto-created on the fly when the transaction is saved.

---

## 2. Goals

1. Replace the current simple `<Select>` dropdown for the `muzakki_id` field in both `PemasukanForm` and `PemasukanBerasForm` with a **searchable creatable combobox**.
2. Allow the amil to search existing muzakki by typing their name.
3. Allow the amil to type a new name and create the muzakki record inline — without leaving the Pemasukan form.
4. Require minimal mandatory data (`nama_kk` only) for inline muzakki creation; `alamat` defaults to `'-'` (editable later from the Muzakki page).
5. After inline creation, the newly created muzakki is automatically selected in the form and its `id` is passed as `muzakki_id` when the transaction is saved.

---

## 3. User Stories

**US-1 — Search existing muzakki:**  
As an amil, when I open the Pemasukan Uang or Pemasukan Beras form, I want to type a muzakki's name and see matching results from the existing list, so I can quickly select the correct person.

**US-2 — Create muzakki on the fly:**  
As an amil, when I type a name that does not exist in the list, I want to see a "Tambah baru: [nama]" option, so I can create the muzakki record without navigating away from the form.

**US-3 — Confirm new muzakki data:**  
As an amil, when I choose "Tambah baru", I want a small inline dialog/section to appear asking me to confirm or fill in the muzakki's name (and optional phone number), so I can save a complete-enough record.

**US-4 — Auto-select after creation:**  
As an amil, after the new muzakki is created, I want it to be automatically selected in the form, so I can proceed to submit the transaction without additional steps.

**US-5 — Clear/reset muzakki:**  
As an amil, I want to be able to clear the selected/typed muzakki and revert to "Tanpa muzakki", so I can correct mistakes.

**US-6 — Bukti Pembayaran shows the correct name:**  
As an amil, after saving a transaction (whether I selected an existing muzakki or created a new one inline), I want the **Bukti Pembayaran (receipt)** to show that muzakki's name in the "Dari" field — both in the on-screen preview and in the downloaded PDF — so the receipt is a complete, accurate record.

---

## 4. Functional Requirements

### 4.1 Combobox Component (Shared)

**FR-1.** A new reusable `MuzakkiCreatableCombobox` component shall be created at `src/components/pemasukan/MuzakkiCreatableCombobox.tsx`.

**FR-2.** The combobox shall fetch and display all existing muzakki from the `muzakki` table, ordered alphabetically by `nama_kk`.

**FR-3.** The combobox shall include a text input that filters the displayed list in real-time as the user types (client-side filtering is acceptable for typical dataset sizes).

**FR-4.** When the typed text does not match any existing muzakki name (case-insensitive), a special option **"+ Tambah baru: [nama yang diketik]"** shall appear at the top of the dropdown list.

**FR-5.** When the user selects the "Tambah baru" option, a small **inline creation confirmation** shall appear (either inside the dropdown popover or as a small modal) showing:
- Name field (pre-filled with the typed text, editable)
- Phone number field (optional, labelled "No. Telp (Opsional)")
- "Simpan & Pilih" button and "Batal" button

**FR-6.** On "Simpan & Pilih", the system shall:
  1. Insert a new row into the `muzakki` table with `nama_kk` = entered name, `alamat` = `'-'`, `no_telp` = entered phone (or null).
  2. Automatically select the newly created muzakki in the combobox (update `muzakki_id` field value in the form).
  3. Invalidate / refetch the `muzakki-options` query so the new entry appears in future sessions.

**FR-7.** The combobox shall show a loading indicator while fetching muzakki options or while creating a new muzakki.

**FR-8.** The combobox shall support a "clear" action (e.g., an ×  button or a "Tanpa muzakki" option) to reset the field to `undefined`.

**FR-9.** If an existing muzakki is selected, the combobox shall display their `nama_kk`.

### 4.2 Integration

**FR-10.** The `MuzakkiCreatableCombobox` component shall replace the existing `<Select>` muzakki field in `PemasukanForm.tsx` (`src/components/pemasukan/PemasukanForm.tsx`).

**FR-11.** The `MuzakkiCreatableCombobox` component shall replace the existing `<Select>` muzakki field in `PemasukanBerasForm.tsx` (`src/components/pemasukan/PemasukanBerasForm.tsx`).

**FR-12.** The `onSubmit` signatures of both forms shall remain unchanged — `muzakki_id` is either a valid UUID string or `undefined`.

### 4.3 Bukti Pembayaran (Receipt) Integration

> Both `BuktiPemasukanUang` (`src/components/pemasukan/BuktiPemasukanUang.tsx`) and `BuktiPemasukanBeras` (`src/components/pemasukan/BuktiPemasukanBeras.tsx`) render a receipt from the saved transaction record. They display the muzakki name via `data.muzakki?.nama_kk`, populated by the Supabase join `muzakki:muzakki_id(id, nama_kk)` in the list query.

#### Path A — Selecting an existing muzakki

```
Amil types name in combobox
  → Filters existing list
  → Selects existing muzakki (UUID already in DB)
  → Form submits with muzakki_id = existing UUID
  → Transaction saved with muzakki_id
  → List query refetches → joins muzakki table
  → data.muzakki.nama_kk = existing name
  → BuktiPembayaran shows: "Dari: [existing name]"
```

#### Path B — Creating a new muzakki inline

```
Amil types a name with no match in list
  → Selects "+ Tambah baru: [name]"
  → Mini-form appears (name pre-filled, optional phone)
  → Amil clicks "Simpan & Pilih"
  → INSERT into muzakki table → new UUID returned
  → Combobox auto-selects new muzakki
  → Form submits with muzakki_id = NEW UUID
  → Transaction saved with new muzakki_id
  → List query refetches → joins muzakki table
  → data.muzakki.nama_kk = newly registered name
  → BuktiPembayaran shows: "Dari: [new name]"
  → New muzakki also visible on Muzakki page
```

#### Path C — No muzakki (anonymous)

```
Amil leaves muzakki field as "Tanpa muzakki"
  → Form submits with muzakki_id = null
  → data.muzakki = null
  → BuktiPembayaran hides the "Dari" row entirely
  → PDF filename uses receipt ID instead of name
```

**FR-13.** After a transaction is saved (either path A or B), when the amil opens the Bukti Pembayaran for that record, the **"Dari" row shall display the muzakki's `nama_kk`** — matching what was selected or created during the form submission.

**FR-14.** The PDF download filename shall follow the existing behaviour:
- With muzakki: `bukti-pemasukan-uang-[nama_kk-slugified].pdf` / `bukti-pemasukan-beras-[nama_kk-slugified].pdf`
- Without muzakki: `bukti-pemasukan-uang-[receipt-id].pdf` / `bukti-pemasukan-beras-[receipt-id].pdf`

No changes are needed to `BuktiPemasukanUang.tsx` or `BuktiPemasukanBeras.tsx` — they already handle both cases correctly. The only requirement is that `muzakki_id` is correctly saved in the transaction, which the form's existing `onSubmit` handler already does.

### 4.5 Error Handling

**FR-15.** If the Supabase insert for a new muzakki fails, the system shall display an error toast/message inside the inline creation UI (e.g., "Gagal menyimpan muzakki baru. Coba lagi.") and NOT submit the transaction.

**FR-16.** Empty/blank names shall be rejected with a validation message: "Nama muzakki tidak boleh kosong."

---

## 5. Non-Goals (Out of Scope)

- Editing an existing muzakki's full details (alamat, etc.) inline — users must use the Muzakki page for that.
- Bulk creation of multiple muzakki at once from the Pemasukan form.
- Changes to the BulkPemasukanForm (bulk mode) — that is a separate flow.
- Changes to the Muzakki page or its dedicated form.
- Changes to the database schema (no migration required — only `nama_kk` is required + `alamat` defaults to `'-'`).

---

## 6. Design Considerations

- Use **shadcn/ui `Command` + `Popover`** pattern (already used elsewhere in the codebase via `cmdk`) for the combobox — this is consistent with the existing component library.
- The inline creation sub-form can live inside the same Popover command list as a conditionally rendered section, keeping the UX contained.
- Match the existing form field styling (`FormItem`, `FormLabel`, `FormMessage` from react-hook-form + shadcn).
- The "Tambah baru" option should be visually distinct — e.g., bold text with a `Plus` icon prefix.
- **Bukti Pembayaran preview:** No UI changes are required to `BuktiPemasukanUang` or `BuktiPemasukanBeras`. The "Dari" field on the receipt automatically reflects the linked `muzakki.nama_kk` — whether that muzakki was pre-existing (Path A) or just registered inline (Path B). When no muzakki is linked (Path C), the "Dari" row is hidden and the PDF filename falls back to the receipt ID.

---

## 7. Technical Considerations

- **Supabase insert**: Use the same `supabase` client already imported in the form files. The insert uses: `supabase.from('muzakki').insert({ nama_kk, alamat: '-', no_telp: noTelp || null }).select('id, nama_kk').single()` — the `.select().single()` is essential to get back the new UUID to auto-select it in the form.
- **React Query**: After a successful creation, call `queryClient.invalidateQueries({ queryKey: ['muzakki-options'] })` so the new muzakki appears immediately in the list.
- **Form controller**: The new component receives `value: string | undefined` and `onChange: (id: string | undefined) => void` as props, matching how react-hook-form's `Controller`/`render` pattern works.
- **Receipt data flow**: The list queries in `usePemasukanUang` and `usePemasukanBeras` already use `muzakki:muzakki_id(id, nama_kk)` in their Supabase `.select()` call. After a `refetch()`, the joined `muzakki` object is populated on the row — so `BuktiPemasukanUang` and `BuktiPemasukanBeras` receive the correct `data.muzakki.nama_kk` with no additional changes.
- **RLS**: The existing RLS policies on the `muzakki` table allow authenticated users to insert — no changes needed.
- **Dependency**: `cmdk` is already a transitive dependency through shadcn/ui's `Command` component — no new packages needed.

---

## 8. Success Metrics

- Amil can create a new muzakki and record a Pemasukan transaction **in a single form visit** (no navigation to Muzakki page required).
- The newly created muzakki appears in the muzakki list on the Muzakki page.
- Existing flow (selecting an existing muzakki) continues to work without regression.
- **Bukti Pembayaran** (screen and PDF) correctly shows the muzakki name in the "Dari" field for both existing (Path A) and newly created (Path B) muzakki.
- When no muzakki is linked (Path C), the "Dari" row is absent from the receipt — consistent with existing behaviour.
- `npm run build` passes with no TypeScript errors.

---

## 9. Open Questions

- Should `alamat` default to `'-'` or be a required field in the inline mini-form? (Current proposal: default to `'-'` for speed; editable later.)
- Should the phone number field in the inline creation form be optional or hidden entirely? (Current proposal: optional and shown for convenience.)
- Should the new combobox also be applied to `BulkPemasukanForm`? (Current proposal: out of scope for this version.)
