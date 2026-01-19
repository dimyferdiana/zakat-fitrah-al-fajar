## Test Plan — Phase 2.1 (Zakat Fitrah Payment Logic)

Scope: validate revised zakat fitrah money/rice logic per Ustadz Imron guidance, plus dashboard correctness.

### Functional Areas
- Zakat uang: accept any nominal as zakat, no overpayment split, store actual in `jumlah_uang_rp`.
- Zakat beras: enforce minimum (jiwa × nilai_beras_kg); warn when below; allow infaq path after negotiation.
- UI/UX: forms, dialogs, receipts (uang shows actual, beras shows actual).
- Dashboard: totals reflect new logic; Total Pemasukan Uang includes zakat uang + fidyah + infak/sedekah + maal + rekonsiliasi; Infak/Sedekah card no overpayment note.
- Data/migrations: migration 006 applies; deprecated field retained for history.

### Test Data Setup
- Active `tahun_zakat` with `nilai_beras_kg` and `nilai_uang_rp`.
- Create muzakki base record (or via payment flow).
- Seed cases: uang payment (any nominal), beras payment >= min, beras payment < min.

### Test Cases (Manual)
- U1: Create zakat uang with nominal > reference; verify saved, no infaq record, table shows actual.
- U2: Edit zakat uang amount; verify updated value and dashboard refresh.
- B1: Create beras payment meeting minimum; saved and shown correctly.
- B2: Create beras payment below minimum; warning dialog appears; zakat not auto-recorded until resolved.
- D1: Dashboard cards: Zakat Uang, Total Pemasukan Uang (includes zakat uang), Infak/Sedekah Uang text updated.
- R1: Receipt (if printed) shows actual received amount for uang; beras shows actual weight.
- M1: Migration 006 applies cleanly after reset.

### Acceptance Criteria
- No overpayment split for uang; no overpayment dialog present.
- Beras below-min triggers warning; at/above min succeeds.
- Dashboard totals align with created data; Total Pemasukan Uang aggregates zakat uang + other categories.

### Suggested Automation (see playwright guide)
- E2E UI: create zakat uang, create beras (min and below-min), assert dashboard cards.
- API/integration (optional): insert via Supabase client, query aggregates.
