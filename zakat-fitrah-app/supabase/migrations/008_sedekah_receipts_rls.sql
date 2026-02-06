-- ============================================================================
-- RLS Policies for bukti_sedekah
-- ============================================================================

ALTER TABLE public.bukti_sedekah ENABLE ROW LEVEL SECURITY;

-- All authenticated: Read
DROP POLICY IF EXISTS "All can view bukti_sedekah" ON public.bukti_sedekah;
CREATE POLICY "All can view bukti_sedekah"
    ON public.bukti_sedekah
    FOR SELECT
    TO authenticated
    USING (true);

-- Admin & Petugas: Create
DROP POLICY IF EXISTS "Admin and Petugas can create bukti_sedekah" ON public.bukti_sedekah;
CREATE POLICY "Admin and Petugas can create bukti_sedekah"
    ON public.bukti_sedekah
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- Admin & Petugas: Update own records
DROP POLICY IF EXISTS "Admin and Petugas can update bukti_sedekah" ON public.bukti_sedekah;
CREATE POLICY "Admin and Petugas can update bukti_sedekah"
    ON public.bukti_sedekah
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role() IN ('admin', 'petugas') AND
        (created_by = auth.uid() OR public.get_user_role() = 'admin')
    )
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- Admin only: Delete
DROP POLICY IF EXISTS "Admin can delete bukti_sedekah" ON public.bukti_sedekah;
CREATE POLICY "Admin can delete bukti_sedekah"
    ON public.bukti_sedekah
    FOR DELETE
    TO authenticated
    USING (public.get_user_role() = 'admin');
