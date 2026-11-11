-- Run with Supabase CLI; the exception rolls all synthetic data back.
DO $$
DECLARE a UUID:=gen_random_uuid(); staff UUID:=gen_random_uuid(); u UUID:=gen_random_uuid();
  p UUID:=gen_random_uuid(); c UUID:=gen_random_uuid(); old_session UUID:=gen_random_uuid(); new_session UUID:=gen_random_uuid(); operation UUID:=gen_random_uuid(); denied BOOLEAN;
BEGIN
  BEGIN
    INSERT INTO auth.users(id,email) VALUES (a,a::text||'@example.test'),(staff,staff::text||'@example.test'),(u,u::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (a,a),(staff,staff),(u,u);
    INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES
      (a,'Admin Uji',a::text||'@example.test','admin',true),
      (staff,'Petugas Uji',staff::text||'@example.test','petugas',true);
    INSERT INTO public.muzakki(id,nama_kk,alamat,jenis_identitas,identitas_terverifikasi) VALUES(p,'Orang Uji','Alamat','individu',true);
    INSERT INTO public.loan_customers(id,person_id,auth_user_id,created_by) VALUES(c,p,u,a);
    INSERT INTO auth.sessions(id,user_id) VALUES(old_session,u);
    PERFORM set_config('request.jwt.claim.sub',u::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u::text,'session_id',u::text)::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'session_id',old_session)::text,true);
    IF NOT public.loan_customer_session_valid() THEN RAISE EXCEPTION 'Sesi nasabah yang aktif ditolak'; END IF;
    PERFORM set_config('request.jwt.claim.sub',staff::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',staff::text,'session_id',staff::text)::text,true);
    denied:=false;
    BEGIN PERFORM public.loan_begin_customer_recovery(c,operation); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
    IF NOT denied THEN RAISE EXCEPTION 'Petugas dapat mereset akun'; END IF;
    PERFORM set_config('request.jwt.claim.sub',a::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',a::text,'session_id',a::text)::text,true);
    IF public.loan_begin_customer_recovery(c,operation)<>u THEN RAISE EXCEPTION 'Akun yang dipulihkan salah'; END IF;
    denied:=false;
    BEGIN PERFORM public.loan_begin_customer_recovery(c,gen_random_uuid()); EXCEPTION WHEN raise_exception THEN denied:=true; END;
    IF NOT denied THEN RAISE EXCEPTION 'Pemulihan bersamaan harus ditolak'; END IF;
    IF EXISTS(SELECT 1 FROM auth.sessions WHERE id=old_session) OR NOT (SELECT access_paused FROM public.loan_customers WHERE id=c) THEN
      RAISE EXCEPTION 'Sesi tidak dicabut atau akun tidak ditangguhkan'; END IF;
    INSERT INTO auth.sessions(id,user_id) VALUES(gen_random_uuid(),u);
    PERFORM public.loan_complete_customer_recovery(c,operation,a,'password',true);
    IF EXISTS(SELECT 1 FROM auth.sessions WHERE user_id=u) THEN RAISE EXCEPTION 'Sesi yang dibuat selama pemulihan harus dicabut'; END IF;
    PERFORM set_config('request.jwt.claim.sub',u::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u::text,'session_id',u::text)::text,true);
    IF public.loan_customer_session_valid() THEN RAISE EXCEPTION 'Token sesi lama masih berlaku'; END IF;
    INSERT INTO auth.sessions(id,user_id) VALUES(new_session,u);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'session_id',new_session)::text,true);
    IF NOT public.loan_customer_session_valid() THEN RAISE EXCEPTION 'Sesi baru ditolak'; END IF;
    UPDATE public.loan_customers SET is_active=false WHERE id=c;
    IF public.loan_customer_session_valid() THEN RAISE EXCEPTION 'Akun nonaktif masih dapat mengakses'; END IF;
    RAISE SQLSTATE 'P9001' USING MESSAGE='Rollback fixture';
  EXCEPTION WHEN SQLSTATE 'P9001' THEN NULL;
  END;
END $$;
