BEGIN;
CREATE TABLE public.loan_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL UNIQUE REFERENCES public.loan_payments(id) ON DELETE RESTRICT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  snapshot JSONB NOT NULL
);
ALTER TABLE public.loan_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.loan_receipts FROM PUBLIC, authenticated, anon;

CREATE FUNCTION public.loan_receipt(p_payment_id UUID, p_issue BOOLEAN DEFAULT false) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_payment public.loan_payments%ROWTYPE;
  v_loan public.loans%ROWTYPE;
  v_receipt public.loan_receipts%ROWTYPE;
  v_name TEXT;
  v_staff_name TEXT;
  v_balance NUMERIC;
BEGIN
  SELECT * INTO v_payment FROM public.loan_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pembayaran tidak ditemukan'; END IF;
  IF NOT public.loan_is_staff() AND NOT public.loan_is_owner(v_payment.loan_id) THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_issue AND NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_loan FROM public.loans WHERE id = v_payment.loan_id FOR UPDATE;
  SELECT * INTO v_payment FROM public.loan_payments WHERE id = p_payment_id FOR UPDATE;
  SELECT * INTO v_receipt FROM public.loan_receipts WHERE payment_id = p_payment_id;
  IF NOT FOUND AND p_issue THEN
    IF v_payment.status <> 'confirmed' THEN RAISE EXCEPTION 'Hanya pembayaran terkonfirmasi dapat diterbitkan tanda terima'; END IF;
    SELECT coalesce(m.nama_lengkap, m.nama_kk), u.nama_lengkap INTO v_name, v_staff_name
      FROM public.loan_customers c JOIN public.muzakki m ON m.id = c.person_id
      LEFT JOIN public.users u ON u.id = v_payment.verified_by WHERE c.id = v_loan.customer_id;
    SELECT coalesce(v_loan.opening_balance, v_loan.principal) - coalesce(sum(amount), 0) INTO v_balance
      FROM public.loan_payments WHERE loan_id = v_loan.id AND status = 'confirmed'
        AND (v_loan.migration_cutoff IS NULL OR payment_date > v_loan.migration_cutoff);
    IF v_balance < 0 THEN RAISE EXCEPTION 'Saldo memerlukan rekonsiliasi'; END IF;
    INSERT INTO public.loan_receipts(payment_id, issued_by, snapshot) VALUES (p_payment_id, auth.uid(),
      jsonb_build_object('loan_number', v_loan.loan_number, 'customer_name', v_name, 'payment_date', v_payment.payment_date,
        'amount', v_payment.amount, 'method', v_payment.method, 'reference', v_payment.reference,
        'verified_by_name', v_staff_name, 'remaining', v_balance)) RETURNING * INTO v_receipt;
    INSERT INTO public.loan_audit(loan_id, actor_id, action, details)
      VALUES (v_loan.id, auth.uid(), 'receipt_issued', jsonb_build_object('receipt_id', v_receipt.id, 'payment_id', p_payment_id));
  END IF;
  IF v_receipt.id IS NULL THEN RETURN NULL; END IF;
  RETURN v_receipt.snapshot || jsonb_build_object('receipt_number', v_receipt.id, 'issued_at', v_receipt.issued_at, 'status', v_payment.status);
END;
$$;
REVOKE ALL ON FUNCTION public.loan_receipt(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loan_receipt(UUID, BOOLEAN) TO authenticated;
COMMIT;
