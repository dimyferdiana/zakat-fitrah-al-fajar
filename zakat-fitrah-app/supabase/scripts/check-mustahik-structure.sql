-- Check mustahik table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'mustahik'
ORDER BY ordinal_position;

-- Check if mustahik has data
SELECT COUNT(*) as total_mustahik FROM public.mustahik;

-- Check sample mustahik with kategori
SELECT 
    m.id,
    m.nama,
    m.alamat,
    m.kategori_id,
    k.nama as kategori_nama
FROM public.mustahik m
LEFT JOIN public.kategori_mustahik k ON m.kategori_id = k.id
LIMIT 5;
