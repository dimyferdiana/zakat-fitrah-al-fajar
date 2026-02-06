-- ============================================================================
-- Reset 2026 data (remote)
-- ============================================================================

BEGIN;

WITH tz AS (
  SELECT id FROM public.tahun_zakat WHERE tahun_masehi = 2026
)
DELETE FROM public.pemasukan_uang
WHERE tahun_zakat_id IN (SELECT id FROM tz);

WITH tz AS (
  SELECT id FROM public.tahun_zakat WHERE tahun_masehi = 2026
)
DELETE FROM public.distribusi_zakat
WHERE tahun_zakat_id IN (SELECT id FROM tz);

WITH tz AS (
  SELECT id FROM public.tahun_zakat WHERE tahun_masehi = 2026
)
DELETE FROM public.pembayaran_zakat
WHERE tahun_zakat_id IN (SELECT id FROM tz);

DELETE FROM public.mustahik
WHERE created_at >= '2026-01-01'::timestamptz
  AND created_at < '2027-01-01'::timestamptz;

DELETE FROM public.muzakki
WHERE created_at >= '2026-01-01'::timestamptz
  AND created_at < '2027-01-01'::timestamptz;

COMMIT;
