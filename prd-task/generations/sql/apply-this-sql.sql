-- ============================================================================
-- MIGRATION: Add is_data_lama column to mustahik table
-- Date: 2026-01-10
-- Purpose: Fix Bug #3 - Enable tracking of imported mustahik from previous years
-- ============================================================================
--
-- INSTRUCTIONS:
-- 1. Copy this entire SQL block
-- 2. Go to: https://supabase.com/dashboard/project/zuykdhqdklsskgrtwejg/sql
-- 3. Paste in the SQL Editor
-- 4. Click "Run" button
-- 5. Verify success message appears
--
-- ============================================================================

-- Add is_data_lama column to mustahik table
ALTER TABLE mustahik 
ADD COLUMN IF NOT EXISTS is_data_lama BOOLEAN DEFAULT false;

-- Add column documentation
COMMENT ON COLUMN mustahik.is_data_lama IS 'Indicates if this mustahik was imported from previous year (true) or newly created (false)';

-- Update existing records to have default value
UPDATE mustahik 
SET is_data_lama = false 
WHERE is_data_lama IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mustahik_is_data_lama ON mustahik(is_data_lama);

-- ============================================================================
-- VERIFICATION (Run this after the above statements)
-- ============================================================================

SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'mustahik' 
  AND column_name = 'is_data_lama';

-- Should return:
-- column_name    | data_type | column_default | is_nullable
-- ---------------+-----------+----------------+-------------
-- is_data_lama   | boolean   | false          | YES

-- ============================================================================
-- Test the column works
-- ============================================================================

SELECT id, nama, is_data_lama 
FROM mustahik 
LIMIT 5;

-- All existing records should have is_data_lama = false

-- ============================================================================
-- DONE! 
-- After running this SQL successfully, proceed with:
-- 1. npm run build
-- 2. npm run preview
-- 3. Re-test mustahik creation (Test 5.1)
-- 4. Re-test import data (Test 5.3)
-- ============================================================================
