BEGIN;
CREATE FUNCTION public.loan_submit_session_claim_v3(
 p_loan_id UUID,p_payment_date DATE,p_amount BIGINT,p_reference TEXT,p_note TEXT,
 p_actor_id UUID,p_request_id UUID,p_files JSONB,p_session UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,storage AS $$
DECLARE v_payment UUID; v_file JSONB; v_first JSONB; v_actual JSONB; v_expected JSONB;
BEGIN
 PERFORM public.loan_check_service_session(p_actor_id,p_session,'customer');
 IF jsonb_typeof(p_files) IS DISTINCT FROM 'array' OR jsonb_array_length(p_files) NOT BETWEEN 1 AND 3 THEN
   RAISE EXCEPTION 'Lampiran harus berjumlah satu sampai tiga';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_files) f WHERE jsonb_typeof(f)<>'object'
    OR coalesce(f->>'path','')='' OR coalesce(f->>'sha256','') !~ '^[0-9a-f]{64}$'
    OR split_part(f->>'path','/',1)<>p_loan_id::text
    OR NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='pinjaman-jamaah-private' AND o.name=f->>'path'))
    OR (SELECT count(DISTINCT f->>'path') FROM jsonb_array_elements(p_files) f) <> jsonb_array_length(p_files)
 THEN RAISE EXCEPTION 'Lampiran tidak valid'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 v_first:=p_files->0;
 v_payment:=public.loan_submit_session_claim_v2(p_loan_id,p_payment_date,p_amount,p_reference,p_note,p_actor_id,p_request_id,v_first->>'path',v_first->>'sha256',p_session);
 FOR v_file IN SELECT value FROM jsonb_array_elements(p_files) WITH ORDINALITY x(value,ord) WHERE ord>1 LOOP
   IF NOT EXISTS(SELECT 1 FROM public.loan_documents WHERE payment_id=v_payment AND storage_path=v_file->>'path') THEN
     INSERT INTO public.loan_documents(loan_id,payment_id,kind,storage_path,snapshot,shared_with_customer,created_by)
     VALUES(p_loan_id,v_payment,'payment_evidence',v_file->>'path',jsonb_build_object('file_sha256',v_file->>'sha256'),true,p_actor_id);
   END IF;
 END LOOP;
 SELECT jsonb_agg(jsonb_build_object('path',storage_path,'sha256',snapshot->>'file_sha256') ORDER BY storage_path)
   INTO v_actual FROM public.loan_documents WHERE payment_id=v_payment AND kind='payment_evidence';
 SELECT jsonb_agg(jsonb_build_object('path',f->>'path','sha256',f->>'sha256') ORDER BY f->>'path')
   INTO v_expected FROM jsonb_array_elements(p_files) f;
 IF v_actual IS DISTINCT FROM v_expected THEN RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk lampiran berbeda'; END IF;
 RETURN v_payment;
END; $$;
REVOKE ALL ON FUNCTION public.loan_submit_session_claim_v3(UUID,DATE,BIGINT,TEXT,TEXT,UUID,UUID,JSONB,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_submit_session_claim_v3(UUID,DATE,BIGINT,TEXT,TEXT,UUID,UUID,JSONB,UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.loan_submit_session_claim_v2(UUID,DATE,BIGINT,TEXT,TEXT,UUID,UUID,TEXT,TEXT,UUID) FROM service_role;
COMMIT;
