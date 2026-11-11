BEGIN;

-- These checks depend on the authenticated session, not on the row. The
-- uncorrelated subqueries let PostgreSQL evaluate them once per statement.
-- Their predicates and the roles to which the policies apply are unchanged.
ALTER POLICY loan_customers_read ON public.loan_customers
  USING ((SELECT public.loan_is_staff()));
ALTER POLICY loans_read ON public.loans
  USING ((SELECT public.loan_is_staff()));
ALTER POLICY muzakki_select_authenticated_active ON public.muzakki
  USING ((SELECT public.get_current_user_is_active()));
ALTER POLICY loan_legacy_profile_guard ON public.muzakki
  USING ((SELECT public.loan_has_active_legacy_profile()))
  WITH CHECK ((SELECT public.loan_has_active_legacy_profile()));

COMMIT;
