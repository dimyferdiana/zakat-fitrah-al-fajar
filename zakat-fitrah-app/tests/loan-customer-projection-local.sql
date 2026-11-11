-- Single CLI statement; synthetic fixtures are rolled back on success or failure.
DO $$
DECLARE a UUID := gen_random_uuid(); u UUID := gen_random_uuid(); other_user UUID := gen_random_uuid(); session_id UUID := gen_random_uuid(); p UUID := gen_random_uuid();
 c UUID := gen_random_uuid(); l UUID := gen_random_uuid(); row_data JSONB; item_count INTEGER;
BEGIN
  BEGIN
    INSERT INTO auth.users(id,email) VALUES (a,a::text||'@example.test'),(u,u::text||'@example.test'),(other_user,other_user::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (a,a),(u,u),(other_user,other_user);
    INSERT INTO auth.sessions(id,user_id) VALUES(session_id,u);
    INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES(a,'Admin Uji',a::text||'@example.test','admin',true);
    INSERT INTO public.muzakki(id,nama_kk,alamat,jenis_identitas,identitas_terverifikasi) VALUES(p,'Orang Uji','Alamat','individu',true);
    INSERT INTO public.loan_customers(id,person_id,auth_user_id,created_by) VALUES(c,p,u,a);
    INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,status,created_by,notes)
      VALUES(l,'TEST-'||l::text,c,'Uji',1000,'active',a,'CATATAN RAHASIA');
    INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount) VALUES(l,1,current_date+7,1000);
    PERFORM set_config('request.jwt.claim.sub',u::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u::text,'session_id',u::text)::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'session_id',session_id)::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    SELECT count(*) INTO item_count FROM public.loans WHERE id=l;
    IF item_count<>0 THEN RAISE EXCEPTION 'Nasabah masih dapat membaca tabel loans langsung'; END IF;
    SELECT to_jsonb(x) INTO row_data FROM public.loan_customer_loans() x WHERE id=l;
    IF row_data IS NULL OR row_data ? 'notes' OR row_data::text LIKE '%RAHASIA%' OR jsonb_array_length(row_data->'loan_installments')<>1 THEN
      RAISE EXCEPTION 'Proyeksi tidak sesuai atau memuat catatan internal';
    END IF;
    PERFORM set_config('request.jwt.claim.sub',other_user::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_user::text,'session_id',other_user::text)::text,true);
    IF EXISTS (SELECT 1 FROM public.loan_customer_loans() WHERE id=l) OR public.loan_is_owner(l) THEN
      RAISE EXCEPTION 'Akun lain dapat mengakses pinjaman';
    END IF;
    EXECUTE 'RESET ROLE';
    UPDATE public.loan_customers SET is_active=false WHERE id=c;
    PERFORM set_config('request.jwt.claim.sub',u::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u::text,'session_id',u::text)::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    IF EXISTS (SELECT 1 FROM public.loan_customer_loans() WHERE id=l) THEN RAISE EXCEPTION 'Nasabah nonaktif masih dapat membaca'; END IF;
    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claim.sub',a::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',a::text,'session_id',a::text)::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    IF NOT EXISTS (SELECT 1 FROM public.loans WHERE id=l AND notes='CATATAN RAHASIA') THEN RAISE EXCEPTION 'Pengurus kehilangan akses'; END IF;
    EXECUTE 'RESET ROLE';
    RAISE SQLSTATE 'P9001' USING MESSAGE='Rollback fixture';
  EXCEPTION WHEN SQLSTATE 'P9001' THEN NULL;
  END;
END;
$$;
