BEGIN;
CREATE FUNCTION public.loan_customer_portal_profile() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB;
BEGIN
 IF NOT public.loan_customer_session_valid() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('name',coalesce(nullif(m.nama_lengkap,''),m.nama_kk),
   'disbursed_known',coalesce((SELECT sum(d.amount) FROM public.loan_disbursements d JOIN public.loans l ON l.id=d.loan_id WHERE l.customer_id=c.id),0),
   'paid_known',coalesce((SELECT sum(p.amount) FROM public.loan_payments p JOIN public.loans l ON l.id=p.loan_id WHERE l.customer_id=c.id AND p.status='confirmed'),0),
   'incomplete_history',EXISTS(SELECT 1 FROM public.loans l WHERE l.customer_id=c.id AND l.historical_incomplete),
   'unverified_loan_ids',coalesce((SELECT jsonb_agg(l.id) FROM public.loans l WHERE l.customer_id=c.id AND l.migration_cutoff IS NOT NULL AND (
     l.opening_balance IS NULL OR NOT EXISTS(SELECT 1 FROM public.loan_installments i WHERE i.loan_id=l.id)
     OR EXISTS(SELECT 1 FROM public.loan_installments i WHERE i.loan_id=l.id AND i.opening_remaining IS NULL)
     OR l.opening_balance IS DISTINCT FROM (SELECT sum(i.opening_remaining) FROM public.loan_installments i WHERE i.loan_id=l.id)
     OR l.principal IS DISTINCT FROM (SELECT sum(i.amount) FROM public.loan_installments i WHERE i.loan_id=l.id)
   )),'[]'::jsonb),
   'contact',(SELECT jsonb_build_object('name',o.nama_lembaga,'phone',o.no_telp,'email',o.email) FROM public.org_settings o WHERE o.id='org')
 ) INTO result FROM public.loan_customers c JOIN public.muzakki m ON m.id=c.person_id WHERE c.auth_user_id=auth.uid() AND c.is_active AND NOT c.access_paused;
 IF result IS NULL THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.loan_customer_portal_profile() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_customer_portal_profile() TO authenticated;
COMMIT;
