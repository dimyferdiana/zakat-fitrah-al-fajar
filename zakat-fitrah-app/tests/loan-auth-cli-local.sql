-- One statement for `supabase db query --file`; the inner exception rolls back all fixtures.
DO $$
DECLARE
  admin_id UUID := gen_random_uuid(); staff_id UUID := gen_random_uuid(); viewer_id UUID := gen_random_uuid();
  account_id UUID := gen_random_uuid(); person_id UUID := gen_random_uuid(); customer_id UUID := gen_random_uuid();
  rejected BOOLEAN;
BEGIN
  BEGIN
    INSERT INTO auth.users(id,email) VALUES (admin_id,admin_id::text||'@example.test'),(staff_id,staff_id::text||'@example.test'),(viewer_id,viewer_id::text||'@example.test'),(account_id,account_id::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (admin_id,admin_id),(staff_id,staff_id),(viewer_id,viewer_id),(account_id,account_id);
    INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES
      (admin_id,'Admin Uji',admin_id::text||'@example.test','admin',true),
      (staff_id,'Petugas Uji',staff_id::text||'@example.test','petugas',true),
      (viewer_id,'Viewer Uji',viewer_id::text||'@example.test','viewer',true);
    INSERT INTO public.muzakki(id,nama_kk,alamat) VALUES(person_id,'Orang Uji','Alamat Uji');
    INSERT INTO public.loan_customers(id,person_id,created_by) VALUES(customer_id,person_id,admin_id);
    UPDATE public.loan_portal_settings SET account_creation_enabled=true;
    PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id::text,'session_id',admin_id::text)::text,true);
    rejected := false;
    BEGIN PERFORM public.loan_link_customer_account(customer_id,account_id); EXCEPTION WHEN raise_exception THEN rejected := true; END;
    IF NOT rejected THEN RAISE EXCEPTION 'Identitas belum terverifikasi diterima'; END IF;
    PERFORM public.loan_confirm_individual(person_id,'Orang Uji');
    PERFORM set_config('request.jwt.claim.sub',staff_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',staff_id::text,'session_id',staff_id::text)::text,true);
    rejected := false;
    BEGIN PERFORM public.loan_link_customer_account(customer_id,account_id); EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
    IF NOT rejected THEN RAISE EXCEPTION 'Petugas dapat menautkan akun'; END IF;
    PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id::text,'session_id',admin_id::text)::text,true);
    PERFORM public.loan_link_customer_account(customer_id,account_id);
    PERFORM public.loan_link_customer_account(customer_id,account_id);
    IF (SELECT count(*) FROM public.loan_audit WHERE action='customer_account_linked' AND details->>'customer_id'=customer_id::text) <> 1 THEN
      RAISE EXCEPTION 'Tautan ulang menghasilkan audit duplikat';
    END IF;
    PERFORM set_config('request.jwt.claim.sub',viewer_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',viewer_id::text,'session_id',viewer_id::text)::text,true);
    IF public.loan_can_view_summary() THEN RAISE EXCEPTION 'Viewer tanpa izin dapat membaca'; END IF;
    PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id::text,'session_id',admin_id::text)::text,true);
    PERFORM public.loan_set_viewer_access(viewer_id,true);
    PERFORM set_config('request.jwt.claim.sub',viewer_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',viewer_id::text,'session_id',viewer_id::text)::text,true);
    IF NOT public.loan_can_view_summary() THEN RAISE EXCEPTION 'Viewer berizin ditolak'; END IF;
    PERFORM set_config('request.jwt.claim.sub',account_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',account_id::text,'session_id',account_id::text)::text,true);
    IF public.loan_is_staff() OR public.loan_can_view_summary() THEN RAISE EXCEPTION 'Nasabah memperoleh hak pengurus'; END IF;
    RAISE SQLSTATE 'P9001' USING MESSAGE='Rollback fixture';
  EXCEPTION WHEN SQLSTATE 'P9001' THEN
    RAISE NOTICE 'PASS: akun, identitas, peran dan izin viewer; fixture di-rollback';
  END;
END;
$$;
