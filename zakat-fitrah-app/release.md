# v2.0.0-phase2 — Phase 2 Dashboard & UX

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
