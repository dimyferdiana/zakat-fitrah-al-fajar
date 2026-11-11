BEGIN;
-- Service and maintenance changes may have no JWT actor; retain them as system
-- events rather than falsely attributing them to a customer or staff member.
ALTER TABLE public.loan_audit ALTER COLUMN actor_id DROP NOT NULL;

CREATE FUNCTION public.loan_audit_person_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE before_data JSONB; after_data JSONB;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.loan_customers WHERE person_id=NEW.id)
    AND NOT EXISTS(SELECT 1 FROM public.loans WHERE guarantor_id=NEW.id) THEN RETURN NEW; END IF;
 before_data:=jsonb_build_object('nama_kk',OLD.nama_kk,'nama_lengkap',OLD.nama_lengkap,'nik',OLD.nik,'alamat',OLD.alamat,'rt',OLD.rt,'rw',OLD.rw,'no_telp',OLD.no_telp,'jenis_identitas',OLD.jenis_identitas,'identitas_terverifikasi',OLD.identitas_terverifikasi,'aktif',OLD.aktif,'rumah_tangga_id',OLD.rumah_tangga_id);
 after_data:=jsonb_build_object('nama_kk',NEW.nama_kk,'nama_lengkap',NEW.nama_lengkap,'nik',NEW.nik,'alamat',NEW.alamat,'rt',NEW.rt,'rw',NEW.rw,'no_telp',NEW.no_telp,'jenis_identitas',NEW.jenis_identitas,'identitas_terverifikasi',NEW.identitas_terverifikasi,'aktif',NEW.aktif,'rumah_tangga_id',NEW.rumah_tangga_id);
 IF before_data IS DISTINCT FROM after_data THEN
   INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'person_identity_updated',jsonb_build_object('person_id',NEW.id,'old',before_data,'new',after_data,'source',CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'user' END));
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_audit_person_change AFTER UPDATE ON public.muzakki FOR EACH ROW EXECUTE FUNCTION public.loan_audit_person_change();

CREATE FUNCTION public.loan_audit_staff_access_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF ROW(OLD.role,OLD.is_active,OLD.email) IS DISTINCT FROM ROW(NEW.role,NEW.is_active,NEW.email) THEN
   INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'staff_access_updated',jsonb_build_object('user_id',NEW.id,'old',jsonb_build_object('role',OLD.role,'active',OLD.is_active,'email',OLD.email),'new',jsonb_build_object('role',NEW.role,'active',NEW.is_active,'email',NEW.email),'source',CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'user' END));
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_audit_staff_access_change AFTER UPDATE OF role,is_active,email ON public.users FOR EACH ROW EXECUTE FUNCTION public.loan_audit_staff_access_change();

CREATE FUNCTION public.loan_audit_customer_access_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF ROW(OLD.auth_user_id,OLD.is_active,OLD.access_paused) IS DISTINCT FROM ROW(NEW.auth_user_id,NEW.is_active,NEW.access_paused) THEN
   INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'customer_access_updated',jsonb_build_object('customer_id',NEW.id,'old',jsonb_build_object('auth_user_id',OLD.auth_user_id,'active',OLD.is_active,'paused',OLD.access_paused),'new',jsonb_build_object('auth_user_id',NEW.auth_user_id,'active',NEW.is_active,'paused',NEW.access_paused),'source',CASE WHEN auth.uid() IS NULL THEN 'system' ELSE 'user' END));
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_audit_customer_access_change AFTER UPDATE OF auth_user_id,is_active,access_paused ON public.loan_customers FOR EACH ROW EXECUTE FUNCTION public.loan_audit_customer_access_change();

CREATE FUNCTION public.loan_audit_customer_email_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE c public.loan_customers%ROWTYPE; actor UUID;
BEGIN
 IF OLD.email IS NOT DISTINCT FROM NEW.email THEN RETURN NEW; END IF;
 SELECT * INTO c FROM public.loan_customers WHERE auth_user_id=NEW.id;
 IF NOT FOUND THEN RETURN NEW; END IF;
 SELECT a.actor_id INTO actor FROM public.loan_audit a WHERE a.action='customer_recovery_started' AND a.details->>'operation'=c.recovery_id::text ORDER BY a.id DESC LIMIT 1;
 INSERT INTO public.loan_audit(actor_id,action,details) VALUES(COALESCE(auth.uid(),actor),'customer_email_updated',jsonb_build_object('customer_id',c.id,'old_email',OLD.email,'new_email',NEW.email,'operation',c.recovery_id));
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_audit_customer_email_change AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.loan_audit_customer_email_change();

CREATE FUNCTION public.loan_audit_schedule_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_loan UUID;
BEGIN
 v_loan:=CASE WHEN TG_OP='DELETE' THEN OLD.loan_id ELSE NEW.loan_id END;
 INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(v_loan,auth.uid(),'installment_'||lower(TG_OP),jsonb_build_object('old',CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END,'new',CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END));
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END; $$;
CREATE TRIGGER loan_audit_schedule_change AFTER INSERT OR UPDATE OR DELETE ON public.loan_installments FOR EACH ROW EXECUTE FUNCTION public.loan_audit_schedule_change();

CREATE FUNCTION public.loan_audit_document_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_loan UUID; v_document UUID; v_kind TEXT; v_actor UUID;
BEGIN
 v_loan:=CASE WHEN TG_OP='DELETE' THEN OLD.loan_id ELSE NEW.loan_id END;
 v_document:=CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END;
 v_kind:=CASE WHEN TG_OP='DELETE' THEN OLD.kind ELSE NEW.kind END;
 v_actor:=CASE WHEN TG_OP='INSERT' THEN COALESCE(auth.uid(),NEW.created_by) ELSE auth.uid() END;
 INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(v_loan,v_actor,'document_'||lower(TG_OP),jsonb_build_object('document_id',v_document,'kind',v_kind));
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END; $$;
CREATE TRIGGER loan_audit_document_change AFTER INSERT OR UPDATE OR DELETE ON public.loan_documents FOR EACH ROW EXECUTE FUNCTION public.loan_audit_document_change();

CREATE FUNCTION public.loan_audit_category_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF ROW(OLD.name,OLD.is_active) IS DISTINCT FROM ROW(NEW.name,NEW.is_active) THEN
   INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'category_changed',jsonb_build_object('category_id',NEW.id,'old',jsonb_build_object('name',OLD.name,'active',OLD.is_active),'new',jsonb_build_object('name',NEW.name,'active',NEW.is_active)));
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_audit_category_change AFTER UPDATE OF name,is_active ON public.loan_categories FOR EACH ROW EXECUTE FUNCTION public.loan_audit_category_change();

REVOKE ALL ON FUNCTION public.loan_audit_person_change(),public.loan_audit_staff_access_change(),public.loan_audit_customer_access_change(),public.loan_audit_customer_email_change(),public.loan_audit_schedule_change(),public.loan_audit_document_change(),public.loan_audit_category_change() FROM PUBLIC,anon,authenticated;
COMMIT;
