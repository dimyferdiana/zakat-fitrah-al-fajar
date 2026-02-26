-- =========================================
-- BACKFILL: account_ledger_entries from legacy transactions
-- =========================================
-- The ledger system (migration 028) was added after these transactions existed.
-- App code (usePemasukanUang, usePemasukanBeras, useRekonsiliasi) writes ledger
-- entries for NEW transactions going forward, but legacy rows have no entries.
-- This migration backfills them.
--
-- Pattern used by app code (matching exactly):
--   entry_type: 'IN', running_balance_before_rp: 0, running_balance_after_rp: amount_rp
-- (balances are per-entry, not cumulative — consistent with running app behaviour)
-- =========================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. pemasukan_uang → IN entries
-- Only rows that have account_id set (from migration 031) and no existing ledger
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.account_ledger_entries (
  account_id,
  entry_type,
  amount_rp,
  running_balance_before_rp,
  running_balance_after_rp,
  entry_date,
  effective_at,
  notes,
  source_pemasukan_uang_id,
  created_by
)
SELECT
  pu.account_id,
  'IN'::public.account_ledger_entry_type,
  pu.jumlah_uang_rp,
  0,
  pu.jumlah_uang_rp,
  pu.tanggal,
  pu.created_at,
  pu.catatan,
  pu.id,
  pu.created_by
FROM public.pemasukan_uang pu
WHERE pu.account_id IS NOT NULL
  AND pu.jumlah_uang_rp > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.account_ledger_entries ale
    WHERE ale.source_pemasukan_uang_id = pu.id
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. pemasukan_beras → IN entries (converts kg → Rp using tahun_zakat.nilai_beras_kg)
-- Rows where nilai_beras_kg = 0 or NULL are skipped (would violate amount_rp > 0)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.account_ledger_entries (
  account_id,
  entry_type,
  amount_rp,
  running_balance_before_rp,
  running_balance_after_rp,
  entry_date,
  effective_at,
  notes,
  source_pemasukan_beras_id,
  created_by
)
SELECT
  pb.account_id,
  'IN'::public.account_ledger_entry_type,
  ROUND(pb.jumlah_beras_kg * tz.nilai_beras_kg, 2),
  0,
  ROUND(pb.jumlah_beras_kg * tz.nilai_beras_kg, 2),
  pb.tanggal,
  pb.created_at,
  pb.catatan,
  pb.id,
  pb.created_by
FROM public.pemasukan_beras pb
JOIN public.tahun_zakat tz ON tz.id = pb.tahun_zakat_id
WHERE pb.account_id IS NOT NULL
  AND pb.jumlah_beras_kg > 0
  AND tz.nilai_beras_kg > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.account_ledger_entries ale
    WHERE ale.source_pemasukan_beras_id = pb.id
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. rekonsiliasi (jenis='uang' only) → REKONSILIASI entries
-- Beras rekonsiliasi rows have no jumlah_uang_rp so they're skipped
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.account_ledger_entries (
  account_id,
  entry_type,
  amount_rp,
  running_balance_before_rp,
  running_balance_after_rp,
  entry_date,
  effective_at,
  notes,
  source_rekonsiliasi_id,
  manual_reconciliation_ref,
  created_by
)
SELECT
  rk.account_id,
  'REKONSILIASI'::public.account_ledger_entry_type,
  ABS(rk.jumlah_uang_rp),
  0,
  ABS(rk.jumlah_uang_rp),
  rk.tanggal,
  rk.created_at,
  rk.catatan,
  rk.id,
  'backfill-legacy-rekonsiliasi',
  rk.created_by
FROM public.rekonsiliasi rk
WHERE rk.account_id IS NOT NULL
  AND rk.jenis = 'uang'
  AND rk.jumlah_uang_rp IS NOT NULL
  AND ABS(rk.jumlah_uang_rp) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.account_ledger_entries ale
    WHERE ale.source_rekonsiliasi_id = rk.id
  );

COMMIT;
