-- ============================================================================
-- Seed Data for Development and Testing
-- ============================================================================

-- Insert 8 Asnaf (Kategori Mustahik)
INSERT INTO public.kategori_mustahik (nama, deskripsi) VALUES
    ('Fakir', 'Orang yang tidak memiliki harta dan usaha sama sekali'),
    ('Miskin', 'Orang yang memiliki harta atau usaha namun tidak mencukupi kebutuhan'),
    ('Amil', 'Panitia atau pengurus zakat'),
    ('Muallaf', 'Orang yang baru masuk Islam atau yang perlu dikuatkan imannya'),
    ('Riqab', 'Hamba sahaya atau budak yang ingin memerdekakan diri'),
    ('Gharimin', 'Orang yang berhutang untuk kepentingan yang baik'),
    ('Fisabilillah', 'Orang yang berjuang di jalan Allah (dakwah, pendidikan, dll)'),
    ('Ibnu Sabil', 'Musafir yang kehabisan bekal dalam perjalanan yang baik')
ON CONFLICT (nama) DO NOTHING;

-- Insert current year tahun_zakat (1446 H / 2025 M)
INSERT INTO public.tahun_zakat (tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active) VALUES
    ('1446 H', 2025, 2.5, 45000, true)
ON CONFLICT (tahun_masehi) DO UPDATE 
    SET is_active = EXCLUDED.is_active,
        nilai_beras_kg = EXCLUDED.nilai_beras_kg,
        nilai_uang_rp = EXCLUDED.nilai_uang_rp;

-- Insert sample muzakki (for testing)
INSERT INTO public.muzakki (nama_kk, alamat, no_telp) VALUES
    ('Ahmad Setiawan', 'Jl. Masjid Al-Fajar No. 123, RT 01/RW 05', '081234567890'),
    ('Budi Santoso', 'Jl. Raya Timur No. 45, RT 02/RW 03', '081234567891'),
    ('Cahyadi Wijaya', 'Jl. Melati No. 78, RT 03/RW 04', '081234567892'),
    ('Dedi Kurniawan', 'Jl. Anggrek No. 12, RT 01/RW 02', '081234567893'),
    ('Eko Prasetyo', 'Jl. Kenangan No. 56, RT 04/RW 06', '081234567894')
ON CONFLICT DO NOTHING;

-- Insert sample mustahik (for testing)
INSERT INTO public.mustahik (tahun_zakat_id, nama, alamat, kategori_mustahik_id, jumlah_anggota, is_active) 
SELECT 
    (SELECT id FROM public.tahun_zakat WHERE is_active = true LIMIT 1),
    'Keluarga Siti Aminah',
    'Jl. Sederhana No. 10, RT 05/RW 08',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Fakir' LIMIT 1),
    5,
    true
WHERE EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Fakir');

INSERT INTO public.mustahik (tahun_zakat_id, nama, alamat, kategori_mustahik_id, jumlah_anggota, is_active)
SELECT 
    (SELECT id FROM public.tahun_zakat WHERE is_active = true LIMIT 1),
    'Keluarga Haji Muhammad',
    'Jl. Damai No. 25, RT 06/RW 09',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Miskin' LIMIT 1),
    4,
    true
WHERE EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Miskin');

INSERT INTO public.mustahik (tahun_zakat_id, nama, alamat, kategori_mustahik_id, jumlah_anggota, is_active)
SELECT 
    (SELECT id FROM public.tahun_zakat WHERE is_active = true LIMIT 1),
    'Pengurus Masjid Al-Fajar',
    'Jl. Masjid Al-Fajar No. 1',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Amil' LIMIT 1),
    8,
    true
WHERE EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Amil');

INSERT INTO public.mustahik (tahun_zakat_id, nama, alamat, kategori_mustahik_id, jumlah_anggota, is_active)
SELECT 
    (SELECT id FROM public.tahun_zakat WHERE is_active = true LIMIT 1),
    'Keluarga Saudara Baru',
    'Jl. Harapan No. 33, RT 02/RW 05',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Muallaf' LIMIT 1),
    3,
    true
WHERE EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Muallaf');

INSERT INTO public.mustahik (tahun_zakat_id, nama, alamat, kategori_mustahik_id, jumlah_anggota, is_active)
SELECT 
    (SELECT id FROM public.tahun_zakat WHERE is_active = true LIMIT 1),
    'Keluarga Pak Sutrisno',
    'Jl. Perjuangan No. 88, RT 07/RW 10',
    (SELECT id FROM public.kategori_mustahik WHERE nama = 'Gharimin' LIMIT 1),
    6,
    true
WHERE EXISTS (SELECT 1 FROM public.kategori_mustahik WHERE nama = 'Gharimin');

-- Insert historical tahun_zakat (optional)
INSERT INTO public.tahun_zakat (tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active) VALUES
    ('1445 H', 2024, 2.5, 40000, false),
    ('1444 H', 2023, 2.5, 35000, false)
ON CONFLICT (tahun_masehi) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment these to verify the seed data:

-- SELECT 'Kategori Mustahik Count' as check_name, COUNT(*) as count FROM public.kategori_mustahik;
-- SELECT 'Tahun Zakat Count' as check_name, COUNT(*) as count FROM public.tahun_zakat;
-- SELECT 'Active Tahun Zakat' as check_name, tahun_hijriah, tahun_masehi FROM public.tahun_zakat WHERE is_active = true;
-- SELECT 'Muzakki Count' as check_name, COUNT(*) as count FROM public.muzakki;
-- SELECT 'Mustahik Count' as check_name, COUNT(*) as count FROM public.mustahik;
