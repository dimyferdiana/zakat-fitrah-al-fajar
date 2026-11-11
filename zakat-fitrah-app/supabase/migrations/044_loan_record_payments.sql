-- Staff-only payment operations. No ledger or donation records are written.
BEGIN;

CREATE OR REPLACE FUNCTION public.loan_record_payment(
  p_loan_id UUID, p_payment_date DATE, p_amount BIGINT,
  p_method TEXT, p_reference TEXT, p_request_id UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_loan public.loans%ROWTYPE;
  v_existing public.loan_payments%ROWTYPE;
  v_paid NUMERIC;
  v_base BIGINT;
BEGIN
  IF NOT public.loan_is_staff() THEN
    RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_amount IS NULL OR p_amount <= 0 OR p_payment_date IS NULL OR
     p_method IS NULL OR p_method NOT IN ('tunai', 'transfer', 'lainnya') THEN
    RAISE EXCEPTION 'Data pembayaran tidak valid';
  END IF;
  -- Serialize both retries and requests for the same loan before validating the balance.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pinjaman tidak ditemukan'; END IF;
  SELECT * INTO v_existing FROM public.loan_payments WHERE idempotency_key = p_request_id;
  IF FOUND THEN
    IF v_existing.loan_id <> p_loan_id OR v_existing.created_by <> auth.uid() OR
       v_existing.payment_date <> p_payment_date OR v_existing.amount <> p_amount OR
       v_existing.method <> p_method OR v_existing.reference IS DISTINCT FROM NULLIF(trim(p_reference), '') THEN
      RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk data berbeda';
    END IF;
    RETURN v_existing.id;
  END IF;
  IF v_loan.status <> 'active' THEN RAISE EXCEPTION 'Pinjaman tidak aktif'; END IF;
  IF p_payment_date > (now() AT TIME ZONE 'Asia/Jakarta')::date OR
     (v_loan.disbursement_date IS NOT NULL AND p_payment_date < v_loan.disbursement_date) OR
     (v_loan.migration_cutoff IS NOT NULL AND p_payment_date <= v_loan.migration_cutoff) THEN
    RAISE EXCEPTION 'Tanggal pembayaran tidak valid';
  END IF;
  v_base := COALESCE(v_loan.opening_balance, v_loan.principal);
  SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM public.loan_payments
    WHERE loan_id = p_loan_id AND status = 'confirmed'
      AND (v_loan.migration_cutoff IS NULL OR payment_date > v_loan.migration_cutoff);
  IF p_amount > v_base - v_paid THEN RAISE EXCEPTION 'Pembayaran melebihi sisa pokok'; END IF;
  INSERT INTO public.loan_payments
    (loan_id, payment_date, amount, method, reference, status, created_by, verified_by, verified_at, idempotency_key)
  VALUES (p_loan_id, p_payment_date, p_amount, p_method, NULLIF(trim(p_reference), ''),
          'confirmed', auth.uid(), auth.uid(), now(), p_request_id);
  IF v_paid + p_amount = v_base THEN
    UPDATE public.loans SET status = 'paid', updated_at = now() WHERE id = p_loan_id;
  END IF;
  INSERT INTO public.loan_audit (loan_id, actor_id, action, details)
    VALUES (p_loan_id, auth.uid(), 'payment_confirmed', jsonb_build_object('payment_key', p_request_id, 'amount', p_amount));
  RETURN (SELECT id FROM public.loan_payments WHERE idempotency_key = p_request_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.loan_cancel_payment(p_payment_id UUID, p_reason TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_loan_id UUID;
  v_cutoff DATE;
  v_payment public.loan_payments%ROWTYPE;
BEGIN
  IF NOT public.loan_is_staff() THEN
    RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'Alasan wajib diisi'; END IF;
  SELECT loan_id INTO v_loan_id FROM public.loan_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pembayaran tidak ditemukan'; END IF;
  SELECT migration_cutoff INTO v_cutoff FROM public.loans WHERE id = v_loan_id FOR UPDATE;
  SELECT * INTO v_payment FROM public.loan_payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.status <> 'confirmed' THEN RAISE EXCEPTION 'Hanya pembayaran terkonfirmasi yang dapat dibatalkan'; END IF;
  IF v_cutoff IS NOT NULL AND v_payment.payment_date <= v_cutoff THEN
    RAISE EXCEPTION 'Pembayaran sebelum cut-off harus diperbaiki melalui koreksi migrasi';
  END IF;
  UPDATE public.loan_payments SET status = 'cancelled', reason = trim(p_reason) WHERE id = p_payment_id;
  UPDATE public.loans SET status = 'active', updated_at = now() WHERE id = v_loan_id AND status = 'paid';
  INSERT INTO public.loan_audit (loan_id, actor_id, action, details)
    VALUES (v_loan_id, auth.uid(), 'payment_cancelled', jsonb_build_object('payment_id', p_payment_id, 'reason', trim(p_reason)));
END;
$$;

REVOKE ALL ON FUNCTION public.loan_record_payment(UUID, DATE, BIGINT, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.loan_cancel_payment(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.loan_record_payment(UUID, DATE, BIGINT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.loan_cancel_payment(UUID, TEXT) TO authenticated;

COMMIT;
