BEGIN;
ALTER TABLE public.loan_customers ADD COLUMN recovery_id UUID,
 ADD COLUMN recovery_state TEXT CHECK(recovery_state IN('pending','failed'));

CREATE FUNCTION public.loan_begin_customer_recovery(p_customer_id UUID,p_operation UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_customer public.loan_customers%ROWTYPE;
BEGIN
 IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_operation IS NULL THEN RAISE EXCEPTION 'Referensi pemulihan wajib diisi'; END IF;
 SELECT * INTO v_customer FROM public.loan_customers WHERE id=p_customer_id AND is_active FOR UPDATE;
 IF NOT FOUND OR v_customer.auth_user_id IS NULL THEN RAISE EXCEPTION 'Akun tidak tersedia'; END IF;
 IF v_customer.recovery_state='pending' THEN RAISE EXCEPTION 'Pemulihan sedang berlangsung'; END IF;
 UPDATE public.loan_customers SET access_paused=true,recovery_id=p_operation,recovery_state='pending' WHERE id=p_customer_id;
 DELETE FROM auth.sessions WHERE user_id=v_customer.auth_user_id;
 INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'customer_recovery_started',jsonb_build_object('customer_id',p_customer_id,'operation',p_operation));
 RETURN v_customer.auth_user_id;
END; $$;
-- Service-only completion prevents a client from claiming that Auth was updated.
CREATE FUNCTION public.loan_complete_customer_recovery(p_customer_id UUID,p_operation UUID,p_actor UUID,p_kind TEXT,p_success BOOLEAN) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF p_actor IS NULL OR p_kind IS NULL OR p_kind NOT IN('email','password') OR p_success IS NULL THEN RAISE EXCEPTION 'Pemulihan tidak valid'; END IF;
 UPDATE public.loan_customers SET access_paused=NOT p_success,recovery_state=CASE WHEN p_success THEN NULL ELSE 'failed' END,
   recovery_id=CASE WHEN p_success THEN NULL ELSE recovery_id END
 WHERE id=p_customer_id AND recovery_id=p_operation AND recovery_state='pending';
 IF NOT FOUND THEN RAISE EXCEPTION 'Referensi pemulihan tidak sesuai'; END IF;
 IF p_success AND p_kind='email' THEN
   UPDATE public.users u SET email=a.email FROM auth.users a JOIN public.loan_customers c ON c.auth_user_id=a.id WHERE c.id=p_customer_id AND u.id=a.id;
 END IF;
 INSERT INTO public.loan_audit(actor_id,action,details) VALUES(p_actor,CASE WHEN p_success THEN 'customer_recovery_completed' ELSE 'customer_recovery_failed' END,
   jsonb_build_object('customer_id',p_customer_id,'operation',p_operation,'kind',p_kind));
END; $$;
REVOKE ALL ON FUNCTION public.loan_begin_account_recovery(UUID),public.loan_finish_account_recovery(UUID,UUID,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.loan_begin_customer_recovery(UUID,UUID),public.loan_complete_customer_recovery(UUID,UUID,UUID,TEXT,BOOLEAN) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_begin_customer_recovery(UUID,UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.loan_complete_customer_recovery(UUID,UUID,UUID,TEXT,BOOLEAN) TO service_role;

CREATE OR REPLACE FUNCTION public.loan_link_customer_account(p_customer_id UUID,p_auth_user_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_customer public.loan_customers%ROWTYPE;
BEGIN
 IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF NOT public.loan_customer_creation_enabled() THEN RAISE EXCEPTION 'Pembuatan akun belum diaktifkan'; END IF;
 IF p_customer_id IS NULL OR p_auth_user_id IS NULL THEN RAISE EXCEPTION 'Nasabah dan akun wajib diisi'; END IF;
 SELECT * INTO v_customer FROM public.loan_customers WHERE id=p_customer_id FOR UPDATE;
 IF NOT FOUND OR NOT v_customer.is_active THEN RAISE EXCEPTION 'Nasabah tidak aktif'; END IF;
 PERFORM 1 FROM public.muzakki WHERE id=v_customer.person_id AND aktif AND jenis_identitas='individu' AND identitas_terverifikasi FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Identitas nasabah belum diverifikasi'; END IF;
 IF v_customer.auth_user_id=p_auth_user_id THEN RETURN p_customer_id; END IF;
 IF v_customer.auth_user_id IS NOT NULL THEN RAISE EXCEPTION 'Nasabah sudah memiliki akun'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_auth_user_id AND email IS NOT NULL)
 OR EXISTS(SELECT 1 FROM public.users WHERE id=p_auth_user_id AND NOT is_active) THEN RAISE EXCEPTION 'Akun tidak aktif atau tidak tersedia'; END IF;
 UPDATE public.loan_customers SET auth_user_id=p_auth_user_id WHERE id=p_customer_id;
 INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'customer_account_linked',jsonb_build_object('customer_id',p_customer_id,'auth_user_id',p_auth_user_id));
 RETURN p_customer_id;
END; $$;
CREATE FUNCTION public.loan_link_staff_customer(p_customer_id UUID,p_user_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.loan_is_admin() OR NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_user_id AND is_active) THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 RETURN public.loan_link_customer_account(p_customer_id,p_user_id);
END; $$;
CREATE FUNCTION public.loan_list_staff_accounts() RETURNS TABLE(id UUID,nama_lengkap TEXT,email TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT u.id,u.nama_lengkap,u.email FROM public.users u WHERE u.is_active ORDER BY u.nama_lengkap,u.id;
END; $$;
REVOKE ALL ON FUNCTION public.loan_link_staff_customer(UUID,UUID),public.loan_list_staff_accounts() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_link_staff_customer(UUID,UUID),public.loan_list_staff_accounts() TO authenticated;

-- These two RPCs previously checked only the stored role and ignored session mode.
CREATE OR REPLACE FUNCTION public.loan_set_policy(p_min BIGINT,p_max BIGINT,p_min_days INTEGER,p_max_days INTEGER,p_guarantor BOOLEAN,p_exceptions TEXT[]) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID;
BEGIN
 IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Hanya admin dapat mengubah kebijakan' USING ERRCODE='42501'; END IF;
 IF p_guarantor IS NULL OR p_exceptions IS NULL OR NOT p_exceptions <@ ARRAY['principal','tenor','guarantor']::TEXT[] THEN RAISE EXCEPTION 'Kebijakan tidak valid'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('loan_policy_settings'));
 UPDATE public.loan_policies SET is_active=false WHERE is_active;
 INSERT INTO public.loan_policies(min_principal,max_principal,min_tenor_days,max_tenor_days,guarantor_required,permitted_exceptions,created_by,is_active)
 VALUES(p_min,p_max,p_min_days,p_max_days,p_guarantor,p_exceptions,auth.uid(),true) RETURNING id INTO v_id;
 INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'policy_created',jsonb_build_object('policy_id',v_id));
 RETURN v_id;
END; $$;
CREATE OR REPLACE FUNCTION public.loan_set_category(p_id UUID,p_name TEXT,p_active BOOLEAN) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID;
BEGIN
 IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Hanya admin dapat mengubah kategori' USING ERRCODE='42501'; END IF;
 IF p_name IS NULL OR length(trim(p_name))=0 OR p_active IS NULL THEN RAISE EXCEPTION 'Kategori tidak valid'; END IF;
 IF p_id IS NULL THEN INSERT INTO public.loan_categories(name,is_active) VALUES(trim(p_name),p_active) RETURNING id INTO v_id;
 ELSE UPDATE public.loan_categories SET name=trim(p_name),is_active=p_active WHERE id=p_id RETURNING id INTO v_id;
 IF v_id IS NULL THEN RAISE EXCEPTION 'Kategori tidak ditemukan'; END IF; END IF;
 INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'category_updated',jsonb_build_object('category_id',v_id,'name',trim(p_name),'active',p_active));
 RETURN v_id;
END; $$;
COMMIT;
