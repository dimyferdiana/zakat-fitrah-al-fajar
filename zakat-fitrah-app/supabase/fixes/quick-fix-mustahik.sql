-- ============================================================================
-- QUICK FIX FOR MUSTAHIK TABLE - Run this in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Create helper function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- STEP 2: Create the mustahik table with correct structure if it doesn't exist
-- Or fix it if it has wrong column names

-- Check if table exists and has wrong column name
DO $$ 
BEGIN
    -- If kategori_mustahik_id exists, rename it to kategori_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mustahik' 
        AND column_name = 'kategori_mustahik_id'
    ) THEN
        ALTER TABLE public.mustahik RENAME COLUMN kategori_mustahik_id TO kategori_id;
    END IF;
    
    -- If tahun_zakat_id exists, drop it (not needed)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mustahik' 
        AND column_name = 'tahun_zakat_id'
    ) THEN
        ALTER TABLE public.mustahik DROP COLUMN tahun_zakat_id;
    END IF;
END $$;

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

-- Drop and recreate policies
DROP POLICY IF EXISTS "All can view mustahik" ON public.mustahik;
DROP POLICY IF EXISTS "Admin and Petugas full access to mustahik" ON public.mustahik;

CREATE POLICY "All can view mustahik"
    ON public.mustahik
    FOR SELECT
    TO authenticated
    USING (true);

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

-- Insert sample mustahik data
INSERT INTO public.mustahik (nama, alamat, kategori_id, jumlah_anggota, is_active) 
SELECT 
    'Keluarga Siti Aminah',
    'Jl. Sederhana No. 10, RT 05/RW 08',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Fakir' LIMIT 1),
    5,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.mustahik WHERE nama = 'Keluarga Siti Aminah')
AND EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Fakir');

INSERT INTO public.mustahik (nama, alamat, kategori_id, jumlah_anggota, is_active)
SELECT 
    'Keluarga Haji Muhammad',
    'Jl. Damai No. 25, RT 06/RW 09',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Miskin' LIMIT 1),
    4,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.mustahik WHERE nama = 'Keluarga Haji Muhammad')
AND EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Miskin');

INSERT INTO public.mustahik (nama, alamat, kategori_id, jumlah_anggota, is_active)
SELECT 
    'Pengurus Masjid Al-Fajar',
    'Jl. Masjid Al-Fajar No. 1',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Amil' LIMIT 1),
    8,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.mustahik WHERE nama = 'Pengurus Masjid Al-Fajar')
AND EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Amil');

INSERT INTO public.mustahik (nama, alamat, kategori_id, jumlah_anggota, is_active)
SELECT 
    'Keluarga Saudara Baru',
    'Jl. Harapan No. 33, RT 02/RW 05',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Muallaf' LIMIT 1),
    3,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.mustahik WHERE nama = 'Keluarga Saudara Baru')
AND EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Muallaf');

INSERT INTO public.mustahik (nama, alamat, kategori_id, jumlah_anggota, is_active)
SELECT 
    'Keluarga Pak Sutrisno',
    'Jl. Perjuangan No. 88, RT 07/RW 10',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Gharimin' LIMIT 1),
    6,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.mustahik WHERE nama = 'Keluarga Pak Sutrisno')
AND EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Gharimin');

-- Verify it worked
SELECT 
    m.nama,
    k.nama as kategori,
    m.jumlah_anggota,
    m.is_active
FROM public.mustahik m
JOIN public.kategori_mustahik k ON m.kategori_id = k.id
ORDER BY k.nama, m.nama;
