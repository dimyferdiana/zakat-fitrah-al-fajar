-- Migration: 014_rls_invitation_auth.sql
-- Description: Update RLS policies to deny anon access and require authenticated + active users
-- Created: 2026-02-14

-- Drop existing RLS policies that allow anon access
-- We'll recreate them to require authenticated users with is_active = true

-- ============================================
-- MUSTAHIK TABLE RLS
-- ============================================
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON mustahik;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON mustahik;
DROP POLICY IF EXISTS "mustahik_select_policy" ON mustahik;
DROP POLICY IF EXISTS "mustahik_insert_policy" ON mustahik;
DROP POLICY IF EXISTS "mustahik_update_policy" ON mustahik;
DROP POLICY IF EXISTS "mustahik_delete_policy" ON mustahik;

CREATE POLICY "mustahik_select_authenticated_active"
  ON mustahik FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "mustahik_insert_authenticated_active"
  ON mustahik FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "mustahik_update_authenticated_active"
  ON mustahik FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "mustahik_delete_authenticated_active"
  ON mustahik FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

-- ============================================
-- MUZAKKI TABLE RLS
-- ============================================
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON muzakki;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON muzakki;
DROP POLICY IF EXISTS "muzakki_select_policy" ON muzakki;
DROP POLICY IF EXISTS "muzakki_insert_policy" ON muzakki;
DROP POLICY IF EXISTS "muzakki_update_policy" ON muzakki;
DROP POLICY IF EXISTS "muzakki_delete_policy" ON muzakki;

CREATE POLICY "muzakki_select_authenticated_active"
  ON muzakki FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "muzakki_insert_authenticated_active"
  ON muzakki FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "muzakki_update_authenticated_active"
  ON muzakki FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "muzakki_delete_authenticated_active"
  ON muzakki FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

-- ============================================
-- PEMASUKAN_UANG TABLE RLS
-- ============================================
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON pemasukan_uang;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON pemasukan_uang;
DROP POLICY IF EXISTS "pemasukan_uang_select_policy" ON pemasukan_uang;
DROP POLICY IF EXISTS "pemasukan_uang_insert_policy" ON pemasukan_uang;
DROP POLICY IF EXISTS "pemasukan_uang_update_policy" ON pemasukan_uang;
DROP POLICY IF EXISTS "pemasukan_uang_delete_policy" ON pemasukan_uang;

CREATE POLICY "pemasukan_uang_select_authenticated_active"
  ON pemasukan_uang FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "pemasukan_uang_insert_authenticated_active"
  ON pemasukan_uang FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "pemasukan_uang_update_authenticated_active"
  ON pemasukan_uang FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "pemasukan_uang_delete_authenticated_active"
  ON pemasukan_uang FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

-- ============================================
-- PEMASUKAN_BERAS TABLE RLS
-- ============================================
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON pemasukan_beras;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON pemasukan_beras;
DROP POLICY IF EXISTS "pemasukan_beras_select_policy" ON pemasukan_beras;
DROP POLICY IF EXISTS "pemasukan_beras_insert_policy" ON pemasukan_beras;
DROP POLICY IF EXISTS "pemasukan_beras_update_policy" ON pemasukan_beras;
DROP POLICY IF EXISTS "pemasukan_beras_delete_policy" ON pemasukan_beras;

CREATE POLICY "pemasukan_beras_select_authenticated_active"
  ON pemasukan_beras FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "pemasukan_beras_insert_authenticated_active"
  ON pemasukan_beras FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "pemasukan_beras_update_authenticated_active"
  ON pemasukan_beras FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "pemasukan_beras_delete_authenticated_active"
  ON pemasukan_beras FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

-- ============================================
-- DISTRIBUSI_ZAKAT TABLE RLS
-- ============================================
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON distribusi_zakat;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_select_policy" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_insert_policy" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_update_policy" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_delete_policy" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_zakat_select_policy" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_zakat_insert_policy" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_zakat_update_policy" ON distribusi_zakat;
DROP POLICY IF EXISTS "distribusi_zakat_delete_policy" ON distribusi_zakat;

CREATE POLICY "distribusi_zakat_select_authenticated_active"
  ON distribusi_zakat FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "distribusi_zakat_insert_authenticated_active"
  ON distribusi_zakat FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "distribusi_zakat_update_authenticated_active"
  ON distribusi_zakat FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "distribusi_zakat_delete_authenticated_active"
  ON distribusi_zakat FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

-- ============================================
-- USER_INVITATIONS TABLE RLS
-- ============================================
-- Only admins can manage invitations
CREATE POLICY "user_invitations_select_admin_only"
  ON user_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "user_invitations_insert_admin_only"
  ON user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "user_invitations_update_admin_only"
  ON user_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "user_invitations_delete_admin_only"
  ON user_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- ============================================
-- USERS TABLE RLS
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read their own data" ON users;
DROP POLICY IF EXISTS "Allow admin to read all users" ON users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON users;
DROP POLICY IF EXISTS "Allow admin to update users" ON users;

-- All users can read their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all user profiles
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND u.is_active = true
    )
  );

-- Users can update their own profile (nama_lengkap, address, phone only)
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM users WHERE id = auth.uid()) -- Cannot change own role
    AND is_active = (SELECT is_active FROM users WHERE id = auth.uid()) -- Cannot change own active status
  );

-- Admins can update any user (including role and is_active)
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND u.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND u.is_active = true
    )
  );

-- ============================================
-- Additional tables that may need RLS updates
-- ============================================

-- TAHUN_ZAKAT TABLE
DROP POLICY IF EXISTS "tahun_zakat_select_policy" ON tahun_zakat;
DROP POLICY IF EXISTS "tahun_zakat_insert_policy" ON tahun_zakat;
DROP POLICY IF EXISTS "tahun_zakat_update_policy" ON tahun_zakat;
DROP POLICY IF EXISTS "tahun_zakat_delete_policy" ON tahun_zakat;

CREATE POLICY "tahun_zakat_select_authenticated_active"
  ON tahun_zakat FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "tahun_zakat_insert_admin_active"
  ON tahun_zakat FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "tahun_zakat_update_admin_active"
  ON tahun_zakat FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "tahun_zakat_delete_admin_active"
  ON tahun_zakat FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- REKONSILIASI TABLE
DROP POLICY IF EXISTS "rekonsiliasi_select_policy" ON rekonsiliasi;
DROP POLICY IF EXISTS "rekonsiliasi_insert_policy" ON rekonsiliasi;
DROP POLICY IF EXISTS "rekonsiliasi_update_policy" ON rekonsiliasi;
DROP POLICY IF EXISTS "rekonsiliasi_delete_policy" ON rekonsiliasi;

CREATE POLICY "rekonsiliasi_select_admin_active"
  ON rekonsiliasi FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "rekonsiliasi_insert_admin_active"
  ON rekonsiliasi FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "rekonsiliasi_update_admin_active"
  ON rekonsiliasi FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "rekonsiliasi_delete_admin_active"
  ON rekonsiliasi FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- HAK_AMIL TABLE
DROP POLICY IF EXISTS "hak_amil_select_policy" ON hak_amil;
DROP POLICY IF EXISTS "hak_amil_insert_policy" ON hak_amil;
DROP POLICY IF EXISTS "hak_amil_update_policy" ON hak_amil;
DROP POLICY IF EXISTS "hak_amil_delete_policy" ON hak_amil;

CREATE POLICY "hak_amil_select_admin_active"
  ON hak_amil FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "hak_amil_insert_admin_active"
  ON hak_amil FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "hak_amil_update_admin_active"
  ON hak_amil FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

CREATE POLICY "hak_amil_delete_admin_active"
  ON hak_amil FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.is_active = true
    )
  );

-- Sedekah tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sedekah') THEN
    DROP POLICY IF EXISTS "sedekah_select_policy" ON sedekah;
    DROP POLICY IF EXISTS "sedekah_insert_policy" ON sedekah;
    DROP POLICY IF EXISTS "sedekah_update_policy" ON sedekah;
    DROP POLICY IF EXISTS "sedekah_delete_policy" ON sedekah;

    CREATE POLICY "sedekah_select_authenticated_active"
      ON sedekah FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_active = true
        )
      );

    CREATE POLICY "sedekah_insert_authenticated_active"
      ON sedekah FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_active = true
        )
      );

    CREATE POLICY "sedekah_update_authenticated_active"
      ON sedekah FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_active = true
        )
      );

    CREATE POLICY "sedekah_delete_authenticated_active"
      ON sedekah FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_active = true
        )
      );
  END IF;
END $$;

-- PEMBAYARAN_ZAKAT TABLE RLS
DROP POLICY IF EXISTS "pembayaran_zakat_select_policy" ON pembayaran_zakat;
DROP POLICY IF EXISTS "pembayaran_zakat_insert_policy" ON pembayaran_zakat;
DROP POLICY IF EXISTS "pembayaran_zakat_update_policy" ON pembayaran_zakat;
DROP POLICY IF EXISTS "pembayaran_zakat_delete_policy" ON pembayaran_zakat;

CREATE POLICY "pembayaran_zakat_select_authenticated_active"
  ON pembayaran_zakat FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "pembayaran_zakat_insert_authenticated_active"
  ON pembayaran_zakat FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "pembayaran_zakat_update_authenticated_active"
  ON pembayaran_zakat FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "pembayaran_zakat_delete_authenticated_active"
  ON pembayaran_zakat FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

-- BUKTI_SEDEKAH TABLE RLS
DROP POLICY IF EXISTS "bukti_sedekah_select_policy" ON bukti_sedekah;
DROP POLICY IF EXISTS "bukti_sedekah_insert_policy" ON bukti_sedekah;
DROP POLICY IF EXISTS "bukti_sedekah_update_policy" ON bukti_sedekah;
DROP POLICY IF EXISTS "bukti_sedekah_delete_policy" ON bukti_sedekah;

CREATE POLICY "bukti_sedekah_select_authenticated_active"
  ON bukti_sedekah FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "bukti_sedekah_insert_authenticated_active"
  ON bukti_sedekah FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "bukti_sedekah_update_authenticated_active"
  ON bukti_sedekah FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

CREATE POLICY "bukti_sedekah_delete_authenticated_active"
  ON bukti_sedekah FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_active = true
    )
  );

COMMENT ON POLICY "mustahik_select_authenticated_active" ON mustahik IS 'Only authenticated and active users can read mustahik data';
COMMENT ON POLICY "muzakki_select_authenticated_active" ON muzakki IS 'Only authenticated and active users can read muzakki data';
COMMENT ON POLICY "user_invitations_select_admin_only" ON user_invitations IS 'Only active admins can manage user invitations';
COMMENT ON POLICY "users_select_own" ON users IS 'Users can read their own profile';
COMMENT ON POLICY "users_select_admin" ON users IS 'Active admins can read all user profiles';
