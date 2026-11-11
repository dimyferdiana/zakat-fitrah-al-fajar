BEGIN;
CREATE TABLE public.loan_session_modes (
  session_id UUID PRIMARY KEY REFERENCES auth.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK(mode IN ('staff','customer')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_session_modes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.loan_session_modes FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.loan_session_valid() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,auth AS $$
 SELECT EXISTS(SELECT 1 FROM auth.sessions s WHERE s.user_id=auth.uid()
   AND s.id::text=auth.jwt()->>'session_id' AND (s.not_after IS NULL OR s.not_after>now()))
 AND NOT EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND NOT is_active)
 AND NOT EXISTS(SELECT 1 FROM public.loan_customers WHERE auth_user_id=auth.uid() AND access_paused);
$$;
CREATE FUNCTION public.loan_effective_mode() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT CASE WHEN NOT public.loan_session_valid() THEN NULL ELSE COALESCE(
   (SELECT mode FROM public.loan_session_modes WHERE session_id::text=auth.jwt()->>'session_id' AND user_id=auth.uid()),
   CASE WHEN EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND is_active) THEN 'staff' ELSE 'customer' END) END;
$$;
CREATE OR REPLACE FUNCTION public.loan_is_staff() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT COALESCE(public.loan_effective_mode()='staff' AND EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND is_active AND role::text IN('admin','petugas')),false);
$$;
CREATE OR REPLACE FUNCTION public.loan_is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT COALESCE(public.loan_effective_mode()='staff' AND EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND is_active AND role::text='admin'),false);
$$;
CREATE OR REPLACE FUNCTION public.loan_has_active_legacy_profile() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT COALESCE(public.loan_effective_mode()='staff' AND EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND is_active),false);
$$;
CREATE OR REPLACE FUNCTION public.loan_customer_session_valid() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT COALESCE(public.loan_effective_mode()='customer' AND EXISTS(SELECT 1 FROM public.loan_customers WHERE auth_user_id=auth.uid() AND is_active AND NOT access_paused),false);
$$;
CREATE OR REPLACE FUNCTION public.loan_can_view_summary() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.loan_is_staff() OR (public.loan_has_active_legacy_profile() AND EXISTS(
   SELECT 1 FROM public.users u JOIN public.loan_viewer_permissions p ON p.user_id=u.id WHERE u.id=auth.uid() AND u.is_active AND u.role::text='viewer'));
$$;

CREATE FUNCTION public.loan_auth_context() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_staff JSONB; v_customer JSONB; v_mode TEXT;
BEGIN
 IF NOT public.loan_session_valid() THEN RAISE EXCEPTION 'Sesi tidak aktif' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('id',id,'email',email,'nama_lengkap',nama_lengkap,'role',role,'is_active',is_active,'created_at',created_at,'updated_at',updated_at) INTO v_staff FROM public.users WHERE id=auth.uid() AND is_active;
 SELECT jsonb_build_object('id',id,'person_id',person_id,'is_active',is_active) INTO v_customer FROM public.loan_customers WHERE auth_user_id=auth.uid() AND is_active AND NOT access_paused;
 v_mode:=public.loan_effective_mode();
 IF (v_mode='staff' AND v_staff IS NULL) OR (v_mode='customer' AND v_customer IS NULL) THEN RAISE EXCEPTION 'Akun tidak aktif atau belum terdaftar' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('mode',v_mode,'staff',CASE WHEN v_mode='staff' THEN v_staff ELSE NULL END,'customer',CASE WHEN v_mode='customer' THEN v_customer ELSE NULL END,'can_staff',v_staff IS NOT NULL,'can_customer',v_customer IS NOT NULL);
END; $$;
CREATE FUNCTION public.loan_set_session_mode(p_mode TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_session UUID;
BEGIN
 IF p_mode IS NULL OR p_mode NOT IN('staff','customer') OR NOT public.loan_session_valid() THEN RAISE EXCEPTION 'Sesi atau mode tidak valid' USING ERRCODE='42501'; END IF;
 SELECT id INTO v_session FROM auth.sessions WHERE user_id=auth.uid() AND id::text=auth.jwt()->>'session_id' FOR UPDATE;
 IF p_mode='staff' AND NOT EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND is_active) THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_mode='customer' AND NOT EXISTS(SELECT 1 FROM public.loan_customers WHERE auth_user_id=auth.uid() AND is_active AND NOT access_paused) THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 INSERT INTO public.loan_session_modes(session_id,user_id,mode) VALUES(v_session,auth.uid(),p_mode) ON CONFLICT(session_id) DO UPDATE SET mode=EXCLUDED.mode,updated_at=now();
 INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'session_mode_changed',jsonb_build_object('mode',p_mode));
END; $$;

-- All legacy role helpers obey the same server-side session mode.
CREATE OR REPLACE FUNCTION public.get_current_user_is_active() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.loan_has_active_legacy_profile(); $$;
CREATE OR REPLACE FUNCTION public.get_current_user_role() RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT role::text FROM public.users WHERE id=auth.uid() AND public.loan_has_active_legacy_profile(); $$;
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT role FROM public.users WHERE id=auth.uid() AND public.loan_has_active_legacy_profile(); $$;
CREATE OR REPLACE FUNCTION public.is_active_user() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.loan_has_active_legacy_profile(); $$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.loan_is_admin(); $$;
CREATE OR REPLACE FUNCTION public.is_admin_user() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.loan_is_admin(); $$;

-- Cover all legacy tables, including those added since the original guard.
DO $$ DECLARE r RECORD; BEGIN
 FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN('r','p') LOOP
   EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon',r.relname);
   IF r.relname NOT LIKE 'loan\_%' ESCAPE '\' AND r.relname<>'loans' THEN
     EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',r.relname);
     EXECUTE format('DROP POLICY IF EXISTS loan_legacy_profile_guard ON public.%I',r.relname);
     EXECUTE format('CREATE POLICY loan_legacy_profile_guard ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.loan_has_active_legacy_profile()) WITH CHECK(public.loan_has_active_legacy_profile())',r.relname);
   END IF;
 END LOOP;
 FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v' LOOP
   EXECUTE format('ALTER VIEW public.%I SET(security_invoker=true)',r.relname);
   EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon',r.relname);
 END LOOP;
 -- Preserve previously allowed authenticated RPCs; trigger and private helpers stay private.
 FOR r IN SELECT p.oid::regprocedure AS signature,p.prorettype='trigger'::regtype AS is_trigger,has_function_privilege('authenticated',p.oid,'EXECUTE') AS allowed FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' LOOP
   EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',r.signature);
   IF r.allowed AND NOT r.is_trigger THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',r.signature); END IF;
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.loan_session_valid(),public.loan_effective_mode(),public.loan_auth_context(),public.loan_set_session_mode(TEXT) TO authenticated;

-- Public URLs stop serving private programme files; existing stored paths remain intact.
UPDATE storage.buckets SET public=false WHERE id IN('qurban-photos','bukti-bayar');
CREATE POLICY loan_legacy_storage_read ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
 USING(bucket_id='pinjaman-jamaah-private' OR public.loan_has_active_legacy_profile());
CREATE POLICY loan_all_storage_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.loan_has_active_legacy_profile());
CREATE POLICY loan_all_storage_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.loan_has_active_legacy_profile()) WITH CHECK(public.loan_has_active_legacy_profile());
CREATE POLICY loan_all_storage_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING(public.loan_has_active_legacy_profile());
COMMIT;
