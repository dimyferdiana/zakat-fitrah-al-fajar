-- Migration: Add payment proof upload for pemasukan uang & beras
-- Date: 2026-03-04

ALTER TABLE public.pemasukan_uang
  ADD COLUMN IF NOT EXISTS bukti_bayar_url TEXT;

ALTER TABLE public.pemasukan_beras
  ADD COLUMN IF NOT EXISTS bukti_bayar_url TEXT;

COMMENT ON COLUMN public.pemasukan_uang.bukti_bayar_url IS 'Public URL of uploaded payment proof image (max 1MB).';
COMMENT ON COLUMN public.pemasukan_beras.bukti_bayar_url IS 'Public URL of uploaded payment proof image (max 1MB).';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bukti-bayar',
  'bukti-bayar',
  true,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated can view bukti bayar" ON storage.objects;
CREATE POLICY "Authenticated can view bukti bayar"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'bukti-bayar');

DROP POLICY IF EXISTS "Admin and petugas can upload bukti bayar" ON storage.objects;
CREATE POLICY "Admin and petugas can upload bukti bayar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bukti-bayar'
    AND public.get_user_role() IN ('admin', 'petugas')
  );

DROP POLICY IF EXISTS "Owners can update bukti bayar" ON storage.objects;
CREATE POLICY "Owners can update bukti bayar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'bukti-bayar' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'bukti-bayar' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owners can delete bukti bayar" ON storage.objects;
CREATE POLICY "Owners can delete bukti bayar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'bukti-bayar' AND owner = auth.uid());
