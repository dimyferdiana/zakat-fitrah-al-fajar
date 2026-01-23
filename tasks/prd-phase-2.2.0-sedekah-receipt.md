# PRD: Phase 2.2.0 Sedekah Receipt Generator (PDF)

## 1. Introduction / Overview
A landscape, printer-friendly Sedekah receipt generator for petugas. Staff inputs donor details and payment info, reuses or creates a donor profile (name, phone, address), and generates a PDF proof (no transaction data persisted). Receipt follows the provided template with stamp and signature assets, white background, includes amount in numbers and terbilang, and labels the signatory as Ketua (H. Eldin Rizal Nasution).

## 2. Goals
- Provide a fast workflow for generating Sedekah receipts as landscape PDFs using the provided template, stamp, and signature.
- Ensure donor profiles (name, phone, address) are looked up and created/updated as needed for future searches.
- Keep the receipt operation side-effect-free for transaction data (only donor profile persistence).
- Output high-quality, printer-friendly PDFs (white background) with terbilang beneath the amount.

## 3. User Stories
- As a petugas, I want to search an existing donor by name/phone so I can reuse their profile when issuing a receipt.
- As a petugas, I want to enter donor details (name, phone, address) and payment info to generate a Sedekah receipt PDF without storing the payment itself.
- As a petugas, I want the receipt to match the provided layout (landscape, white background) and include the official stamp, signature, and Ketua label so it looks authentic.
- As a petugas, I want the amount shown both numerically (Rp) and in terbilang so the donor can verify correctness.

## 4. Functional Requirements
1. The system must allow searching existing donor profiles (muzakki table) by name or phone; if found, prefill name/phone/address.
2. The system must allow manual entry and creating/updating a donor profile (name, phone, address) when not found; profiles are persisted for future lookups.
3. The system must collect receipt fields: receipt number, donor name, address, phone (optional display), payment category selection, amount (numeric Rp), terbilang auto-generated from amount, date, and optional notes.
4. The system must support category list: Zakat, Infak, Sahabat Quran, Bank Infak, Santunan Yatim & Dhuafa, plus optional free-text when needed.
5. The system must generate a landscape PDF with white background that follows the provided template, including: header text, receipt title, receipt number, date, donor details, payment purpose, amount, terbilang below amount, doa text, signature block with "Ketua" label and name (H. Eldin Rizal Nasution), embedded stamp, and signature image.
6. The system must render stamp and signature assets with transparent backgrounds.
7. The system must format currency as Rp with thousand separators and place terbilang text directly beneath the numeric amount.
8. The system must provide at least a PDF download action; optional print dialog if enabled by UX.
9. The system must not persist receipt/payment transaction data; only donor profile data is stored/updated.

## 5. Non-Goals (Out of Scope)
- Persisting or reconciling Sedekah payment transactions.
- Multi-currency support; scope is IDR only.
- Complex receipt numbering schemes tied to backend sequences; assume local/manual numbering unless later extended.
- Bulk/batch receipt generation.

## 6. Design Considerations
- Layout: landscape orientation, white background, printer-friendly. Use provided header text and match spacing similar to supplied sample.
- Assets: use provided stamp and signature images; ensure transparent rendering; position near the Ketua block.
- Typography: match existing app PDF exports (jsPDF) for consistency; allow bold header/title.
- Terbilang: auto-generate Indonesian words from numeric amount; place directly under the numeric amount field.
- Categories: fixed list with optional free-text extension to handle future variants without code change.

## 7. Technical Considerations
- PDF engine: reuse existing jsPDF patterns from current exports/receipts for headers/footers and landscape mode.
- Data layer: reuse existing profile (muzakki/donor) lookup/create logic; match-by-name or phone; allow manual entry and persist the profile (name, phone, address) in Supabase.
- Currency/formatting: use shared helpers for Rupiah formatting; add terbilang helper.
- Asset handling: store stamp/signature assets in public/static with transparent backgrounds; embed into PDF via base64 or URL to avoid CORS issues.
- Input validation: use existing form stack (React Hook Form + Zod); require name and address; phone optional but used for matching when provided.

## 8. Success Metrics
- 95% of receipts generated without manual retries (no validation or asset errors).
- Receipt generation time < 3 seconds on typical network.
- Zero persisted payment records created by this flow (profiles only).
- Donor lookup success rate improves over time (measured by reuse of existing profiles when phone/name matches).

## 9. Open Questions
- Receipt numbering: auto-generate local sequence vs. manual entry—default to manual unless a simple local sequence is acceptable?
- Should phone be displayed on the PDF, or only stored? (Currently optional display.)
- Should the print dialog be triggered automatically after generation, or remain download-only?
- Should categories allow a "Lainnya" free text entry on the PDF, or stick to fixed list only?
