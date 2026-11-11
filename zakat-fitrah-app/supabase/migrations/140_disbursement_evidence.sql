BEGIN;
CREATE FUNCTION public.loan_save_session_disbursement_evidence(
 p_disbursement_id UUID,p_actor UUID,p_session UUID,p_path TEXT,p_sha256 TEXT,p_request_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,storage AS $$
DECLARE d public.loan_disbursements%ROWTYPE; existing public.loan_documents%ROWTYPE; result UUID;
BEGIN
 PERFORM public.loan_check_service_session(p_actor,p_session,'staff');
 IF p_request_id IS NULL OR p_sha256 IS NULL OR p_sha256 !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Identitas bukti tidak valid'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 SELECT * INTO d FROM public.loan_disbursements WHERE id=p_disbursement_id FOR SHARE;
 IF NOT FOUND OR p_path IS NULL OR split_part(p_path,'/',1)<>d.loan_id::text OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='pinjaman-jamaah-private' AND name=p_path) THEN RAISE EXCEPTION 'Pencairan atau bukti tidak tersedia'; END IF;
 SELECT * INTO existing FROM public.loan_documents WHERE request_id=p_request_id;
 IF FOUND THEN
   IF existing.loan_id<>d.loan_id OR existing.kind<>'disbursement' OR existing.created_by<>p_actor OR existing.storage_path<>p_path OR existing.snapshot->>'disbursement_id' IS DISTINCT FROM d.id::text OR existing.snapshot->>'file_sha256' IS DISTINCT FROM p_sha256 THEN RAISE EXCEPTION 'Kunci permintaan sudah digunakan'; END IF;
   RETURN existing.id;
 END IF;
 INSERT INTO public.loan_documents(loan_id,kind,storage_path,snapshot,created_by,request_id)
 VALUES(d.loan_id,'disbursement',p_path,jsonb_build_object('disbursement_id',d.id,'file_sha256',p_sha256),p_actor,p_request_id) RETURNING id INTO result;
 INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(d.loan_id,p_actor,'disbursement_evidence_uploaded',jsonb_build_object('disbursement_id',d.id,'document_id',result));
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.loan_save_session_disbursement_evidence(UUID,UUID,UUID,TEXT,TEXT,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_save_session_disbursement_evidence(UUID,UUID,UUID,TEXT,TEXT,UUID) TO service_role;
COMMIT;
