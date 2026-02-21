-- ✅ CORRECTED SQL - Run this in Supabase SQL Editor
-- Fix for: ERROR: column "confirmed_at" can only be updated to DEFAULT

-- Confirm email for dimy.jtk09@gmail.com
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'dimy.jtk09@gmail.com'
  AND email_confirmed_at IS NULL;

-- Verify it worked
SELECT 
  email, 
  email_confirmed_at,
  confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ CONFIRMED - Can login now!'
    ELSE '❌ Not confirmed yet'
  END as status
FROM auth.users
WHERE email = 'dimy.jtk09@gmail.com';
