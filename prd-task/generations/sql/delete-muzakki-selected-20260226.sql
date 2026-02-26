-- Delete specific muzakki rows requested on 2026-02-26
-- Safe pattern: exact match by (nama_kk, alamat, no_telp)

BEGIN;

WITH target(nama_kk, alamat, no_telp) AS (
  VALUES
    ('Ahmad Santoso (2023)', 'Jl. Masjid No. 10', '081234567801'),
    ('Ahmad Santoso (2024)', 'Jl. Masjid No. 10', '081234567801'),
    ('Budi Raharja (2023)', 'Jl. Melati No. 20', '081234567802'),
    ('Budi Raharja (2024)', 'Jl. Melati No. 20', '081234567802'),
    ('Budi Santoso', 'Jl. Raya Timur No. 45, RT 02/RW 03', '081234567891'),
    ('Citra Dewi (2023)', 'Jl. Anggrek No. 30', '081234567803'),
    ('Citra Dewi (2024)', 'Jl. Anggrek No. 30', '081234567803'),
    ('Dedi Kurniawan (2024)', 'Jl. Kenanga No. 40', '081234567804'),
    ('Derry Sulaiman', 'Hong Kong', '081234567890'),
    ('Dimy', 'Pamski', '08123244343'),
    ('Edi', 'Masjid Al Fajar', '-')
),
matched AS (
  SELECT m.id, m.nama_kk, m.alamat, m.no_telp
  FROM public.muzakki m
  JOIN target t
    ON btrim(m.nama_kk) = btrim(t.nama_kk)
   AND btrim(m.alamat) = btrim(t.alamat)
   AND btrim(coalesce(m.no_telp, '')) = btrim(t.no_telp)
)
SELECT 'MATCH_BEFORE_DELETE' AS info, count(*) AS total FROM matched;

WITH target(nama_kk, alamat, no_telp) AS (
  VALUES
    ('Ahmad Santoso (2023)', 'Jl. Masjid No. 10', '081234567801'),
    ('Ahmad Santoso (2024)', 'Jl. Masjid No. 10', '081234567801'),
    ('Budi Raharja (2023)', 'Jl. Melati No. 20', '081234567802'),
    ('Budi Raharja (2024)', 'Jl. Melati No. 20', '081234567802'),
    ('Budi Santoso', 'Jl. Raya Timur No. 45, RT 02/RW 03', '081234567891'),
    ('Citra Dewi (2023)', 'Jl. Anggrek No. 30', '081234567803'),
    ('Citra Dewi (2024)', 'Jl. Anggrek No. 30', '081234567803'),
    ('Dedi Kurniawan (2024)', 'Jl. Kenanga No. 40', '081234567804'),
    ('Derry Sulaiman', 'Hong Kong', '081234567890'),
    ('Dimy', 'Pamski', '08123244343'),
    ('Edi', 'Masjid Al Fajar', '-')
),
deleted AS (
  DELETE FROM public.muzakki m
  USING target t
  WHERE btrim(m.nama_kk) = btrim(t.nama_kk)
    AND btrim(m.alamat) = btrim(t.alamat)
    AND btrim(coalesce(m.no_telp, '')) = btrim(t.no_telp)
  RETURNING m.id, m.nama_kk, m.alamat, m.no_telp
)
SELECT 'DELETED' AS info, count(*) AS total FROM deleted;

WITH target(nama_kk, alamat, no_telp) AS (
  VALUES
    ('Ahmad Santoso (2023)', 'Jl. Masjid No. 10', '081234567801'),
    ('Ahmad Santoso (2024)', 'Jl. Masjid No. 10', '081234567801'),
    ('Budi Raharja (2023)', 'Jl. Melati No. 20', '081234567802'),
    ('Budi Raharja (2024)', 'Jl. Melati No. 20', '081234567802'),
    ('Budi Santoso', 'Jl. Raya Timur No. 45, RT 02/RW 03', '081234567891'),
    ('Citra Dewi (2023)', 'Jl. Anggrek No. 30', '081234567803'),
    ('Citra Dewi (2024)', 'Jl. Anggrek No. 30', '081234567803'),
    ('Dedi Kurniawan (2024)', 'Jl. Kenanga No. 40', '081234567804'),
    ('Derry Sulaiman', 'Hong Kong', '081234567890'),
    ('Dimy', 'Pamski', '08123244343'),
    ('Edi', 'Masjid Al Fajar', '-')
),
remaining AS (
  SELECT m.id
  FROM public.muzakki m
  JOIN target t
    ON btrim(m.nama_kk) = btrim(t.nama_kk)
   AND btrim(m.alamat) = btrim(t.alamat)
   AND btrim(coalesce(m.no_telp, '')) = btrim(t.no_telp)
)
SELECT 'MATCH_AFTER_DELETE' AS info, count(*) AS total FROM remaining;

COMMIT;

-- NOTE:
-- 1) pembayaran_zakat rows linked via muzakki_id will be deleted automatically (ON DELETE CASCADE).
-- 2) bukti_sedekah.donor_id and pemasukan_beras.muzakki_id are set to NULL automatically.
