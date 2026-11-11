BEGIN;
DROP POLICY loan_customers_read ON public.loan_customers;
CREATE POLICY loan_customers_read ON public.loan_customers FOR SELECT TO authenticated USING(public.loan_is_staff());
DROP POLICY documents_read ON public.loan_documents;
CREATE POLICY documents_read ON public.loan_documents FOR SELECT TO authenticated USING(public.loan_is_staff());
DROP POLICY loan_disbursements_read ON public.loan_disbursements;
CREATE POLICY loan_disbursements_read ON public.loan_disbursements FOR SELECT TO authenticated USING(public.loan_is_staff());

CREATE FUNCTION public.loan_customer_documents() RETURNS TABLE(id UUID,loan_id UUID,kind TEXT,storage_path TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT d.id,d.loan_id,d.kind,d.storage_path FROM public.loan_documents d
 WHERE d.shared_with_customer AND d.kind IN('contract_signed','payment_evidence','receipt') AND public.loan_is_owner(d.loan_id);
$$;
CREATE FUNCTION public.loan_can_download_document(p_path TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.loan_documents d WHERE d.storage_path=p_path AND
 (public.loan_is_staff() OR (d.shared_with_customer AND d.kind IN('contract_signed','payment_evidence','receipt') AND public.loan_is_owner(d.loan_id))));
$$;
DROP POLICY loan_private_download ON storage.objects;
CREATE POLICY loan_private_download ON storage.objects FOR SELECT TO authenticated
 USING(bucket_id='pinjaman-jamaah-private' AND public.loan_can_download_document(name));
CREATE FUNCTION public.loan_current_session_id() RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,auth AS $$
 SELECT s.id FROM auth.sessions s WHERE s.user_id=auth.uid() AND s.id::text=auth.jwt()->>'session_id' AND public.loan_session_valid();
$$;

-- Recheck the original caller inside the final transaction after an upload.
CREATE FUNCTION public.loan_check_service_session(p_actor UUID,p_session UUID,p_mode TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_mode TEXT;
BEGIN
 PERFORM 1 FROM auth.sessions WHERE id=p_session AND user_id=p_actor AND (not_after IS NULL OR not_after>now()) FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Sesi telah berakhir' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.users WHERE id=p_actor FOR SHARE;
 PERFORM 1 FROM public.loan_customers WHERE auth_user_id=p_actor FOR SHARE;
 IF EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND NOT is_active)
 OR EXISTS(SELECT 1 FROM public.loan_customers WHERE auth_user_id=p_actor AND access_paused) THEN RAISE EXCEPTION 'Akun tidak aktif' USING ERRCODE='42501'; END IF;
 SELECT mode INTO v_mode FROM public.loan_session_modes WHERE session_id=p_session AND user_id=p_actor;
 v_mode:=COALESCE(v_mode,CASE WHEN EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND is_active) THEN 'staff' ELSE 'customer' END);
 IF v_mode IS DISTINCT FROM p_mode THEN RAISE EXCEPTION 'Mode telah berubah' USING ERRCODE='42501'; END IF;
 IF p_mode='staff' AND NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND is_active AND role::text IN('admin','petugas')) THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_mode='customer' AND NOT EXISTS(SELECT 1 FROM public.loan_customers WHERE auth_user_id=p_actor AND is_active AND NOT access_paused) THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
END; $$;
CREATE FUNCTION public.loan_submit_session_claim(p_loan_id UUID,p_payment_date DATE,p_amount BIGINT,p_reference TEXT,p_actor_id UUID,p_request_id UUID,p_path TEXT,p_sha256 TEXT,p_session UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM public.loan_check_service_session(p_actor_id,p_session,'customer');
 RETURN public.loan_submit_payment_claim(p_loan_id,p_payment_date,p_amount,p_reference,p_actor_id,p_request_id,p_path,p_sha256);
END; $$;
CREATE FUNCTION public.loan_save_session_contract(p_loan_id UUID,p_storage_path TEXT,p_disbursement_date DATE,p_actor_id UUID,p_request_id UUID,p_file_sha256 TEXT,p_session UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM public.loan_check_service_session(p_actor_id,p_session,'staff');
 RETURN public.loan_save_signed_contract(p_loan_id,p_storage_path,p_disbursement_date,p_actor_id,p_request_id,p_file_sha256);
END; $$;
REVOKE ALL ON FUNCTION public.loan_customer_documents(),public.loan_can_download_document(TEXT),public.loan_current_session_id() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_customer_documents(),public.loan_can_download_document(TEXT),public.loan_current_session_id() TO authenticated;
REVOKE ALL ON FUNCTION public.loan_check_service_session(UUID,UUID,TEXT),public.loan_submit_session_claim(UUID,DATE,BIGINT,TEXT,UUID,UUID,TEXT,TEXT,UUID),public.loan_save_session_contract(UUID,TEXT,DATE,UUID,UUID,TEXT,UUID) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.loan_submit_payment_claim(UUID,DATE,BIGINT,TEXT,UUID,UUID,TEXT,TEXT),public.loan_save_signed_contract(UUID,TEXT,DATE,UUID,UUID,TEXT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.loan_submit_session_claim(UUID,DATE,BIGINT,TEXT,UUID,UUID,TEXT,TEXT,UUID),public.loan_save_session_contract(UUID,TEXT,DATE,UUID,UUID,TEXT,UUID) TO service_role;
COMMIT;
