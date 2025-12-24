-- ============================================================================
-- COMPREHENSIVE MUSTAHIK TABLE FIX
-- Run these queries in order to diagnose and fix the issue
-- ============================================================================

-- STEP 1: Check if mustahik table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'mustahik'
) as table_exists;

-- STEP 2: Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'mustahik'
ORDER BY ordinal_position;

-- STEP 3: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'mustahik';

-- STEP 4: Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'mustahik';

-- ============================================================================
-- FIX: If table doesn't exist or has wrong structure, recreate it
-- ============================================================================

-- Drop existing table if it has wrong structure (BE CAREFUL - THIS DELETES DATA!)
-- Uncomment only if you're sure:
-- DROP TABLE IF EXISTS public.mustahik CASCADE;

-- Create correct mustahik table
CREATE TABLE IF NOT EXISTS public.mustahik (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama TEXT NOT NULL,
    alamat TEXT NOT NULL,
    kategori_id UUID NOT NULL REFERENCES public.kategori_mustahik(id) ON DELETE RESTRICT,
    jumlah_anggota INTEGER NOT NULL CHECK (jumlah_anggota > 0),
    no_telp TEXT,
    catatan TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mustahik ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "All can view mustahik" ON public.mustahik;
CREATE POLICY "All can view mustahik"
    ON public.mustahik
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admin and Petugas full access to mustahik" ON public.mustahik;
CREATE POLICY "Admin and Petugas full access to mustahik"
    ON public.mustahik
    FOR ALL
    TO authenticated
    USING (public.get_user_role() IN ('admin', 'petugas'))
    WITH CHECK (public.get_user_role() IN ('admin', 'petugas'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mustahik_kategori_id ON public.mustahik(kategori_id);
CREATE INDEX IF NOT EXISTS idx_mustahik_nama ON public.mustahik(nama);
CREATE INDEX IF NOT EXISTS idx_mustahik_is_active ON public.mustahik(is_active);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_mustahik_updated_at ON public.mustahik;
CREATE TRIGGER update_mustahik_updated_at BEFORE UPDATE ON public.mustahik
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.mustahik (nama, alamat, kategori_id, jumlah_anggota, is_active) 
SELECT 
    'Keluarga Siti Aminah',
    'Jl. Sederhana No. 10, RT 05/RW 08',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Fakir' LIMIT 1),
    5,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.mustahik WHERE nama = 'Keluarga Siti Aminah');

INSERT INTO public.mustahik (nama, alamat, kategori_id, jumlah_anggota, is_active)
SELECT 
    'Pengurus Masjid Al-Fajar',
    'Jl. Masjid Al-Fajar No. 1',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Amil' LIMIT 1),
    8,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.mustahik WHERE nama = 'Pengurus Masjid Al-Fajar');

-- Verify
SELECT 
    m.id,
    m.nama,
    m.alamat,
    k.nama as kategori,
    m.jumlah_anggota,
    m.is_active
FROM public.mustahik m
JOIN public.kategori_mustahik k ON m.kategori_id = k.id
LIMIT 10;
