-- Fix: Add petugas role to account_ledger_entries INSERT/UPDATE/DELETE policies
-- petugas can input transactions (pemasukan_uang, pemasukan_beras, pembayaran_zakat)
-- so they must also be able to write to account_ledger_entries (double-entry ledger).
-- Previously only admin + bendahara were granted write access, causing 403 for petugas.

BEGIN;

-- DROP old write policies
DROP POLICY IF EXISTS "account_ledger_entries_insert_admin_bendahara_active" ON public.account_ledger_entries;
DROP POLICY IF EXISTS "account_ledger_entries_update_admin_bendahara_active" ON public.account_ledger_entries;
DROP POLICY IF EXISTS "account_ledger_entries_delete_admin_bendahara_active" ON public.account_ledger_entries;

-- Recreate with petugas included
CREATE POLICY "account_ledger_entries_insert_admin_bendahara_petugas_active"
  ON public.account_ledger_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara', 'petugas')
  );

CREATE POLICY "account_ledger_entries_update_admin_bendahara_petugas_active"
  ON public.account_ledger_entries FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara', 'petugas')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara', 'petugas')
  );

CREATE POLICY "account_ledger_entries_delete_admin_bendahara_petugas_active"
  ON public.account_ledger_entries FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara', 'petugas')
  );

COMMIT;
