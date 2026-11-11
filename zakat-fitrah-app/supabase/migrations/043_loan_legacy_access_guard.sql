-- Existing policies such as bukti_sedekah SELECT USING (true) also apply to
-- customer sessions. Add a restrictive guard to existing public RLS tables.
-- Loan-only accounts do not receive a public.users staff profile.
BEGIN;

CREATE OR REPLACE FUNCTION public.loan_has_active_legacy_profile() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_active)
$$;

DO $$
DECLARE
  relation RECORD;
BEGIN
  FOR relation IN
    SELECT n.nspname, c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity
      AND c.relname NOT IN ('loan_customers', 'loan_categories', 'loan_policies', 'loans',
                            'loan_installments', 'loan_payments', 'loan_documents', 'loan_audit')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS loan_legacy_profile_guard ON %I.%I', relation.nspname, relation.relname);
    EXECUTE format(
      'CREATE POLICY loan_legacy_profile_guard ON %I.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.loan_has_active_legacy_profile()) WITH CHECK (public.loan_has_active_legacy_profile())',
      relation.nspname, relation.relname
    );
  END LOOP;
END;
$$;

COMMIT;
