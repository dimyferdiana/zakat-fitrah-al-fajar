BEGIN;
-- This projection is staff-only and contains neither internal notes nor account data.
-- Amounts are recomputed from the latest confirmed transaction states by the client.
CREATE FUNCTION public.loan_dashboard_report_data() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object(
  'id',l.id,'number',l.loan_number,'customer_id',l.customer_id,'name',coalesce(nullif(m.nama_lengkap,''),m.nama_kk),
  'category_id',l.category_id,'category',coalesce(cat.name,'Belum dikategorikan'), 'purpose',l.purpose,
  'principal',l.principal,'status',l.status,'disbursement_date',l.disbursement_date,
  'region',l.region_snapshot,'migration_cutoff',l.migration_cutoff,'opening_balance',l.opening_balance,
  'historical_incomplete',l.historical_incomplete,
  'disbursement',(SELECT jsonb_build_object('date',d.disbursement_date,'amount',d.amount) FROM public.loan_disbursements d WHERE d.loan_id=l.id),
  'installments',coalesce((SELECT jsonb_agg(jsonb_build_object('dueDate',i.due_date,'amount',i.amount,'opening_remaining',i.opening_remaining) ORDER BY i.installment_number) FROM public.loan_installments i WHERE i.loan_id=l.id),'[]'::jsonb),
  'payments',coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'date',p.payment_date,'amount',p.amount,'status',p.status) ORDER BY p.payment_date,p.id) FROM public.loan_payments p WHERE p.loan_id=l.id),'[]'::jsonb),
  'followups',coalesce((SELECT jsonb_agg(jsonb_build_object('promise_date',f.promise_date,'promise_amount',f.promise_amount,'next_followup_date',f.next_followup_date) ORDER BY f.followup_date DESC,f.created_at DESC) FROM public.loan_followups f WHERE f.loan_id=l.id),'[]'::jsonb),
  'has_contract',EXISTS(SELECT 1 FROM public.loan_documents d WHERE d.loan_id=l.id AND d.kind='contract_signed' AND d.verified_by IS NOT NULL AND d.verified_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.loan_contract_invalidations x WHERE x.document_id=d.id))
 ) ORDER BY l.created_at DESC),'[]'::jsonb) INTO result
 FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id JOIN public.muzakki m ON m.id=c.person_id
 LEFT JOIN public.loan_categories cat ON cat.id=l.category_id;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.loan_dashboard_report_data() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_dashboard_report_data() TO authenticated;
COMMIT;
