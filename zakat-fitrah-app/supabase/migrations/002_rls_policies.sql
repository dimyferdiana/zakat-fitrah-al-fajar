-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_zakat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_mustahik ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muzakki ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran_zakat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mustahik ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribusi_zakat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function to get current user's role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Admin: Full access
DROP POLICY IF EXISTS "Admin full access to users" ON public.users;
CREATE POLICY "Admin full access to users"
    ON public.users
    FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

-- All: View own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- All: Update own profile (except role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

-- ============================================================================
-- TAHUN_ZAKAT TABLE POLICIES
-- ============================================================================

-- All authenticated: Read
DROP POLICY IF EXISTS "All can view tahun_zakat" ON public.tahun_zakat;
CREATE POLICY "All can view tahun_zakat"
    ON public.tahun_zakat
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin: Full access
DROP POLICY IF EXISTS "Admin full access to tahun_zakat" ON public.tahun_zakat;
CREATE POLICY "Admin full access to tahun_zakat"
    ON public.tahun_zakat
    FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

-- Petugas: Create and update only
DROP POLICY IF EXISTS "Petugas can create/update tahun_zakat" ON public.tahun_zakat;
CREATE POLICY "Petugas can create/update tahun_zakat"
    ON public.tahun_zakat
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

DROP POLICY IF EXISTS "Petugas can update tahun_zakat" ON public.tahun_zakat;
CREATE POLICY "Petugas can update tahun_zakat"
    ON public.tahun_zakat
    FOR UPDATE
    TO authenticated
    USING (public.get_user_role() IN ('admin', 'petugas'))
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- ============================================================================
-- KATEGORI_MUSTAHIK TABLE POLICIES
-- ============================================================================

-- All authenticated: Read
DROP POLICY IF EXISTS "All can view kategori_mustahik" ON public.kategori_mustahik;
CREATE POLICY "All can view kategori_mustahik"
    ON public.kategori_mustahik
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin only: Write
DROP POLICY IF EXISTS "Admin full access to kategori_mustahik" ON public.kategori_mustahik;
CREATE POLICY "Admin full access to kategori_mustahik"
    ON public.kategori_mustahik
    FOR ALL
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

-- ============================================================================
-- MUZAKKI TABLE POLICIES
-- ============================================================================

-- All authenticated: Read
DROP POLICY IF EXISTS "All can view muzakki" ON public.muzakki;
CREATE POLICY "All can view muzakki"
    ON public.muzakki
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin & Petugas: Full access
DROP POLICY IF EXISTS "Admin and Petugas full access to muzakki" ON public.muzakki;
CREATE POLICY "Admin and Petugas full access to muzakki"
    ON public.muzakki
    FOR ALL
    TO authenticated
    USING (public.get_user_role() IN ('admin', 'petugas'))
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- ============================================================================
-- PEMBAYARAN_ZAKAT TABLE POLICIES
-- ============================================================================

-- All authenticated: Read
DROP POLICY IF EXISTS "All can view pembayaran_zakat" ON public.pembayaran_zakat;
CREATE POLICY "All can view pembayaran_zakat"
    ON public.pembayaran_zakat
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin & Petugas: Create
DROP POLICY IF EXISTS "Admin and Petugas can create pembayaran_zakat" ON public.pembayaran_zakat;
CREATE POLICY "Admin and Petugas can create pembayaran_zakat"
    ON public.pembayaran_zakat
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- Admin & Petugas: Update own records
DROP POLICY IF EXISTS "Admin and Petugas can update pembayaran_zakat" ON public.pembayaran_zakat;
CREATE POLICY "Admin and Petugas can update pembayaran_zakat"
    ON public.pembayaran_zakat
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'petugas') AND
        (created_by = auth.uid() OR public.get_user_role() = 'admin')
    )
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- Admin only: Delete
DROP POLICY IF EXISTS "Admin can delete pembayaran_zakat" ON public.pembayaran_zakat;
CREATE POLICY "Admin can delete pembayaran_zakat"
    ON public.pembayaran_zakat
    FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- ============================================================================
-- MUSTAHIK TABLE POLICIES
-- ============================================================================

-- All authenticated: Read
DROP POLICY IF EXISTS "All can view mustahik" ON public.mustahik;
CREATE POLICY "All can view mustahik"
    ON public.mustahik
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin & Petugas: Full access
DROP POLICY IF EXISTS "Admin and Petugas full access to mustahik" ON public.mustahik;
CREATE POLICY "Admin and Petugas full access to mustahik"
    ON public.mustahik
    FOR ALL
    TO authenticated
    USING (public.get_user_role() IN ('admin', 'petugas'))
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- ============================================================================
-- DISTRIBUSI_ZAKAT TABLE POLICIES
-- ============================================================================

-- All authenticated: Read
DROP POLICY IF EXISTS "All can view distribusi_zakat" ON public.distribusi_zakat;
CREATE POLICY "All can view distribusi_zakat"
    ON public.distribusi_zakat
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin & Petugas: Create
DROP POLICY IF EXISTS "Admin and Petugas can create distribusi_zakat" ON public.distribusi_zakat;
CREATE POLICY "Admin and Petugas can create distribusi_zakat"
    ON public.distribusi_zakat
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- Admin & Petugas: Update
DROP POLICY IF EXISTS "Admin and Petugas can update distribusi_zakat" ON public.distribusi_zakat;
CREATE POLICY "Admin and Petugas can update distribusi_zakat"
    ON public.distribusi_zakat
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'petugas') AND
        (created_by = auth.uid() OR public.get_user_role() = 'admin')
    )
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- Admin only: Delete
DROP POLICY IF EXISTS "Admin can delete distribusi_zakat" ON public.distribusi_zakat;
CREATE POLICY "Admin can delete distribusi_zakat"
    ON public.distribusi_zakat
    FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- ============================================================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================================================

-- All authenticated: Read own logs
DROP POLICY IF EXISTS "Users can view own audit_logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit_logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

-- System: Insert only (no updates/deletes)
DROP POLICY IF EXISTS "System can insert audit_logs" ON public.audit_logs;
CREATE POLICY "System can insert audit_logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Admin: View all
DROP POLICY IF EXISTS "Admin can view all audit_logs" ON public.audit_logs;
CREATE POLICY "Admin can view all audit_logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.get_user_role() = 'admin');
