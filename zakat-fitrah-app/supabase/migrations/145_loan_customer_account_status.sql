BEGIN;
CREATE FUNCTION public.loan_customer_account_status(p_customer_id UUID)
RETURNS TABLE(has_account BOOLEAN, is_active BOOLEAN, access_paused BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT c.auth_user_id IS NOT NULL, c.is_active, c.access_paused
 FROM public.loan_customers c WHERE c.id=p_customer_id;
END; $$;
REVOKE ALL ON FUNCTION public.loan_customer_account_status(UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_customer_account_status(UUID) TO authenticated;
COMMIT;
