-- =========================================
-- RLS: ACCOUNTS + ACCOUNT LEDGER ENTRIES
-- =========================================

BEGIN;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_ledger_entries ENABLE ROW LEVEL SECURITY;

-- ACCOUNTS POLICIES
DROP POLICY IF EXISTS "accounts_select_admin_bendahara_petugas_active" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_admin_bendahara_active" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_admin_bendahara_active" ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete_admin_bendahara_active" ON public.accounts;

CREATE POLICY "accounts_select_admin_bendahara_petugas_active"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara', 'petugas')
  );

CREATE POLICY "accounts_insert_admin_bendahara_active"
  ON public.accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

CREATE POLICY "accounts_update_admin_bendahara_active"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

CREATE POLICY "accounts_delete_admin_bendahara_active"
  ON public.accounts FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

-- ACCOUNT_LEDGER_ENTRIES POLICIES
DROP POLICY IF EXISTS "account_ledger_entries_select_admin_bendahara_petugas_active" ON public.account_ledger_entries;
DROP POLICY IF EXISTS "account_ledger_entries_insert_admin_bendahara_active" ON public.account_ledger_entries;
DROP POLICY IF EXISTS "account_ledger_entries_update_admin_bendahara_active" ON public.account_ledger_entries;
DROP POLICY IF EXISTS "account_ledger_entries_delete_admin_bendahara_active" ON public.account_ledger_entries;

CREATE POLICY "account_ledger_entries_select_admin_bendahara_petugas_active"
  ON public.account_ledger_entries FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara', 'petugas')
  );

CREATE POLICY "account_ledger_entries_insert_admin_bendahara_active"
  ON public.account_ledger_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

CREATE POLICY "account_ledger_entries_update_admin_bendahara_active"
  ON public.account_ledger_entries FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

CREATE POLICY "account_ledger_entries_delete_admin_bendahara_active"
  ON public.account_ledger_entries FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

COMMIT;
