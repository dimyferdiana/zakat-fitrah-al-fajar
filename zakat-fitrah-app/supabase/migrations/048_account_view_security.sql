-- This legacy view exists in some deployed databases but not in the repository's
-- baseline migrations. When present, execute it with the caller's permissions
-- so that account/ledger RLS is not bypassed by the view owner.
BEGIN;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'account_latest_balances' AND c.relkind = 'v'
  ) THEN
    IF current_setting('server_version_num')::integer < 150000 THEN
      RAISE EXCEPTION 'account_latest_balances requires PostgreSQL 15 or newer for security_invoker';
    END IF;
    ALTER VIEW public.account_latest_balances SET (security_invoker = true);
  END IF;
END;
$$;
COMMIT;
