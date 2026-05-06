BEGIN;

-- Create storage bucket for qurban animal photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qurban-photos',
  'qurban-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "qurban_photos_upload_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'qurban-photos');

-- Allow public read access
CREATE POLICY "qurban_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'qurban-photos');

-- Allow authenticated users to update/delete their own photos
CREATE POLICY "qurban_photos_update_authenticated"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'qurban-photos');

CREATE POLICY "qurban_photos_delete_authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'qurban-photos');

COMMIT;
