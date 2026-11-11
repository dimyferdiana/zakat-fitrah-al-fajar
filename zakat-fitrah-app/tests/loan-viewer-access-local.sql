-- Local database only; synthetic users, permissions and changes are rolled back.
BEGIN;
DO $$
DECLARE
  admin_id UUID := gen_random_uuid(); staff_id UUID := gen_random_uuid(); viewer_id UUID := gen_random_uuid();
  customer_id UUID := gen_random_uuid(); person_id UUID := gen_random_uuid(); loan_id UUID := gen_random_uuid();
  rejected BOOLEAN;
BEGIN
  INSERT INTO auth.users(id,email) VALUES (admin_id,admin_id::text||'@example.test'),(staff_id,staff_id::text||'@example.test'),(viewer_id,viewer_id::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (admin_id,admin_id),(staff_id,staff_id),(viewer_id,viewer_id);
  INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES
    (admin_id,'Admin',admin_id::text||'@example.test','admin',true),
    (staff_id,'Petugas',staff_id::text||'@example.test','petugas',true),
    (viewer_id,'Viewer',viewer_id::text||'@example.test','viewer',true);
  INSERT INTO public.muzakki(id,nama_kk,alamat) VALUES (person_id,'Uji','Uji');
  INSERT INTO public.loan_customers(id,person_id,created_by) VALUES (customer_id,person_id,admin_id);
  INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,created_by)
    VALUES (loan_id,'UJI-'||loan_id::text,customer_id,'Uji',1000,admin_id);
  PERFORM set_config('request.jwt.claim.sub',viewer_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',viewer_id::text,'session_id',viewer_id::text)::text,true);
  rejected := false;
  BEGIN PERFORM public.loan_viewer_summary(); EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Viewer tanpa izin harus ditolak'; END IF;
  PERFORM set_config('request.jwt.claim.sub',staff_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',staff_id::text,'session_id',staff_id::text)::text,true);
  rejected := false;
  BEGIN PERFORM public.loan_set_viewer_access(viewer_id,true); EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Hanya admin boleh memberikan izin'; END IF;
  PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id::text,'session_id',admin_id::text)::text,true);
  PERFORM public.loan_set_viewer_access(viewer_id,true);
  PERFORM public.loan_set_viewer_access(viewer_id,true);
  IF (SELECT count(*) FROM public.loan_audit WHERE action='viewer_access_granted' AND details->>'user_id'=viewer_id::text) <> 1 THEN
    RAISE EXCEPTION 'Izin ulang tidak boleh membuat audit duplikat';
  END IF;
  PERFORM set_config('request.jwt.claim.sub',viewer_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',viewer_id::text,'session_id',viewer_id::text)::text,true);
  IF NOT public.loan_can_view_summary() OR NOT EXISTS (SELECT 1 FROM public.loan_viewer_summary() WHERE id=loan_id) THEN
    RAISE EXCEPTION 'Viewer berizin harus dapat membaca ringkasan';
  END IF;
  UPDATE public.users SET is_active=false WHERE id=viewer_id;
  IF public.loan_can_view_summary() THEN RAISE EXCEPTION 'Viewer nonaktif tidak boleh membaca'; END IF;
  UPDATE public.users SET is_active=true WHERE id=viewer_id;
  PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id::text,'session_id',admin_id::text)::text,true);
  PERFORM public.loan_set_viewer_access(viewer_id,false);
  PERFORM set_config('request.jwt.claim.sub',viewer_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',viewer_id::text,'session_id',viewer_id::text)::text,true);
  IF public.loan_can_view_summary() THEN RAISE EXCEPTION 'Izin yang dicabut tidak boleh membaca'; END IF;
  PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id::text,'session_id',admin_id::text)::text,true);
  PERFORM public.loan_set_viewer_access(viewer_id,true);
  PERFORM set_config('test.loan_viewer',viewer_id::text,true);
  PERFORM set_config('test.loan_viewer_loan',loan_id::text,true);
  RAISE NOTICE 'PASS: viewer dengan izin eksplisit, penonaktifan dan pencabutan';
END;
$$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub',current_setting('test.loan_viewer'),true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.loan_viewer'),'session_id',current_setting('test.loan_viewer'))::text,true);
  IF NOT EXISTS (SELECT 1 FROM public.loan_viewer_summary() WHERE id=current_setting('test.loan_viewer_loan')::uuid) THEN
    RAISE EXCEPTION 'Viewer berizin harus dapat membaca melalui RPC';
  END IF;
  IF EXISTS (SELECT 1 FROM public.loans WHERE id=current_setting('test.loan_viewer_loan')::uuid) THEN
    RAISE EXCEPTION 'Izin ringkasan tidak boleh membuka tabel pinjaman';
  END IF;
  RAISE NOTICE 'PASS: viewer authenticated hanya dapat mengakses ringkasan';
END;
$$;
RESET ROLE;
ROLLBACK;
