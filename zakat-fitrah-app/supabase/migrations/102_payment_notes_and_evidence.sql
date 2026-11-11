BEGIN;
ALTER TABLE public.loan_payments ADD COLUMN customer_note TEXT CHECK(customer_note IS NULL OR length(customer_note)<=1000);

CREATE FUNCTION public.loan_record_staff_payment(p_loan_id UUID,p_payment_date DATE,p_amount BIGINT,p_method TEXT,p_reference TEXT,p_notes TEXT,p_request_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID; v_existing public.loan_payments%ROWTYPE; v_notes TEXT:=NULLIF(trim(p_notes),'');
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF length(v_notes)>1000 OR p_request_id IS NULL THEN RAISE EXCEPTION 'Catatan atau permintaan tidak valid'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 SELECT * INTO v_existing FROM public.loan_payments WHERE idempotency_key=p_request_id;
 IF FOUND AND v_existing.notes IS DISTINCT FROM v_notes THEN RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk catatan berbeda'; END IF;
 v_id:=public.loan_record_payment(p_loan_id,p_payment_date,p_amount,p_method,p_reference,p_request_id);
 IF v_existing.id IS NULL THEN UPDATE public.loan_payments SET notes=v_notes WHERE id=v_id; END IF;
 RETURN v_id;
END; $$;

CREATE FUNCTION public.loan_submit_session_claim_v2(p_loan_id UUID,p_payment_date DATE,p_amount BIGINT,p_reference TEXT,p_note TEXT,p_actor_id UUID,p_request_id UUID,p_path TEXT,p_sha256 TEXT,p_session UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID; v_existing public.loan_payments%ROWTYPE; v_note TEXT:=NULLIF(trim(p_note),'');
BEGIN
 IF length(v_note)>1000 OR p_request_id IS NULL THEN RAISE EXCEPTION 'Catatan atau permintaan tidak valid'; END IF;
 PERFORM public.loan_check_service_session(p_actor_id,p_session,'customer');
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 SELECT * INTO v_existing FROM public.loan_payments WHERE idempotency_key=p_request_id;
 IF FOUND AND v_existing.customer_note IS DISTINCT FROM v_note THEN RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk catatan berbeda'; END IF;
 v_id:=public.loan_submit_payment_claim(p_loan_id,p_payment_date,p_amount,p_reference,p_actor_id,p_request_id,p_path,p_sha256);
 IF v_existing.id IS NULL THEN UPDATE public.loan_payments SET customer_note=v_note WHERE id=v_id; END IF;
 RETURN v_id;
END; $$;

CREATE FUNCTION public.loan_save_staff_payment_evidence(p_payment_id UUID,p_actor UUID,p_session UUID,p_path TEXT,p_sha256 TEXT,p_request_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,storage AS $$
DECLARE v_payment public.loan_payments%ROWTYPE; v_existing public.loan_documents%ROWTYPE; v_id UUID;
BEGIN
 PERFORM public.loan_check_service_session(p_actor,p_session,'staff');
 IF p_request_id IS NULL OR p_path IS NULL OR p_sha256 IS NULL OR p_sha256 !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Identitas bukti tidak valid'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 SELECT * INTO v_payment FROM public.loan_payments WHERE id=p_payment_id FOR UPDATE;
 IF NOT FOUND OR v_payment.status NOT IN('confirmed','cancelled') THEN RAISE EXCEPTION 'Pembayaran tidak tersedia'; END IF;
 IF split_part(p_path,'/',1)<>v_payment.loan_id::text OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='pinjaman-jamaah-private' AND name=p_path) THEN RAISE EXCEPTION 'Bukti tidak tersedia'; END IF;
 SELECT * INTO v_existing FROM public.loan_documents WHERE request_id=p_request_id;
 IF FOUND THEN
   IF v_existing.payment_id<>p_payment_id OR v_existing.created_by<>p_actor OR v_existing.storage_path<>p_path OR v_existing.snapshot->>'file_sha256' IS DISTINCT FROM p_sha256 THEN RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk data berbeda'; END IF;
   RETURN v_existing.id;
 END IF;
 INSERT INTO public.loan_documents(loan_id,payment_id,kind,storage_path,snapshot,shared_with_customer,created_by,request_id)
 VALUES(v_payment.loan_id,p_payment_id,'payment_evidence',p_path,jsonb_build_object('file_sha256',p_sha256,'source','staff'),false,p_actor,p_request_id) RETURNING id INTO v_id;
 INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(v_payment.loan_id,p_actor,'payment_evidence_uploaded',jsonb_build_object('payment_id',p_payment_id,'document_id',v_id));
 RETURN v_id;
END; $$;

DROP FUNCTION public.loan_customer_payment_history();
CREATE FUNCTION public.loan_customer_payment_history()
RETURNS TABLE(id UUID,loan_id UUID,payment_date DATE,amount BIGINT,status TEXT,rejection_reason TEXT,customer_note TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p.id,p.loan_id,p.payment_date,p.amount,p.status,CASE WHEN p.status='rejected' THEN p.reason ELSE NULL END,p.customer_note
 FROM public.loan_payments p JOIN public.loans l ON l.id=p.loan_id JOIN public.loan_customers c ON c.id=l.customer_id
 WHERE c.auth_user_id=auth.uid() AND c.is_active AND NOT c.access_paused AND public.loan_customer_session_valid()
 AND l.status IN('active','paid','needs_reconciliation');
$$;
REVOKE ALL ON FUNCTION public.loan_record_staff_payment(UUID,DATE,BIGINT,TEXT,TEXT,TEXT,UUID),public.loan_customer_payment_history() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_record_staff_payment(UUID,DATE,BIGINT,TEXT,TEXT,TEXT,UUID),public.loan_customer_payment_history() TO authenticated;
REVOKE ALL ON FUNCTION public.loan_submit_session_claim_v2(UUID,DATE,BIGINT,TEXT,TEXT,UUID,UUID,TEXT,TEXT,UUID),public.loan_save_staff_payment_evidence(UUID,UUID,UUID,TEXT,TEXT,UUID) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.loan_submit_session_claim(UUID,DATE,BIGINT,TEXT,UUID,UUID,TEXT,TEXT,UUID) FROM service_role;
GRANT EXECUTE ON FUNCTION public.loan_submit_session_claim_v2(UUID,DATE,BIGINT,TEXT,TEXT,UUID,UUID,TEXT,TEXT,UUID),public.loan_save_staff_payment_evidence(UUID,UUID,UUID,TEXT,TEXT,UUID) TO service_role;
COMMIT;
