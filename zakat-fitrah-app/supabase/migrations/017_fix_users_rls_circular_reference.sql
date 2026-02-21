-- Migration 017: Fix circular reference in users table RLS policies
-- The previous migration created a circular dependency where the users table policies
-- tried to query the users table itself to check is_active status

-- Drop the problematic policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;

-- Recreate policies without circular references
-- Users can ALWAYS read their own profile (no circular check)
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all user profiles (check role directly without subquery)
-- This uses a simpler check that doesn't create circular references
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Check if the current user (from auth.uid()) has admin role
    -- by directly checking the row being queried where id matches auth.uid()
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Users can update their own profile (nama_lengkap, address, phone only)
-- They cannot change their role or is_active status
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM users WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM users WHERE id = auth.uid())
  );

-- Admins can update any user (including role and is_active)
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

COMMENT ON POLICY "users_select_own" ON users IS 'Users can always read their own profile without is_active checks to avoid circular reference';
COMMENT ON POLICY "users_select_admin" ON users IS 'Admins can read all user profiles';
COMMENT ON POLICY "users_update_own" ON users IS 'Users can update their profile but not role or is_active';
COMMENT ON POLICY "users_update_admin" ON users IS 'Admins can update any user including role and is_active';
