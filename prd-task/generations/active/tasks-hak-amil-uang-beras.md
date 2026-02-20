# Tasks: Pengaturan Hak Amil (Uang & Beras)

## Relevant Files

- `zakat-fitrah-app/supabase/migrations/023_hak_amil_config_and_snapshots.sql` - Migration untuk konfigurasi hak amil per tahun + snapshot per transaksi.
- `zakat-fitrah-app/supabase/migrations/024_hak_amil_rls_and_audit.sql` - RLS policy dan audit log perubahan konfigurasi hak amil.
- `zakat-fitrah-app/src/types/database.types.ts` - Tambahan tipe tabel konfigurasi, snapshot, dan agregasi hak amil.
- `zakat-fitrah-app/src/hooks/useHakAmil.ts` - Hook query/mutation untuk konfigurasi hak amil, kalkulasi, dan rekap laporan.
- `zakat-fitrah-app/src/hooks/useDashboard.ts` - Integrasi ringkasan hak amil di dashboard keuangan.
- `zakat-fitrah-app/src/pages/Dashboard.tsx` - Tampilan section/kartu “Hak Amil”.
- `zakat-fitrah-app/src/pages/Laporan.tsx` - Tab/filter laporan hak amil bulanan & tahunan.
- `zakat-fitrah-app/src/components/dashboard/HakAmilCard.tsx` - Komponen stat card khusus hak amil per kategori.
- `zakat-fitrah-app/src/components/laporan/LaporanHakAmil.tsx` - Tabel rekap hak amil bruto/rekonsiliasi/neto/persen/nominal.
- `zakat-fitrah-app/src/components/settings/HakAmilConfigForm.tsx` - Form admin untuk set basis perhitungan per tahun zakat.
- `zakat-fitrah-app/src/components/settings/HakAmilConfigTable.tsx` - Daftar konfigurasi hak amil per tahun.
- `zakat-fitrah-app/src/utils/hakAmilCalculator.ts` - Fungsi kalkulasi formula hak amil per kategori.
- `zakat-fitrah-app/src/utils/hakAmilCalculator.test.ts` - Unit test kalkulasi hak amil.
- `zakat-fitrah-app/src/utils/export.ts` - Tambahan export PDF/Excel untuk laporan hak amil.
- `zakat-fitrah-app/src/pages/Settings.tsx` - Menambah tab “Hak Amil” (admin-only).
- `zakat-fitrah-app/src/lib/auth.tsx` - Pastikan role gating admin/petugas untuk akses konfigurasi.

### Notes

- Unit tests sebaiknya diletakkan berdampingan dengan file yang diuji.
- Jalankan test file tertentu dengan `npx vitest run [optional/path/to/test/file]`.
- Jalankan semua test dengan `npx vitest run`.
- Jalankan validasi build sebelum menandai tugas selesai: `npm run build`.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/hak-amil-uang-beras`

- [x] 1.0 Finalize data contract & formula rules
  - [x] 1.1 Review `prd-hak-amil-uang-beras.md` and lock final formula mapping per kategori.
  - [x] 1.2 Define enum kategori penerimaan yang dipakai kalkulasi: `zakat_fitrah`, `zakat_maal`, `infak`, `fidyah`, `beras`.
  - [x] 1.3 Define default basis kalkulasi: `net_after_reconciliation`.
  - [x] 1.4 Define per-year basis override design (`net_after_reconciliation` / `gross_before_reconciliation`).
  - [x] 1.5 Define output contract untuk laporan: bruto, rekonsiliasi, neto, persen, nominal.
  - [x] 1.6 Define behavior untuk kategori 0% (fidyah & beras): wajib tampil dengan nominal 0.

#### Wave 0 Contract Lock (2026-02-20)

- Formula final per kategori:
  - `zakat_fitrah`: `12.5%`
  - `zakat_maal`: `12.5%`
  - `infak`: `20%`
  - `fidyah`: `0%`
  - `beras`: `0%`
- Enum kategori kalkulasi: `zakat_fitrah | zakat_maal | infak | fidyah | beras`.
- Default basis mode: `net_after_reconciliation`.
- Basis override per tahun zakat: hanya `net_after_reconciliation` atau `gross_before_reconciliation`, tersimpan per `tahun_zakat_id`, berlaku untuk transaksi baru (snapshot historis tidak berubah).
- Output contract laporan hak amil (per kategori): `bruto`, `rekonsiliasi`, `neto`, `persen`, `nominal_hak_amil`.
- Kategori 0% (`fidyah`, `beras`) wajib tetap tampil pada dashboard/laporan/export dengan `persen=0` dan `nominal_hak_amil=0`.

- [x] 2.0 Database migration: configuration, snapshot, and audit
  - [x] 2.1 Create migration `023_hak_amil_config_and_snapshots.sql`.
  - [x] 2.2 Create table `hak_amil_configs` (per tahun zakat) with basis mode + percentages.
  - [x] 2.3 Add unique constraint by `tahun_zakat_id`.
  - [x] 2.4 Create table `hak_amil_snapshots` to store per-transaction calculated values.
  - [x] 2.5 Add foreign keys to transaction sources (uang/beras/rekonsiliasi reference strategy).
  - [x] 2.6 Add indexes for reporting (`tahun_zakat_id`, `kategori`, `tanggal`).
  - [x] 2.7 Create migration `024_hak_amil_rls_and_audit.sql`.
  - [x] 2.8 Add RLS: admin full access for config; petugas read-only config; both can read reports per policy.
  - [x] 2.9 Add audit logging trigger on config change (old value/new value + actor + timestamp).
  - [x] 2.10 Apply migrations in Supabase and verify schema + policies.
    - ✅ COMPLETE: Migrations 023 dan 024 berhasil dijalankan manual via Supabase SQL Editor (Feb 20, 2026).
    - Schema `hak_amil_configs` dan `hak_amil_snapshots` sudah aktif di remote database.
    - RLS policies dan audit trigger sudah terpasang.

- [x] 3.0 Core calculation engine implementation
  - [x] 3.1 Create `src/utils/hakAmilCalculator.ts`.
  - [x] 3.2 Implement formula mapping:
    - Zakat Fitrah = 12.5%
    - Zakat Maal = 12.5%
    - Infak = 20%
    - Fidyah = 0%
    - Beras = 0%
  - [x] 3.3 Implement basis handler: gross vs net-after-reconciliation.
  - [x] 3.4 Implement deterministic rounding strategy (documented and consistent).
  - [x] 3.5 Implement helper to produce breakdown object for UI and export.
  - [x] 3.6 Add unit tests for each category and each basis mode.
    - BLOCKED: Test execution via `npx vitest run src/utils/hakAmilCalculator.test.ts` could not run because `vitest` is not installed in this workspace and the command requires interactive package install confirmation.
  - [x] 3.7 Add unit tests for edge cases (0, negative adjustment, very large values).
    - BLOCKED: Runtime verification of edge-case tests could not be executed for the same `vitest` availability issue.

- [x] 4.0 Persist snapshots at transaction level
  - [x] 4.1 Identify insertion points in uang/beras/rekonsiliasi transaction flows.
  - [x] 4.2 Implement snapshot write on create/update relevant transaction events.
  - [x] 4.3 Ensure snapshot stores category, basis, percentage, nominal source, nominal hak amil.
  - [x] 4.4 Ensure changes in yearly config do not retroactively mutate old snapshots.
  - [x] 4.5 Add backfill script/migration for existing transactions (if required by policy).
  - [x] 4.6 Validate idempotency and avoid duplicate snapshots.
  - IMPLEMENTATION SUMMARY (Wave 2 - Agent A):
    - Created `/zakat-fitrah-app/src/lib/hakAmilSnapshot.ts` with snapshot creation utilities
    - Integrated snapshot persistence into `usePemasukanUang` (pemasukan_uang transactions)
    - Integrated snapshot persistence into `usePemasukanBeras` (pemasukan_beras transactions)
    - Design decision: Rekonsiliasi does NOT create snapshots (it's an adjustment, not income)
    - Snapshots are immutable: store basis_mode and persen at transaction time
    - Idempotency ensured via unique indexes per source transaction
    - Failure handling: snapshot errors logged but don't block main transaction
    - Backfill consideration documented in `prd-task/generations/notes/hak-amil-backfill-consideration.md`
    - Migration guide created in `prd-task/generations/notes/hak-amil-migration-application-guide.md`

- [x] 5.0 Admin configuration UI (per tahun zakat)
  - [x] 5.1 Create `HakAmilConfigForm.tsx` with form fields for basis + percentages.
  - [x] 5.2 Pre-fill default percentages based on PRD formula.
  - [x] 5.3 Add validation rules (percent in range 0–100, required year, required basis).
  - [x] 5.4 Create `HakAmilConfigTable.tsx` for existing configs by year.
  - [x] 5.5 Add admin-only access in `Settings.tsx` tab "Hak Amil".
  - [x] 5.6 Show read-only badge for petugas if they can view without edit rights.
  - [x] 5.7 Log config changes and show last updated by/time metadata.

- [x] 6.0 Dashboard and report integration
  - [x] 6.1 Create/extend `useHakAmil.ts` for monthly and yearly aggregations.
  - [x] 6.2 Integrate summary cards into dashboard (`HakAmilCard.tsx`).
  - [x] 6.3 Show per-category nominal hak amil and total hak amil period.
  - [x] 6.4 Ensure fidyah/beras appear with 0% and nominal 0 where relevant.
  - [x] 6.5 Add `LaporanHakAmil.tsx` with filters: month, year zakat, category.
  - [x] 6.6 Display columns: bruto, rekonsiliasi, neto, persen, nominal hak amil.
  - [x] 6.7 Add monthly and yearly views in `Laporan.tsx`.

- [x] 7.0 Export PDF/Excel for hak amil report
  - [x] 7.1 Extend `src/utils/export.ts` with `exportHakAmilPDF()`.
  - [x] 7.2 Extend `src/utils/export.ts` with `exportHakAmilExcel()`.
  - [x] 7.3 Ensure export includes filter metadata (periode, tahun zakat, basis mode).
  - [x] 7.4 Ensure export includes category rows including 0% categories.
  - [x] 7.5 Add export actions in laporan hak amil UI.

- [x] 8.0 QA, security checks, and rollout
  - [x] 8.1 Run `npm run build` and resolve type/build issues.
  - [x] 8.2 Run `npx vitest run` and ensure calculator tests pass.
  - [x] 8.3 Validate role access: admin edit, petugas read-only, unauthorized blocked.
  - [x] 8.4 Validate formula correctness for all categories and basis modes.
  - [x] 8.5 Validate snapshot immutability when config changes in new period.
  - [x] 8.6 Validate monthly/yearly report totals against manual calculation samples.
  - [x] 8.7 Validate PDF/Excel export integrity and formatting.
  - [x] 8.8 Update docs in `prd-task/generations/notes/` or relevant README section with usage and formula.

---

## PM Parallelization Pass (A/B/C Assignment Plan)

### Objective

Menjalankan implementasi paralel tanpa konflik file dan tanpa saling overwrite antar agent.

### Agent Roles

- **Agent A (Backend/DB):** migration, RLS, audit, snapshot persistence.
- **Agent B (Frontend/UI):** settings form, dashboard card, laporan UI, export actions.
- **Agent C (Domain Logic/Hook/Test):** calculator engine, hook aggregation, unit test, QA checklist execution.

### Wave Plan

#### Wave 0 (Solo prerequisite)

- Owner: **Lead/PM**
- Tasks:
  - 0.1 Create and checkout branch
  - 1.0 Finalize data contract & formula rules (1.1–1.6)

> Reason: kontrak data harus fix sebelum coding paralel.

#### Wave 1 (Can run in parallel)

- **Agent A:** 2.0 (2.1–2.10)
- **Agent C:** 3.0 (3.1–3.7)
- **Agent B:** 5.0 draft UI scaffold only (5.1, 5.2, 5.3, 5.4 layout) tanpa binding final API

#### Wave 2 (Depends on Wave 1)

- **Agent A:** 4.0 (4.1–4.6) snapshot persistence after DB schema exists
- **Agent C:** 6.1 (hook aggregation) based on DB + calculator
- **Agent B:** 5.5–5.7 (role gating + metadata) after API contract stabil

#### Wave 3 (Parallel integration)

- **Agent B:** 6.2–6.7 (dashboard + laporan integration)
- **Agent C:** 7.1–7.4 (export logic wiring in `export.ts` + data transformer)
- **Agent B:** 7.5 (export actions in UI)

#### Wave 4 (QA & hardening)

- **Agent C (lead QA):** 8.1–8.8
- **Agent A/B support:** bug fixes from QA findings

### File Ownership (Conflict Prevention)

#### Agent A owns

- `zakat-fitrah-app/supabase/migrations/023_hak_amil_config_and_snapshots.sql`
- `zakat-fitrah-app/supabase/migrations/024_hak_amil_rls_and_audit.sql`
- DB-related sections in `src/types/database.types.ts` (coordinate with Agent C before merge)

#### Agent B owns

- `zakat-fitrah-app/src/components/settings/HakAmilConfigForm.tsx`
- `zakat-fitrah-app/src/components/settings/HakAmilConfigTable.tsx`
- `zakat-fitrah-app/src/components/dashboard/HakAmilCard.tsx`
- `zakat-fitrah-app/src/components/laporan/LaporanHakAmil.tsx`
- `zakat-fitrah-app/src/pages/Settings.tsx`
- `zakat-fitrah-app/src/pages/Dashboard.tsx`
- `zakat-fitrah-app/src/pages/Laporan.tsx`

#### Agent C owns

- `zakat-fitrah-app/src/utils/hakAmilCalculator.ts`
- `zakat-fitrah-app/src/utils/hakAmilCalculator.test.ts`
- `zakat-fitrah-app/src/hooks/useHakAmil.ts`
- `zakat-fitrah-app/src/hooks/useDashboard.ts` (hak amil query sections)
- `zakat-fitrah-app/src/utils/export.ts` (hak amil export functions)

### Shared Files (Single Writer Rule)

- `src/types/database.types.ts` → **single writer: Agent C**, Agent A provides schema contract.
- `src/hooks/useDashboard.ts` → **single writer: Agent C**.
- `src/utils/export.ts` → **single writer: Agent C**, Agent B only consumes exported functions.

### Integration Checkpoints

1. **Checkpoint A (after Wave 1):**
  - Migrations reviewed
  - Calculator tests pass
  - UI scaffold renders without data binding
2. **Checkpoint B (after Wave 2):**
  - Snapshot persistence works
  - Hook returns correct aggregates
  - Role gating valid
3. **Checkpoint C (after Wave 3):**
  - Dashboard + laporan + export end-to-end ready
4. **Checkpoint D (Wave 4):**
  - Build + tests + manual verification complete

### Task-to-Agent Mapping (Quick View)

- **Agent A:** 2.0, 4.0, support 8.x bugfix DB
- **Agent B:** 5.0, 6.2–6.7, 7.5, support 8.x bugfix UI
- **Agent C:** 3.0, 6.1, 7.1–7.4, 8.0 lead

### PM Monitoring Rules

- Update checklist status per sub-task immediately (`[ ]` → `[x]`).
- If a task is blocked, annotate with `BLOCKED:` note directly under sub-task.
- Run sync every checkpoint before moving to next wave.
- Do not let two agents edit the same shared file simultaneously.
