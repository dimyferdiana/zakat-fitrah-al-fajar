BEGIN;
-- Some legacy permissive UPDATE policies allow self-profile edits. Their OR
-- combination must never allow a non-admin to grant themselves permissions.
CREATE FUNCTION public.loan_guard_staff_access() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF current_user IN('authenticated','anon') AND ROW(OLD.role,OLD.is_active,OLD.email) IS DISTINCT FROM ROW(NEW.role,NEW.is_active,NEW.email)
   AND NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Hanya admin dapat mengubah role, status atau email' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_guard_staff_access BEFORE UPDATE OF role,is_active,email ON public.users FOR EACH ROW EXECUTE FUNCTION public.loan_guard_staff_access();

CREATE FUNCTION public.loan_audit_loan_fields() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE old_data JSONB; new_data JSONB;
BEGIN
 IF TG_OP='INSERT' THEN
   IF NEW.migration_cutoff IS NULL AND NEW.opening_balance IS NULL AND NOT NEW.historical_incomplete THEN RETURN NEW; END IF;
   old_data:=NULL;
 ELSE
   IF ROW(OLD.category_id,OLD.purpose,OLD.principal,OLD.planned_disbursement_date,OLD.responsible_id,OLD.notes,OLD.funding_label,
      OLD.guarantor_id,OLD.guarantor_relationship,OLD.guarantor_contact,OLD.migration_cutoff,OLD.opening_balance,OLD.historical_incomplete)
      IS NOT DISTINCT FROM ROW(NEW.category_id,NEW.purpose,NEW.principal,NEW.planned_disbursement_date,NEW.responsible_id,NEW.notes,NEW.funding_label,
      NEW.guarantor_id,NEW.guarantor_relationship,NEW.guarantor_contact,NEW.migration_cutoff,NEW.opening_balance,NEW.historical_incomplete) THEN RETURN NEW; END IF;
   old_data:=jsonb_build_object('category_id',OLD.category_id,'purpose',OLD.purpose,'principal',OLD.principal,'planned_date',OLD.planned_disbursement_date,'responsible_id',OLD.responsible_id,'funding_label',OLD.funding_label,'guarantor_id',OLD.guarantor_id,'guarantor_relationship',OLD.guarantor_relationship,'guarantor_contact',OLD.guarantor_contact,'migration_cutoff',OLD.migration_cutoff,'opening_balance',OLD.opening_balance,'historical_incomplete',OLD.historical_incomplete);
 END IF;
 new_data:=jsonb_build_object('category_id',NEW.category_id,'purpose',NEW.purpose,'principal',NEW.principal,'planned_date',NEW.planned_disbursement_date,'responsible_id',NEW.responsible_id,'funding_label',NEW.funding_label,'guarantor_id',NEW.guarantor_id,'guarantor_relationship',NEW.guarantor_relationship,'guarantor_contact',NEW.guarantor_contact,'migration_cutoff',NEW.migration_cutoff,'opening_balance',NEW.opening_balance,'historical_incomplete',NEW.historical_incomplete);
 INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(NEW.id,auth.uid(),CASE WHEN TG_OP='INSERT' THEN 'migration_fields_created' ELSE 'loan_fields_updated' END,
   jsonb_build_object('old',old_data,'new',new_data,'notes_changed',CASE WHEN TG_OP='INSERT' THEN NEW.notes IS NOT NULL ELSE OLD.notes IS DISTINCT FROM NEW.notes END,'source',CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'user' END));
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_audit_loan_fields AFTER INSERT OR UPDATE OF category_id,purpose,principal,planned_disbursement_date,responsible_id,notes,funding_label,guarantor_id,guarantor_relationship,guarantor_contact,migration_cutoff,opening_balance,historical_incomplete ON public.loans
 FOR EACH ROW EXECUTE FUNCTION public.loan_audit_loan_fields();
REVOKE ALL ON FUNCTION public.loan_guard_staff_access(),public.loan_audit_loan_fields() FROM PUBLIC,anon,authenticated;
COMMIT;
