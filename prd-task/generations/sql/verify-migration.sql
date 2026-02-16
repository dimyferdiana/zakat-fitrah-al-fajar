-- Verification queries after applying 012_pemasukan_beras migration

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public'
  AND table_name = 'pemasukan_beras'
) AS table_exists;

-- 2. Check if enum exists
SELECT unnest(enum_range(NULL::pemasukan_beras_kategori)) AS enum_values;

-- 3. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pemasukan_beras'
ORDER BY ordinal_position;

-- 4. Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'pemasukan_beras';

-- 5. Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'pemasukan_beras';

-- If all queries return results, migration was successful! ✅
