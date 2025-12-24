-- ============================================================================
-- Check Database Status
-- Run this to see what already exists in your database
-- ============================================================================

-- Check if enums exist
SELECT 
    typname as enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('user_role', 'jenis_zakat', 'status_distribusi')
GROUP BY typname
ORDER BY typname;

-- Check which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if users table has data
SELECT COUNT(*) as user_count FROM public.users;

-- Check if kategori_mustahik has data
SELECT COUNT(*) as kategori_count FROM public.kategori_mustahik;

-- Check if tahun_zakat has data
SELECT COUNT(*) as tahun_zakat_count FROM public.tahun_zakat;

-- Check RLS status
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check all users
SELECT 
    email,
    nama_lengkap,
    role,
    is_active,
    created_at
FROM public.users
ORDER BY created_at;

-- Check active tahun zakat
SELECT 
    tahun_hijriah,
    tahun_masehi,
    nilai_beras_kg,
    nilai_uang_rp,
    is_active
FROM public.tahun_zakat
WHERE is_active = true;
