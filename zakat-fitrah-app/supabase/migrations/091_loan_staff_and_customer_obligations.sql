BEGIN;
CREATE FUNCTION public.loan_staff_choices() RETURNS TABLE(id UUID,nama_lengkap TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT u.id,u.nama_lengkap FROM public.users u WHERE u.is_active AND u.role::text IN ('admin','petugas') ORDER BY u.nama_lengkap,u.id;
END; $$;

CREATE FUNCTION public.loan_customer_obligations(p_customer UUID)
RETURNS TABLE(loan_number TEXT,status TEXT,remaining NUMERIC)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  RETURN QUERY
    WITH b AS (
      SELECT l.id,l.loan_number,l.status,l.principal,l.migration_cutoff,l.opening_balance,
        (SELECT count(*) FROM public.loan_installments i WHERE i.loan_id=l.id) AS n,
        (SELECT count(*) FROM public.loan_installments i WHERE i.loan_id=l.id AND i.opening_remaining IS NULL) AS unknown,
        (SELECT sum(CASE WHEN l.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END) FROM public.loan_installments i WHERE i.loan_id=l.id) AS scheduled,
        COALESCE((SELECT sum(p.amount) FROM public.loan_payments p WHERE p.loan_id=l.id AND p.status='confirmed'
          AND (l.migration_cutoff IS NULL OR p.payment_date>l.migration_cutoff)),0) AS paid
      FROM public.loans l WHERE l.customer_id=p_customer AND l.status IN ('active','needs_reconciliation')
    )
    SELECT b.loan_number,b.status,CASE WHEN b.n=0 OR (b.migration_cutoff IS NOT NULL AND (b.unknown>0 OR b.opening_balance IS NULL OR b.scheduled<>b.opening_balance))
      OR (b.migration_cutoff IS NULL AND b.scheduled<>b.principal) OR b.paid>b.scheduled
      THEN NULL ELSE b.scheduled-b.paid END FROM b ORDER BY b.loan_number;
END; $$;
REVOKE ALL ON FUNCTION public.loan_staff_choices(),public.loan_customer_obligations(UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_staff_choices(),public.loan_customer_obligations(UUID) TO authenticated;
COMMIT;
