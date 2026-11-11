-- Exercises real RPCs and always rolls back the synthetic data.
BEGIN;
DO $$
DECLARE
  actor UUID:=gen_random_uuid(); borrower UUID:=gen_random_uuid(); person UUID:=gen_random_uuid();
  customer UUID:=gen_random_uuid(); loan UUID:=gen_random_uuid(); ordinary UUID:=gen_random_uuid();
  claim UUID:=gen_random_uuid(); confirmed UUID; request UUID:=gen_random_uuid();
  today DATE:=(now() AT TIME ZONE 'Asia/Jakarta')::date; path TEXT; failed BOOLEAN; before_fin JSONB; after_fin JSONB;
BEGIN
  SELECT jsonb_build_object(
    'accounts',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.accounts t),
    'ledger',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.account_ledger_entries t),
    'uang',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_uang t),
    'beras',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_beras t),
    'sedekah',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.bukti_sedekah t),
    'zakat',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pembayaran_zakat t)
  ) INTO before_fin;
  INSERT INTO auth.users(id,email) VALUES(actor,actor::text||'@example.test'),(borrower,borrower::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES(actor,actor);
  INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES(actor,'Admin uji',actor::text||'@example.test','admin',true);
  INSERT INTO public.muzakki(id,nama_kk,nama_lengkap,alamat,jenis_identitas,identitas_terverifikasi) VALUES(person,'Uji','Uji','Alamat','individu',true);
  INSERT INTO public.loan_customers(id,person_id,auth_user_id,created_by) VALUES(customer,person,borrower,actor);
  INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,status,migration_cutoff,opening_balance,created_by)
    VALUES(loan,'MIG-'||loan::text,customer,'Uji',1000,'needs_reconciliation',today-1,800,actor),
          (ordinary,'ORD-'||ordinary::text,customer,'Uji',1000,'needs_reconciliation',NULL,NULL,actor);
  INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount,opening_remaining) VALUES(loan,1,today,1000,800),(ordinary,1,today,1000,NULL);
  INSERT INTO public.loan_payments(id,loan_id,payment_date,amount,method,status,created_by,idempotency_key)
    VALUES(claim,loan,today,100,'transfer','pending',borrower,gen_random_uuid());
  path:=loan::text||'/'||request::text||'.png';
  INSERT INTO storage.objects(bucket_id,name) VALUES('pinjaman-jamaah-private',path);
  INSERT INTO public.loan_documents(loan_id,payment_id,kind,storage_path,created_by) VALUES(loan,claim,'payment_evidence',path,borrower);
  PERFORM set_config('request.jwt.claim.sub',actor::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor::text,'session_id',actor::text)::text,true);
  confirmed:=public.loan_record_payment(loan,today,100,'tunai',NULL,gen_random_uuid());
  UPDATE public.loan_installments SET opening_remaining=NULL WHERE loan_id=loan;
  failed:=false;
  BEGIN PERFORM public.loan_record_payment(loan,today,100,'tunai',NULL,gen_random_uuid()); EXCEPTION WHEN check_violation THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'Pembayaran dengan jadwal awal kosong seharusnya ditolak'; END IF;
  failed:=false;
  BEGIN PERFORM public.loan_review_payment_claim(claim,true,NULL); EXCEPTION WHEN check_violation THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'Verifikasi dengan jadwal awal kosong seharusnya ditolak'; END IF;
  failed:=false;
  BEGIN PERFORM public.loan_submit_payment_claim(loan,today,100,NULL,borrower,request,path,repeat('a',64)); EXCEPTION WHEN check_violation THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'Klaim dengan jadwal awal kosong seharusnya ditolak'; END IF;
  -- Cancellation and rejection must still work while the opening is repaired.
  PERFORM public.loan_cancel_payment(confirmed,'Koreksi uji');
  PERFORM public.loan_review_payment_claim(claim,false,'Perlu perbaikan');
  UPDATE public.loan_installments SET opening_remaining=700 WHERE loan_id=loan;
  failed:=false;
  BEGIN PERFORM public.loan_record_payment(loan,today,100,'tunai',NULL,gen_random_uuid()); EXCEPTION WHEN check_violation THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'Saldo awal yang tidak cocok seharusnya ditolak'; END IF;
  UPDATE public.loan_installments SET opening_remaining=800 WHERE loan_id=loan;
  UPDATE public.loans SET opening_balance=NULL WHERE id=loan;
  failed:=false;
  BEGIN PERFORM public.loan_record_payment(loan,today,100,'tunai',NULL,gen_random_uuid()); EXCEPTION WHEN check_violation THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'Saldo awal kosong seharusnya ditolak'; END IF;
  UPDATE public.loans SET opening_balance=800 WHERE id=loan;
  DELETE FROM public.loan_installments WHERE loan_id=loan;
  failed:=false;
  BEGIN PERFORM public.loan_record_payment(loan,today,100,'tunai',NULL,gen_random_uuid()); EXCEPTION WHEN check_violation THEN failed:=true; END;
  IF NOT failed THEN RAISE EXCEPTION 'Jadwal awal kosong seharusnya ditolak'; END IF;
  INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount,opening_remaining) VALUES(loan,1,today,1000,800);
  PERFORM public.loan_record_payment(loan,today,100,'tunai',NULL,gen_random_uuid());
  -- A normally restored loan without migration cutoff remains payable.
  PERFORM public.loan_record_payment(ordinary,today,100,'tunai',NULL,gen_random_uuid());
  SELECT jsonb_build_object(
    'accounts',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.accounts t),
    'ledger',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.account_ledger_entries t),
    'uang',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_uang t),
    'beras',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_beras t),
    'sedekah',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.bukti_sedekah t),
    'zakat',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pembayaran_zakat t)
  ) INTO after_fin;
  IF before_fin IS DISTINCT FROM after_fin THEN RAISE EXCEPTION 'Saldo awal dan koreksi migrasi sintetis tidak boleh mengubah kas atau penerimaan'; END IF;
END $$;
ROLLBACK;
