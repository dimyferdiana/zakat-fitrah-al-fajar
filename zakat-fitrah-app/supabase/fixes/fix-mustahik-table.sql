-- ============================================================================
-- Fix Mustahik Table Structure
-- Run this to check and fix the column names
-- ============================================================================

-- Step 1: Check current structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'mustahik'
ORDER BY ordinal_position;

-- Step 2: If the table has wrong columns, we need to check what exists
-- Uncomment and run this if needed:

-- SELECT * FROM public.mustahik LIMIT 1;

-- Step 3: If kategori_mustahik_id exists instead of kategori_id, run this:
-- ALTER TABLE public.mustahik RENAME COLUMN kategori_mustahik_id TO kategori_id;

-- Step 4: If tahun_zakat_id column is missing, it might be OK - check the schema
-- The seed file incorrectly references tahun_zakat_id which shouldn't be in mustahik table
