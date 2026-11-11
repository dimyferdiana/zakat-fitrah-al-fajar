BEGIN;
-- A reverted change must not revive an exception that was granted for earlier data.
ALTER TABLE public.loans ADD COLUMN exception_version BIGINT NOT NULL DEFAULT 0;

CREATE FUNCTION public.loan_bump_exception_version() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF ROW(OLD.principal,OLD.guarantor_id,OLD.guarantor_relationship,OLD.guarantor_contact,OLD.customer_id)
     IS DISTINCT FROM ROW(NEW.principal,NEW.guarantor_id,NEW.guarantor_relationship,NEW.guarantor_contact,NEW.customer_id) THEN
    NEW.exception_version := OLD.exception_version + 1;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER loan_exception_version BEFORE UPDATE OF principal,guarantor_id,guarantor_relationship,guarantor_contact,customer_id ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.loan_bump_exception_version();

CREATE FUNCTION public.loan_invalidate_exceptions_for_schedule() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND OLD IS NOT DISTINCT FROM NEW THEN RETURN NEW; END IF;
  UPDATE public.loans SET exception_version=exception_version+1 WHERE id=COALESCE(NEW.loan_id,OLD.loan_id) AND status='draft';
  IF TG_OP='UPDATE' AND OLD.loan_id IS DISTINCT FROM NEW.loan_id THEN
    UPDATE public.loans SET exception_version=exception_version+1 WHERE id=OLD.loan_id AND status='draft';
  END IF;
  RETURN COALESCE(NEW,OLD);
END; $$;
CREATE TRIGGER loan_exception_schedule AFTER INSERT OR UPDATE OR DELETE ON public.loan_installments
FOR EACH ROW EXECUTE FUNCTION public.loan_invalidate_exceptions_for_schedule();

CREATE FUNCTION public.loan_invalidate_exceptions_for_person() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF ROW(OLD.nama_kk,OLD.nama_lengkap,OLD.nik,OLD.alamat,OLD.rt,OLD.rw,OLD.jenis_identitas,OLD.identitas_terverifikasi)
     IS DISTINCT FROM ROW(NEW.nama_kk,NEW.nama_lengkap,NEW.nik,NEW.alamat,NEW.rt,NEW.rw,NEW.jenis_identitas,NEW.identitas_terverifikasi) THEN
    UPDATE public.loans l SET exception_version=l.exception_version+1
    WHERE l.status='draft' AND (l.guarantor_id=NEW.id OR EXISTS (SELECT 1 FROM public.loan_customers c WHERE c.id=l.customer_id AND c.person_id=NEW.id));
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER loan_exception_person AFTER UPDATE ON public.muzakki
FOR EACH ROW EXECUTE FUNCTION public.loan_invalidate_exceptions_for_person();

CREATE OR REPLACE FUNCTION public.loan_exception_fingerprint(p_loan UUID, p_date DATE) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object('version',l.exception_version,'principal',l.principal,'guarantor_id',l.guarantor_id,'relationship',l.guarantor_relationship,
    'contact',l.guarantor_contact,'date',p_date,
    'customer_identity',public.loan_contract_person_snapshot((SELECT person_id FROM public.loan_customers WHERE id=l.customer_id)),
    'guarantor_identity',CASE WHEN l.guarantor_id IS NULL THEN NULL ELSE public.loan_contract_person_snapshot(l.guarantor_id) END,
    'schedule',(SELECT jsonb_agg(jsonb_build_object('date',due_date,'amount',amount) ORDER BY installment_number) FROM public.loan_installments WHERE loan_id=l.id))
  FROM public.loans l WHERE l.id=p_loan
$$;
REVOKE ALL ON FUNCTION public.loan_bump_exception_version(),public.loan_invalidate_exceptions_for_schedule(),public.loan_invalidate_exceptions_for_person() FROM PUBLIC,anon,authenticated;
COMMIT;
