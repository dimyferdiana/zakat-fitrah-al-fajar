-- ===========================
-- Zakat Database Check & Sample Data Script
-- ===========================

-- 1. CHECK EXISTING DATA
-- ===========================

-- Check Tahun Zakat
SELECT 'TAHUN ZAKAT' as table_name, COUNT(*) as count FROM tahun_zakat;
SELECT * FROM tahun_zakat ORDER BY tahun_masehi DESC;

-- Check Kategori Mustahik (8 Asnaf)
SELECT 'KATEGORI MUSTAHIK' as table_name, COUNT(*) as count FROM kategori_mustahik;
SELECT * FROM kategori_mustahik ORDER BY urutan;

-- Check Muzakki (Donors)
SELECT 'MUZAKKI' as table_name, COUNT(*) as count FROM muzakki;
SELECT id, nama_kk, alamat, no_telp FROM muzakki ORDER BY nama_kk LIMIT 5;

-- Check Mustahik (Recipients)
SELECT 'MUSTAHIK' as table_name, COUNT(*) as count FROM mustahik;
SELECT m.id, m.nama, m.alamat, k.nama as kategori, m.jumlah_anggota, m.is_active 
FROM mustahik m 
LEFT JOIN kategori_mustahik k ON m.kategori_id = k.id 
ORDER BY m.nama LIMIT 5;

-- Check Pembayaran Zakat
SELECT 'PEMBAYARAN ZAKAT' as table_name, COUNT(*) as count FROM pembayaran_zakat;
SELECT pz.id, mz.nama_kk, pz.jumlah_jiwa, pz.jenis_zakat, pz.total_zakat, pz.tanggal_bayar
FROM pembayaran_zakat pz
LEFT JOIN muzakki mz ON pz.muzakki_id = mz.id
ORDER BY pz.tanggal_bayar DESC LIMIT 5;

-- Check Distribusi Zakat
SELECT 'DISTRIBUSI ZAKAT' as table_name, COUNT(*) as count FROM distribusi_zakat;
SELECT dz.id, m.nama as mustahik_nama, dz.jenis_distribusi, dz.jumlah, dz.status, dz.tanggal_distribusi
FROM distribusi_zakat dz
LEFT JOIN mustahik m ON dz.mustahik_id = m.id
ORDER BY dz.tanggal_distribusi DESC LIMIT 5;

-- Check Users
SELECT 'USERS' as table_name, COUNT(*) as count FROM users;
SELECT id, nama_lengkap, email, role, is_active FROM users;


-- ===========================
-- 2. ADD SAMPLE DATA
-- ===========================

-- Note: Run these INSERT statements individually if needed
-- Make sure to have at least one active user first

-- Add more Muzakki (if needed)
/*
INSERT INTO muzakki (nama_kk, alamat, no_telp) VALUES
('Bpk. Ahmad Hidayat', 'Jl. Masjid Al-Fajar No. 15, Jakarta', '0812-3456-7890'),
('Ibu Siti Nurhaliza', 'Jl. Raya Kebayoran No. 23, Jakarta', '0813-4567-8901'),
('Bpk. Muhammad Rizki', 'Jl. Sudirman No. 45, Jakarta', '0821-5678-9012');
*/

-- Add sample Pembayaran Zakat (Payments)
-- Note: Replace UUIDs with actual IDs from your database
/*
-- First, get active tahun_zakat_id
SELECT id, tahun_hijriah FROM tahun_zakat WHERE is_active = true;

-- Get muzakki IDs
SELECT id, nama_kk FROM muzakki LIMIT 5;

-- Get user ID for petugas_penerima
SELECT id, nama_lengkap FROM users WHERE role IN ('admin', 'petugas') LIMIT 1;

-- Example INSERT (update UUIDs with actual values):
INSERT INTO pembayaran_zakat (
  tahun_zakat_id,
  muzakki_id,
  jumlah_jiwa,
  jenis_zakat,
  nilai_per_orang,
  total_zakat,
  tanggal_bayar,
  petugas_penerima,
  catatan
) VALUES (
  'YOUR_TAHUN_ZAKAT_ID',
  'YOUR_MUZAKKI_ID',
  4,
  'uang',
  45000,
  180000,
  CURRENT_DATE,
  'YOUR_USER_ID',
  'Pembayaran zakat fitrah untuk 4 orang'
);
*/

-- Add sample Distribusi Zakat
/*
-- Get mustahik IDs
SELECT id, nama FROM mustahik WHERE is_active = true LIMIT 5;

-- Example INSERT:
INSERT INTO distribusi_zakat (
  tahun_zakat_id,
  mustahik_id,
  jenis_distribusi,
  jumlah,
  jumlah_uang_rp,
  tanggal_distribusi,
  status,
  petugas_distribusi,
  catatan
) VALUES (
  'YOUR_TAHUN_ZAKAT_ID',
  'YOUR_MUSTAHIK_ID',
  'uang',
  50000,
  50000,
  CURRENT_DATE,
  'selesai',
  'YOUR_USER_ID',
  'Distribusi zakat untuk mustahik kategori Fakir'
);
*/


-- ===========================
-- 3. SUMMARY QUERIES
-- ===========================

-- Total Pemasukan by Year
SELECT 
  tz.tahun_hijriah,
  COUNT(pz.id) as jumlah_pembayaran,
  SUM(pz.jumlah_jiwa) as total_jiwa,
  SUM(CASE WHEN pz.jenis_zakat = 'uang' THEN pz.total_zakat ELSE 0 END) as total_uang,
  SUM(CASE WHEN pz.jenis_zakat = 'beras' THEN pz.total_zakat ELSE 0 END) as total_beras_kg
FROM tahun_zakat tz
LEFT JOIN pembayaran_zakat pz ON tz.id = pz.tahun_zakat_id
GROUP BY tz.tahun_hijriah, tz.tahun_masehi
ORDER BY tz.tahun_masehi DESC;

-- Total Distribusi by Year
SELECT 
  tz.tahun_hijriah,
  COUNT(dz.id) as jumlah_distribusi,
  SUM(CASE WHEN dz.jenis_distribusi = 'uang' THEN dz.jumlah ELSE 0 END) as total_uang_distribusi,
  SUM(CASE WHEN dz.jenis_distribusi = 'beras' THEN dz.jumlah ELSE 0 END) as total_beras_distribusi_kg
FROM tahun_zakat tz
LEFT JOIN distribusi_zakat dz ON tz.id = dz.tahun_zakat_id
GROUP BY tz.tahun_hijriah, tz.tahun_masehi
ORDER BY tz.tahun_masehi DESC;

-- Mustahik by Category
SELECT 
  k.nama as kategori,
  COUNT(m.id) as jumlah_mustahik,
  SUM(m.jumlah_anggota) as total_anggota
FROM kategori_mustahik k
LEFT JOIN mustahik m ON k.id = m.kategori_id AND m.is_active = true
GROUP BY k.nama, k.urutan
ORDER BY k.urutan;
