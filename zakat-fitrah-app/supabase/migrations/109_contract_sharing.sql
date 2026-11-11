BEGIN;
CREATE FUNCTION public.loan_set_contract_sharing(p_document_id UUID,p_shared BOOLEAN) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.loan_documents%ROWTYPE;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_shared IS NULL THEN RAISE EXCEPTION 'Status tidak valid'; END IF;
 SELECT * INTO d FROM public.loan_documents WHERE id=p_document_id FOR UPDATE;
 IF NOT FOUND OR d.kind<>'contract_signed' OR d.verified_by IS NULL OR d.verified_at IS NULL THEN RAISE EXCEPTION 'Kontrak bertanda tangan tidak tersedia'; END IF;
 IF p_shared AND EXISTS(SELECT 1 FROM public.loan_contract_invalidations WHERE document_id=d.id) THEN RAISE EXCEPTION 'Kontrak sudah tidak berlaku'; END IF;
 IF d.shared_with_customer IS DISTINCT FROM p_shared THEN
   UPDATE public.loan_documents SET shared_with_customer=p_shared WHERE id=d.id;
   INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(d.loan_id,auth.uid(),'contract_sharing_changed',jsonb_build_object('document_id',d.id,'shared',p_shared));
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.loan_set_contract_sharing(UUID,BOOLEAN) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_set_contract_sharing(UUID,BOOLEAN) TO authenticated;
COMMIT;
