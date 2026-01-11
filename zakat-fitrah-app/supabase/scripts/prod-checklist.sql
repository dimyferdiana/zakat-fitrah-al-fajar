-- Production Checklist: Run each block to verify Supabase is ready
-- Project: zakat-fitrah-al-fajar
-- Target ref: zuykdhqdklsskgrtwejg

-- 1) Tables present
SELECT tablename AS table_name, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2) Core tables quick row counts (should be >= 0, not errors)
SELECT 'tahun_zakat' AS table, COUNT(*) FROM public.tahun_zakat
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'kategori_mustahik', COUNT(*) FROM public.kategori_mustahik
UNION ALL
SELECT 'muzakki', COUNT(*) FROM public.muzakki
UNION ALL
SELECT 'mustahik', COUNT(*) FROM public.mustahik
UNION ALL
SELECT 'pembayaran_zakat', COUNT(*) FROM public.pembayaran_zakat
UNION ALL
SELECT 'distribusi_zakat', COUNT(*) FROM public.distribusi_zakat
UNION ALL
SELECT 'pemasukan_uang', COUNT(*) FROM public.pemasukan_uang
UNION ALL
SELECT 'rekonsiliasi', COUNT(*) FROM public.rekonsiliasi
UNION ALL
SELECT 'hak_amil', COUNT(*) FROM public.hak_amil;

-- 3) Active tahun_zakat (must have exactly one true)
SELECT id, tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active
FROM public.tahun_zakat
WHERE is_active = true;

-- 4) User roles and status
SELECT id, email, nama_lengkap, role, is_active
FROM public.users
ORDER BY role, email;

-- 5) Helper function exists
SELECT proname AS function_name
FROM pg_proc
JOIN pg_namespace ns ON ns.oid = pg_proc.pronamespace
WHERE ns.nspname = 'public' AND proname = 'get_user_role';

-- 6) RLS enabled on critical tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'tahun_zakat', 'kategori_mustahik', 'muzakki', 'mustahik',
    'pembayaran_zakat', 'distribusi_zakat', 'pemasukan_uang', 'rekonsiliasi', 'hak_amil'
  )
ORDER BY tablename;

-- 7) Policies sanity (just list names)
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8) Sample data spot checks (optional)
-- Active tahun + nilai zakat
SELECT tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp
FROM public.tahun_zakat
ORDER BY tahun_masehi DESC;

-- Seeded kategori_mustahik (expect 8 rows)
SELECT nama, deskripsi FROM public.kategori_mustahik ORDER BY nama;
