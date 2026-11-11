-- Synthetic data only. The nested transaction always rolls back.
DO $fixture$
DECLARE actor UUID:=gen_random_uuid(); staff UUID:=gen_random_uuid(); person UUID:=gen_random_uuid();
 customer UUID:=gen_random_uuid(); loan UUID:=gen_random_uuid(); payment UUID:=gen_random_uuid();
 today DATE:=(now() AT TIME ZONE 'Asia/Jakarta')::date; value JSONB; rules JSONB; rejected BOOLEAN; i INTEGER;
BEGIN
 BEGIN
 INSERT INTO auth.users(id,email) VALUES(actor,actor::text||'@example.test'),(staff,staff::text||'@example.test');
 INSERT INTO auth.sessions(id,user_id) VALUES(actor,actor),(staff,staff);
 INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES(actor,'Admin Uji',actor::text||'@example.test','admin',true),(staff,'Petugas Uji',staff::text||'@example.test','petugas',true);
 INSERT INTO public.muzakki(id,nama_kk,nama_lengkap,alamat,jenis_identitas,identitas_terverifikasi) VALUES(person,'Nasabah Uji','Nasabah Uji','Alamat Uji','individu',true);
 INSERT INTO public.loan_customers(id,person_id,created_by) VALUES(customer,person,actor);
 INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,status,disbursement_date,created_by)
 VALUES(loan,'COLLECT-'||loan::text,customer,'Uji',1000,'active',today-180,actor);
 INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount) VALUES(loan,1,today,1000);
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor::text,'session_id',actor::text)::text,true);
 rules:='[{"label":"Lancar","min":0,"max":0},{"label":"Perhatian","min":1,"max":7},{"label":"Kurang lancar","min":8,"max":30},{"label":"Bermasalah","min":31,"max":90},{"label":"Macet","min":91,"max":null}]';
 rejected:=false;
 BEGIN PERFORM public.loan_set_collectibility(true,'[{"label":"A","min":0,"max":7},{"label":"B","min":9,"max":null}]'); EXCEPTION WHEN raise_exception THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Rentang bercelah harus ditolak'; END IF;
 rejected:=false;
 BEGIN PERFORM public.loan_set_collectibility(true,'[{"label":"A","min":0,"max":7},{"label":"B","min":7,"max":null}]'); EXCEPTION WHEN raise_exception THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Rentang bertumpang tindih harus ditolak'; END IF;
 PERFORM public.loan_set_collectibility(true,rules);
 FOR i IN SELECT unnest(ARRAY[0,1,7,8,30,31,90,91]) LOOP
   UPDATE public.loan_installments SET due_date=today-i WHERE loan_id=loan;
   value:=public.loan_collectibility_status(loan,today);
   IF (value->>'dpd')::INTEGER<>i OR value->>'label'<>(CASE WHEN i=0 THEN 'Lancar' WHEN i<=7 THEN 'Perhatian' WHEN i<=30 THEN 'Kurang lancar' WHEN i<=90 THEN 'Bermasalah' ELSE 'Macet' END) THEN RAISE EXCEPTION 'Batas DPD tidak sesuai: %, %',i,value; END IF;
 END LOOP;
 INSERT INTO public.loan_payments(id,loan_id,payment_date,amount,method,status,created_by,idempotency_key) VALUES(payment,loan,today,1000,'tunai','confirmed',actor,gen_random_uuid());
 value:=public.loan_collectibility_status(loan,today);
 IF value->>'state'<>'no_obligation' OR value->'label'<>'null'::jsonb THEN RAISE EXCEPTION 'Pinjaman lunas tidak boleh diberi label'; END IF;
 UPDATE public.loan_payments SET status='cancelled' WHERE id=payment;
 value:=public.loan_customer_collectibility(customer,today);
 IF value->>'label'<>'Macet' THEN RAISE EXCEPTION 'Koreksi harus menghitung ulang DPD'; END IF;
 PERFORM public.loan_set_collectibility(false,NULL);
 value:=public.loan_collectibility_status(loan,today);
 IF (value->>'enabled')::BOOLEAN OR value->'label'<>'null'::jsonb OR (value->>'dpd')::INTEGER<>91 OR (value->>'overdue')::BIGINT<>1000 THEN RAISE EXCEPTION 'Nonaktif harus menyembunyikan label tanpa menghapus DPD dan tunggakan'; END IF;
 IF (SELECT count(*) FROM public.loan_collectibility_versions WHERE created_by=actor)<>2 OR (SELECT count(*) FROM public.loan_audit WHERE actor_id=actor AND action='collectibility_policy_created')<>2 THEN RAISE EXCEPTION 'Riwayat versi dan audit kebijakan harus tersimpan'; END IF;
 UPDATE public.loans SET migration_cutoff=today-1,opening_balance=NULL,historical_incomplete=true WHERE id=loan;
 value:=public.loan_collectibility_status(loan,today);
 IF value->>'state'<>'unavailable' OR value->'label'<>'null'::jsonb THEN RAISE EXCEPTION 'Migrasi tidak lengkap harus ditandai belum tersedia'; END IF;
 UPDATE public.loans SET principal=1200,opening_balance=1000 WHERE id=loan;
 UPDATE public.loan_installments SET opening_remaining=1000 WHERE loan_id=loan;
 value:=public.loan_collectibility_status(loan,today);
 IF value->>'state'<>'unavailable' OR value->'label'<>'null'::jsonb THEN RAISE EXCEPTION 'Jadwal migrasi yang tidak cocok dengan pokok harus ditahan'; END IF;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',staff::text,'session_id',staff::text)::text,true);
 rejected:=false;
 BEGIN PERFORM public.loan_set_collectibility(true,rules); EXCEPTION WHEN insufficient_privilege THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Petugas bukan admin tidak boleh mengatur kolektabilitas'; END IF;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 rejected:=false;
 BEGIN PERFORM public.loan_collectibility_status(loan,today); EXCEPTION WHEN insufficient_privilege THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Akun tanpa hak pengurus tidak boleh membaca kolektabilitas'; END IF;
 RAISE SQLSTATE 'P9002' USING MESSAGE='rollback test fixture';
 EXCEPTION WHEN SQLSTATE 'P9002' THEN NULL;
 END;
END $fixture$;
