-- Migration 018: Fix users table RLS with security definer function
-- Previous migration 017 still had circular reference in admin policy subquery
-- This migration creates a helper function that bypasses RLS to check user role

-- Create a security definer function to get current user's role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Create a security definer function to check if current user is active
CREATE OR REPLACE FUNCTION public.get_current_user_is_active()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_active FROM public.users WHERE id = auth.uid() LIMIT 1), false);
$$;

-- Drop existing policies on users table
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;

-- Recreate policies using the security definer functions (no circular reference!)

-- Users can ALWAYS read their own profile (no RLS recursion)
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all profiles using the helper function (no RLS recursion)
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- Users can update their own profile
-- Note: Application-level code ensures role and is_active are not sent in updates
-- See: src/hooks/useProfile.ts which only updates nama_lengkap, address, phone
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any user using the helper function
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- Grant execute permission on the functions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_is_active() TO authenticated;

COMMENT ON FUNCTION public.get_current_user_role() IS 'Get current authenticated user role without triggering RLS (security definer)';
COMMENT ON FUNCTION public.get_current_user_is_active() IS 'Check if current authenticated user is active without triggering RLS (security definer)';
COMMENT ON POLICY "users_select_own" ON users IS 'Users can always read their own profile';
COMMENT ON POLICY "users_select_admin" ON users IS 'Admins can read all profiles using security definer function';
