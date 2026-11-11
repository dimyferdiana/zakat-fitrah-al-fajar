-- Local database only. Temporary portal flag and all fixture data are rolled back.
BEGIN;
DO $$
DECLARE
  admin_id UUID := gen_random_uuid(); staff_id UUID := gen_random_uuid(); account_id UUID := gen_random_uuid();
  person_id UUID := gen_random_uuid(); customer_id UUID := gen_random_uuid(); rejected BOOLEAN;
BEGIN
  INSERT INTO auth.users(id,email) VALUES (admin_id,admin_id::text||'@example.test'),(staff_id,staff_id::text||'@example.test'),(account_id,account_id::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (admin_id,admin_id),(staff_id,staff_id),(account_id,account_id);
  INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES
    (admin_id,'Admin Uji',admin_id::text || '@example.test','admin',true),
    (staff_id,'Petugas Uji',staff_id::text || '@example.test','petugas',true);
  INSERT INTO public.muzakki(id,nama_kk,alamat) VALUES (person_id,'Orang Uji','Alamat Uji');
  INSERT INTO public.loan_customers(id,person_id,created_by) VALUES (customer_id,person_id,admin_id);
  UPDATE public.loan_portal_settings SET account_creation_enabled = true;
  PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id::text,'session_id',admin_id::text)::text,true);
  rejected := false;
  BEGIN PERFORM public.loan_link_customer_account(customer_id,account_id); EXCEPTION WHEN raise_exception THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Identitas belum terverifikasi harus ditolak'; END IF;
  PERFORM public.loan_confirm_individual(person_id,'Orang Uji');
  PERFORM public.person_set_active(person_id,false);
  rejected := false;
  BEGIN PERFORM public.loan_link_customer_account(customer_id,account_id); EXCEPTION WHEN raise_exception THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Identitas nonaktif harus ditolak'; END IF;
  PERFORM public.person_set_active(person_id,true);
  PERFORM set_config('request.jwt.claim.sub',staff_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',staff_id::text,'session_id',staff_id::text)::text,true);
  rejected := false;
  BEGIN PERFORM public.loan_link_customer_account(customer_id,account_id); EXCEPTION WHEN insufficient_privilege THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Petugas tidak boleh menautkan akun'; END IF;
  PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id::text,'session_id',admin_id::text)::text,true);
  PERFORM public.loan_link_customer_account(customer_id,account_id);
  PERFORM public.loan_link_customer_account(customer_id,account_id);
  IF (SELECT count(*) FROM public.loan_audit WHERE actor_id=admin_id AND action='customer_account_linked' AND details->>'customer_id'=customer_id::text) <> 1 THEN
    RAISE EXCEPTION 'Tautan ulang tidak boleh menambah audit duplikat';
  END IF;
  RAISE NOTICE 'PASS: peran admin, verifikasi identitas, penonaktifan, dan idempotensi tautan akun';
END;
$$;
ROLLBACK;
