-- QA Test Data Setup Script for Phase 2
-- Run this in Supabase SQL Editor or via psql

-- =====================================================
-- This block is idempotent. It creates auth + identity + public.users rows
-- for petugas and viewer if they don't exist, and ensures roles are set.

DO $$
DECLARE
  v_petugas_id uuid;
  v_viewer_id uuid;
BEGIN
  -- Petugas user
  SELECT id INTO v_petugas_id FROM auth.users WHERE email = 'petugas-test@example.com' LIMIT 1;
  IF v_petugas_id IS NULL THEN
    v_petugas_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_petugas_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'petugas-test@example.com',
      crypt('password123', gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('nama', 'Petugas QA'),
      now(), now()
    );

    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
    VALUES (
      'petugas-test@example.com',
      v_petugas_id,
      jsonb_build_object('sub', v_petugas_id::text, 'email', 'petugas-test@example.com', 'email_verified', true),
      'email',
      now(), now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;
  END IF;

  INSERT INTO public.users (id, email, nama_lengkap, role, created_at)
  VALUES (v_petugas_id, 'petugas-test@example.com', 'Petugas QA', 'petugas', now())
  ON CONFLICT (id) DO UPDATE SET role = 'petugas', nama_lengkap = 'Petugas QA';

  -- Viewer user
  SELECT id INTO v_viewer_id FROM auth.users WHERE email = 'viewer-test@example.com' LIMIT 1;
  IF v_viewer_id IS NULL THEN
    v_viewer_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      v_viewer_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer-test@example.com',
      crypt('password123', gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('nama', 'Viewer QA'),
      now(), now()
    );

    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
    VALUES (
      'viewer-test@example.com',
      v_viewer_id,
      jsonb_build_object('sub', v_viewer_id::text, 'email', 'viewer-test@example.com', 'email_verified', true),
      'email',
      now(), now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;
  END IF;

  INSERT INTO public.users (id, email, nama_lengkap, role, created_at)
  VALUES (v_viewer_id, 'viewer-test@example.com', 'Viewer QA', 'viewer', now())
  ON CONFLICT (id) DO UPDATE SET role = 'viewer', nama_lengkap = 'Viewer QA';
END $$;

-- =====================================================
-- 2. ADD TEST DATA FOR DASHBOARD CALCULATIONS
-- =====================================================

-- Get active tahun_zakat_id
DO $$
DECLARE
  v_tahun_id uuid;
  v_admin_id uuid;
  v_muzakki_id uuid;
  v_mustahik_id uuid;
BEGIN
  -- Get active tahun
  SELECT id INTO v_tahun_id 
  FROM tahun_zakat 
  WHERE is_active = true 
  LIMIT 1;

  IF v_tahun_id IS NULL THEN
    RAISE EXCEPTION 'Tidak ada tahun_zakat aktif. Aktifkan satu tahun terlebih dahulu.';
  END IF;
  
  -- Get admin user
  SELECT id INTO v_admin_id 
  FROM users 
  WHERE role = 'admin' 
  LIMIT 1;
  
  -- Get or create test muzakki
  SELECT id INTO v_muzakki_id 
  FROM muzakki 
  WHERE nama_kk = 'Test Muzakki QA'
  LIMIT 1;
  
  IF v_muzakki_id IS NULL THEN
    INSERT INTO muzakki (nama_kk, alamat)
    VALUES ('Test Muzakki QA', 'Jl. Test No. 123')
    RETURNING id INTO v_muzakki_id;
  END IF;
  
  -- Get or create test mustahik
  SELECT m.id INTO v_mustahik_id 
  FROM mustahik m
  JOIN kategori_mustahik k ON m.kategori_id = k.id
  WHERE m.nama = 'Test Mustahik QA'
  LIMIT 1;
  
  IF v_mustahik_id IS NULL THEN
    INSERT INTO mustahik (nama, alamat, kategori_id, jumlah_anggota, is_active)
    SELECT 'Test Mustahik QA', 'Jl. Test No. 456', id, 4, true
    FROM kategori_mustahik
    WHERE nama = 'Fakir'
    LIMIT 1
    RETURNING id INTO v_mustahik_id;
  END IF;
  
  -- Add test pemasukan_uang records
  -- Clean previous QA inserts for determinism
  DELETE FROM pemasukan_uang WHERE tahun_zakat_id = v_tahun_id;

  INSERT INTO pemasukan_uang (
    tahun_zakat_id,
    muzakki_id,
    kategori,
    akun,
    jumlah_uang_rp,
    tanggal,
    catatan,
    created_by
  ) VALUES
    (v_tahun_id, v_muzakki_id, 'fidyah_uang', 'kas', 100000, CURRENT_DATE, 'QA Seed Fidyah Kas', v_admin_id),
    (v_tahun_id, v_muzakki_id, 'fidyah_uang', 'bank', 60000, CURRENT_DATE, 'QA Seed Fidyah Bank', v_admin_id),
    (v_tahun_id, NULL, 'infak_sedekah_uang', 'kas', 310000, CURRENT_DATE, 'QA Seed Infak Kas', v_admin_id),
    (v_tahun_id, NULL, 'maal_penghasilan_uang', 'bank', 400000, CURRENT_DATE, 'QA Seed Maal Bank', v_admin_id);
  
  -- Add test rekonsiliasi (adjustment)
  DELETE FROM rekonsiliasi WHERE tahun_zakat_id = v_tahun_id;

  INSERT INTO rekonsiliasi (
    tahun_zakat_id,
    jenis,
    akun,
    jumlah_uang_rp,
    jumlah_beras_kg,
    tanggal,
    catatan,
    created_by
  ) VALUES
    (v_tahun_id, 'uang', 'kas', 100000, NULL, CURRENT_DATE, 'QA Seed adjustment penambahan kas', v_admin_id),
    (v_tahun_id, 'beras', NULL, NULL, -2.5, CURRENT_DATE, 'QA Seed adjustment pengurangan beras', v_admin_id);
  
  -- Set hak_amil
  INSERT INTO hak_amil (
    tahun_zakat_id,
    jumlah_uang_rp,
    updated_by
  ) VALUES
    (v_tahun_id, 100000, v_admin_id)
  ON CONFLICT (tahun_zakat_id) 
  DO UPDATE SET 
    jumlah_uang_rp = 100000,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();
  
  -- Add test distribusi for sisa calculation
  DELETE FROM distribusi_zakat WHERE tahun_zakat_id = v_tahun_id;

  INSERT INTO distribusi_zakat (
    mustahik_id,
    tahun_zakat_id,
    jenis_distribusi,
    jumlah_uang_rp,
    tanggal_distribusi,
    status,
    created_by,
    catatan
  ) VALUES
    (v_mustahik_id, v_tahun_id, 'uang', 140000, CURRENT_DATE, 'selesai', v_admin_id, 'QA Seed distribusi uang');
  
  RAISE NOTICE 'Test data created successfully';
  RAISE NOTICE 'Tahun ID: %', v_tahun_id;
  RAISE NOTICE 'Admin ID: %', v_admin_id;
  RAISE NOTICE 'Muzakki ID: %', v_muzakki_id;
  RAISE NOTICE 'Mustahik ID: %', v_mustahik_id;
END $$;

-- =====================================================
-- 3. VERIFY TEST DATA
-- =====================================================

-- Check pemasukan_uang
SELECT 
  kategori,
  akun,
  SUM(jumlah_uang_rp) as total
FROM pemasukan_uang
WHERE tahun_zakat_id = (SELECT id FROM tahun_zakat WHERE is_active = true LIMIT 1)
GROUP BY kategori, akun
ORDER BY kategori, akun;

-- Expected results:
-- fidyah_uang, bank: 60000
-- fidyah_uang, kas: 100000
-- infak_sedekah_uang, kas: 310000
-- maal_penghasilan_uang, bank: 400000
-- TOTAL FIDYAH: 160,000
-- TOTAL INFAK: 310,000
-- TOTAL MAAL: 400,000

-- Check rekonsiliasi
SELECT 
  jenis,
  akun,
  jumlah_uang_rp,
  jumlah_beras_kg,
  catatan
FROM rekonsiliasi
WHERE tahun_zakat_id = (SELECT id FROM tahun_zakat WHERE is_active = true LIMIT 1)
ORDER BY created_at DESC;

-- Expected: 
-- uang adjustment: +50,000
-- beras adjustment: -2.5 kg

-- Check hak_amil
SELECT 
  jumlah_uang_rp
FROM hak_amil
WHERE tahun_zakat_id = (SELECT id FROM tahun_zakat WHERE is_active = true LIMIT 1);

-- Expected: 100,000

-- =====================================================
-- MANUAL CALCULATION FOR VERIFICATION:
-- =====================================================
-- Total Pemasukan Uang (dashboard card) = Fidyah + Infak + Maal + Rekonsiliasi Uang
--                                        = 160,000 + 310,000 + 400,000 + 100,000
--                                        = 970,000
-- 
-- Hak Amil = 100,000
-- 
-- Distribusi Uang = 140,000
-- 
-- Sisa Uang = Total Pemasukan - Hak Amil - Distribusi
--           = 970,000 - 100,000 - 140,000
--           = 730,000
-- =====================================================

-- Verify calculation
SELECT 
  (
    SELECT COALESCE(SUM(jumlah_uang_rp), 0)
    FROM pemasukan_uang
    WHERE tahun_zakat_id = (SELECT id FROM tahun_zakat WHERE is_active = true LIMIT 1)
  ) as total_pemasukan,
  (
    SELECT COALESCE(SUM(jumlah_uang_rp), 0)
    FROM rekonsiliasi
    WHERE tahun_zakat_id = (SELECT id FROM tahun_zakat WHERE is_active = true LIMIT 1)
      AND jenis = 'uang'
  ) as rekonsiliasi_uang,
  (
    SELECT COALESCE(jumlah_uang_rp, 0)
    FROM hak_amil
    WHERE tahun_zakat_id = (SELECT id FROM tahun_zakat WHERE is_active = true LIMIT 1)
  ) as hak_amil,
  (
    SELECT COALESCE(SUM(jumlah_uang_rp), 0)
    FROM distribusi_zakat
    WHERE tahun_zakat_id = (SELECT id FROM tahun_zakat WHERE is_active = true LIMIT 1)
  ) as distribusi_uang;

-- Dashboard should show these exact numbers!
