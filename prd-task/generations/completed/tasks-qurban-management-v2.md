## Relevant Files

### New Files
- `zakat-fitrah-app/supabase/migrations/036_qurban_coupons.sql` — New migration: `qurban_coupons` table, indexes, RLS policies, pgcrypto extension.
- `zakat-fitrah-app/src/hooks/useQurbanCoupons.ts` — All coupon CRUD: generate, list, redeem by token, redeem manually, cancel, update expiry.
- `zakat-fitrah-app/src/hooks/useQurbanDashboard.ts` — Aggregated stats queries for the Qurban Dashboard.
- `zakat-fitrah-app/src/pages/QurbanDashboard.tsx` — New dashboard page (stat cards, chart, per-event breakdown).
- `zakat-fitrah-app/src/pages/QurbanEvents.tsx` — New event management page (admin only).
- `zakat-fitrah-app/src/pages/QurbanPeserta.tsx` — New participant list page (table view matching Penerimaan Zakat).
- `zakat-fitrah-app/src/pages/QurbanDistribusi.tsx` — New distribution management page (mustahik coupons + progress).
- `zakat-fitrah-app/src/pages/QurbanScan.tsx` — New QR scan & redemption screen.
- `zakat-fitrah-app/src/components/qurban/dashboard/QurbanStatCards.tsx` — 4 summary stat cards.
- `zakat-fitrah-app/src/components/qurban/dashboard/QurbanPaymentChart.tsx` — Pie/bar chart: lunas vs belum bayar.
- `zakat-fitrah-app/src/components/qurban/dashboard/QurbanEventCard.tsx` — Per-event breakdown card.
- `zakat-fitrah-app/src/components/qurban/CouponDetailDialog.tsx` — Dialog showing coupon info with QR code and share button.
- `zakat-fitrah-app/src/components/qurban/CouponShareImage.tsx` — Off-screen coupon card rendered for PNG export.
- `zakat-fitrah-app/src/components/qurban/MustahikCouponPicker.tsx` — Checkbox select dialog for picking mustahik + setting expiry.

### Modified Files
- `zakat-fitrah-app/src/types/qurban.ts` — Add `QurbanCoupon` interface and related filter params type.
- `zakat-fitrah-app/src/types/database.types.ts` — Regenerate after migration to include `qurban_coupons` row type.
- `zakat-fitrah-app/src/hooks/useQurbanShares.ts` — Add flat list query with joins (event + animal + muzakki) for Daftar Peserta.
- `zakat-fitrah-app/src/components/layouts/AppLayout.tsx` — Update Qurban navSections to 5-item structure.
- `zakat-fitrah-app/src/App.tsx` — Add lazy-loaded routes for all 5 new Qurban pages.

### Reused (no changes expected)
- `zakat-fitrah-app/src/components/qurban/QurbanEventDialog.tsx` — Reused as-is for create/edit on the new Events page.
- `zakat-fitrah-app/src/components/qurban/BuktiQurban.tsx` — Reused for "View Bukti" action on Daftar Peserta.
- `zakat-fitrah-app/src/hooks/useQurbanEvents.ts` — Reused for event selectors and event management.
- `zakat-fitrah-app/src/hooks/useMustahik.ts` — Reused for mustahik picker in distribution plan.

### Notes

- No test files are required for this project (no Jest config found). Manual browser testing is the primary QA method.
- Reference PRD: `prd-task/generations/prd-qurban-management-v2.md`
- Run `npm run build` (from `zakat-fitrah-app/`) before marking any parent task complete.
- For Supabase migrations: run `supabase db push` locally or apply via MCP tool `mcp__claude_ai_Supabase__apply_migration`.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/qurban-management-v2`

- [x] 1.0 Database: migration, types & data hooks
  - [x] 1.1 Create `supabase/migrations/036_qurban_coupons.sql`: enable `pgcrypto` extension (`CREATE EXTENSION IF NOT EXISTS pgcrypto`), then create the `qurban_coupons` table with all columns: `id`, `event_id`, `recipient_type`, `recipient_id`, `qurban_share_id` (nullable), `coupon_number` (default `encode(gen_random_bytes(6), 'hex')`), `token` (default `gen_random_uuid()`), `status` (default `'active'`), `expires_at`, `redeemed_at`, `redeemed_by`, `catatan`, `created_at`, `updated_at`. NOTE: Created as `037_qurban_coupons.sql` since `036_qurban_data_migration.sql` already existed.
  - [x] 1.2 Add database constraints: unique index on `qurban_share_id` (WHERE NOT NULL) for muzakki coupons; unique index on `(event_id, recipient_type, recipient_id)` for mustahik coupons; CHECK constraint on `status` IN ('active', 'redeemed', 'cancelled'); CHECK constraint on `recipient_type` IN ('muzakki', 'mustahik').
  - [x] 1.3 Add foreign key constraints: `event_id → qurban_events(id)`, `qurban_share_id → qurban_shares(id)`, `redeemed_by → auth.users(id)`.
  - [x] 1.4 Add RLS policies: enable RLS on `qurban_coupons`; SELECT for admin/petugas/viewer; INSERT for admin/petugas; UPDATE (all fields) for admin/petugas; DELETE for admin only.
  - [x] 1.5 Migration file created at `supabase/migrations/037_qurban_coupons.sql` and ready to apply. NOTE: Needs to be applied by DevOps via `supabase db push` or MCP tool — not applied here.
  - [x] 1.6 Skipped — requires CLI (`supabase gen types typescript`). database.types.ts unchanged; hooks use `(supabase as any)` cast for `qurban_coupons` table.
  - [x] 1.7 Add `QurbanCoupon` interface, `QurbanCouponStatus` type, and `QurbanCouponListParams` interface to `src/types/qurban.ts`.
  - [x] 1.8 Create `src/hooks/useQurbanCoupons.ts` with the following hooks:
    - `useQurbanCouponsByEvent(eventId, params)` — paginated list with filters (status, recipient_type, search by name)
    - `useGenerateMuzakkiCoupon()` — mutation: create coupon for a `qurban_share_id`; cancel existing coupon first if one exists
    - `useGenerateMustahikCoupons()` — mutation: bulk create coupons for an array of mustahik IDs with a shared `expires_at`
    - `useRedeemCouponByToken()` — mutation: look up token, run validation chain (exists → active → not expired → event match), then set status to redeemed
    - `useRedeemCouponManually()` — mutation: redeem by coupon id (same validation)
    - `useCancelCoupon()` — mutation: set status to cancelled
    - `useUpdateCouponExpiry()` — mutation: update `expires_at` for one or many coupon IDs
  - [x] 1.9 Create `src/hooks/useQurbanDashboard.ts` with a `useQurbanDashboardStats(eventId?)` hook that returns: total hewan (sapi/kambing), total peserta, total nominal, lunas count + amount, belum bayar count + amount, coupons issued, coupons redeemed, per-event breakdown array.
  - [x] 1.10 Extend `src/hooks/useQurbanShares.ts`: add `useQurbanShareListFlat(params)` that fetches a paginated flat list joining `qurban_shares → qurban_animals → qurban_events → muzakki` with filter params (eventId, status, search, page, pageSize).

- [x] 2.0 Navigation & routing: update Qurban sidebar to 5-item structure
  - [x] 2.1 Open `src/App.tsx` (or the router config file) and add 5 new lazy-loaded route entries under the Qurban section: `/qurban/dashboard`, `/qurban/events`, `/qurban` (existing — keep), `/qurban/peserta`, `/qurban/distribusi`, `/qurban/scan`.
  - [x] 2.2 Create minimal placeholder page files for all new pages so routing resolves without errors: `QurbanDashboard.tsx`, `QurbanEvents.tsx`, `QurbanPeserta.tsx`, `QurbanDistribusi.tsx`, `QurbanScan.tsx` — each just exports a `<div>Coming soon</div>` until implemented in later tasks.
  - [x] 2.3 Open `src/components/layouts/AppLayout.tsx` and update the Qurban `navSections` array to the 5-item structure:
    1. "Dashboard Qurban" → `/qurban/dashboard` (admin + petugas)
    2. "Manajemen Event" → `/qurban/events` (admin only)
    3. "Data Hewan" → `/qurban` (existing — admin + petugas)
    4. "Daftar Peserta" → `/qurban/peserta` (admin + petugas)
    5. "Distribusi Qurban" → `/qurban/distribusi` (admin + petugas)
  - [x] 2.4 Run `npm run build` and confirm no TypeScript or routing errors.

- [x] 3.0 Event Management page & Daftar Peserta list view
  - [x] 3.1 Build `QurbanEvents.tsx`: `PageHeader` with title "Manajemen Event Qurban" and a "Tambah Event" button; render a shadcn/ui `Table` with columns: Nama Event, Tanggal, Jumlah Hewan, Jumlah Peserta, Aksi.
  - [x] 3.2 Fetch event list using `useQurbanEventList()`; for each event, fetch animal count and peserta count using a single joined query or existing hooks.
  - [x] 3.3 Wire "Tambah Event" button and the Edit action to open the existing `QurbanEventDialog` component.
  - [x] 3.4 Wire the Delete action to a confirmation `AlertDialog`; call `useDeleteQurbanEvent()` on confirm; show the existing error toast if the event has linked animals.
  - [x] 3.5 Build `QurbanPeserta.tsx`: filter bar at the top (Event dropdown using `useQurbanEventList`, Status Pembayaran select, search input); paginated `Table` (20 rows/page) below.
  - [x] 3.6 Connect `QurbanPeserta.tsx` to `useQurbanShareList(params)` created in task 1.10; render table columns: No., Nama Muzakki, Nama Hewan (nomor + jenis), Event, Urutan Slot, Nominal (formatted Rp), Status Pembayaran (badge), Aksi.
  - [x] 3.7 Implement row `DropdownMenu` actions in `QurbanPeserta`:
    - "Edit Status Bayar" — open inline dialog to toggle belum_bayar/lunas (reuse existing payment toggle pattern from `AnimalDetailDialog`)
    - "Lihat Bukti Qurban" — open existing `BuktiQurban` component
    - "Generate Kupon" — disabled with tooltip "Lunasi pembayaran terlebih dahulu" when status is belum_bayar; calls `useGenerateMuzakkiCoupon()` then opens `CouponDetailDialog`
    - "Lihat Kupon" — shown instead of Generate if coupon already exists; opens `CouponDetailDialog`
    - "Hapus" — confirmation AlertDialog, call delete mutation
  - [x] 3.8 Show total participant count below the table: "Total: X peserta".
  - [x] 3.9 Run `npm run build` and confirm no errors.

- [x] 4.0 Qurban Dashboard
  - [x] 4.1 Implement `useQurbanDashboard.ts` fully: write the Supabase queries to aggregate stats. Use separate queries for: (a) animal counts grouped by jenis, (b) share counts and nominal sum grouped by status_pembayaran, (c) coupon counts grouped by status, all joined/filtered by the optional `eventId` parameter. Combine results in the hook return value.
  - [x] 4.2 Create `src/components/qurban/dashboard/QurbanStatCards.tsx`: render 4 stat cards using the existing `StatCard` component pattern — Total Sapi, Total Kambing, Total Peserta, Total Nominal Terkumpul.
  - [x] 4.3 Create `src/components/qurban/dashboard/QurbanPaymentChart.tsx`: render a pie or bar chart (use Recharts, same library as the existing `PemasukanChart`) showing lunas vs belum bayar by count and nominal.
  - [x] 4.4 Create `src/components/qurban/dashboard/QurbanEventCard.tsx`: a card component that takes one event's stats (hewan count, peserta count, nominal lunas, nominal belum bayar, coupons issued, coupons redeemed) and renders them with a mini progress bar for coupon redemption.
  - [x] 4.5 Build `QurbanDashboard.tsx` page: add an event filter dropdown at the top (All Events + per-event options from `useQurbanEventList`); render `QurbanStatCards`, `QurbanPaymentChart`, a grid of `QurbanEventCard` per event, all wired to `useQurbanDashboardStats(selectedEventId)`.
  - [x] 4.6 Run `npm run build` and confirm no errors.

- [x] 5.0 Coupon generation & Distribusi Qurban management page
  - [x] 5.1 Create `src/components/qurban/CouponDetailDialog.tsx`: a dialog that receives a `QurbanCoupon` + recipient details and displays: coupon_number (monospace), Nama Penerima, Nama Event, info fields (jenis hewan + slot for muzakki, tanggal distribusi for mustahik), "Berlaku hingga" date, and a `react-qr-code` QR code rendering the `token` value. Include a "Bagikan Kupon" button (implemented in task 6.9).
  - [x] 5.2 Create `src/components/qurban/MustahikCouponPicker.tsx`: a dialog with a `useEffect`-loaded list of active mustahik (from `useMustahikList`), filtered by kategori, with checkboxes for selection; a date picker input for `expires_at`; and a "Generate Kupon" confirm button that calls `useGenerateMustahikCoupons()` with the selected IDs and expiry.
  - [x] 5.3 Build `QurbanDistribusi.tsx` page: event selector (required — show prompt if none selected); progress summary header showing "X dari Y kupon sudah ditebus (Z%)" as a progress bar; paginated table of mustahik coupons for the selected event.
  - [x] 5.4 Implement the table in `QurbanDistribusi.tsx` using `useQurbanCouponsByEvent(eventId, { recipient_type: 'mustahik', ...filters })`: columns — No. Kupon (monospace), Nama Mustahik, Kategori Mustahik, Status (badge: Active/Redeemed/Expired/Cancelled), Waktu Redemption, Berlaku Hingga, Aksi.
  - [x] 5.5 Add filter bar on `QurbanDistribusi.tsx`: Status kupon dropdown, Kategori mustahik dropdown (from `useKategoriMustahik`), free-text search by name.
  - [x] 5.6 Implement row actions in `QurbanDistribusi.tsx` via `DropdownMenu`: "Lihat Kupon" (opens `CouponDetailDialog`), "Bagikan Kupon" (triggers share flow from task 6.9), "Tandai Redeemed" (calls `useRedeemCouponManually` with confirmation), "Update Expiry" (inline date picker → `useUpdateCouponExpiry`), "Batalkan Kupon" (calls `useCancelCoupon` with confirmation, only shown if status is active).
  - [x] 5.7 Add page-level actions to `QurbanDistribusi.tsx` header: "Tambah Peserta Distribusi" button (opens `MustahikCouponPicker`), "Update Expiry Semua" button (date picker dialog → calls `useUpdateCouponExpiry` with all active coupon IDs for the event), "Mulai Scan" button (navigates to `/qurban/scan?eventId=...`).
  - [x] 5.8 Run `npm run build` and confirm no errors.

- [x] 6.0 QR scan redemption, manual fallback & coupon image sharing
  - [x] 6.1 Install dependencies: `npm install react-qr-code html5-qrcode html2canvas` (from within `zakat-fitrah-app/`). Verify they are added to `package.json`.
  - [x] 6.2 Build `QurbanScan.tsx` page structure: event selector at top (pre-filled if `?eventId=` query param is present); camera viewport panel (top half on mobile); result/confirmation panel (bottom half); a "Cari Manual" toggle button.
  - [x] 6.3 Integrate `html5-qrcode` into the camera panel: start scanning on mount (after camera permission is granted), call a `handleScanResult(token: string)` callback on each detected QR code, stop scanner on unmount. Show a graceful permission-denied message if camera access is refused.
  - [x] 6.4 Implement `handleScanResult`: call `useRedeemCouponByToken()` look-up (read-only check first, then confirm); display result state in the result panel — one of: valid coupon details + confirm button, already redeemed warning, expired error, cancelled error, not found error, wrong event error (see PRD req 40 for the full validation chain).
  - [x] 6.5 On petugas confirmation in the result panel, call the redeem mutation; show a success state ("Berhasil ditebus!") and reset the scanner for the next scan.
  - [x] 6.6 Implement the "Cari Manual" panel: toggling it hides the camera and shows a search input; search by coupon_number or mustahik name using `useQurbanCouponsByEvent` with a search param; display matching coupon(s) as result cards with a "Konfirmasi Redemption" button; apply the same validation rules as scan.
  - [x] 6.7 Create `src/components/qurban/CouponShareImage.tsx`: a `div` component styled as a coupon card (white background, mosque name at top, large QR code from `react-qr-code` in center, recipient name + event name, coupon_number in monospace at bottom, "Berlaku hingga" date). This component is rendered off-screen (positioned absolute, off-viewport) so it can be captured by html2canvas.
  - [x] 6.8 Create a `exportCouponImage(elementRef)` utility function in `src/lib/couponExport.ts`: uses `html2canvas(elementRef.current, { scale: 2 })` to produce a PNG blob; verify output is under 500 KB; return the blob.
  - [x] 6.9 Implement the "Bagikan Kupon" action: render `CouponShareImage` off-screen for the target coupon; call `exportCouponImage`; if `navigator.share` is available AND `navigator.canShare({ files: [...] })` returns true, call `navigator.share({ files: [pngFile], title: 'Kupon Qurban' })`; otherwise trigger a download link (`<a href=blobUrl download=...>`). Wire this button in `CouponDetailDialog` and in the Distribusi page row action.
  - [x] 6.10 Run `npm run build` and confirm no TypeScript errors or missing imports.
  - [x] 6.11 Do a final end-to-end manual smoke test: create a coupon → view it → scan the QR via the scan screen (use another device or screenshot) → confirm redemption → verify status changes to redeemed in the Distribusi table. Test the expired flow by temporarily setting `expires_at` to a past date.
