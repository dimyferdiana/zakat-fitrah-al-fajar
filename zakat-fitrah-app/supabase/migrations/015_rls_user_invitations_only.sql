-- Migration: RLS for User Invitations (Simplified)
-- Description: Add RLS policies for user_invitations table and helper functions
-- Date: 2026-02-14
--  
-- Note: This is a simplified version that only handles user_invitations
-- and doesn't modify existing table policies

-- ============================================
-- Create helper function to check if user is active
-- ============================================

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- User Invitations: Admin only
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_invitations_select_policy" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_insert_policy" ON public.user_invitations;
DROP POLICY IF EXISTS "user_invitations_update_policy" ON public.user_invitations;

CREATE POLICY "user_invitations_select_policy" ON public.user_invitations
FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "user_invitations_insert_policy" ON public.user_invitations
FOR INSERT
WITH CHECK (public.is_admin_user());

CREATE POLICY "user_invitations_update_policy" ON public.user_invitations
FOR UPDATE
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- ============================================
-- Users: Self-read, admin full access
-- ============================================

DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_select_own_policy" ON public.users;
DROP POLICY IF EXISTS "users_select_admin_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_own_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_admin_policy" ON public.users;

-- All authenticated users can read their own profile
CREATE POLICY "users_select_own_policy" ON public.users
FOR SELECT
USING (auth.uid() = id AND is_active = true);

-- Admins can read all user profiles
CREATE POLICY "users_select_admin_policy" ON public.users
FOR SELECT
USING (public.is_admin_user());

-- Users can update their own profile (except role and is_active)
CREATE POLICY "users_update_own_policy" ON public.users
FOR UPDATE
USING (auth.uid() = id AND is_active = true)
WITH CHECK (
  auth.uid() = id 
  AND is_active = true
  -- Prevent self-modification of role and is_active
  AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  AND is_active = (SELECT is_active FROM public.users WHERE id = auth.uid())
);

-- Admins can update any user
CREATE POLICY "users_update_admin_policy" ON public.users
FOR UPDATE
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

COMMENT ON FUNCTION public.is_active_user IS 'Helper function to check if current user is active';
COMMENT ON FUNCTION public.is_admin_user IS 'Helper function to check if current user is an active admin';
