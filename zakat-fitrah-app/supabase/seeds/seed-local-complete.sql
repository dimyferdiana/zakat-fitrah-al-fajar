-- ============================================================
-- Complete Local Development Seed Data
-- Run: docker exec -i supabase_db_zakat-fitrah-app psql -U postgres -d postgres < supabase/seeds/seed-local-complete.sql
-- ============================================================

DO $$
DECLARE
  admin_user_id     UUID := 'd3aed7a9-6fcc-4d72-9abe-0ddafe2ff398';

  tahun_2023_id UUID;
  tahun_2024_id UUID;
  tahun_2025_id UUID;

  fakir_id   UUID;
  miskin_id  UUID;
  amil_id    UUID;
  mualaf_id  UUID;
  riqab_id   UUID;
  gharim_id  UUID;
  fisabil_id UUID;
  ibnu_id    UUID;

  -- Muzakki
  mz1 UUID; mz2 UUID; mz3 UUID; mz4 UUID; mz5 UUID;
  mz6 UUID; mz7 UUID; mz8 UUID; mz9 UUID; mz10 UUID;

  -- Mustahik
  ms1 UUID; ms2 UUID; ms3 UUID; ms4 UUID; ms5 UUID;
  ms6 UUID; ms7 UUID;
BEGIN

  -- ============================================================
  -- 1. KATEGORI MUSTAHIK (8 Asnaf)
  -- ============================================================
  INSERT INTO kategori_mustahik (nama, deskripsi) VALUES
    ('Fakir',        'Orang yang tidak memiliki harta dan pekerjaan')
  ON CONFLICT (nama) DO NOTHING
  RETURNING id INTO fakir_id;
  IF fakir_id IS NULL THEN SELECT id INTO fakir_id FROM kategori_mustahik WHERE nama = 'Fakir'; END IF;

  INSERT INTO kategori_mustahik (nama, deskripsi) VALUES
    ('Miskin',       'Orang yang memiliki pekerjaan namun penghasilan tidak mencukupi')
  ON CONFLICT (nama) DO NOTHING
  RETURNING id INTO miskin_id;
  IF miskin_id IS NULL THEN SELECT id INTO miskin_id FROM kategori_mustahik WHERE nama = 'Miskin'; END IF;

  INSERT INTO kategori_mustahik (nama, deskripsi) VALUES
    ('Amil',         'Pengurus zakat')
  ON CONFLICT (nama) DO NOTHING
  RETURNING id INTO amil_id;
  IF amil_id IS NULL THEN SELECT id INTO amil_id FROM kategori_mustahik WHERE nama = 'Amil'; END IF;

  INSERT INTO kategori_mustahik (nama, deskripsi) VALUES
    ('Mualaf',       'Orang yang baru masuk Islam')
  ON CONFLICT (nama) DO NOTHING
  RETURNING id INTO mualaf_id;
  IF mualaf_id IS NULL THEN SELECT id INTO mualaf_id FROM kategori_mustahik WHERE nama = 'Mualaf'; END IF;

  INSERT INTO kategori_mustahik (nama, deskripsi) VALUES
    ('Riqab',        'Memerdekakan budak')
  ON CONFLICT (nama) DO NOTHING
  RETURNING id INTO riqab_id;
  IF riqab_id IS NULL THEN SELECT id INTO riqab_id FROM kategori_mustahik WHERE nama = 'Riqab'; END IF;

  INSERT INTO kategori_mustahik (nama, deskripsi) VALUES
    ('Gharim',       'Orang yang memiliki utang')
  ON CONFLICT (nama) DO NOTHING
  RETURNING id INTO gharim_id;
  IF gharim_id IS NULL THEN SELECT id INTO gharim_id FROM kategori_mustahik WHERE nama = 'Gharim'; END IF;

  INSERT INTO kategori_mustahik (nama, deskripsi) VALUES
    ('Fisabilillah', 'Orang yang berjuang di jalan Allah')
  ON CONFLICT (nama) DO NOTHING
  RETURNING id INTO fisabil_id;
  IF fisabil_id IS NULL THEN SELECT id INTO fisabil_id FROM kategori_mustahik WHERE nama = 'Fisabilillah'; END IF;

  INSERT INTO kategori_mustahik (nama, deskripsi) VALUES
    ('Ibnu Sabil',   'Musafir yang kehabisan bekal')
  ON CONFLICT (nama) DO NOTHING
  RETURNING id INTO ibnu_id;
  IF ibnu_id IS NULL THEN SELECT id INTO ibnu_id FROM kategori_mustahik WHERE nama = 'Ibnu Sabil'; END IF;

  RAISE NOTICE 'Kategori seeded: Fakir=%, Miskin=%', fakir_id, miskin_id;

  -- ============================================================
  -- 2. GET TAHUN ZAKAT IDs
  -- ============================================================
  SELECT id INTO tahun_2023_id FROM tahun_zakat WHERE tahun_masehi = 2023 LIMIT 1;
  SELECT id INTO tahun_2024_id FROM tahun_zakat WHERE tahun_masehi = 2024 LIMIT 1;
  SELECT id INTO tahun_2025_id FROM tahun_zakat WHERE tahun_masehi = 2025 LIMIT 1;

  RAISE NOTICE 'Tahun: 2023=%, 2024=%, 2025=%', tahun_2023_id, tahun_2024_id, tahun_2025_id;

  -- ============================================================
  -- 3. MUZAKKI (Donors) - 10 families across years
  -- ============================================================

  -- 2023 donors
  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Ahmad Santoso', 'Jl. Masjid No. 10, RT 01/03', '081234560001')
  RETURNING id INTO mz1;

  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Budi Raharja', 'Jl. Melati No. 20, RT 02/04', '081234560002')
  RETURNING id INTO mz2;

  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Dewi Kurniawati', 'Jl. Anggrek No. 5, RT 03/02', '081234560003')
  RETURNING id INTO mz3;

  -- 2024 donors (new households)
  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Eko Prasetyo', 'Jl. Kenanga No. 15, RT 04/01', '081234560004')
  RETURNING id INTO mz4;

  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Fajar Nugroho', 'Jl. Palm No. 8, RT 01/05', '081234560005')
  RETURNING id INTO mz5;

  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Gita Permatasari', 'Jl. Dahlia No. 33, RT 02/06', '081234560006')
  RETURNING id INTO mz6;

  -- 2025 donors
  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Hendra Wijaya', 'Jl. Flamboyan No. 12, RT 05/02', '081234560007')
  RETURNING id INTO mz7;

  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Indah Lestari', 'Jl. Bougenville No. 9, RT 06/03', '081234560008')
  RETURNING id INTO mz8;

  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Joko Santoso', 'Jl. Cempaka No. 4, RT 03/04', '081234560009')
  RETURNING id INTO mz9;

  INSERT INTO muzakki (nama_kk, alamat, no_telp)
  VALUES ('Kartini Rahayu', 'Jl. Kamboja No. 17, RT 07/01', '081234560010')
  RETURNING id INTO mz10;

  RAISE NOTICE 'Muzakki seeded: 10 KK';

  -- ============================================================
  -- 4. MUSTAHIK (Recipients)
  -- ============================================================

  INSERT INTO mustahik (nama, alamat, kategori_id, jumlah_anggota, no_telp, is_active)
  VALUES ('Pak Suparman', 'Jl. Gang Sempit No. 2, RT 08/05', fakir_id, 4, '081234570001', true)
  RETURNING id INTO ms1;

  INSERT INTO mustahik (nama, alamat, kategori_id, jumlah_anggota, no_telp, is_active)
  VALUES ('Ibu Mariyem', 'Jl. Belakang Masjid No. 1, RT 09/02', fakir_id, 3, '081234570002', true)
  RETURNING id INTO ms2;

  INSERT INTO mustahik (nama, alamat, kategori_id, jumlah_anggota, no_telp, is_active)
  VALUES ('Pak Slamet', 'Jl. Gubuk No. 5, RT 10/04', miskin_id, 5, '081234570003', true)
  RETURNING id INTO ms3;

  INSERT INTO mustahik (nama, alamat, kategori_id, jumlah_anggota, no_telp, is_active)
  VALUES ('Ibu Sulastri', 'Jl. Kampung Melayu No. 3, RT 11/01', miskin_id, 2, '081234570004', true)
  RETURNING id INTO ms4;

  INSERT INTO mustahik (nama, alamat, kategori_id, jumlah_anggota, no_telp, is_active)
  VALUES ('Pak Rohmat', 'Jl. Pondok No. 7, RT 12/03', gharim_id, 6, '081234570005', true)
  RETURNING id INTO ms5;

  INSERT INTO mustahik (nama, alamat, kategori_id, jumlah_anggota, no_telp, is_active)
  VALUES ('Ibu Srinah', 'Jl. Tegalan No. 11, RT 13/06', miskin_id, 3, '081234570006', true)
  RETURNING id INTO ms6;

  INSERT INTO mustahik (nama, alamat, kategori_id, jumlah_anggota, no_telp, is_active)
  VALUES ('Pak Gunawan', 'Jl. Tanah Kosong No. 6, RT 14/02', fakir_id, 7, '081234570007', true)
  RETURNING id INTO ms7;

  RAISE NOTICE 'Mustahik seeded: 7 orang';

  -- ============================================================
  -- 5. PEMBAYARAN ZAKAT
  -- ============================================================

  -- === 2023 DATA ===
  IF tahun_2023_id IS NOT NULL THEN
    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by, created_at)
    VALUES (mz1, tahun_2023_id, '2023-04-05', 3, 'beras', 7.50, admin_user_id, '2023-04-05 08:00:00+00');

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, akun_uang, created_by, created_at)
    VALUES (mz2, tahun_2023_id, '2023-04-06', 2, 'uang', 76000, 'kas', admin_user_id, '2023-04-06 09:00:00+00');

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by, created_at)
    VALUES (mz3, tahun_2023_id, '2023-04-07', 4, 'beras', 10.00, admin_user_id, '2023-04-07 10:00:00+00');
  END IF;

  -- === 2024 DATA ===
  IF tahun_2024_id IS NOT NULL THEN
    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by, created_at)
    VALUES (mz1, tahun_2024_id, '2024-04-01', 3, 'beras', 7.50, admin_user_id, '2024-04-01 08:00:00+00');

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, akun_uang, created_by, created_at)
    VALUES (mz2, tahun_2024_id, '2024-04-02', 2, 'uang', 80000, 'kas', admin_user_id, '2024-04-02 09:00:00+00');

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by, created_at)
    VALUES (mz3, tahun_2024_id, '2024-04-02', 4, 'beras', 10.00, admin_user_id, '2024-04-02 10:00:00+00');

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, akun_uang, created_by, created_at)
    VALUES (mz4, tahun_2024_id, '2024-04-03', 5, 'uang', 200000, 'bank', admin_user_id, '2024-04-03 11:00:00+00');

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by, created_at)
    VALUES (mz5, tahun_2024_id, '2024-04-04', 3, 'beras', 7.50, admin_user_id, '2024-04-04 08:30:00+00');

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, akun_uang, created_by, created_at)
    VALUES (mz6, tahun_2024_id, '2024-04-04', 6, 'uang', 240000, 'kas', admin_user_id, '2024-04-04 09:30:00+00');
  END IF;

  -- === 2025 DATA ===
  IF tahun_2025_id IS NOT NULL THEN
    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by)
    VALUES (mz1, tahun_2025_id, '2025-03-28', 3, 'beras', 7.50, admin_user_id);

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, akun_uang, created_by)
    VALUES (mz2, tahun_2025_id, '2025-03-28', 2, 'uang', 90000, 'kas', admin_user_id);

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by)
    VALUES (mz3, tahun_2025_id, '2025-03-29', 4, 'beras', 10.00, admin_user_id);

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, akun_uang, created_by)
    VALUES (mz4, tahun_2025_id, '2025-03-29', 5, 'uang', 225000, 'bank', admin_user_id);

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by)
    VALUES (mz5, tahun_2025_id, '2025-03-30', 3, 'beras', 7.50, admin_user_id);

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, akun_uang, created_by)
    VALUES (mz6, tahun_2025_id, '2025-03-30', 6, 'uang', 270000, 'kas', admin_user_id);

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by)
    VALUES (mz7, tahun_2025_id, '2025-03-31', 4, 'beras', 10.00, admin_user_id);

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, akun_uang, created_by)
    VALUES (mz8, tahun_2025_id, '2025-03-31', 2, 'uang', 90000, 'bank', admin_user_id);

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_by)
    VALUES (mz9, tahun_2025_id, '2025-04-01', 5, 'beras', 12.50, admin_user_id);

    INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, akun_uang, created_by)
    VALUES (mz10, tahun_2025_id, '2025-04-01', 3, 'uang', 135000, 'kas', admin_user_id);
  END IF;

  RAISE NOTICE 'Pembayaran zakat seeded';

  -- ============================================================
  -- 6. DISTRIBUSI ZAKAT
  -- ============================================================

  -- === 2023 DISTRIBUSI ===
  IF tahun_2023_id IS NOT NULL THEN
    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_beras_kg, tanggal_distribusi, status, created_by, created_at)
    VALUES (ms1, tahun_2023_id, 'beras', 5.00, '2023-04-10', 'selesai', admin_user_id, '2023-04-10 14:00:00+00');

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_uang_rp, tanggal_distribusi, status, created_by, created_at)
    VALUES (ms2, tahun_2023_id, 'uang', 150000, '2023-04-10', 'selesai', admin_user_id, '2023-04-10 14:30:00+00');
  END IF;

  -- === 2024 DISTRIBUSI ===
  IF tahun_2024_id IS NOT NULL THEN
    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_beras_kg, tanggal_distribusi, status, created_by, created_at)
    VALUES (ms1, tahun_2024_id, 'beras', 5.00, '2024-04-08', 'selesai', admin_user_id, '2024-04-08 14:00:00+00');

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_uang_rp, tanggal_distribusi, status, created_by, created_at)
    VALUES (ms2, tahun_2024_id, 'uang', 160000, '2024-04-08', 'selesai', admin_user_id, '2024-04-08 14:30:00+00');

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_beras_kg, tanggal_distribusi, status, created_by, created_at)
    VALUES (ms3, tahun_2024_id, 'beras', 7.50, '2024-04-09', 'selesai', admin_user_id, '2024-04-09 09:00:00+00');

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_uang_rp, tanggal_distribusi, status, created_by, created_at)
    VALUES (ms4, tahun_2024_id, 'uang', 120000, '2024-04-09', 'selesai', admin_user_id, '2024-04-09 10:00:00+00');
  END IF;

  -- === 2025 DISTRIBUSI ===
  IF tahun_2025_id IS NOT NULL THEN
    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_beras_kg, tanggal_distribusi, status, created_by)
    VALUES (ms1, tahun_2025_id, 'beras', 5.00, '2025-04-05', 'selesai', admin_user_id);

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_uang_rp, tanggal_distribusi, status, created_by)
    VALUES (ms2, tahun_2025_id, 'uang', 180000, '2025-04-05', 'selesai', admin_user_id);

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_beras_kg, tanggal_distribusi, status, created_by)
    VALUES (ms3, tahun_2025_id, 'beras', 7.50, '2025-04-06', 'selesai', admin_user_id);

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_uang_rp, tanggal_distribusi, status, created_by)
    VALUES (ms4, tahun_2025_id, 'uang', 135000, '2025-04-06', 'selesai', admin_user_id);

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_beras_kg, tanggal_distribusi, status, created_by)
    VALUES (ms5, tahun_2025_id, 'beras', 10.00, '2025-04-07', 'pending', admin_user_id);

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_uang_rp, tanggal_distribusi, status, created_by)
    VALUES (ms6, tahun_2025_id, 'uang', 90000, '2025-04-07', 'pending', admin_user_id);

    INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, jenis_distribusi, jumlah_beras_kg, tanggal_distribusi, status, created_by)
    VALUES (ms7, tahun_2025_id, 'beras', 12.50, '2025-04-08', 'pending', admin_user_id);
  END IF;

  RAISE NOTICE 'Distribusi zakat seeded';
  RAISE NOTICE '=== SEED COMPLETE ===';
  RAISE NOTICE 'Login: seed-admin@example.com / password123';

END $$;

-- Verify seeded data
SELECT 'kategori_mustahik' AS tabel, COUNT(*)::text AS jumlah FROM kategori_mustahik
UNION ALL SELECT 'muzakki',            COUNT(*)::text FROM muzakki
UNION ALL SELECT 'mustahik',           COUNT(*)::text FROM mustahik
UNION ALL SELECT 'pembayaran_zakat',   COUNT(*)::text FROM pembayaran_zakat
UNION ALL SELECT 'distribusi_zakat',   COUNT(*)::text FROM distribusi_zakat
UNION ALL SELECT 'tahun_zakat',        COUNT(*)::text FROM tahun_zakat
ORDER BY tabel;
