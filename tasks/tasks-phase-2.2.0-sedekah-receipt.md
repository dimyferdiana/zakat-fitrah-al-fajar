## Relevant Files

- src/pages/SettingsPage.tsx - Potential location for admin/config entry points if needed.
- src/pages/PemasukanUang.tsx - Reference pattern for uang flows and category handling.
- src/pages/Dashboard.tsx - Entry point routing; add navigation to the new receipt UI if required.
- src/components/pemasukan/PemasukanUangList.tsx - Table patterns and export triggers.
- src/components/pemasukan/PemasukanUangForm.tsx - Form pattern with React Hook Form + Zod.
- src/components/ui/Button.tsx - Reuse existing button styles.
- src/components/ui/Input.tsx - Reuse input styles.
- src/components/ui/Select.tsx - Category selection UI.
- src/hooks/useMuzakki.ts - Muzakki lookup/create logic (name/phone/address).
- src/hooks/useUsers.ts - Pattern for Supabase queries and mutations.
- src/lib/utils.ts - Currency formatting helpers; extend with terbilang helper.
- src/utils/export.ts - jsPDF usage patterns for headers/footers.
- src/components/common/ReceiptPrint.tsx - Reference receipt/print patterns (if present).
- src/assets/ - Store stamp/signature transparent PNGs for PDF embedding.

### Notes
- Unit tests should typically be placed alongside the code files they are testing.

## Instructions for Completing Tasks
- Update checkboxes from `- [ ]` to `- [x]` as you complete each sub-task.

## Tasks
- [ ] 0.0 Create feature branch
	- [ ] 0.1 Create and checkout `feature/phase-2-2-0-sedekah-receipt`

- [ ] 1.0 Finalize receipt template scope (fields, assets, numbering, categories)
	- [ ] 1.1 Confirm field list: receipt no, donor name, address, phone (display optional), category, amount (Rp), terbilang, date, optional notes, doa text, Ketua name/label
	- [ ] 1.2 Decide receipt numbering: manual vs local auto-sequence (default manual per PRD)
	- [ ] 1.3 Set fixed categories + optional free-text: Zakat, Infak, Sahabat Quran, Bank Infak, Santunan Yatim & Dhuafa, Lainnya (free text)
	- [ ] 1.4 Prepare assets: transparent PNGs for stamp and signature, ensure white background output
	- [ ] 1.5 Define layout in landscape, positions for stamp, signature, and terbilang under amount

- [ ] 2.0 Implement donor profile lookup/create (name/phone/address persistence)
	- [ ] 2.1 Add search-by-name/phone hook using muzakki table; prefill on hit
	- [ ] 2.2 Support manual entry when not found; validate required name/address, optional phone
	- [ ] 2.3 On save, upsert profile (name, phone, address) to Supabase
	- [ ] 2.4 Handle optimistic UI/loading/error states in the form

- [ ] 3.0 Build Sedekah receipt UI flow (form + validation)
	- [ ] 3.1 Create/extend page or modal for Sedekah receipt generation entry
	- [ ] 3.2 Implement form with React Hook Form + Zod; include fields from 1.1
	- [ ] 3.3 Bind donor lookup to name/phone inputs; allow overwrite of prefills
	- [ ] 3.4 Format amount as Rupiah with thousand separators; derive terbilang live from amount
	- [ ] 3.5 Add category select + optional free-text when Lainnya chosen
	- [ ] 3.6 Provide actions: Generate PDF (required) and optional Print dialog trigger if enabled

- [ ] 4.0 Generate landscape PDF with template, stamp, signature, terbilang
	- [ ] 4.1 Add transparent stamp and signature assets to public/assets and loadable in code
	- [ ] 4.2 Implement jsPDF export in landscape with white background matching provided sample
	- [ ] 4.3 Render header text, receipt title, receipt number, date, donor details, category, amount, terbilang beneath amount, doa text
	- [ ] 4.4 Place signature block with label "Ketua" and name "H. Eldin Rizal Nasution"; overlay stamp + signature images
	- [ ] 4.5 Verify PDF typography/layout parity with sample (spacing, lines, bold titles)

- [ ] 5.0 QA, accessibility, and sign-off
	- [ ] 5.1 Manual QA: donor lookup/create, form validation, PDF generation, asset rendering (transparent), landscape layout, terbilang correctness
	- [ ] 5.2 Cross-browser sanity (Chrome/Edge/Firefox) for PDF/download/print flows
	- [ ] 5.3 Update docs: add usage notes and asset requirements in README/DEPLOYMENT
	- [ ] 5.4 Handoff: confirm with stakeholders that template matches provided sample
