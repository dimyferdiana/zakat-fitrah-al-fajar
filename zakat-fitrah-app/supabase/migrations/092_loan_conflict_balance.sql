BEGIN;
-- Preserve the existing atomic disbursement implementation; enhance its conflict
-- message while holding the same loan-then-customer locks that protect issuance.
ALTER FUNCTION public.loan_disburse(UUID,DATE,TEXT,TEXT,TEXT,UUID) RENAME TO loan_disburse_impl_092;
REVOKE ALL ON FUNCTION public.loan_disburse_impl_092(UUID,DATE,TEXT,TEXT,TEXT,UUID) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.loan_disburse(p_loan_id UUID,p_date DATE,p_method TEXT,p_reference TEXT,p_funding_label TEXT,p_request_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_loan public.loans%ROWTYPE; v_obligation RECORD;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  -- Do not reject a retry merely because a later loan was opened in the meantime.
  IF EXISTS(SELECT 1 FROM public.loan_disbursements WHERE request_id=p_request_id) THEN
    RETURN public.loan_disburse_impl_092(p_loan_id,p_date,p_method,p_reference,p_funding_label,p_request_id);
  END IF;
  SELECT * INTO v_loan FROM public.loans WHERE id=p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pinjaman tidak ditemukan'; END IF;
  PERFORM 1 FROM public.loan_customers WHERE id=v_loan.customer_id FOR UPDATE;
  SELECT * INTO v_obligation FROM public.loan_customer_obligations(v_loan.customer_id)
    WHERE loan_number<>v_loan.loan_number LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Nasabah masih memiliki pinjaman aktif atau rekonsiliasi %; sisa %',
      v_obligation.loan_number,CASE WHEN v_obligation.remaining IS NULL THEN 'belum dapat dihitung' ELSE 'Rp' || v_obligation.remaining::TEXT END;
  END IF;
  RETURN public.loan_disburse_impl_092(p_loan_id,p_date,p_method,p_reference,p_funding_label,p_request_id);
END; $$;
REVOKE ALL ON FUNCTION public.loan_disburse(UUID,DATE,TEXT,TEXT,TEXT,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_disburse(UUID,DATE,TEXT,TEXT,TEXT,UUID) TO authenticated;
COMMIT;
