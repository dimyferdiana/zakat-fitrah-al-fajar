BEGIN;

-- The exact template selected at signing is archived with the signed document.
CREATE FUNCTION public.loan_save_session_contract_v2(
  p_loan_id UUID, p_storage_path TEXT, p_disbursement_date DATE, p_actor_id UUID,
  p_request_id UUID, p_file_sha256 TEXT, p_session UUID, p_template_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_document UUID; v_template public.loan_contract_templates%ROWTYPE; v_snapshot JSONB;
BEGIN
  PERFORM public.loan_check_service_session(p_actor_id,p_session,'staff');
  SELECT * INTO v_template FROM public.loan_contract_templates WHERE id=p_template_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pilih versi template kontrak yang tersedia'; END IF;
  v_document := public.loan_save_signed_contract(p_loan_id,p_storage_path,p_disbursement_date,p_actor_id,p_request_id,p_file_sha256);
  SELECT snapshot INTO v_snapshot FROM public.loan_documents WHERE id=v_document FOR UPDATE;
  IF v_snapshot ? 'template_id' AND v_snapshot->>'template_id' <> p_template_id::text THEN
    RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk template berbeda';
  END IF;
  IF NOT v_snapshot ? 'template_id' THEN
    UPDATE public.loan_documents SET snapshot=snapshot || jsonb_build_object(
      'template_id',v_template.id, 'template_version',v_template.version,
      'template_title',v_template.title, 'template_body',v_template.body
    ) WHERE id=v_document;
  END IF;
  RETURN v_document;
END; $$;
REVOKE ALL ON FUNCTION public.loan_save_session_contract_v2(UUID,TEXT,DATE,UUID,UUID,TEXT,UUID,UUID) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_save_session_contract_v2(UUID,TEXT,DATE,UUID,UUID,TEXT,UUID,UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.loan_save_session_contract(UUID,TEXT,DATE,UUID,UUID,TEXT,UUID) FROM service_role;
COMMIT;
