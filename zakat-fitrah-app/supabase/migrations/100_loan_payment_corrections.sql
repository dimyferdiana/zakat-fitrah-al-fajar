BEGIN;

-- A corrected paid loan can coexist with a newer active loan. Both are real
-- obligations; needs_reconciliation marks the older correction exception.
CREATE OR REPLACE FUNCTION public.loan_is_owner(p_loan_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.loan_customer_session_valid() AND EXISTS (
   SELECT 1 FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id
   WHERE l.id=p_loan_id AND c.auth_user_id=auth.uid() AND c.is_active AND NOT c.access_paused
   AND l.status IN('active','paid','needs_reconciliation')
 );
$$;
CREATE OR REPLACE FUNCTION public.loan_customer_loans()
RETURNS TABLE(id UUID,loan_number TEXT,status TEXT,principal BIGINT,migration_cutoff DATE,loan_installments JSONB)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT l.id,l.loan_number,l.status,l.principal,l.migration_cutoff,
   COALESCE((SELECT jsonb_agg(jsonb_build_object('due_date',i.due_date,'amount',i.amount,'opening_remaining',i.opening_remaining,'installment_number',i.installment_number) ORDER BY i.installment_number)
     FROM public.loan_installments i WHERE i.loan_id=l.id),'[]'::jsonb)
 FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id
 WHERE c.auth_user_id=auth.uid() AND c.is_active AND NOT c.access_paused AND public.loan_customer_session_valid()
   AND l.status IN('active','paid','needs_reconciliation') ORDER BY l.created_at DESC;
$$;
CREATE OR REPLACE FUNCTION public.loan_customer_payment_history()
RETURNS TABLE(id UUID,loan_id UUID,payment_date DATE,amount BIGINT,status TEXT,rejection_reason TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p.id,p.loan_id,p.payment_date,p.amount,p.status,CASE WHEN p.status='rejected' THEN p.reason ELSE NULL END
 FROM public.loan_payments p JOIN public.loans l ON l.id=p.loan_id JOIN public.loan_customers c ON c.id=l.customer_id
 WHERE c.auth_user_id=auth.uid() AND c.is_active AND NOT c.access_paused AND public.loan_customer_session_valid()
   AND l.status IN('active','paid','needs_reconciliation');
$$;

CREATE OR REPLACE FUNCTION public.loan_record_payment(p_loan_id UUID,p_payment_date DATE,p_amount BIGINT,p_method TEXT,p_reference TEXT,p_request_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_loan public.loans%ROWTYPE; v_existing public.loan_payments%ROWTYPE; v_paid NUMERIC; v_base BIGINT; v_id UUID;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_amount IS NULL OR p_amount<=0 OR p_payment_date IS NULL OR p_method IS NULL OR p_method NOT IN('tunai','transfer','lainnya') THEN RAISE EXCEPTION 'Data pembayaran tidak valid'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 SELECT * INTO v_loan FROM public.loans WHERE id=p_loan_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pinjaman tidak ditemukan'; END IF;
 SELECT * INTO v_existing FROM public.loan_payments WHERE idempotency_key=p_request_id;
 IF FOUND THEN
   IF v_existing.loan_id<>p_loan_id OR v_existing.created_by<>auth.uid() OR v_existing.payment_date<>p_payment_date OR v_existing.amount<>p_amount OR v_existing.method<>p_method OR v_existing.reference IS DISTINCT FROM NULLIF(trim(p_reference),'') THEN RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk data berbeda'; END IF;
   RETURN v_existing.id;
 END IF;
 IF v_loan.status NOT IN('active','needs_reconciliation') THEN RAISE EXCEPTION 'Pinjaman tidak aktif'; END IF;
 IF p_payment_date>(now() AT TIME ZONE 'Asia/Jakarta')::date OR (v_loan.disbursement_date IS NOT NULL AND p_payment_date<v_loan.disbursement_date) OR (v_loan.migration_cutoff IS NOT NULL AND p_payment_date<=v_loan.migration_cutoff) THEN RAISE EXCEPTION 'Tanggal pembayaran tidak valid'; END IF;
 v_base:=COALESCE(v_loan.opening_balance,v_loan.principal);
 SELECT COALESCE(sum(amount),0) INTO v_paid FROM public.loan_payments WHERE loan_id=p_loan_id AND status='confirmed' AND (v_loan.migration_cutoff IS NULL OR payment_date>v_loan.migration_cutoff);
 IF p_amount>v_base-v_paid THEN RAISE EXCEPTION 'Pembayaran melebihi sisa pokok'; END IF;
 INSERT INTO public.loan_payments(loan_id,payment_date,amount,method,reference,status,created_by,verified_by,verified_at,idempotency_key)
 VALUES(p_loan_id,p_payment_date,p_amount,p_method,NULLIF(trim(p_reference),''),'confirmed',auth.uid(),auth.uid(),now(),p_request_id) RETURNING id INTO v_id;
 IF v_paid+p_amount=v_base THEN UPDATE public.loans SET status='paid',updated_at=now() WHERE id=p_loan_id; END IF;
 INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(p_loan_id,auth.uid(),'payment_confirmed',jsonb_build_object('payment_id',v_id,'request_id',p_request_id,'amount',p_amount));
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.loan_cancel_payment(p_payment_id UUID,p_reason TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_loan public.loans%ROWTYPE; v_loan_id UUID; v_payment public.loan_payments%ROWTYPE; v_status TEXT;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_reason IS NULL OR length(trim(p_reason))=0 THEN RAISE EXCEPTION 'Alasan wajib diisi'; END IF;
 SELECT loan_id INTO v_loan_id FROM public.loan_payments WHERE id=p_payment_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pembayaran tidak ditemukan'; END IF;
 SELECT * INTO v_loan FROM public.loans WHERE id=v_loan_id FOR UPDATE;
 PERFORM 1 FROM public.loan_customers WHERE id=v_loan.customer_id FOR UPDATE;
 SELECT * INTO v_payment FROM public.loan_payments WHERE id=p_payment_id FOR UPDATE;
 IF v_payment.status='cancelled' AND v_payment.reason=trim(p_reason) AND EXISTS(SELECT 1 FROM public.loan_audit WHERE loan_id=v_loan_id AND actor_id=auth.uid() AND action='payment_cancelled' AND details->>'payment_id'=p_payment_id::text) THEN RETURN; END IF;
 IF v_payment.status<>'confirmed' OR v_loan.status NOT IN('active','paid','needs_reconciliation') THEN RAISE EXCEPTION 'Hanya pembayaran terkonfirmasi pada pinjaman yang berlaku dapat dibatalkan'; END IF;
 IF v_loan.migration_cutoff IS NOT NULL AND v_payment.payment_date<=v_loan.migration_cutoff THEN RAISE EXCEPTION 'Pembayaran sebelum cut-off harus diperbaiki melalui koreksi migrasi'; END IF;
 UPDATE public.loan_payments SET status='cancelled',reason=trim(p_reason) WHERE id=p_payment_id;
 v_status:=v_loan.status;
 IF v_loan.status='paid' THEN
   v_status:=CASE WHEN EXISTS(SELECT 1 FROM public.loans WHERE customer_id=v_loan.customer_id AND id<>v_loan_id AND status IN('active','needs_reconciliation')) THEN 'needs_reconciliation' ELSE 'active' END;
   UPDATE public.loans SET status=v_status,updated_at=now() WHERE id=v_loan_id;
 END IF;
 INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(v_loan_id,auth.uid(),'payment_cancelled',jsonb_build_object('payment_id',p_payment_id,'reason',trim(p_reason),'resulting_loan_status',v_status));
END; $$;

CREATE OR REPLACE FUNCTION public.loan_review_payment_claim_unchecked(p_payment_id UUID,p_accept BOOLEAN,p_reason TEXT DEFAULT NULL) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_loan public.loans%ROWTYPE; v_payment public.loan_payments%ROWTYPE; v_loan_id UUID; v_paid NUMERIC; v_base BIGINT;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_accept IS NULL OR (NOT p_accept AND coalesce(length(trim(p_reason)),0)=0) THEN RAISE EXCEPTION 'Alasan penolakan wajib diisi'; END IF;
 SELECT loan_id INTO v_loan_id FROM public.loan_payments WHERE id=p_payment_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Klaim tidak ditemukan'; END IF;
 SELECT * INTO v_loan FROM public.loans WHERE id=v_loan_id FOR UPDATE;
 SELECT * INTO v_payment FROM public.loan_payments WHERE id=p_payment_id FOR UPDATE;
 IF v_payment.verified_by=auth.uid() AND ((p_accept AND v_payment.status='confirmed') OR (NOT p_accept AND v_payment.status='rejected' AND v_payment.reason=trim(p_reason))) THEN RETURN; END IF;
 IF v_payment.status<>'pending' THEN RAISE EXCEPTION 'Klaim sudah diperiksa'; END IF;
 IF p_accept THEN
   IF v_loan.status NOT IN('active','needs_reconciliation') THEN RAISE EXCEPTION 'Pinjaman tidak aktif'; END IF;
   IF v_payment.payment_date>(now() AT TIME ZONE 'Asia/Jakarta')::date OR (v_loan.disbursement_date IS NOT NULL AND v_payment.payment_date<v_loan.disbursement_date) OR (v_loan.migration_cutoff IS NOT NULL AND v_payment.payment_date<=v_loan.migration_cutoff) THEN RAISE EXCEPTION 'Tanggal pembayaran tidak valid'; END IF;
   v_base:=COALESCE(v_loan.opening_balance,v_loan.principal);
   SELECT COALESCE(sum(amount),0) INTO v_paid FROM public.loan_payments WHERE loan_id=v_loan.id AND status='confirmed' AND (v_loan.migration_cutoff IS NULL OR payment_date>v_loan.migration_cutoff);
   IF v_payment.amount>v_base-v_paid THEN RAISE EXCEPTION 'Klaim melebihi sisa pokok'; END IF;
   UPDATE public.loan_payments SET status='confirmed',verified_by=auth.uid(),verified_at=now() WHERE id=p_payment_id;
   IF v_paid+v_payment.amount=v_base THEN UPDATE public.loans SET status='paid',updated_at=now() WHERE id=v_loan.id; END IF;
 ELSE UPDATE public.loan_payments SET status='rejected',reason=trim(p_reason),verified_by=auth.uid(),verified_at=now() WHERE id=p_payment_id;
 END IF;
 INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(v_loan.id,auth.uid(),CASE WHEN p_accept THEN 'payment_claim_confirmed' ELSE 'payment_claim_rejected' END,jsonb_build_object('payment_id',p_payment_id,'reason',CASE WHEN p_accept THEN NULL ELSE trim(p_reason) END));
END; $$;
CREATE OR REPLACE FUNCTION public.loan_review_payment_claim(p_payment_id UUID,p_accept BOOLEAN,p_reason TEXT DEFAULT NULL) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,storage AS $$
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_accept IS TRUE AND EXISTS(SELECT 1 FROM public.loan_payments WHERE id=p_payment_id AND status='pending') AND NOT EXISTS(
   SELECT 1 FROM public.loan_documents d JOIN storage.objects o ON o.bucket_id='pinjaman-jamaah-private' AND o.name=d.storage_path WHERE d.payment_id=p_payment_id AND d.kind='payment_evidence'
 ) THEN RAISE EXCEPTION 'Bukti pembayaran tidak tersedia'; END IF;
 PERFORM public.loan_review_payment_claim_unchecked(p_payment_id,p_accept,p_reason);
END; $$;

-- Derived allocation: always recomputed in payment date/UUID order, so
-- backdated input and cancellations cannot leave stale allocations.
CREATE FUNCTION public.loan_payment_allocations(p_loan_id UUID)
RETURNS TABLE(payment_id UUID,installment_id UUID,installment_number INTEGER,amount BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.loan_is_staff() AND NOT public.loan_is_owner(p_loan_id) THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.loans l JOIN public.loan_installments i ON i.loan_id=l.id WHERE l.id=p_loan_id AND l.migration_cutoff IS NOT NULL AND i.opening_remaining IS NULL) THEN RAISE EXCEPTION 'Rincian saldo migrasi belum lengkap'; END IF;
 RETURN QUERY WITH due AS (
   SELECT i.id,i.installment_number,CASE WHEN l.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END AS value,
     COALESCE(sum(CASE WHEN l.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END) OVER(ORDER BY i.installment_number ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0) AS start_at
   FROM public.loan_installments i JOIN public.loans l ON l.id=i.loan_id WHERE i.loan_id=p_loan_id
 ), pay AS (
   SELECT p.id,p.amount,COALESCE(sum(p.amount) OVER(ORDER BY p.payment_date,p.id ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0) AS start_at
   FROM public.loan_payments p JOIN public.loans l ON l.id=p.loan_id WHERE p.loan_id=p_loan_id AND p.status='confirmed' AND p.payment_date<=(now() AT TIME ZONE 'Asia/Jakarta')::date AND (l.migration_cutoff IS NULL OR p.payment_date>l.migration_cutoff)
 ) SELECT pay.id,due.id,due.installment_number,(least(pay.start_at+pay.amount,due.start_at+due.value)-greatest(pay.start_at,due.start_at))::bigint
   FROM pay CROSS JOIN due WHERE least(pay.start_at+pay.amount,due.start_at+due.value)>greatest(pay.start_at,due.start_at) ORDER BY pay.start_at,due.installment_number;
END; $$;
REVOKE ALL ON FUNCTION public.loan_payment_allocations(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_payment_allocations(UUID) TO authenticated;
COMMIT;
