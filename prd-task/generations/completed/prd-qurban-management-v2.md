# Product Requirements Document

## Qurban Management System — Full Feature Enhancement (v2)

**Date:** 2026-05-08
**Status:** Final Draft
**Author:** AI-assisted (dimyferdiana)

---

## 1. Introduction / Overview

The existing Qurban module manages animals, events, and muzakki slot assignments. However, it lacks several critical operational features needed for a complete end-to-end qurban lifecycle: a readable registration list view, dedicated event management, a dashboard for at-a-glance metrics, a secure coupon system for both muzakki (peserta) and mustahik (penerima daging), and a QR-based distribution & redemption workflow.

**Goal:** Extend the Qurban module into a full operational system — from registration through distribution day — so that petugas can manage events, track payments, issue secure coupons, and process redemptions with a phone camera scan.

---

## 2. Goals

1. Give petugas a flat **list/table view** of all qurban participants (like Penerimaan Zakat) for easier lookup and management.
2. Provide a **dedicated Event Management** menu so admins can create, edit, and delete qurban events without navigating through the animal grid.
3. Provide a **Qurban Dashboard** with at-a-glance stats: animals, participants, payment status, and distribution progress.
4. Enable **secure coupon generation** for two recipient types: muzakki (bukti pendaftaran peserta) and mustahik (tiket distribusi daging).
5. Support **distribution day workflow**: petugas scans a QR code to mark a coupon as redeemed, with a manual fallback.
6. Allow petugas to **share a coupon image** (via WhatsApp or print) containing the QR code and recipient details.
7. Prevent coupon **forgery (pemalsuan)** by using cryptographically unpredictable tokens in the QR code payload.

---

## 3. User Stories

### 3.1 Registration List View

- **As a petugas**, I want to see all qurban participants in a table (name, hewan, slot, nominal, status bayar) so I can quickly find and verify a specific person without scrolling through animal cards.
- **As an admin**, I want to filter and search the participant list by event, payment status, and name.

### 3.2 Event Management

- **As an admin**, I want a dedicated "Manajemen Event" menu item in the Qurban sidebar so I can create, rename, change the date of, or delete a qurban event without going through the animal management page.

### 3.3 Qurban Dashboard

- **As an admin/petugas**, I want a dashboard that shows: total hewan per jenis, total peserta, total nominal terkumpul, payment status breakdown, and distribution redemption progress per event.

### 3.4 Coupon Generation — Muzakki (Peserta)

- **As a petugas**, I want to generate a "Bukti Pendaftaran Qurban" coupon for a muzakki who has registered a slot, so they have proof of their participation including a unique secure QR code.

### 3.5 Coupon Generation — Mustahik (Penerima Daging)

- **As an admin**, I want to assign distribution coupons (Kupon Distribusi Daging Qurban) to mustahik so each person knows their entitlement and can present it on distribution day.

### 3.6 Distribution Process

- **As an admin**, I want to create a distribution plan: select an event, assign portions to mustahik, and generate their coupons, so distribution day is organized.

### 3.7 Redemption — QR Scan

- **As a petugas on distribution day**, I want to open a scan screen on my phone/tablet, point at a mustahik's QR code, and have the system instantly confirm or reject the coupon and mark it as redeemed.

### 3.8 Manual Redemption Fallback

- **As a petugas**, if the QR scan fails (damaged coupon, poor lighting), I want to search by name or coupon number and manually mark the coupon as redeemed.

### 3.9 Share Coupon Image

- **As a petugas**, I want to generate a shareable coupon image (suitable for WhatsApp or PDF print) containing the recipient's name, event, portion info, and QR code.

---

## 4. Functional Requirements

### 4.1 Registration List View (Daftar Peserta Qurban)

1. The system must add a new sub-page **"Daftar Peserta"** accessible from the Qurban sidebar (separate from the existing animal grid view).
2. The list must display all `qurban_shares` joined with `qurban_animals` and `qurban_events` in a paginated table (20 rows/page), matching the Penerimaan Zakat table pattern.
3. Table columns: No., Nama Muzakki, Nama Hewan (nomor + jenis), Event, Urutan Slot, Nominal, Status Pembayaran, Aksi.
4. The list must support filtering by: Event (dropdown), Status Pembayaran (belum_bayar / lunas), and free-text search by muzakki name.
5. Row actions must include: Edit (payment status), View Bukti Qurban, Generate/View Coupon, Delete.
6. The system must show a total participant count at the bottom of the list.

### 4.2 Event Management Menu

7. The system must add a dedicated **"Manajemen Event"** navigation item under the Qurban sidebar section (visible to admin only).
8. The Event Management page must list all qurban events in a table with columns: Nama Event, Tanggal, Jumlah Hewan, Jumlah Peserta, Aksi.
9. Admin must be able to create, edit, and delete events from this page.
10. Deleting an event must be blocked if animals are linked to it (show an informative error message); the existing `useDeleteQurbanEvent` hook already enforces this.
11. The existing `QurbanEventDialog` component must be reused for the create/edit form.

### 4.3 Qurban Dashboard

12. The system must add a **"Dashboard Qurban"** page as the first item in the Qurban sidebar section.
13. Dashboard must show summary stat cards:
    - Total Hewan (split by sapi / kambing count)
    - Total Peserta (total filled slots across all events)
    - Total Nominal Terkumpul (sum of all `qurban_shares.nominal`)
    - Status Pembayaran summary (count + total nominal lunas vs belum bayar)
14. Dashboard must show a **Payment Status Chart** (pie or bar chart: lunas vs belum bayar by nominal and count).
15. Dashboard must show a **Per-Event Breakdown** section: one card per event showing hewan count, peserta count, payment totals, and coupon redemption progress.
16. Dashboard must show a **Distribution Progress** section: coupons issued vs redeemed, as a progress bar per event.
17. Dashboard must have an event filter dropdown to narrow data to a single qurban event.
18. Dashboard data must use React Query and refresh on page load.

### 4.4 Coupon System — Database & Security

19. The system must add a `qurban_coupons` table with the following columns:
    - `id` UUID (primary key)
    - `event_id` UUID (FK to qurban_events)
    - `recipient_type` text — `'muzakki'` or `'mustahik'`
    - `recipient_id` UUID — muzakki.id or mustahik.id depending on type
    - `qurban_share_id` UUID nullable (FK to qurban_shares, for muzakki coupons only)
    - `coupon_number` text — a random, unpredictable short code generated from `encode(gen_random_bytes(6), 'hex')` (e.g., `a3f9c2d1b0e4`), NOT sequential
    - `token` UUID — generated by PostgreSQL `gen_random_uuid()`, NOT sequential
    - `status` text — `'active'`, `'redeemed'`, or `'cancelled'`
    - `expires_at` timestamptz — settable by admin; after this timestamp the coupon is treated as invalid
    - `redeemed_at` timestamptz nullable
    - `redeemed_by` UUID nullable (FK to auth.users)
    - `catatan` text nullable
    - `created_at`, `updated_at` timestamptz
20. Both `token` and `coupon_number` must be generated server-side by PostgreSQL (`gen_random_uuid()` and `encode(gen_random_bytes(6), 'hex')` respectively) — never client-generated or sequential. This makes both the QR content and the printed coupon number impossible to enumerate or forge.
21. The QR code content must encode **only the `token` value** (not coupon_number or any recipient details), so the QR code is opaque and cannot be forged by guessing.
22. RLS policies:
    - SELECT: admin, petugas, viewer
    - INSERT/UPDATE (create coupon, cancel, set expires_at): admin, petugas
    - UPDATE (redemption only — set status to redeemed): petugas
    - DELETE: admin only

### 4.5 Coupon Generation — Muzakki (Bukti Pendaftaran)

23. The system must allow petugas to generate a coupon for a muzakki from the Daftar Peserta row action ("Generate Kupon") **only when the share's `status_pembayaran` is `lunas`**. The action must be disabled/hidden for shares with `belum_bayar` status.
24. A muzakki coupon links to their specific `qurban_share_id`.
25. There must be a unique constraint on `qurban_share_id`; regenerating a coupon cancels the previous one and creates a new one with a fresh token and coupon_number.
26. The coupon card must display: Nama Muzakki, Nama Event, Jenis Hewan, Nomor Hewan, Urutan Slot, Nominal, QR Code, Coupon Number.

### 4.6 Coupon Generation — Mustahik (Kupon Distribusi Daging)

27. The system must allow admin to create a distribution plan from the Distribusi Qurban page: select an event, then assign coupons to mustahik from the existing mustahik master data.
28. Admin must be able to select mustahik individually or in bulk (checkbox select from a list filtered by kategori mustahik).
29. Each mustahik receives exactly one coupon per event (unique constraint on `(event_id, recipient_type='mustahik', recipient_id)`).
30. The coupon card must display: Nama Mustahik, Nama Event, Tanggal Distribusi, QR Code, Coupon Number. Portion size is fixed and uniform — no variable "Jumlah Porsi" field required.
31. Coupons must be generatable in bulk: one "Generate Semua Kupon" action creates coupons for all selected mustahik in a single operation.
32. When generating coupons (individually or in bulk), admin must set the **expiry date** (`expires_at`) for the batch. After this date, the coupons become invalid and cannot be redeemed. This date is set once per batch and applies to all coupons generated together.

### 4.7 Distribution Process Management

33. The system must add a **"Distribusi Qurban"** page in the Qurban sidebar (accessible to admin and petugas).
34. The page must list all mustahik coupons for a selected event in a table with columns: No. Kupon, Nama Mustahik, Kategori Mustahik, Status (Active/Redeemed/Expired/Cancelled), Waktu Redemption, Berlaku Hingga, Aksi.
35. Filter options: Event (required), Status kupon, Kategori mustahik, free-text search by name.
36. A progress summary header must show: **X of Y kupon sudah ditebus (Z%)** as a progress bar.
37. Admin must be able to update the `expires_at` date on an individual coupon or on all active coupons of an event (bulk update expiry).

### 4.8 Coupon Redemption — QR Scan

38. The system must provide a **"Scan Kupon"** screen accessible via a button on the Distribusi Qurban page ("Mulai Scan").
39. The scan screen must use the device camera via a browser QR scanning library (e.g., `html5-qrcode` or `@zxing/browser`) to read QR codes in real-time.
40. On successful scan: the system must look up the token in `qurban_coupons`, validate the coupon against these rules in order:
    - Token exists → else: "Kupon tidak valid atau tidak ditemukan."
    - Status is `active` → else if `redeemed`: show original redemption time and petugas name; else if `cancelled`: "Kupon sudah dibatalkan."
    - `now() < expires_at` → else: "Kupon sudah kedaluwarsa (expired)."
    - `event_id` matches the currently selected event → else: "Kupon bukan untuk event ini."
    - If all pass: display coupon details (nama, event, berlaku hingga) and prompt petugas to confirm.
41. On confirmed redemption: update `status` to `'redeemed'`, set `redeemed_at` to now, set `redeemed_by` to current user's ID.
42. The scan screen must work on mobile browsers (iOS Safari and Android Chrome) and request camera permission gracefully.

### 4.9 Manual Redemption Fallback

43. On the Distribusi Qurban page, each active coupon row must have a "Tandai Redeemed" action in its row action dropdown for manual override.
44. The scan screen must include a "Cari Manual" toggle: a text input to search by coupon number or mustahik name, showing a matching coupon card with a "Konfirmasi Redemption" button. The same expiry and event validation (requirement 40) must apply here too.
45. Manual redemption must record the same `redeemed_at` and `redeemed_by` fields as scan-based redemption.

### 4.10 Coupon Image Sharing

46. The system must generate a shareable coupon image for both muzakki and mustahik coupons (triggered from a "Bagikan Kupon" button in the coupon row action or coupon detail dialog).
47. The coupon image must include: mosque name, recipient name, event name, coupon number (random short code), QR code, and "Berlaku hingga: [expires_at date]".
48. The QR code in the image must be generated client-side from the coupon `token` using `react-qr-code` or equivalent.
49. The image must be rendered as an off-screen HTML element and exported as a PNG blob using `html2canvas` or `dom-to-image-more` (target < 500 KB).
50. The "Bagikan" action must trigger: (a) **Web Share API** for mobile devices (enables native share sheet → WhatsApp, etc.), or (b) **download as PNG** on desktop as fallback.

---

## 5. Non-Goals (Out of Scope)

- Integration with physical barcode scanners (USB/Bluetooth) — browser camera only.
- SMS or WhatsApp push notifications to mustahik.
- Multi-language support — Indonesian only.
- Self-service QR redemption by mustahik themselves (kiosk mode) — petugas-operated only.
- Financial accounting integration for qurban (separate from zakat ledger).
- Meat weight / portion weight tracking per recipient.
- Printing directly to a physical printer from the app.

---

## 6. Design Considerations

- **Daftar Peserta table** must match the Penerimaan Zakat table pattern exactly: same filter bar layout, same `Pagination` component, same `DropdownMenu` for row actions (from `@/components/ui/`).
- **Event Management page** follows the same pattern as Muzakki/Mustahik master data pages: `PageHeader` with a create button, full-width table.
- **Dashboard** follows the existing Zakat Dashboard widget/card pattern — reuse `StatCard` and `DistribusiProgress` components where possible; add a new `PembayaranChart` component for the pie/bar chart.
- **Qurban Sidebar** updated to 5 items:
  1. Dashboard Qurban (`/qurban/dashboard`)
  2. Manajemen Event (`/qurban/events`) — admin only
  3. Data Hewan (`/qurban`) — existing
  4. Daftar Peserta (`/qurban/peserta`)
  5. Distribusi Qurban (`/qurban/distribusi`)
- **Coupon image** layout: white card, mosque name/logo at top, large QR code centered, recipient name + event name below, coupon number at bottom in monospace. Keep image square or portrait (1:1.4 ratio) for WhatsApp preview.
- **Scan screen** should be mobile-first: full-height camera viewport top half, result card bottom half. A "Cari Manual" toggle expands a search panel instead of the camera view.

---

## 7. Technical Considerations

- **QR scan library**: `html5-qrcode` (MIT, widely used, supports iOS Safari) or `@zxing/browser` — evaluate bundle size.
- **QR render library**: `react-qr-code` (lightweight, SVG-based).
- **Image export**: `html2canvas` v1+ or `dom-to-image-more` — test on Safari (Canvas CORS quirks).
- **Token security**: Two-layer randomness to prevent forgery:
  - `token` = `gen_random_uuid()` (UUID v4, 122 bits entropy) — used in QR code
  - `coupon_number` = `encode(gen_random_bytes(6), 'hex')` (48 bits entropy, 12 hex chars) — printed on coupon, human-readable but not guessable
  - Neither is sequential; both are server-generated; QR encodes only the token.
- **Expiry enforcement**: Checked at redemption time by comparing `now()` against `expires_at`. Expired coupons show as "Kedaluwarsa" in the distribution list. Expiry is set per batch by admin (not auto-derived from event date alone).
- **New Supabase migration**: `036_qurban_coupons.sql` — `qurban_coupons` table, unique index on `(event_id, recipient_type, recipient_id)` for mustahik, unique index on `qurban_share_id` for muzakki, + RLS policies + `pgcrypto` extension for `gen_random_bytes`.
- **New hooks**:
  - `useQurbanCoupons.ts` — CRUD, bulk generate, redeem by token, redeem manually, update expiry
  - `useQurbanDashboard.ts` — aggregated stats (multiple Supabase queries or a DB view)
- **Existing hooks to reuse**: `useQurbanEvents`, `useQurbanAnimals`, `useQurbanShares`, `useMustahikList`, `useKategoriMustahik`.
- **New pages**: `QurbanDashboard.tsx`, `QurbanEvents.tsx`, `QurbanPeserta.tsx`, `QurbanDistribusi.tsx`, `QurbanScan.tsx`.
- **AppLayout** Qurban nav section in `AppLayout.tsx` must be updated with the new 5-item structure.
- **Web Share API**: Check `navigator.share` support before showing share button; fall back to PNG download.

---

## 8. Success Metrics

- Petugas can find any participant by name in under 10 seconds using the list view search.
- Admin can create/edit/delete an event from the Event Management page without touching the animal grid.
- Dashboard loads all stat cards in under 2 seconds on a typical mobile connection.
- Petugas can issue coupons to 100 mustahik in under 5 minutes using bulk generation.
- QR scan-to-redemption confirmation takes under 5 seconds per recipient on a modern mobile browser.
- Zero duplicate redemptions: scanning an already-redeemed coupon shows a clear warning instead of re-redeeming.
- Coupon PNG images are under 500 KB and share successfully via the Android/iOS native share sheet.

---

## 9. Decisions Log

All open questions have been resolved. Decisions are incorporated into the requirements above.

| # | Question | Decision |
|---|----------|----------|
| 1 | Lokasi distribusi on coupon? | **Not needed.** No location field on distribution plan or coupon. |
| 2 | Variable portions per mustahik? | **Fixed portion.** One coupon = one standard portion for all mustahik. No "Jumlah Porsi" variable field. |
| 3 | Muzakki coupon gating? | **Lunas only.** "Generate Kupon" is disabled for shares with `status_pembayaran = belum_bayar`. |
| 4 | Coupon number format? | **Random, not sequential.** Both `token` (UUID v4) and `coupon_number` (6 random bytes as 12-char hex) are server-generated and unpredictable to prevent enumeration and forgery. |
| 5 | Coupon expiry? | **Yes, admin-settable per batch.** Admin sets `expires_at` when generating coupons. Redemption is rejected after this date. Admin can update expiry later if needed. |
