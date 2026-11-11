-- Synthetic records only: all changes and audit rows are rolled back.
BEGIN;
DO $$
DECLARE
  actor UUID := gen_random_uuid(); staff UUID := gen_random_uuid(); person UUID := gen_random_uuid();
  customer UUID := gen_random_uuid(); loan UUID := gen_random_uuid(); today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO auth.users(id,email) VALUES (actor,actor::text||'@example.test'),(staff,staff::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (actor,actor);
  INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES
    (actor,'Admin Uji',actor::text||'@example.test','admin',true),
    (staff,'Petugas Uji',staff::text||'@example.test','petugas',true);
  INSERT INTO public.muzakki(id,nama_kk,nama_lengkap,alamat,jenis_identitas,identitas_terverifikasi)
    VALUES(person,'Nama Awal','Nama Awal','Alamat Awal','individu',true);
  INSERT INTO public.loan_customers(id,person_id,created_by) VALUES(customer,person,actor);
  INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,created_by)
    VALUES(loan,'AUDIT-'||loan::text,customer,'Uji',1000,actor);
  PERFORM set_config('request.jwt.claim.sub',actor::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor::text,'session_id',actor::text)::text,true);
  UPDATE public.muzakki SET nama_lengkap='Nama Baru',alamat='Alamat Baru' WHERE id=person;
  UPDATE public.users SET role='viewer' WHERE id=staff;
  INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount) VALUES(loan,1,today,1000);
  UPDATE public.loan_installments SET due_date=today+1 WHERE loan_id=loan;
  UPDATE public.loans SET migration_cutoff=today,opening_balance=800,historical_incomplete=true,notes='RAHASIA-UJI-TIDAK-BOLEH-TERCATAT' WHERE id=loan;
  INSERT INTO public.loan_documents(loan_id,kind,storage_path,snapshot,created_by)
    VALUES(loan,'payment_evidence','audit/'||loan::text,jsonb_build_object('secret','RAHASIA-UJI-TIDAK-BOLEH-TERCATAT'),actor);
  IF NOT EXISTS(SELECT 1 FROM public.loan_audit WHERE action='person_identity_updated' AND actor_id=actor AND details->>'person_id'=person::text AND details->'old'->>'alamat'='Alamat Awal' AND details->'new'->>'alamat'='Alamat Baru') THEN RAISE EXCEPTION 'Audit perubahan identitas tidak lengkap'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.loan_audit WHERE action='staff_access_updated' AND actor_id=actor AND details->>'user_id'=staff::text AND details->'old'->>'role'='petugas' AND details->'new'->>'role'='viewer') THEN RAISE EXCEPTION 'Audit perubahan izin tidak lengkap'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.loan_audit WHERE loan_id=loan AND action='installment_update' AND actor_id=actor AND details->'old'->>'due_date'=today::text AND details->'new'->>'due_date'=(today+1)::text) THEN RAISE EXCEPTION 'Audit perubahan jadwal tidak lengkap'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.loan_audit WHERE loan_id=loan AND action='loan_fields_updated' AND actor_id=actor AND details->'new'->>'migration_cutoff'=today::text AND (details->'new'->>'opening_balance')::int=800 AND (details->'new'->>'historical_incomplete')::boolean) THEN RAISE EXCEPTION 'Audit kolom migrasi tidak lengkap'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.loan_audit WHERE loan_id=loan AND action='document_insert' AND actor_id=actor) THEN RAISE EXCEPTION 'Audit dokumen tidak ada'; END IF;
  IF EXISTS(SELECT 1 FROM public.loan_audit WHERE (loan_id=loan OR actor_id=actor) AND details::text LIKE '%RAHASIA-UJI-TIDAK-BOLEH-TERCATAT%') THEN RAISE EXCEPTION 'Audit memuat isi dokumen atau catatan'; END IF;
END $$;
ROLLBACK;
