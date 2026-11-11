BEGIN;
CREATE FUNCTION public.loan_print_document_data(p_loan_id UUID) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB;
BEGIN
 IF NOT public.loan_is_staff() AND NOT public.loan_is_owner(p_loan_id) THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object(
   'loan_number',l.loan_number,'customer_name',coalesce(m.nama_lengkap,m.nama_kk),'purpose',l.purpose,
   'principal',l.principal,'status',l.status,'migration_cutoff',l.migration_cutoff,
   'disbursement',(SELECT jsonb_build_object('date',d.disbursement_date,'amount',d.amount,'method',d.method,'reference',d.reference) FROM public.loan_disbursements d WHERE d.loan_id=l.id),
   'schedule',coalesce((SELECT jsonb_agg(jsonb_build_object('date',i.due_date,'amount',i.amount,'opening_remaining',i.opening_remaining) ORDER BY i.installment_number) FROM public.loan_installments i WHERE i.loan_id=l.id),'[]'::jsonb),
   'payments',coalesce((SELECT jsonb_agg(jsonb_build_object('date',p.payment_date,'amount',p.amount,'status',p.status,'method',p.method) ORDER BY p.payment_date,p.id) FROM public.loan_payments p WHERE p.loan_id=l.id),'[]'::jsonb)
 ) INTO result FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id JOIN public.muzakki m ON m.id=c.person_id WHERE l.id=p_loan_id;
 IF result IS NULL THEN RAISE EXCEPTION 'Pinjaman tidak ditemukan'; END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.loan_print_document_data(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_print_document_data(UUID) TO authenticated;
COMMIT;
