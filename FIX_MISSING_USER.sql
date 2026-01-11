-- ============================================================================
-- FIX MISSING USER RECORD
-- Fix for: User authenticated but can't access dashboard (stuck on login page)
-- Date: January 11, 2026
-- ============================================================================
--
-- PROBLEM: User was created in Supabase Auth but missing from 'users' table
-- SOLUTION: Manually insert user record into 'users' table
--
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/zuykdhqdklsskgrtwejg/sql
-- 2. Run PART 1 to find the user's auth ID
-- 3. Copy the ID from the result
-- 4. Update PART 2 with the copied ID
-- 5. Run PART 2 to create the user record
--
-- ============================================================================

-- ============================================================================
-- PART 1: Find the user's ID from auth.users
-- ============================================================================

SELECT 
  id,
  email,
  raw_user_meta_data->>'nama_lengkap' as nama_lengkap,
  raw_user_meta_data->>'role' as role,
  created_at,
  confirmed_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'dimyferdi@gmail.com';

-- Copy the 'id' value from the result above

-- ============================================================================
-- PART 2: Insert user record into users table
-- ============================================================================

-- Replace 'PASTE_USER_ID_HERE' with the actual ID from PART 1

INSERT INTO public.users (
  id,
  email,
  nama_lengkap,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'PASTE_USER_ID_HERE'::uuid,  -- Replace with actual UUID from PART 1
  'dimyferdi@gmail.com',
  'Dimy Ferdiana',  -- Update if different
  'viewer',  -- Change to 'admin' or 'petugas' if needed
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nama_lengkap = EXCLUDED.nama_lengkap,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION: Check if user record exists
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.nama_lengkap,
  u.role,
  u.is_active,
  u.created_at
FROM public.users u
WHERE u.email = 'dimyferdi@gmail.com';

-- Should return one row with the user data

-- ============================================================================
-- ALTERNATIVE: Automatic solution using a function
-- ============================================================================

-- If you want to automatically sync auth users to users table,
-- you can create a trigger function (for future users):

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nama_lengkap, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run on new auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- DONE!
-- After running this SQL:
-- 1. User should be able to login successfully
-- 2. User will be redirected to dashboard
-- 3. Future users will be automatically synced
-- ============================================================================
