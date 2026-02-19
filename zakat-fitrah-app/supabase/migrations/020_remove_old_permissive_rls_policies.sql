-- Migration 020: Remove old RLS policies from migration 002
-- Migration 002 created overly permissive policies that allow ALL authenticated users
-- Migration 016/019 created more restrictive policies that check is_active
-- But since multiple policies use OR logic, we need to explicitly drop the old ones

-- ============================================
-- DROP OLD MUSTAHIK POLICIES
-- ============================================
DROP POLICY IF EXISTS "All can view mustahik" ON mustahik;
DROP POLICY IF EXISTS "Admin and Petugas full access to mustahik" ON mustahik;

-- ============================================
-- DROP OLD MUZAKKI POLICIES
-- ============================================
DROP POLICY IF EXISTS "All can view muzakki" ON muzakki;
DROP POLICY IF EXISTS "Admin and Petugas full access to muzakki" ON muzakki;

-- ============================================
-- DROP OLD PEMBAYARAN_ZAKAT POLICIES
-- ============================================
DROP POLICY IF EXISTS "All can view pembayaran_zakat" ON pembayaran_zakat;
DROP POLICY IF EXISTS "Admin and Petugas can create pembayaran_zakat" ON pembayaran_zakat;
DROP POLICY IF EXISTS "Admin and Petugas can update pembayaran_zakat" ON pembayaran_zakat;
DROP POLICY IF EXISTS "Admin can delete pembayaran_zakat" ON pembayaran_zakat;

-- ============================================
-- DROP OLD DISTRIBUSI_ZAKAT POLICIES
-- ============================================
DROP POLICY IF EXISTS "All can view distribusi_zakat" ON distribusi_zakat;
DROP POLICY IF EXISTS "Admin and Petugas can create distribusi_zakat" ON distribusi_zakat;
DROP POLICY IF EXISTS "Admin and Petugas can update distribusi_zakat" ON distribusi_zakat;
DROP POLICY IF EXISTS "Admin can delete distribusi_zakat" ON distribusi_zakat;

-- ============================================
-- DROP OLD PEMASUKAN_UANG POLICIES (if they exist from earlier migrations)
-- ============================================
DROP POLICY IF EXISTS "All can view pemasukan_uang" ON pemasukan_uang;
DROP POLICY IF EXISTS "Admin and Petugas full access to pemasukan_uang" ON pemasukan_uang;
DROP POLICY IF EXISTS "pemasukan_uang_policy" ON pemasukan_uang;

-- ============================================
-- DROP OLD PEMASUKAN_BERAS POLICIES (if they exist from earlier migrations)
-- ============================================
DROP POLICY IF EXISTS "All can view pemasukan_beras" ON pemasukan_beras;
DROP POLICY IF EXISTS "Admin and Petugas full access to pemasukan_beras" ON pemasukan_beras;
DROP POLICY IF EXISTS "pemasukan_beras_policy" ON pemasukan_beras;
