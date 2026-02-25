# Tasks: Muzakki Creatable Inline in Pemasukan Forms (v2.1.0)

**PRD:** [prd-muzakki-creatable-in-pemasukan.md](./prd-muzakki-creatable-in-pemasukan.md)  
**Version:** v2.1.0  
**Branch:** `feature/muzakki-creatable-combobox`

---

## Relevant Files

- `zakat-fitrah-app/src/components/pemasukan/MuzakkiCreatableCombobox.tsx` — **NEW** — Shared reusable combobox component with search + inline creation capability.
- `zakat-fitrah-app/src/components/pemasukan/PemasukanForm.tsx` — Replace `<Select>` muzakki field with `MuzakkiCreatableCombobox`.
- `zakat-fitrah-app/src/components/pemasukan/PemasukanBerasForm.tsx` — Replace `<Select>` muzakki field with `MuzakkiCreatableCombobox`.
- `zakat-fitrah-app/src/pages/PemasukanUang.tsx` — No changes expected; verify submit handler still passes `muzakki_id`.
- `zakat-fitrah-app/src/pages/PemasukanBeras.tsx` — No changes expected; verify submit handler still passes `muzakki_id`.
- `zakat-fitrah-app/package.json` — Bump version to `2.1.0`.

### Notes

- This feature requires NO database migrations — only `nama_kk` is inserted; `alamat` defaults to `'-'`.
- shadcn/ui's `Command` + `Popover` components are already available (`cmdk` is a transitive dep).
- After creating a new muzakki, invalidate `['muzakki-options']` query via `useQueryClient`.
- Run `npm run build` in `zakat-fitrah-app/` to verify no TypeScript errors before marking complete.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 From `zakat-fitrah-app/` working directory, run: `git checkout -b feature/muzakki-creatable-combobox`

- [x] 1.0 Build the `MuzakkiCreatableCombobox` component
  - [x] 1.1 Create file `src/components/pemasukan/MuzakkiCreatableCombobox.tsx`
  - [x] 1.2 Import `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandItem`, `CommandGroup` from `@/components/ui/command` and `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover`
  - [x] 1.3 Add `useQuery` to fetch all muzakki (`id`, `nama_kk`) from Supabase, ordered by `nama_kk` ascending, using query key `['muzakki-options']`
  - [x] 1.4 Add local state: `open` (popover open/close), `search` (text input value), `creating` (boolean — is inline mini-form visible), `newName` (string), `newTelp` (string), `isCreating` (boolean — loading indicator during insert)
  - [x] 1.5 Implement real-time filtering: filter `muzakkiOptions` list by `search` text (case-insensitive match on `nama_kk`)
  - [x] 1.6 When no filtered match exists AND `search.trim()` is non-empty, render a **"+ Tambah baru: [search]"** CommandItem at the top of the list
  - [x] 1.7 When "Tambah baru" is selected, set `creating = true`, `newName = search`, and render the inline mini-form inside the popover (below the command list or as a separate popover section)
  - [x] 1.8 Inline mini-form fields: `Nama Muzakki` (Input, pre-filled with `newName`, required) + `No. Telp` (Input, optional) + `Simpan & Pilih` button + `Batal` button
  - [x] 1.9 Validate: if `newName.trim()` is empty, show inline error "Nama muzakki tidak boleh kosong." and block submit
  - [x] 1.10 On "Simpan & Pilih": call `supabase.from('muzakki').insert({ nama_kk: newName.trim(), alamat: '-', no_telp: newTelp.trim() || null }).select('id, nama_kk').single()`
  - [x] 1.11 On successful insert: call `queryClient.invalidateQueries({ queryKey: ['muzakki-options'] })`, call `onChange(newMuzakki.id)`, close the popover, reset creation state
  - [x] 1.12 On insert error: show error message "Gagal menyimpan muzakki baru. Coba lagi." inside the mini-form, do NOT close the popover
  - [x] 1.13 Add a "clear" mechanism: when a muzakki is selected, show an `×` button (or a "Tanpa muzakki" CommandItem) that calls `onChange(undefined)` and resets the display
  - [x] 1.14 Component props interface: `{ value: string | undefined; onChange: (id: string | undefined) => void; disabled?: boolean }`
  - [x] 1.15 Display the selected muzakki's `nama_kk` in the trigger button; show placeholder "Pilih atau ketik nama muzakki..." when nothing is selected

- [x] 2.0 Integrate into `PemasukanForm.tsx`
  - [x] 2.1 Import `MuzakkiCreatableCombobox` from `./MuzakkiCreatableCombobox`
  - [x] 2.2 Remove the existing `useQuery` for `muzakki-options` from `PemasukanForm.tsx` (it will live inside the combobox component now)
  - [x] 2.3 Replace the `<FormField name="muzakki_id">` `<Select>` block with `<MuzakkiCreatableCombobox value={field.value} onChange={field.onChange} disabled={isSubmitting} />` inside a `<FormControl>`
  - [x] 2.4 Remove now-unused imports (`SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`) if no longer needed elsewhere in the file
  - [x] 2.5 Remove the `MuzakkiOption` interface and `muzakkiOptions` state if no longer needed in this file

- [x] 3.0 Integrate into `PemasukanBerasForm.tsx`
  - [x] 3.1 Import `MuzakkiCreatableCombobox` from `./MuzakkiCreatableCombobox`
  - [x] 3.2 Remove the existing `useQuery` for `muzakki-options` from `PemasukanBerasForm.tsx`
  - [x] 3.3 Replace the `<FormField name="muzakki_id">` `<Select>` block with `<MuzakkiCreatableCombobox value={field.value} onChange={field.onChange} disabled={isSubmitting} />`
  - [x] 3.4 Remove now-unused imports and interfaces

- [x] 4.0 Version bump
  - [x] 4.1 In `zakat-fitrah-app/package.json`, update `"version"` from `"0.0.0"` to `"2.1.0"`
  - [x] 4.2 Add a new entry to `zakat-fitrah-app/release.md` documenting v2.1.0 changes

- [x] 5.0 Quality assurance
  - [x] 5.1 Run `npm run build` in `zakat-fitrah-app/` — fix any TypeScript errors before proceeding ✅ Build passes
  - [ ] 5.2 **Path A (existing muzakki):** Select an existing muzakki in PemasukanUang form → save transaction → open Bukti Pembayaran → verify "Dari" row shows the correct `nama_kk` in both screen preview and downloaded PDF
  - [ ] 5.3 **Path A (existing muzakki):** Repeat the same verification for PemasukanBeras form
  - [ ] 5.4 **Path B (new muzakki inline):** In PemasukanUang form, type a brand-new name → select "+ Tambah baru" → complete mini-form → save transaction → open Bukti Pembayaran → verify "Dari" row shows the newly registered `nama_kk` in both screen preview and downloaded PDF
  - [ ] 5.5 **Path B (new muzakki inline):** Repeat the same verification for PemasukanBeras form
  - [ ] 5.6 **Path B — registration check:** After inline creation, navigate to the Muzakki page and confirm the new muzakki appears in the list with the correct `nama_kk`
  - [ ] 5.7 **Path C (no muzakki):** Leave muzakki field as "Tanpa muzakki" → save → open Bukti Pembayaran → verify the "Dari" row is absent from screen and PDF; verify PDF filename uses the receipt ID
  - [ ] 5.8 Verify "Tanpa muzakki" / clear (×) option works in both PemasukanUang and PemasukanBeras forms
  - [ ] 5.9 Verify error handling: if the muzakki insert fails, the transaction is NOT saved and an error message is shown inside the mini-form

- [x] 6.0 Commit and push
  - [x] 6.1 Stage all changed files: `git add .`
  - [x] 6.2 Commit: `git commit -m "feat(pemasukan): add creatable muzakki combobox in uang & beras forms (v2.1.0)"`
  - [ ] 6.3 Push branch: `git push origin feature/muzakki-creatable-combobox`
