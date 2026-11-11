BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'pinjaman-jamaah-private' AND public) THEN
    RAISE EXCEPTION 'Bucket pinjaman harus privat';
  END IF;
END;
$$;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pinjaman-jamaah-private', 'pinjaman-jamaah-private', false, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.loan_documents ADD COLUMN request_id UUID UNIQUE;

CREATE POLICY loan_private_download ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pinjaman-jamaah-private' AND EXISTS (
    SELECT 1 FROM public.loan_documents d WHERE d.storage_path = name
      AND (public.loan_is_staff() OR (d.shared_with_customer AND public.loan_is_owner(d.loan_id)))
  ));

-- Only the server-side upload function can call this after validating file bytes.
CREATE OR REPLACE FUNCTION public.loan_save_signed_contract(
  p_loan_id UUID, p_storage_path TEXT, p_disbursement_date DATE, p_actor_id UUID,
  p_request_id UUID, p_file_sha256 TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE
  v_loan public.loans%ROWTYPE;
  v_schedule JSONB;
  v_document_id UUID;
  v_existing public.loan_documents%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_actor_id AND is_active AND role::text IN ('admin', 'petugas')) THEN
    RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_file_sha256 IS NULL OR p_file_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Identitas berkas tidak valid';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  SELECT * INTO v_existing FROM public.loan_documents WHERE request_id = p_request_id;
  IF FOUND THEN
    IF v_existing.loan_id <> p_loan_id OR v_existing.storage_path <> p_storage_path OR
       v_existing.created_by <> p_actor_id OR v_existing.snapshot->>'file_sha256' IS DISTINCT FROM p_file_sha256 OR
       v_existing.snapshot->>'disbursement_date' IS DISTINCT FROM p_disbursement_date::text OR
       NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'pinjaman-jamaah-private' AND name = p_storage_path) THEN
      RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk data berbeda';
    END IF;
    RETURN v_existing.id;
  END IF;
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND OR v_loan.status <> 'draft' THEN RAISE EXCEPTION 'Pinjaman bukan draft'; END IF;
  IF p_disbursement_date IS NULL OR p_storage_path IS NULL OR
     split_part(p_storage_path, '/', 1) <> p_loan_id::text OR
     NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'pinjaman-jamaah-private' AND name = p_storage_path) THEN
    RAISE EXCEPTION 'Berkas kontrak tidak valid';
  END IF;
  SELECT jsonb_agg(jsonb_build_object('dueDate', due_date::text, 'amount', amount) ORDER BY installment_number)
    INTO v_schedule FROM public.loan_installments WHERE loan_id = p_loan_id;
  IF v_schedule IS NULL THEN RAISE EXCEPTION 'Jadwal pinjaman belum tersedia'; END IF;
  INSERT INTO public.loan_documents (loan_id, kind, storage_path, snapshot, created_by, verified_by, verified_at, request_id)
  VALUES (p_loan_id, 'contract_signed', p_storage_path,
    jsonb_build_object('loan_id', p_loan_id::text, 'customer_id', v_loan.customer_id::text,
      'purpose', v_loan.purpose, 'disbursement_date', p_disbursement_date::text,
      'guarantor_id', v_loan.guarantor_id::text, 'principal', v_loan.principal, 'schedule', v_schedule, 'file_sha256', p_file_sha256),
    p_actor_id, p_actor_id, now(), p_request_id) RETURNING id INTO v_document_id;
  INSERT INTO public.loan_audit (loan_id, actor_id, action, details)
    VALUES (p_loan_id, p_actor_id, 'signed_contract_uploaded', jsonb_build_object('document_id', v_document_id));
  RETURN v_document_id;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_save_signed_contract(UUID, TEXT, DATE, UUID, UUID, TEXT) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.loan_save_signed_contract(UUID, TEXT, DATE, UUID, UUID, TEXT) TO service_role;
COMMIT;
