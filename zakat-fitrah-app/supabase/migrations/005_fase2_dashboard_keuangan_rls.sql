-- Migration: Phase 2 - Dashboard Keuangan RLS policies
-- Date: 2026-01-11
-- Purpose: Enable RLS and add policies for pemasukan_uang, hak_amil, rekonsiliasi

-- Enable RLS
ALTER TABLE public.pemasukan_uang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hak_amil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rekonsiliasi ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PEMASUKAN_UANG POLICIES
-- =========================================

-- All authenticated: Read
CREATE POLICY "All can view pemasukan_uang"
    ON public.pemasukan_uang
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin & Petugas: Create
CREATE POLICY "Admin and Petugas can create pemasukan_uang"
    ON public.pemasukan_uang
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- Admin & Petugas: Update own records
CREATE POLICY "Admin and Petugas can update pemasukan_uang"
    ON public.pemasukan_uang
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'petugas') AND
        (created_by = auth.uid() OR public.get_user_role() = 'admin')
    )
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- Admin only: Delete
CREATE POLICY "Admin can delete pemasukan_uang"
    ON public.pemasukan_uang
    FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- =========================================
-- HAK_AMIL POLICIES
-- =========================================

-- All authenticated: Read
CREATE POLICY "All can view hak_amil"
    ON public.hak_amil
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin: Insert
CREATE POLICY "Admin can insert hak_amil"
    ON public.hak_amil
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'admin');

-- Admin: Update
CREATE POLICY "Admin can update hak_amil"
    ON public.hak_amil
    FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

-- Admin: Delete
CREATE POLICY "Admin can delete hak_amil"
    ON public.hak_amil
    FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');

-- =========================================
-- REKONSILIASI POLICIES
-- =========================================

-- All authenticated: Read
CREATE POLICY "All can view rekonsiliasi"
    ON public.rekonsiliasi
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin: Create
CREATE POLICY "Admin can create rekonsiliasi"
    ON public.rekonsiliasi
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() = 'admin');

-- Admin: Update
CREATE POLICY "Admin can update rekonsiliasi"
    ON public.rekonsiliasi
    FOR UPDATE
    TO authenticated
    USING (public.get_user_role() = 'admin')
    WITH CHECK (public.get_user_role() = 'admin');

-- Admin: Delete
CREATE POLICY "Admin can delete rekonsiliasi"
    ON public.rekonsiliasi
    FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');
