-- Sample Data for Historical Years (2023 & 2024)
-- This will populate 1444 H (2023) and 1445 H (2024) with realistic data
-- Run this in Supabase SQL Editor to see proper year-over-year growth comparisons
-- CORRECTED VERSION - matches actual database schema

DO $$
DECLARE
  tahun_2023_id UUID;
  tahun_2024_id UUID;
  
  -- Sample Muzakki IDs
  muzakki_2023_1 UUID;
  muzakki_2023_2 UUID;
  muzakki_2023_3 UUID;
  
  muzakki_2024_1 UUID;
  muzakki_2024_2 UUID;
  muzakki_2024_3 UUID;
  muzakki_2024_4 UUID;
  
  -- Sample Mustahik IDs
  mustahik_2023_1 UUID;
  mustahik_2023_2 UUID;
  
  mustahik_2024_1 UUID;
  mustahik_2024_2 UUID;
  mustahik_2024_3 UUID;
  
  -- Kategori Mustahik IDs
  fakir_id UUID;
  miskin_id UUID;
BEGIN

  -- Get tahun zakat IDs
  SELECT id INTO tahun_2023_id FROM tahun_zakat WHERE tahun_masehi = 2023 LIMIT 1;
  SELECT id INTO tahun_2024_id FROM tahun_zakat WHERE tahun_masehi = 2024 LIMIT 1;
  
  -- Get kategori mustahik IDs
  SELECT id INTO fakir_id FROM kategori_mustahik WHERE nama = 'Fakir' LIMIT 1;
  SELECT id INTO miskin_id FROM kategori_mustahik WHERE nama = 'Miskin' LIMIT 1;

  RAISE NOTICE 'Tahun 2023 ID: %', tahun_2023_id;
  RAISE NOTICE 'Tahun 2024 ID: %', tahun_2024_id;

  -- ============================================
  -- 2023 DATA
  -- ============================================
  
  -- Muzakki 1 - 2023
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, created_at)
  VALUES (gen_random_uuid(), 'Ahmad Santoso (2023)', 'Jl. Masjid No. 10', '081234567801', '2023-03-15'::timestamp)
  RETURNING id INTO muzakki_2023_1;

  INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_at)
  VALUES (muzakki_2023_1, tahun_2023_id, '2023-04-05'::date, 3, 'beras', 7.5, '2023-04-05'::timestamp);

  -- Muzakki 2 - 2023
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, created_at)
  VALUES (gen_random_uuid(), 'Budi Raharja (2023)', 'Jl. Melati No. 20', '081234567802', '2023-03-16'::timestamp)
  RETURNING id INTO muzakki_2023_2;

  INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, created_at)
  VALUES (muzakki_2023_2, tahun_2023_id, '2023-04-06'::date, 4, 'uang', 200000, '2023-04-06'::timestamp);

  -- Muzakki 3 - 2023
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, created_at)
  VALUES (gen_random_uuid(), 'Citra Dewi (2023)', 'Jl. Anggrek No. 30', '081234567803', '2023-03-17'::timestamp)
  RETURNING id INTO muzakki_2023_3;

  INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_at)
  VALUES (muzakki_2023_3, tahun_2023_id, '2023-04-07'::date, 2, 'beras', 5.0, '2023-04-07'::timestamp);

  -- Mustahik 1 - 2023
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota, no_telp, catatan, is_active, created_at)
  VALUES (gen_random_uuid(), 'Pak Joko (2023)', 'Kampung Melayu RT 01', fakir_id, 4, '082345678801', 'Data 2023', true, '2023-03-20'::timestamp)
  RETURNING id INTO mustahik_2023_1;

  INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (mustahik_2023_1, tahun_2023_id, '2023-04-15'::date, 'beras', 5.0, 'selesai', 'Distribusi 2023', '2023-04-15'::timestamp);

  -- Mustahik 2 - 2023
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota, no_telp, catatan, is_active, created_at)
  VALUES (gen_random_uuid(), 'Bu Siti (2023)', 'Kampung Rambutan RT 02', miskin_id, 3, '082345678802', 'Data 2023', true, '2023-03-21'::timestamp)
  RETURNING id INTO mustahik_2023_2;

  INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (mustahik_2023_2, tahun_2023_id, '2023-04-16'::date, 'uang', 150000, 'selesai', 'Distribusi 2023', '2023-04-16'::timestamp);

  RAISE NOTICE '✅ 2023 Data Created: 3 Muzakki, 2 Mustahik';
  RAISE NOTICE '   - Pemasukan Beras: 12.5 kg';
  RAISE NOTICE '   - Pemasukan Uang: Rp 200,000';
  RAISE NOTICE '   - Distribusi Beras: 5.0 kg';
  RAISE NOTICE '   - Distribusi Uang: Rp 150,000';

  -- ============================================
  -- 2024 DATA
  -- ============================================
  
  -- Muzakki 1 - 2024
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, created_at)
  VALUES (gen_random_uuid(), 'Ahmad Santoso (2024)', 'Jl. Masjid No. 10', '081234567801', '2024-03-15'::timestamp)
  RETURNING id INTO muzakki_2024_1;

  INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_at)
  VALUES (muzakki_2024_1, tahun_2024_id, '2024-04-05'::date, 3, 'beras', 7.5, '2024-04-05'::timestamp);

  -- Muzakki 2 - 2024
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, created_at)
  VALUES (gen_random_uuid(), 'Budi Raharja (2024)', 'Jl. Melati No. 20', '081234567802', '2024-03-16'::timestamp)
  RETURNING id INTO muzakki_2024_2;

  INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, created_at)
  VALUES (muzakki_2024_2, tahun_2024_id, '2024-04-06'::date, 4, 'uang', 250000, '2024-04-06'::timestamp);

  -- Muzakki 3 - 2024
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, created_at)
  VALUES (gen_random_uuid(), 'Citra Dewi (2024)', 'Jl. Anggrek No. 30', '081234567803', '2024-03-17'::timestamp)
  RETURNING id INTO muzakki_2024_3;

  INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, created_at)
  VALUES (muzakki_2024_3, tahun_2024_id, '2024-04-07'::date, 2, 'beras', 5.0, '2024-04-07'::timestamp);

  -- Muzakki 4 - 2024 (NEW!)
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, created_at)
  VALUES (gen_random_uuid(), 'Dedi Kurniawan (2024)', 'Jl. Kenanga No. 40', '081234567804', '2024-03-18'::timestamp)
  RETURNING id INTO muzakki_2024_4;

  INSERT INTO pembayaran_zakat (muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_uang_rp, created_at)
  VALUES (muzakki_2024_4, tahun_2024_id, '2024-04-08'::date, 5, 'uang', 300000, '2024-04-08'::timestamp);

  -- Mustahik 1 - 2024
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota, no_telp, catatan, is_active, created_at)
  VALUES (gen_random_uuid(), 'Pak Joko (2024)', 'Kampung Melayu RT 01', fakir_id, 4, '082345678801', 'Data 2024', true, '2024-03-20'::timestamp)
  RETURNING id INTO mustahik_2024_1;

  INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (mustahik_2024_1, tahun_2024_id, '2024-04-15'::date, 'beras', 6.0, 'selesai', 'Distribusi 2024', '2024-04-15'::timestamp);

  -- Mustahik 2 - 2024
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota, no_telp, catatan, is_active, created_at)
  VALUES (gen_random_uuid(), 'Bu Siti (2024)', 'Kampung Rambutan RT 02', miskin_id, 3, '082345678802', 'Data 2024', true, '2024-03-21'::timestamp)
  RETURNING id INTO mustahik_2024_2;

  INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (mustahik_2024_2, tahun_2024_id, '2024-04-16'::date, 'uang', 200000, 'selesai', 'Distribusi 2024', '2024-04-16'::timestamp);

  -- Mustahik 3 - 2024 (NEW!)
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota, no_telp, catatan, is_active, created_at)
  VALUES (gen_random_uuid(), 'Pak Budi (2024)', 'Kampung Jawa RT 03', fakir_id, 5, '082345678803', 'Mustahik baru 2024', true, '2024-03-22'::timestamp)
  RETURNING id INTO mustahik_2024_3;

  INSERT INTO distribusi_zakat (mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (mustahik_2024_3, tahun_2024_id, '2024-04-17'::date, 'beras', 4.0, 'selesai', 'Distribusi 2024', '2024-04-17'::timestamp);

  RAISE NOTICE '✅ 2024 Data Created: 4 Muzakki, 3 Mustahik';
  RAISE NOTICE '   - Pemasukan Beras: 12.5 kg';
  RAISE NOTICE '   - Pemasukan Uang: Rp 550,000';
  RAISE NOTICE '   - Distribusi Beras: 10.0 kg';
  RAISE NOTICE '   - Distribusi Uang: Rp 200,000';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '📊 PERBANDINGAN DATA CREATED';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '2023 (1444 H):';
  RAISE NOTICE '  - Muzakki: 3 KK';
  RAISE NOTICE '  - Mustahik: 2 KK';
  RAISE NOTICE '  - Pemasukan Beras: 12.5 kg';
  RAISE NOTICE '  - Pemasukan Uang: Rp 200,000';
  RAISE NOTICE '  - Distribusi Beras: 5.0 kg';
  RAISE NOTICE '  - Distribusi Uang: Rp 150,000';
  RAISE NOTICE '';
  RAISE NOTICE '2024 (1445 H):';
  RAISE NOTICE '  - Muzakki: 4 KK (+33%%)';
  RAISE NOTICE '  - Mustahik: 3 KK (+50%%)';
  RAISE NOTICE '  - Pemasukan Beras: 12.5 kg (0%%)';
  RAISE NOTICE '  - Pemasukan Uang: Rp 550,000 (+175%%)';
  RAISE NOTICE '  - Distribusi Beras: 10.0 kg (+100%%)';
  RAISE NOTICE '  - Distribusi Uang: Rp 200,000 (+33%%)';
  RAISE NOTICE '';
  RAISE NOTICE '2025 (1446 H): [Your existing data]';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Now test Perbandingan Tahun to see real growth!';
  RAISE NOTICE '═══════════════════════════════════════════';

END $$;

  INSERT INTO pembayaran_zakat (id, muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, jumlah_uang_rp, created_at)
  VALUES (
    gen_random_uuid(), 
    muzakki_2023_1, 
    tahun_2023_id, 
    '2023-04-05'::date, 
    3, 
    'beras', 
    7.5, 
    NULL,
    '2023-04-05'::timestamp
  );

  -- Muzakki 2 - 2023
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, catatan, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Budi Raharja (2023)', 'Jl. Melati No. 20', '081234567802', 'Data tahun 2023', tahun_2023_id, '2023-03-16'::timestamp)
  RETURNING id INTO muzakki_2023_2;

  INSERT INTO pembayaran_zakat (id, muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, jumlah_uang_rp, created_at)
  VALUES (
    gen_random_uuid(), 
    muzakki_2023_2, 
    tahun_2023_id, 
    '2023-04-06'::date, 
    4, 
    'uang', 
    NULL,
    200000,
    '2023-04-06'::timestamp
  );

  -- Muzakki 3 - 2023
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, catatan, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Citra Dewi (2023)', 'Jl. Anggrek No. 30', '081234567803', 'Data tahun 2023', tahun_2023_id, '2023-03-17'::timestamp)
  RETURNING id INTO muzakki_2023_3;

  INSERT INTO pembayaran_zakat (id, muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, jumlah_uang_rp, created_at)
  VALUES (
    gen_random_uuid(), 
    muzakki_2023_3, 
    tahun_2023_id, 
    '2023-04-07'::date, 
    2, 
    'beras', 
    5.0,
    NULL,
    '2023-04-07'::timestamp
  );

  -- ============================================
  -- STEP 3: Create Mustahik for 2023
  -- ============================================
  
  -- Mustahik 1 - 2023
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota_keluarga, no_telp, catatan, status, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Pak Joko (2023)', 'Kampung Melayu RT 01', fakir_id, 4, '082345678801', 'Data 2023', 'aktif', tahun_2023_id, '2023-03-20'::timestamp)
  RETURNING id INTO mustahik_2023_1;

  -- Distribusi for Mustahik 1 - 2023
  INSERT INTO distribusi_zakat (id, mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (
    gen_random_uuid(),
    mustahik_2023_1,
    tahun_2023_id,
    '2023-04-15'::date,
    'beras',
    5.0,
    'selesai',
    'Distribusi 2023',
    '2023-04-15'::timestamp
  );

  -- Mustahik 2 - 2023
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota_keluarga, no_telp, catatan, status, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Bu Siti (2023)', 'Kampung Rambutan RT 02', miskin_id, 3, '082345678802', 'Data 2023', 'aktif', tahun_2023_id, '2023-03-21'::timestamp)
  RETURNING id INTO mustahik_2023_2;

  -- Distribusi for Mustahik 2 - 2023
  INSERT INTO distribusi_zakat (id, mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (
    gen_random_uuid(),
    mustahik_2023_2,
    tahun_2023_id,
    '2023-04-16'::date,
    'uang',
    150000,
    'selesai',
    'Distribusi 2023',
    '2023-04-16'::timestamp
  );

  RAISE NOTICE '✅ 2023 Data Created: 3 Muzakki, 2 Mustahik';
  RAISE NOTICE '   - Pemasukan Beras: 12.5 kg';
  RAISE NOTICE '   - Pemasukan Uang: Rp 200,000';
  RAISE NOTICE '   - Distribusi Beras: 5.0 kg';
  RAISE NOTICE '   - Distribusi Uang: Rp 150,000';

  -- ============================================
  -- STEP 4: Create Muzakki for 2024
  -- ============================================
  
  -- Muzakki 1 - 2024
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, catatan, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Ahmad Santoso (2024)', 'Jl. Masjid No. 10', '081234567801', 'Data tahun 2024', tahun_2024_id, '2024-03-15'::timestamp)
  RETURNING id INTO muzakki_2024_1;

  INSERT INTO pembayaran_zakat (id, muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, jumlah_uang_rp, created_at)
  VALUES (
    gen_random_uuid(), 
    muzakki_2024_1, 
    tahun_2024_id, 
    '2024-04-05'::date, 
    3, 
    'beras', 
    7.5, 
    NULL,
    '2024-04-05'::timestamp
  );

  -- Muzakki 2 - 2024
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, catatan, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Budi Raharja (2024)', 'Jl. Melati No. 20', '081234567802', 'Data tahun 2024', tahun_2024_id, '2024-03-16'::timestamp)
  RETURNING id INTO muzakki_2024_2;

  INSERT INTO pembayaran_zakat (id, muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, jumlah_uang_rp, created_at)
  VALUES (
    gen_random_uuid(), 
    muzakki_2024_2, 
    tahun_2024_id, 
    '2024-04-06'::date, 
    4, 
    'uang', 
    NULL,
    250000,
    '2024-04-06'::timestamp
  );

  -- Muzakki 3 - 2024
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, catatan, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Citra Dewi (2024)', 'Jl. Anggrek No. 30', '081234567803', 'Data tahun 2024', tahun_2024_id, '2024-03-17'::timestamp)
  RETURNING id INTO muzakki_2024_3;

  INSERT INTO pembayaran_zakat (id, muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, jumlah_uang_rp, created_at)
  VALUES (
    gen_random_uuid(), 
    muzakki_2024_3, 
    tahun_2024_id, 
    '2024-04-07'::date, 
    2, 
    'beras', 
    5.0,
    NULL,
    '2024-04-07'::timestamp
  );

  -- Muzakki 4 - 2024 (NEW!)
  INSERT INTO muzakki (id, nama_kk, alamat, no_telp, catatan, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Dedi Kurniawan (2024)', 'Jl. Kenanga No. 40', '081234567804', 'Muzakki baru 2024', tahun_2024_id, '2024-03-18'::timestamp)
  RETURNING id INTO muzakki_2024_4;

  INSERT INTO pembayaran_zakat (id, muzakki_id, tahun_zakat_id, tanggal_bayar, jumlah_jiwa, jenis_zakat, jumlah_beras_kg, jumlah_uang_rp, created_at)
  VALUES (
    gen_random_uuid(), 
    muzakki_2024_4, 
    tahun_2024_id, 
    '2024-04-08'::date, 
    5, 
    'uang', 
    NULL,
    300000,
    '2024-04-08'::timestamp
  );

  -- ============================================
  -- STEP 5: Create Mustahik for 2024
  -- ============================================
  
  -- Mustahik 1 - 2024
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota_keluarga, no_telp, catatan, status, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Pak Joko (2024)', 'Kampung Melayu RT 01', fakir_id, 4, '082345678801', 'Data 2024', 'aktif', tahun_2024_id, '2024-03-20'::timestamp)
  RETURNING id INTO mustahik_2024_1;

  INSERT INTO distribusi_zakat (id, mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (
    gen_random_uuid(),
    mustahik_2024_1,
    tahun_2024_id,
    '2024-04-15'::date,
    'beras',
    6.0,
    'selesai',
    'Distribusi 2024',
    '2024-04-15'::timestamp
  );

  -- Mustahik 2 - 2024
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota_keluarga, no_telp, catatan, status, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Bu Siti (2024)', 'Kampung Rambutan RT 02', miskin_id, 3, '082345678802', 'Data 2024', 'aktif', tahun_2024_id, '2024-03-21'::timestamp)
  RETURNING id INTO mustahik_2024_2;

  INSERT INTO distribusi_zakat (id, mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (
    gen_random_uuid(),
    mustahik_2024_2,
    tahun_2024_id,
    '2024-04-16'::date,
    'uang',
    200000,
    'selesai',
    'Distribusi 2024',
    '2024-04-16'::timestamp
  );

  -- Mustahik 3 - 2024 (NEW!)
  INSERT INTO mustahik (id, nama, alamat, kategori_id, jumlah_anggota_keluarga, no_telp, catatan, status, tahun_zakat_id, created_at)
  VALUES (gen_random_uuid(), 'Pak Budi (2024)', 'Kampung Jawa RT 03', fakir_id, 5, '082345678803', 'Mustahik baru 2024', 'aktif', tahun_2024_id, '2024-03-22'::timestamp)
  RETURNING id INTO mustahik_2024_3;

  INSERT INTO distribusi_zakat (id, mustahik_id, tahun_zakat_id, tanggal_distribusi, jenis_distribusi, jumlah, status, catatan, created_at)
  VALUES (
    gen_random_uuid(),
    mustahik_2024_3,
    tahun_2024_id,
    '2024-04-17'::date,
    'beras',
    4.0,
    'selesai',
    'Distribusi 2024',
    '2024-04-17'::timestamp
  );

  RAISE NOTICE '✅ 2024 Data Created: 4 Muzakki, 3 Mustahik';
  RAISE NOTICE '   - Pemasukan Beras: 12.5 kg';
  RAISE NOTICE '   - Pemasukan Uang: Rp 550,000';
  RAISE NOTICE '   - Distribusi Beras: 10.0 kg';
  RAISE NOTICE '   - Distribusi Uang: Rp 200,000';

  -- ============================================
  -- SUMMARY
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '📊 PERBANDINGAN DATA CREATED';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '2023 (1444 H):';
  RAISE NOTICE '  - Muzakki: 3 KK';
  RAISE NOTICE '  - Mustahik: 2 KK';
  RAISE NOTICE '  - Pemasukan Beras: 12.5 kg';
  RAISE NOTICE '  - Pemasukan Uang: Rp 200,000';
  RAISE NOTICE '  - Distribusi Beras: 5.0 kg';
  RAISE NOTICE '  - Distribusi Uang: Rp 150,000';
  RAISE NOTICE '';
  RAISE NOTICE '2024 (1445 H):';
  RAISE NOTICE '  - Muzakki: 4 KK (+33%%)';
  RAISE NOTICE '  - Mustahik: 3 KK (+50%%)';
  RAISE NOTICE '  - Pemasukan Beras: 12.5 kg (0%%)';
  RAISE NOTICE '  - Pemasukan Uang: Rp 550,000 (+175%%)';
  RAISE NOTICE '  - Distribusi Beras: 10.0 kg (+100%%)';
  RAISE NOTICE '  - Distribusi Uang: Rp 200,000 (+33%%)';
  RAISE NOTICE '';
  RAISE NOTICE '2025 (1446 H): [Your existing data]';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Now test Perbandingan Tahun to see real growth!';
  RAISE NOTICE '═══════════════════════════════════════════';

END $$;
