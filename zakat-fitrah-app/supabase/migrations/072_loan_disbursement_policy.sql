BEGIN;
CREATE OR REPLACE FUNCTION public.loan_disburse(
  p_loan_id UUID, p_date DATE, p_method TEXT, p_reference TEXT,
  p_funding_label TEXT, p_request_id UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_loan public.loans%ROWTYPE;
  v_policy public.loan_policies%ROWTYPE;
  v_existing public.loan_disbursements%ROWTYPE;
  v_schedule JSONB;
  v_total NUMERIC;
  v_first DATE;
  v_last DATE;
  v_tenor INTEGER;
  v_person UUID;
  v_region JSONB;
  v_conflict TEXT;
  v_type TEXT;
  v_violations TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_request_id IS NULL OR p_date IS NULL OR p_date > (now() AT TIME ZONE 'Asia/Jakarta')::date OR
     p_method IS NULL OR p_method NOT IN ('tunai', 'transfer', 'lainnya') OR
     p_funding_label IS NULL OR length(trim(p_funding_label)) = 0 THEN
    RAISE EXCEPTION 'Data pencairan tidak valid';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pinjaman tidak ditemukan'; END IF;
  SELECT * INTO v_existing FROM public.loan_disbursements WHERE request_id = p_request_id;
  IF FOUND THEN
    IF v_existing.loan_id <> p_loan_id OR v_existing.created_by <> auth.uid() OR
       v_existing.disbursement_date <> p_date OR v_existing.method <> p_method OR
       v_existing.reference IS DISTINCT FROM NULLIF(trim(p_reference), '') OR
       v_loan.funding_label IS DISTINCT FROM trim(p_funding_label) THEN
      RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk data berbeda';
    END IF;
    RETURN v_existing.id;
  END IF;
  IF v_loan.status <> 'draft' THEN RAISE EXCEPTION 'Pinjaman bukan draft'; END IF;
  PERFORM 1 FROM public.loan_customers WHERE id = v_loan.customer_id AND is_active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nasabah tidak aktif'; END IF;
  SELECT m.id, jsonb_build_object('alamat', m.alamat, 'rt', m.rt, 'rw', m.rw)
    INTO v_person, v_region FROM public.loan_customers c JOIN public.muzakki m ON m.id = c.person_id
    WHERE c.id = v_loan.customer_id AND m.aktif AND m.jenis_identitas = 'individu' AND m.identitas_terverifikasi;
  IF NOT FOUND THEN RAISE EXCEPTION 'Identitas nasabah belum diverifikasi'; END IF;
  SELECT loan_number INTO v_conflict FROM public.loans WHERE customer_id = v_loan.customer_id AND status IN ('active','needs_reconciliation') AND id <> p_loan_id LIMIT 1;
  IF v_conflict IS NOT NULL THEN RAISE EXCEPTION 'Nasabah masih memiliki kewajiban pinjaman aktif atau rekonsiliasi %', v_conflict; END IF;
  SELECT SUM(amount), MIN(due_date), MAX(due_date),
         jsonb_agg(jsonb_build_object('dueDate', due_date::text, 'amount', amount) ORDER BY installment_number)
    INTO v_total, v_first, v_last, v_schedule FROM public.loan_installments WHERE loan_id = p_loan_id;
  IF v_total IS DISTINCT FROM v_loan.principal OR v_first IS NULL OR v_first < p_date THEN
    RAISE EXCEPTION 'Jadwal tidak sesuai pokok atau tanggal pencairan';
  END IF;
  v_tenor := v_last - p_date;
  SELECT * INTO v_policy FROM public.loan_policies WHERE is_active FOR SHARE;
  IF FOUND THEN
    IF (v_policy.min_principal IS NOT NULL AND v_loan.principal < v_policy.min_principal) OR
       (v_policy.max_principal IS NOT NULL AND v_loan.principal > v_policy.max_principal) THEN v_violations := array_append(v_violations,'principal'); END IF;
    IF (v_policy.min_tenor_days IS NOT NULL AND v_tenor < v_policy.min_tenor_days) OR
       (v_policy.max_tenor_days IS NOT NULL AND v_tenor > v_policy.max_tenor_days) THEN v_violations := array_append(v_violations,'tenor'); END IF;
    IF v_policy.guarantor_required AND v_loan.guarantor_id IS NULL THEN v_violations := array_append(v_violations,'guarantor'); END IF;
    FOREACH v_type IN ARRAY v_violations LOOP
      IF NOT v_type=ANY(v_policy.permitted_exceptions) OR NOT EXISTS (
        SELECT 1 FROM public.loan_policy_exceptions e WHERE e.loan_id=p_loan_id AND e.policy_id=v_policy.id
          AND e.exception_type=v_type AND e.fingerprint=public.loan_exception_fingerprint(p_loan_id,p_date)
      ) THEN RAISE EXCEPTION 'Pinjaman melanggar kebijakan %; pengecualian yang sah diperlukan',v_type; END IF;
    END LOOP;
  END IF;
  IF v_loan.guarantor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.muzakki WHERE id=v_loan.guarantor_id AND id<>v_person AND aktif
      AND jenis_identitas='individu' AND identitas_terverifikasi
  ) THEN RAISE EXCEPTION 'Penjamin harus individu aktif yang terverifikasi'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.loan_documents d WHERE d.loan_id = p_loan_id AND d.kind = 'contract_signed'
      AND d.verified_by IS NOT NULL AND d.verified_at IS NOT NULL
      AND d.snapshot->>'loan_id' = p_loan_id::text
      AND d.snapshot->>'customer_id' = v_loan.customer_id::text
      AND d.snapshot->>'purpose' = v_loan.purpose
      AND d.snapshot->>'disbursement_date' = p_date::text
      AND d.snapshot->>'guarantor_id' IS NOT DISTINCT FROM v_loan.guarantor_id::text
      AND d.snapshot->'principal' = to_jsonb(v_loan.principal)
      AND d.snapshot->'schedule' = v_schedule
  ) THEN RAISE EXCEPTION 'Kontrak bertanda tangan yang sesuai belum diperiksa'; END IF;
  INSERT INTO public.loan_disbursements (loan_id, disbursement_date, amount, method, reference, created_by, request_id)
    VALUES (p_loan_id, p_date, v_loan.principal, p_method, NULLIF(trim(p_reference), ''), auth.uid(), p_request_id);
  UPDATE public.loans SET status = 'active', disbursement_date = p_date, funding_label = trim(p_funding_label),
    region_snapshot = v_region, policy_id = v_policy.id, updated_at = now() WHERE id = p_loan_id;
  INSERT INTO public.loan_audit (loan_id, actor_id, action, details)
    VALUES (p_loan_id, auth.uid(), 'disbursed', jsonb_build_object('request_id', p_request_id, 'amount', v_loan.principal));
  RETURN (SELECT id FROM public.loan_disbursements WHERE request_id = p_request_id);
END;
$$;
COMMIT;
