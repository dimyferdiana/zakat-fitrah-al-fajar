-- =========================================
-- VIEW: account_latest_balances
-- Returns the latest running_balance_after_rp per account
-- Used by the accounts list table to show current saldo per rekening
-- =========================================

BEGIN;

CREATE OR REPLACE VIEW public.account_latest_balances
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (account_id)
  account_id,
  running_balance_after_rp AS current_balance,
  entry_date                AS last_entry_date
FROM public.account_ledger_entries
ORDER BY account_id, effective_at DESC, created_at DESC;

COMMIT;
