-- Expand muzakki table as central Warga registry
-- Supports Mustahik, Muzakki, Peserta Qurban, Penerima Qurban, and login account linking

ALTER TABLE public.muzakki
  ADD COLUMN IF NOT EXISTS nik TEXT,
  ADD COLUMN IF NOT EXISTS rt TEXT,
  ADD COLUMN IF NOT EXISTS rw TEXT,
  ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT CHECK (jenis_kelamin IS NULL OR jenis_kelamin IN ('laki-laki', 'perempuan')),
  ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
  ADD COLUMN IF NOT EXISTS keterangan TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- NIK must be unique when provided (NULLs allowed)
CREATE UNIQUE INDEX IF NOT EXISTS muzakki_nik_unique
  ON public.muzakki(nik)
  WHERE nik IS NOT NULL;

-- Index for user_id lookup
CREATE INDEX IF NOT EXISTS muzakki_user_id_idx
  ON public.muzakki(user_id)
  WHERE user_id IS NOT NULL;
