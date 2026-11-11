BEGIN;
CREATE FUNCTION public.loan_submit_payment_claim(
  p_loan_id UUID, p_payment_date DATE, p_amount BIGINT, p_reference TEXT,
  p_actor_id UUID, p_request_id UUID, p_path TEXT, p_sha256 TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE v_loan public.loans%ROWTYPE; v_existing public.loan_payments%ROWTYPE; v_id UUID;
BEGIN
  IF p_actor_id IS NULL OR p_request_id IS NULL OR p_payment_date IS NULL OR p_amount IS NULL OR p_amount <= 0
    OR p_sha256 IS NULL OR p_sha256 !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Data klaim tidak valid'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.loan_customers WHERE id = v_loan.customer_id AND auth_user_id = p_actor_id AND is_active) THEN
    RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_existing FROM public.loan_payments WHERE idempotency_key = p_request_id;
  IF FOUND THEN
    IF v_existing.loan_id <> p_loan_id OR v_existing.created_by <> p_actor_id OR v_existing.payment_date <> p_payment_date
      OR v_existing.amount <> p_amount OR v_existing.reference IS DISTINCT FROM NULLIF(trim(p_reference), '')
      OR NOT EXISTS (SELECT 1 FROM public.loan_documents WHERE payment_id = v_existing.id AND storage_path = p_path AND snapshot->>'file_sha256' = p_sha256)
      OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'pinjaman-jamaah-private' AND name = p_path) THEN
      RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk data berbeda';
    END IF;
    RETURN v_existing.id;
  END IF;
  IF v_loan.status <> 'active' OR p_payment_date > (now() AT TIME ZONE 'Asia/Jakarta')::date
    OR (v_loan.disbursement_date IS NOT NULL AND p_payment_date < v_loan.disbursement_date)
    OR (v_loan.migration_cutoff IS NOT NULL AND p_payment_date <= v_loan.migration_cutoff)
    OR p_path IS NULL OR split_part(p_path, '/', 1) <> p_loan_id::text
    OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'pinjaman-jamaah-private' AND name = p_path) THEN
    RAISE EXCEPTION 'Klaim atau bukti tidak valid';
  END IF;
  INSERT INTO public.loan_payments (loan_id, payment_date, amount, method, reference, status, created_by, idempotency_key)
    VALUES (p_loan_id, p_payment_date, p_amount, 'transfer', NULLIF(trim(p_reference), ''), 'pending', p_actor_id, p_request_id) RETURNING id INTO v_id;
  INSERT INTO public.loan_documents (loan_id, payment_id, kind, storage_path, snapshot, shared_with_customer, created_by, request_id)
    VALUES (p_loan_id, v_id, 'payment_evidence', p_path, jsonb_build_object('file_sha256', p_sha256), true, p_actor_id, p_request_id);
  INSERT INTO public.loan_audit (loan_id, actor_id, action, details)
    VALUES (p_loan_id, p_actor_id, 'payment_claim_submitted', jsonb_build_object('payment_id', v_id));
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_submit_payment_claim(UUID, DATE, BIGINT, TEXT, UUID, UUID, TEXT, TEXT) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.loan_submit_payment_claim(UUID, DATE, BIGINT, TEXT, UUID, UUID, TEXT, TEXT) TO service_role;

CREATE FUNCTION public.loan_review_payment_claim(p_payment_id UUID, p_accept BOOLEAN, p_reason TEXT DEFAULT NULL) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_loan public.loans%ROWTYPE; v_payment public.loan_payments%ROWTYPE; v_loan_id UUID; v_paid NUMERIC; v_base BIGINT;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_accept IS NULL OR (NOT p_accept AND coalesce(length(trim(p_reason)), 0) = 0) THEN RAISE EXCEPTION 'Alasan penolakan wajib diisi'; END IF;
  SELECT loan_id INTO v_loan_id FROM public.loan_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Klaim tidak ditemukan'; END IF;
  SELECT * INTO v_loan FROM public.loans WHERE id = v_loan_id FOR UPDATE;
  SELECT * INTO v_payment FROM public.loan_payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.status <> 'pending' THEN RAISE EXCEPTION 'Klaim sudah diperiksa'; END IF;
  IF p_accept THEN
    IF v_loan.status <> 'active' THEN RAISE EXCEPTION 'Pinjaman tidak aktif'; END IF;
    v_base := coalesce(v_loan.opening_balance, v_loan.principal);
    SELECT coalesce(sum(amount), 0) INTO v_paid FROM public.loan_payments WHERE loan_id = v_loan.id AND status = 'confirmed'
      AND (v_loan.migration_cutoff IS NULL OR payment_date > v_loan.migration_cutoff);
    IF v_payment.amount > v_base - v_paid THEN RAISE EXCEPTION 'Klaim melebihi sisa pokok'; END IF;
    UPDATE public.loan_payments SET status = 'confirmed', verified_by = auth.uid(), verified_at = now() WHERE id = p_payment_id;
    IF v_paid + v_payment.amount = v_base THEN UPDATE public.loans SET status = 'paid', updated_at = now() WHERE id = v_loan.id; END IF;
  ELSE
    UPDATE public.loan_payments SET status = 'rejected', reason = trim(p_reason), verified_by = auth.uid(), verified_at = now() WHERE id = p_payment_id;
  END IF;
  INSERT INTO public.loan_audit (loan_id, actor_id, action, details)
    VALUES (v_loan.id, auth.uid(), CASE WHEN p_accept THEN 'payment_claim_confirmed' ELSE 'payment_claim_rejected' END, jsonb_build_object('payment_id', p_payment_id, 'reason', CASE WHEN p_accept THEN NULL ELSE trim(p_reason) END));
END;
$$;
REVOKE ALL ON FUNCTION public.loan_review_payment_claim(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loan_review_payment_claim(UUID, BOOLEAN, TEXT) TO authenticated;
COMMIT;
