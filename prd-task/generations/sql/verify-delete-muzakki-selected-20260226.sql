-- Verification checks after delete-muzakki-selected-20260226.sql
-- Run this in Supabase SQL Editor

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
)
SELECT
  'target_muzakki_remaining' AS check_name,
  COUNT(*)::bigint AS total
FROM public.muzakki m
JOIN target t
  ON btrim(m.nama_kk) = btrim(t.nama_kk)
 AND btrim(m.alamat) = btrim(t.alamat)
 AND btrim(coalesce(m.no_telp, '')) = btrim(t.no_telp)

UNION ALL

SELECT
  'orphan_pembayaran_zakat_muzakki_id' AS check_name,
  COUNT(*)::bigint AS total
FROM public.pembayaran_zakat p
LEFT JOIN public.muzakki m ON m.id = p.muzakki_id
WHERE p.muzakki_id IS NOT NULL
  AND m.id IS NULL

UNION ALL

SELECT
  'bukti_sedekah_invalid_donor_id' AS check_name,
  COUNT(*)::bigint AS total
FROM public.bukti_sedekah b
LEFT JOIN public.muzakki m ON m.id = b.donor_id
WHERE b.donor_id IS NOT NULL
  AND m.id IS NULL

UNION ALL

SELECT
  'pemasukan_beras_invalid_muzakki_id' AS check_name,
  COUNT(*)::bigint AS total
FROM public.pemasukan_beras pb
LEFT JOIN public.muzakki m ON m.id = pb.muzakki_id
WHERE pb.muzakki_id IS NOT NULL
  AND m.id IS NULL
ORDER BY check_name;

-- Optional detail query: show any leftover target rows (should return 0 rows)
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
)
SELECT m.id, m.nama_kk, m.alamat, m.no_telp, m.created_at
FROM public.muzakki m
JOIN target t
  ON btrim(m.nama_kk) = btrim(t.nama_kk)
 AND btrim(m.alamat) = btrim(t.alamat)
 AND btrim(coalesce(m.no_telp, '')) = btrim(t.no_telp)
ORDER BY m.nama_kk;