-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_zakat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muzakki ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_mustahik ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mustahik ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran_zakat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribusi_zakat ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all authenticated users to read tahun_zakat" ON public.tahun_zakat;
DROP POLICY IF EXISTS "Allow admin to manage tahun_zakat" ON public.tahun_zakat;
DROP POLICY IF EXISTS "Allow authenticated users to read muzakki" ON public.muzakki;
DROP POLICY IF EXISTS "Allow admin and petugas to manage muzakki" ON public.muzakki;
DROP POLICY IF EXISTS "Allow all to read kategori_mustahik" ON public.kategori_mustahik;
DROP POLICY IF EXISTS "Allow authenticated users to read mustahik" ON public.mustahik;
DROP POLICY IF EXISTS "Allow admin and petugas to manage mustahik" ON public.mustahik;
DROP POLICY IF EXISTS "Allow authenticated users to read pembayaran" ON public.pembayaran_zakat;
DROP POLICY IF EXISTS "Allow admin and petugas to manage pembayaran" ON public.pembayaran_zakat;
DROP POLICY IF EXISTS "Allow authenticated users to read distribusi" ON public.distribusi_zakat;
DROP POLICY IF EXISTS "Allow admin and petugas to manage distribusi" ON public.distribusi_zakat;

-- USERS TABLE POLICIES
CREATE POLICY "Users can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- TAHUN ZAKAT POLICIES
CREATE POLICY "Allow all authenticated users to read tahun_zakat"
  ON public.tahun_zakat
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin to manage tahun_zakat"
  ON public.tahun_zakat
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- MUZAKKI POLICIES
CREATE POLICY "Allow authenticated users to read muzakki"
  ON public.muzakki
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin and petugas to manage muzakki"
  ON public.muzakki
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'petugas')
    )
  );

-- KATEGORI MUSTAHIK POLICIES (read-only reference table)
CREATE POLICY "Allow all to read kategori_mustahik"
  ON public.kategori_mustahik
  FOR SELECT
  TO authenticated
  USING (true);

-- MUSTAHIK POLICIES
CREATE POLICY "Allow authenticated users to read mustahik"
  ON public.mustahik
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin and petugas to manage mustahik"
  ON public.mustahik
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'petugas')
    )
  );

-- PEMBAYARAN ZAKAT POLICIES
CREATE POLICY "Allow authenticated users to read pembayaran"
  ON public.pembayaran_zakat
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin and petugas to manage pembayaran"
  ON public.pembayaran_zakat
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'petugas')
    )
  );

-- DISTRIBUSI ZAKAT POLICIES
CREATE POLICY "Allow authenticated users to read distribusi"
  ON public.distribusi_zakat
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin and petugas to manage distribusi"
  ON public.distribusi_zakat
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'petugas')
    )
  );
