BEGIN;
CREATE TABLE public.loan_contract_invalidations (
  document_id UUID PRIMARY KEY REFERENCES public.loan_documents(id) ON DELETE RESTRICT,
  person_id UUID NOT NULL REFERENCES public.muzakki(id) ON DELETE RESTRICT,
  invalidated_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  invalidated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_contract_invalidations ENABLE ROW LEVEL SECURITY;
CREATE POLICY loan_contract_invalidations_staff_read ON public.loan_contract_invalidations FOR SELECT TO authenticated USING (public.loan_is_staff());
REVOKE ALL ON public.loan_contract_invalidations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.loan_contract_invalidations TO authenticated;

-- A changed identity invalidates the old document permanently, even on revert.
CREATE FUNCTION public.loan_invalidate_contracts_for_person() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF ROW(OLD.nama_kk, OLD.nama_lengkap, OLD.nik, OLD.alamat, OLD.rt, OLD.rw, OLD.jenis_identitas, OLD.identitas_terverifikasi)
     IS DISTINCT FROM ROW(NEW.nama_kk, NEW.nama_lengkap, NEW.nik, NEW.alamat, NEW.rt, NEW.rw, NEW.jenis_identitas, NEW.identitas_terverifikasi) THEN
    INSERT INTO public.loan_contract_invalidations(document_id, person_id, invalidated_by)
      SELECT d.id, NEW.id, auth.uid() FROM public.loan_documents d
      JOIN public.loans l ON l.id = d.loan_id JOIN public.loan_customers c ON c.id = l.customer_id
      WHERE d.kind = 'contract_signed' AND l.status = 'draft' AND (c.person_id = NEW.id OR l.guarantor_id = NEW.id)
      ON CONFLICT (document_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_invalidate_contracts_for_person() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER loan_invalidate_contracts_for_person AFTER UPDATE ON public.muzakki
  FOR EACH ROW EXECUTE FUNCTION public.loan_invalidate_contracts_for_person();

CREATE OR REPLACE FUNCTION public.loan_check_contract_identity() RETURNS TRIGGER
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
      AND NOT EXISTS (SELECT 1 FROM public.loan_contract_invalidations x WHERE x.document_id = d.id)
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
COMMIT;
