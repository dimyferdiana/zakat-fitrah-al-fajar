-- Synthetic policy and contract tests; the transaction is always rolled back.
BEGIN;
DO $$
DECLARE
  actor UUID := gen_random_uuid(); person UUID := gen_random_uuid(); guarantor UUID := gen_random_uuid();
  customer UUID := gen_random_uuid(); loan UUID := gen_random_uuid(); request UUID := gen_random_uuid();
  today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date; schedule JSONB; rejected BOOLEAN;
BEGIN
  INSERT INTO auth.users(id,email) VALUES (actor,actor::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (actor,actor);
  INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES(actor,'Admin Uji',actor::text||'@example.test','admin',true);
  INSERT INTO public.muzakki(id,nama_kk,nama_lengkap,alamat,jenis_identitas,identitas_terverifikasi)
    VALUES(person,'Nasabah Uji','Nasabah Uji','Alamat','individu',true), (guarantor,'Penjamin Uji','Penjamin Uji','Alamat','individu',true);
  INSERT INTO public.loan_customers(id,person_id,created_by) VALUES(customer,person,actor);
  INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,created_by) VALUES(loan,'TEST-'||loan::text,customer,'Uji',1000,actor);
  INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount) VALUES(loan,1,today+7,1000);
  PERFORM set_config('request.jwt.claim.sub',actor::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor::text,'session_id',actor::text)::text,true);
  PERFORM public.loan_set_policy(NULL,500,NULL,NULL,true,ARRAY['principal','guarantor']);
  PERFORM public.loan_set_draft_details(loan,today,NULL,NULL,NULL,NULL);
  rejected := false;
  BEGIN PERFORM public.loan_disburse(loan,today,'tunai',NULL,'Dana Uji',request);
    EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%melanggar kebijakan%' THEN RAISE; END IF; rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Batas kebijakan harus ditegakkan'; END IF;
  PERFORM public.loan_record_policy_exception(loan,today,'principal','Disetujui pengurus');
  PERFORM public.loan_record_policy_exception(loan,today,'guarantor','Disetujui pengurus');
  rejected := false;
  BEGIN PERFORM public.loan_set_draft_details(loan,today,NULL,person,'Diri sendiri','0812');
    EXCEPTION WHEN raise_exception THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Nasabah tidak boleh menjadi penjamin sendiri'; END IF;
  PERFORM public.loan_set_draft_details(loan,today,NULL,guarantor,'Keluarga','0812');
  rejected := false;
  BEGIN PERFORM public.loan_disburse(loan,today,'tunai',NULL,'Dana Uji',request);
    EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%melanggar kebijakan%' THEN RAISE; END IF; rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Pengecualian lama harus gugur setelah penjamin berubah'; END IF;
  PERFORM public.loan_record_policy_exception(loan,today,'principal','Disetujui ulang');
  PERFORM public.loan_set_draft_details(loan,today,NULL,guarantor,'Keluarga','0813');
  PERFORM public.loan_set_draft_details(loan,today,NULL,guarantor,'Keluarga','0812');
  rejected := false;
  BEGIN PERFORM public.loan_disburse(loan,today,'tunai',NULL,'Dana Uji',request);
    EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%melanggar kebijakan%' THEN RAISE; END IF; rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Pengecualian tidak boleh kembali berlaku setelah data dikembalikan'; END IF;
  PERFORM public.loan_record_policy_exception(loan,today,'principal','Disetujui setelah koreksi');
  schedule := jsonb_build_array(jsonb_build_object('dueDate',(today+7)::text,'amount',1000));
  INSERT INTO public.loan_documents(loan_id,kind,storage_path,snapshot,created_by,verified_by,verified_at)
    VALUES(loan,'contract_signed','test/policy-'||loan::text,
      jsonb_build_object('loan_id',loan::text,'customer_id',customer::text,'purpose','Uji','disbursement_date',today::text,'guarantor_id',guarantor::text,'principal',1000,'schedule',schedule),actor,actor,now());
  PERFORM public.loan_disburse(loan,today,'tunai',NULL,'Dana Uji',request);
  PERFORM public.loan_disburse(loan,today,'tunai',NULL,'Dana Uji',request);
  IF (SELECT count(*) FROM public.loan_disbursements WHERE loan_id=loan) <> 1 THEN RAISE EXCEPTION 'Retry pencairan tidak idempoten'; END IF;
  rejected := false;
  BEGIN PERFORM public.loan_cancel_draft(loan,'Uji'); EXCEPTION WHEN raise_exception THEN rejected := true; END;
  IF NOT rejected THEN RAISE EXCEPTION 'Pinjaman aktif tidak boleh dibatalkan sebagai draft'; END IF;
  RAISE NOTICE 'PASS: kebijakan, pengecualian, penjamin, kontrak, retry dan pembatalan';
END $$;
ROLLBACK;
