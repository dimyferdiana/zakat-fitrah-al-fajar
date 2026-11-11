BEGIN;

-- A signed document captures the exact people represented when it was saved.
CREATE FUNCTION public.loan_contract_person_snapshot(p_person_id UUID) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('id', m.id, 'nama_kk', m.nama_kk, 'nama_lengkap', m.nama_lengkap,
    'nik', m.nik, 'alamat', m.alamat, 'rt', m.rt, 'rw', m.rw,
    'jenis_identitas', m.jenis_identitas, 'identitas_terverifikasi', m.identitas_terverifikasi)
  FROM public.muzakki m WHERE m.id = p_person_id;
$$;
REVOKE ALL ON FUNCTION public.loan_contract_person_snapshot(UUID) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.loan_snapshot_signed_people() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_person UUID; v_guarantor UUID;
BEGIN
  IF NEW.kind = 'contract_signed' THEN
    SELECT c.person_id, l.guarantor_id INTO v_person, v_guarantor
      FROM public.loans l JOIN public.loan_customers c ON c.id = l.customer_id WHERE l.id = NEW.loan_id;
    IF v_person IS NULL THEN RAISE EXCEPTION 'Identitas nasabah tidak tersedia'; END IF;
    PERFORM 1 FROM public.muzakki WHERE id IN (v_person, v_guarantor) ORDER BY id FOR SHARE;
    NEW.snapshot := NEW.snapshot || jsonb_build_object(
      'customer_identity', public.loan_contract_person_snapshot(v_person),
      'guarantor_identity', CASE WHEN v_guarantor IS NULL THEN NULL ELSE public.loan_contract_person_snapshot(v_guarantor) END
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_snapshot_signed_people() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER loan_snapshot_signed_people BEFORE INSERT ON public.loan_documents
  FOR EACH ROW EXECUTE FUNCTION public.loan_snapshot_signed_people();

CREATE FUNCTION public.loan_check_contract_identity() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_person UUID; v_schedule JSONB; v_customer_identity JSONB; v_guarantor_identity JSONB;
BEGIN
  IF OLD.status <> 'draft' OR NEW.status <> 'active' THEN RETURN NEW; END IF;
  SELECT c.person_id INTO v_person FROM public.loan_customers c WHERE c.id = NEW.customer_id;
  PERFORM 1 FROM public.muzakki WHERE id IN (v_person, NEW.guarantor_id) ORDER BY id FOR SHARE;
  v_customer_identity := public.loan_contract_person_snapshot(v_person);
  v_guarantor_identity := CASE WHEN NEW.guarantor_id IS NULL THEN NULL ELSE public.loan_contract_person_snapshot(NEW.guarantor_id) END;
  SELECT jsonb_agg(jsonb_build_object('dueDate', i.due_date::text, 'amount', i.amount) ORDER BY i.installment_number)
    INTO v_schedule FROM public.loan_installments i WHERE i.loan_id = NEW.id;
  IF v_customer_identity IS NULL OR (NEW.guarantor_id IS NOT NULL AND v_guarantor_identity IS NULL) OR NOT EXISTS (
    SELECT 1 FROM public.loan_documents d
    WHERE d.loan_id = NEW.id AND d.kind = 'contract_signed' AND d.verified_by IS NOT NULL AND d.verified_at IS NOT NULL
      AND d.snapshot->>'loan_id' = NEW.id::text AND d.snapshot->>'customer_id' = NEW.customer_id::text
      AND d.snapshot->>'purpose' = NEW.purpose AND d.snapshot->>'disbursement_date' = NEW.disbursement_date::text
      AND d.snapshot->>'guarantor_id' IS NOT DISTINCT FROM NEW.guarantor_id::text
      AND d.snapshot->'principal' = to_jsonb(NEW.principal) AND d.snapshot->'schedule' = v_schedule
      AND d.snapshot->'customer_identity' = v_customer_identity
      AND d.snapshot->'guarantor_identity' IS NOT DISTINCT FROM coalesce(v_guarantor_identity, 'null'::jsonb)
  ) THEN RAISE EXCEPTION 'Identitas atau data kontrak berubah; unggah kontrak bertanda tangan yang sesuai'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_check_contract_identity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER loan_check_contract_identity BEFORE UPDATE OF status ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.loan_check_contract_identity();
COMMIT;
