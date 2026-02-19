-- Migration 019: Fix domain table RLS with security definer function
-- Previous migration 016 uses subqueries to check is_active on users table
-- This causes RLS evaluation issues because the users table itself has RLS policies
-- This migration updates key domain tables to use the security definer function: get_current_user_is_active()
-- This ensures inactive users cannot access protected tables regardless of their authentication status

-- ============================================
-- MUSTAHIK TABLE RLS FIX
-- ============================================
DROP POLICY IF EXISTS "mustahik_select_authenticated_active" ON mustahik;
DROP POLICY IF EXISTS "mustahik_insert_authenticated_active" ON mustahik;
DROP POLICY IF EXISTS "mustahik_update_authenticated_active" ON mustahik;
DROP POLICY IF EXISTS "mustahik_delete_authenticated_active" ON mustahik;

CREATE POLICY "mustahik_select_authenticated_active"
  ON mustahik FOR SELECT
  TO authenticated
  USING (public.get_current_user_is_active());

CREATE POLICY "mustahik_insert_authenticated_active"
  ON mustahik FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "mustahik_update_authenticated_active"
  ON mustahik FOR UPDATE
  TO authenticated
  USING (public.get_current_user_is_active())
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "mustahik_delete_authenticated_active"
  ON mustahik FOR DELETE
  TO authenticated
  USING (public.get_current_user_is_active());

-- ============================================
-- MUZAKKI TABLE RLS FIX
-- ============================================
DROP POLICY IF EXISTS "muzakki_select_authenticated_active" ON muzakki;
DROP POLICY IF EXISTS "muzakki_insert_authenticated_active" ON muzakki;
DROP POLICY IF EXISTS "muzakki_update_authenticated_active" ON muzakki;
DROP POLICY IF EXISTS "muzakki_delete_authenticated_active" ON muzakki;

CREATE POLICY "muzakki_select_authenticated_active"
  ON muzakki FOR SELECT
  TO authenticated
  USING (public.get_current_user_is_active());

CREATE POLICY "muzakki_insert_authenticated_active"
  ON muzakki FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "muzakki_update_authenticated_active"
  ON muzakki FOR UPDATE
  TO authenticated
  USING (public.get_current_user_is_active())
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "muzakki_delete_authenticated_active"
  ON muzakki FOR DELETE
  TO authenticated
  USING (public.get_current_user_is_active());

-- ============================================
-- PEMASUKAN_UANG TABLE RLS FIX
-- ============================================
DROP POLICY IF EXISTS "pemasukan_uang_select_authenticated_active" ON pemasukan_uang;
DROP POLICY IF EXISTS "pemasukan_uang_insert_authenticated_active" ON pemasukan_uang;
DROP POLICY IF EXISTS "pemasukan_uang_update_authenticated_active" ON pemasukan_uang;
DROP POLICY IF EXISTS "pemasukan_uang_delete_authenticated_active" ON pemasukan_uang;

CREATE POLICY "pemasukan_uang_select_authenticated_active"
  ON pemasukan_uang FOR SELECT
  TO authenticated
  USING (public.get_current_user_is_active());

CREATE POLICY "pemasukan_uang_insert_authenticated_active"
  ON pemasukan_uang FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "pemasukan_uang_update_authenticated_active"
  ON pemasukan_uang FOR UPDATE
  TO authenticated
  USING (public.get_current_user_is_active())
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "pemasukan_uang_delete_authenticated_active"
  ON pemasukan_uang FOR DELETE
  TO authenticated
  USING (public.get_current_user_is_active());

-- ============================================
-- PEMASUKAN_BERAS TABLE RLS FIX
-- ============================================
DROP POLICY IF EXISTS "pemasukan_beras_select_authenticated_active" ON pemasukan_beras;
DROP POLICY IF EXISTS "pemasukan_beras_insert_authenticated_active" ON pemasukan_beras;
DROP POLICY IF EXISTS "pemasukan_beras_update_authenticated_active" ON pemasukan_beras;
DROP POLICY IF EXISTS "pemasukan_beras_delete_authenticated_active" ON pemasukan_beras;

CREATE POLICY "pemasukan_beras_select_authenticated_active"
  ON pemasukan_beras FOR SELECT
  TO authenticated
  USING (public.get_current_user_is_active());

CREATE POLICY "pemasukan_beras_insert_authenticated_active"
  ON pemasukan_beras FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "pemasukan_beras_update_authenticated_active"
  ON pemasukan_beras FOR UPDATE
  TO authenticated
  USING (public.get_current_user_is_active())
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "pemasukan_beras_delete_authenticated_active"
  ON pemasukan_beras FOR DELETE
  TO authenticated
  USING (public.get_current_user_is_active());

-- ============================================
-- DISTRIBUSI_ZAKAT TABLE RLS FIX
-- ============================================
DROP POLICY IF EXISTS "distribusi_zakat_select_authenticated_active" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_zakat_insert_authenticated_active" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_zakat_update_authenticated_active" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_zakat_delete_authenticated_active" ON distribusi_zakat;

CREATE POLICY "distribusi_zakat_select_authenticated_active"
  ON distribusi_zakat FOR SELECT
  TO authenticated
  USING (public.get_current_user_is_active());

CREATE POLICY "distribusi_zakat_insert_authenticated_active"
  ON distribusi_zakat FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "distribusi_zakat_update_authenticated_active"
  ON distribusi_zakat FOR UPDATE
  TO authenticated
  USING (public.get_current_user_is_active())
  WITH CHECK (public.get_current_user_is_active());

CREATE POLICY "distribusi_zakat_delete_authenticated_active"
  ON distribusi_zakat FOR DELETE
  TO authenticated
  USING (public.get_current_user_is_active());
