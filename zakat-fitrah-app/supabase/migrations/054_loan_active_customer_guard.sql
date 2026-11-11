BEGIN;

-- Enforces the one-active-loan rule even if two different operations race.
CREATE UNIQUE INDEX loans_one_active_per_customer ON public.loans(customer_id) WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.loan_cancel_payment(p_payment_id UUID, p_reason TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_loan public.loans%ROWTYPE;
  v_loan_id UUID;
  v_payment public.loan_payments%ROWTYPE;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'Alasan wajib diisi'; END IF;
  SELECT loan_id INTO v_loan_id FROM public.loan_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pembayaran tidak ditemukan'; END IF;
  SELECT * INTO v_loan FROM public.loans WHERE id = v_loan_id FOR UPDATE;
  -- Disbursement also locks this customer before checking for another active loan.
  PERFORM 1 FROM public.loan_customers WHERE id = v_loan.customer_id FOR UPDATE;
  SELECT * INTO v_payment FROM public.loan_payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment.status <> 'confirmed' THEN RAISE EXCEPTION 'Hanya pembayaran terkonfirmasi yang dapat dibatalkan'; END IF;
  IF v_loan.migration_cutoff IS NOT NULL AND v_payment.payment_date <= v_loan.migration_cutoff THEN
    RAISE EXCEPTION 'Pembayaran sebelum cut-off harus diperbaiki melalui koreksi migrasi';
  END IF;
  IF v_loan.status = 'paid' AND EXISTS (SELECT 1 FROM public.loans WHERE customer_id = v_loan.customer_id AND status = 'active' AND id <> v_loan_id) THEN
    RAISE EXCEPTION 'Nasabah memiliki pinjaman aktif lain; pembatalan memerlukan rekonsiliasi';
  END IF;
  UPDATE public.loan_payments SET status = 'cancelled', reason = trim(p_reason) WHERE id = p_payment_id;
  UPDATE public.loans SET status = 'active', updated_at = now() WHERE id = v_loan_id AND status = 'paid';
  INSERT INTO public.loan_audit (loan_id, actor_id, action, details)
    VALUES (v_loan_id, auth.uid(), 'payment_cancelled', jsonb_build_object('payment_id', p_payment_id, 'reason', trim(p_reason)));
END;
$$;
COMMIT;
