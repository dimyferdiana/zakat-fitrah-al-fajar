-- Migration: Add is_data_lama column to mustahik table
-- Date: 2026-01-10
-- Purpose: Fix Bug #3 - Enable tracking of imported mustahik from previous years

-- Add is_data_lama column
ALTER TABLE mustahik 
ADD COLUMN IF NOT EXISTS is_data_lama BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN mustahik.is_data_lama IS 'Indicates if this mustahik was imported from previous year (true) or newly created (false)';

-- Update any existing records to have is_data_lama = false (default)
UPDATE mustahik 
SET is_data_lama = false 
WHERE is_data_lama IS NULL;

-- Create index for faster filtering on is_data_lama
CREATE INDEX IF NOT EXISTS idx_mustahik_is_data_lama ON mustahik(is_data_lama);

-- Verification query (commented out, run manually to verify)
-- SELECT 
--   column_name, 
--   data_type, 
--   column_default, 
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'mustahik' 
--   AND column_name = 'is_data_lama';
