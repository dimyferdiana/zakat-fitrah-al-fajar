# v2.1.0 — Muzakki Creatable Inline in Pemasukan Forms

## Highlights
- New **creatable combobox** for the Muzakki field in both Pemasukan Uang and Pemasukan Beras forms.
- Amil can now **search existing muzakki by name** via real-time filtering, or **type a new name** and register a new muzakki record inline — no navigation to the Muzakki page required.
- Inline mini-form collects `nama_kk` (required) and optional `no_telp`; `alamat` defaults to `'-'` and can be updated later on the Muzakki page.
- After inline creation, the new muzakki is auto-selected and its ID is saved with the transaction — the Bukti Pembayaran (screen preview + PDF) shows the correct "Dari" name automatically.
- Clear (×) button to reset selection back to "Tanpa muzakki".

## Key Changes
- **NEW** `src/components/pemasukan/MuzakkiCreatableCombobox.tsx` — reusable Popover-based combobox with search, create, and clear.
- `PemasukanForm.tsx` — replaced `<Select>` muzakki field with `MuzakkiCreatableCombobox`; removed inline `useQuery` for muzakki.
- `PemasukanBerasForm.tsx` — same replacement as above.
- `package.json` — version bumped to `2.1.0`.

## Quality
- `npm run build` passes.
- No breaking changes to `onSubmit` signatures — `muzakki_id` remains a UUID string or `undefined`.
- Bukti Pembayaran (Uang + Beras) unchanged; receipt data flow works for all three paths (existing, new inline, anonymous).

---



## Highlights
- Mobile-friendly navigation for Settings & Laporan (Tabs auto-swap to Select on small screens).
- Overpay flow for muzakki: inline confirmation dialog; excess recorded as infak/sedekah uang.
- Mustahik visibility: “Sudah Terima?” badge column and active-year tagging.
- Distribusi safeguards: prevent multiple distribusi per mustahik per tahun; form only shows eligible mustahik.
- Hak Amil + Rekonsiliasi workflows improved; negative adjustments allowed.

## Key Changes
- Distribusi: client-side guard before create; filtered mustahik list; crash fixes in form.
- Settings: cleaned padding, controlled tabs/select; hak amil query typing and upsert stability.
- Laporan: mobile select navigation for reports.
- Dashboard: handles hak amil data safely; progress cards tidy TS issues.
- Muzakki: controlled form fields, overpay confirmation, safer selisih math.
- Mustahik: computed `has_received` per active tahun and surfaced in table.

## Quality
- `npm run build` passes.
- HMR/dev run confirmed locally.
- Smoke to consider post-release: login → Settings hak amil save → Distribusi create (eligible mustahik) → Mustahik table badges.
