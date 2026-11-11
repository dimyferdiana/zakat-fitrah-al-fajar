BEGIN;
CREATE FUNCTION public.loan_snapshot_guarantor_details() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_loan public.loans%ROWTYPE;
BEGIN
  IF NEW.kind='contract_signed' THEN
    SELECT * INTO v_loan FROM public.loans WHERE id=NEW.loan_id FOR SHARE;
    NEW.snapshot := NEW.snapshot || jsonb_build_object('guarantor_relationship',v_loan.guarantor_relationship,'guarantor_contact',v_loan.guarantor_contact);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER loan_snapshot_guarantor_details BEFORE INSERT ON public.loan_documents
  FOR EACH ROW EXECUTE FUNCTION public.loan_snapshot_guarantor_details();

CREATE FUNCTION public.loan_invalidate_guarantor_contract() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_person UUID;
BEGIN
  IF OLD.status='draft' AND ROW(OLD.guarantor_id, OLD.guarantor_relationship, OLD.guarantor_contact)
    IS DISTINCT FROM ROW(NEW.guarantor_id, NEW.guarantor_relationship, NEW.guarantor_contact) THEN
    SELECT person_id INTO v_person FROM public.loan_customers WHERE id=NEW.customer_id;
    INSERT INTO public.loan_contract_invalidations(document_id,person_id,invalidated_by)
      SELECT id,v_person,auth.uid() FROM public.loan_documents WHERE loan_id=NEW.id AND kind='contract_signed'
      ON CONFLICT(document_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER loan_invalidate_guarantor_contract AFTER UPDATE OF guarantor_id,guarantor_relationship,guarantor_contact ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.loan_invalidate_guarantor_contract();

CREATE FUNCTION public.loan_check_guarantor_contract() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF OLD.status='draft' AND NEW.status='active' AND NEW.guarantor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.loan_documents d WHERE d.loan_id=NEW.id AND d.kind='contract_signed'
      AND d.verified_by IS NOT NULL AND d.verified_at IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.loan_contract_invalidations x WHERE x.document_id=d.id)
      AND d.snapshot->>'guarantor_id'=NEW.guarantor_id::text
      AND d.snapshot->>'guarantor_relationship'=NEW.guarantor_relationship
      AND d.snapshot->>'guarantor_contact'=NEW.guarantor_contact
      AND d.snapshot->>'disbursement_date'=NEW.disbursement_date::text
      AND d.snapshot->'customer_identity'=public.loan_contract_person_snapshot((SELECT person_id FROM public.loan_customers WHERE id=NEW.customer_id))
      AND d.snapshot->'guarantor_identity'=public.loan_contract_person_snapshot(NEW.guarantor_id)
      AND d.snapshot->'principal'=to_jsonb(NEW.principal)
      AND d.snapshot->>'purpose'=NEW.purpose
      AND d.snapshot->'schedule'=(SELECT jsonb_agg(jsonb_build_object('dueDate',due_date::text,'amount',amount) ORDER BY installment_number) FROM public.loan_installments WHERE loan_id=NEW.id)
  ) THEN RAISE EXCEPTION 'Kontrak penjamin tidak sesuai'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER loan_check_guarantor_contract BEFORE UPDATE OF status ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.loan_check_guarantor_contract();
REVOKE ALL ON FUNCTION public.loan_snapshot_guarantor_details(),public.loan_invalidate_guarantor_contract(),public.loan_check_guarantor_contract() FROM PUBLIC,anon,authenticated;
COMMIT;
