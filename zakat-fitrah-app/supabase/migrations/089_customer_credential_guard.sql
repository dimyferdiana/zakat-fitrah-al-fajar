BEGIN;
-- Linked customer credentials are managed by the audited admin recovery flow.
-- Existing staff-only password recovery remains available.
CREATE FUNCTION public.loan_guard_customer_credentials() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
BEGIN
 IF ROW(OLD.email,OLD.encrypted_password) IS DISTINCT FROM ROW(NEW.email,NEW.encrypted_password)
 AND EXISTS(SELECT 1 FROM public.loan_customers WHERE auth_user_id=NEW.id)
 AND NOT EXISTS(SELECT 1 FROM public.loan_customers WHERE auth_user_id=NEW.id AND access_paused AND recovery_state='pending') THEN
   RAISE EXCEPTION 'Pemulihan akun nasabah harus melalui admin' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_guard_customer_credentials BEFORE UPDATE OF email,encrypted_password ON auth.users
 FOR EACH ROW EXECUTE FUNCTION public.loan_guard_customer_credentials();
REVOKE ALL ON FUNCTION public.loan_guard_customer_credentials() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.loan_complete_customer_recovery(p_customer_id UUID,p_operation UUID,p_actor UUID,p_kind TEXT,p_success BOOLEAN) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_user UUID;
BEGIN
 IF p_actor IS NULL OR p_kind IS NULL OR p_kind NOT IN('email','password') OR p_success IS NULL THEN RAISE EXCEPTION 'Pemulihan tidak valid'; END IF;
 SELECT auth_user_id INTO v_user FROM public.loan_customers WHERE id=p_customer_id AND recovery_id=p_operation AND recovery_state='pending' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Referensi pemulihan tidak sesuai'; END IF;
 PERFORM 1 FROM auth.users WHERE id=v_user FOR UPDATE;
 -- Also revoke sessions created while the account was paused.
 DELETE FROM auth.sessions WHERE user_id=v_user;
 UPDATE public.loan_customers SET access_paused=NOT p_success,recovery_state=CASE WHEN p_success THEN NULL ELSE 'failed' END,
   recovery_id=CASE WHEN p_success THEN NULL ELSE recovery_id END WHERE id=p_customer_id;
 IF p_success AND p_kind='email' THEN UPDATE public.users u SET email=a.email FROM auth.users a WHERE u.id=v_user AND a.id=v_user; END IF;
 INSERT INTO public.loan_audit(actor_id,action,details) VALUES(p_actor,CASE WHEN p_success THEN 'customer_recovery_completed' ELSE 'customer_recovery_failed' END,
   jsonb_build_object('customer_id',p_customer_id,'operation',p_operation,'kind',p_kind));
END; $$;
CREATE POLICY loan_programme_file_read ON storage.objects FOR SELECT TO authenticated
 USING(bucket_id IN('qurban-photos','bukti-bayar') AND public.loan_has_active_legacy_profile());
DO $$ DECLARE r RECORD; BEGIN
 FOR r IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prorettype='trigger'::regtype LOOP
   EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',r.signature);
 END LOOP;
END $$;
COMMIT;
