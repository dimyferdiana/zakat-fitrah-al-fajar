BEGIN;
-- Read-only guidance; loan_disburse remains the final authority and locks rows.
CREATE FUNCTION public.loan_draft_readiness(p_loan_id UUID,p_date DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.loans%ROWTYPE; person_id UUID; person_ok BOOLEAN; schedule_json JSONB; schedule_sum NUMERIC; first_due DATE; last_due DATE;
 contract_ok BOOLEAN; conflict_number TEXT; policy_row public.loan_policies%ROWTYPE; policy_reasons TEXT[]:=ARRAY[]::TEXT[]; issue TEXT;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 SELECT * INTO l FROM public.loans WHERE id=p_loan_id;
 IF NOT FOUND OR l.status<>'draft' THEN RAISE EXCEPTION 'Draf tidak tersedia' USING ERRCODE='22023'; END IF;
 SELECT c.person_id,(c.is_active AND m.aktif AND m.jenis_identitas='individu' AND m.identitas_terverifikasi)
 INTO person_id,person_ok FROM public.loan_customers c JOIN public.muzakki m ON m.id=c.person_id WHERE c.id=l.customer_id;
 SELECT sum(i.amount),min(i.due_date),max(i.due_date),jsonb_agg(jsonb_build_object('dueDate',i.due_date::text,'amount',i.amount) ORDER BY i.installment_number)
 INTO schedule_sum,first_due,last_due,schedule_json FROM public.loan_installments i WHERE i.loan_id=l.id;
 SELECT loan_number INTO conflict_number FROM public.loans WHERE customer_id=l.customer_id AND id<>l.id AND status IN ('active','needs_reconciliation') ORDER BY created_at,id LIMIT 1;
 SELECT * INTO policy_row FROM public.loan_policies WHERE is_active;
 IF policy_row.id IS NOT NULL THEN
  IF (policy_row.min_principal IS NOT NULL AND l.principal<policy_row.min_principal) OR (policy_row.max_principal IS NOT NULL AND l.principal>policy_row.max_principal) THEN policy_reasons:=array_append(policy_reasons,'principal'); END IF;
  IF p_date IS NOT NULL AND last_due IS NOT NULL AND ((policy_row.min_tenor_days IS NOT NULL AND last_due-p_date<policy_row.min_tenor_days) OR (policy_row.max_tenor_days IS NOT NULL AND last_due-p_date>policy_row.max_tenor_days)) THEN policy_reasons:=array_append(policy_reasons,'tenor'); END IF;
  IF policy_row.guarantor_required AND l.guarantor_id IS NULL THEN policy_reasons:=array_append(policy_reasons,'guarantor'); END IF;
  FOREACH issue IN ARRAY policy_reasons LOOP
   IF issue=ANY(policy_row.permitted_exceptions) AND p_date IS NOT NULL AND EXISTS(SELECT 1 FROM public.loan_policy_exceptions e WHERE e.loan_id=l.id AND e.policy_id=policy_row.id AND e.exception_type=issue AND e.fingerprint=public.loan_exception_fingerprint(l.id,p_date)) THEN policy_reasons:=array_remove(policy_reasons,issue); END IF;
  END LOOP;
 END IF;
 SELECT EXISTS(SELECT 1 FROM public.loan_documents d WHERE d.loan_id=l.id AND d.kind='contract_signed' AND d.verified_by IS NOT NULL AND d.verified_at IS NOT NULL
  AND NOT EXISTS(SELECT 1 FROM public.loan_contract_invalidations x WHERE x.document_id=d.id)
  AND d.snapshot->>'loan_id'=l.id::text AND d.snapshot->>'customer_id'=l.customer_id::text AND d.snapshot->>'purpose'=l.purpose
  AND d.snapshot->>'disbursement_date'=p_date::text AND d.snapshot->>'guarantor_id' IS NOT DISTINCT FROM l.guarantor_id::text
  AND d.snapshot->'principal'=to_jsonb(l.principal) AND d.snapshot->'schedule'=schedule_json
  AND d.snapshot->'customer_identity'=public.loan_contract_person_snapshot(person_id)
  AND d.snapshot->'guarantor_identity' IS NOT DISTINCT FROM coalesce(CASE WHEN l.guarantor_id IS NULL THEN NULL ELSE public.loan_contract_person_snapshot(l.guarantor_id) END,'null'::jsonb)
  AND (l.guarantor_id IS NULL OR (d.snapshot->>'guarantor_relationship'=l.guarantor_relationship AND d.snapshot->>'guarantor_contact'=l.guarantor_contact))) INTO contract_ok;
 RETURN jsonb_build_object('customer_id',l.customer_id,'person_ok',coalesce(person_ok,false),
  'schedule_ok',(schedule_sum IS NOT DISTINCT FROM l.principal AND first_due IS NOT NULL AND (p_date IS NULL OR first_due>=p_date)),
  'contract_ok',contract_ok,'conflict_number',conflict_number,'policy_reasons',to_jsonb(policy_reasons),
  'guarantor_ok',(l.guarantor_id IS NULL OR EXISTS(SELECT 1 FROM public.muzakki WHERE id=l.guarantor_id AND id<>person_id AND aktif AND jenis_identitas='individu' AND identitas_terverifikasi)));
END; $$;
REVOKE ALL ON FUNCTION public.loan_draft_readiness(UUID,DATE) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_draft_readiness(UUID,DATE) TO authenticated;
COMMIT;
