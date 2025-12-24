-- Insert initial tahun_zakat data
-- This should be run once to populate the tahun_zakat table

-- Insert current year (1446 H / 2025 M)
INSERT INTO public.tahun_zakat (tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active) 
VALUES ('1446 H', 2025, 2.5, 45000, true)
ON CONFLICT (tahun_masehi) DO UPDATE 
    SET is_active = EXCLUDED.is_active,
        nilai_beras_kg = EXCLUDED.nilai_beras_kg,
        nilai_uang_rp = EXCLUDED.nilai_uang_rp;

-- Insert previous year (1445 H / 2024 M)
INSERT INTO public.tahun_zakat (tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active) 
VALUES ('1445 H', 2024, 2.5, 40000, false)
ON CONFLICT (tahun_masehi) DO UPDATE 
    SET nilai_beras_kg = EXCLUDED.nilai_beras_kg,
        nilai_uang_rp = EXCLUDED.nilai_uang_rp;

-- Verify the data was inserted
SELECT * FROM public.tahun_zakat ORDER BY tahun_masehi DESC;
