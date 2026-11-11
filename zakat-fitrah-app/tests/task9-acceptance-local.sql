-- Real PostgreSQL acceptance fixture; synthetic identities and all changes roll back.
BEGIN;
DO $$
DECLARE
  actor UUID:=gen_random_uuid(); borrower UUID:=gen_random_uuid(); person UUID:=gen_random_uuid();
  customer UUID:=gen_random_uuid(); loan UUID:=gen_random_uuid(); rejected_claim UUID:=gen_random_uuid();
  accepted_claim UUID:=gen_random_uuid(); request_one UUID:=gen_random_uuid(); request_two UUID:=gen_random_uuid();
  final_payment UUID; receipt_before JSONB; receipt_after JSONB; pending_remaining BIGINT;
  allocation_total BIGINT; before_state JSONB; after_state JSONB; today DATE:=(now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
  INSERT INTO auth.users(id,email) VALUES(actor,actor::text||'@example.test'),(borrower,borrower::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES(actor,actor),(borrower,borrower);
  INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES(actor,'Petugas sintetis',actor::text||'@example.test','petugas',true);
  INSERT INTO public.muzakki(id,nama_kk,nama_lengkap,alamat,jenis_identitas,identitas_terverifikasi) VALUES(person,'Nasabah sintetis','Nasabah sintetis','Alamat sintetis','individu',true);
  INSERT INTO public.loan_customers(id,person_id,auth_user_id,created_by) VALUES(customer,person,borrower,actor);
  INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,status,disbursement_date,created_by)
    VALUES(loan,'AC9-'||loan::text,customer,'Uji',1200000,'active',today-2,actor);
  INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount)
    VALUES(loan,1,today-1,400000),(loan,2,today+29,400000),(loan,3,today+59,400000);
  -- Compare whole row fingerprints, not only counts: an UPDATE must be detected.
  SELECT jsonb_build_object(
    'accounts',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.accounts t),
    'ledger',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.account_ledger_entries t),
    'uang',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_uang t),
    'beras',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_beras t),
    'sedekah',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.bukti_sedekah t),
    'zakat',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pembayaran_zakat t)
  ) INTO before_state;
  INSERT INTO public.loan_payments(id,loan_id,payment_date,amount,method,status,created_by,idempotency_key)
    VALUES(rejected_claim,loan,today,250000,'transfer','pending',borrower,request_one),
          (accepted_claim,loan,today,250000,'transfer','pending',borrower,request_two);
  INSERT INTO storage.objects(bucket_id,name) VALUES('pinjaman-jamaah-private',loan::text||'/'||request_one::text||'.png'),('pinjaman-jamaah-private',loan::text||'/'||request_two::text||'.png');
  INSERT INTO public.loan_documents(loan_id,payment_id,kind,storage_path,created_by,shared_with_customer)
    VALUES(loan,rejected_claim,'payment_evidence',loan::text||'/'||request_one::text||'.png',borrower,true),
          (loan,accepted_claim,'payment_evidence',loan::text||'/'||request_two::text||'.png',borrower,true);
  SELECT 1200000-coalesce(sum(amount) FILTER(WHERE status='confirmed'),0) INTO pending_remaining FROM public.loan_payments WHERE loan_id=loan;
  IF pending_remaining<>1200000 THEN RAISE EXCEPTION 'Klaim menunggu tidak boleh mengurangi saldo'; END IF;
  PERFORM set_config('request.jwt.claim.sub',actor::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor::text,'session_id',actor::text)::text,true);
  PERFORM public.loan_review_payment_claim(rejected_claim,false,'Bukti tidak cocok');
  PERFORM set_config('request.jwt.claim.sub',borrower::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',borrower::text,'session_id',borrower::text)::text,true);
  IF NOT EXISTS(SELECT 1 FROM public.loan_customer_payment_history() WHERE id=rejected_claim AND status='rejected' AND rejection_reason='Bukti tidak cocok') THEN RAISE EXCEPTION 'Alasan penolakan tidak terlihat oleh nasabah'; END IF;
  PERFORM set_config('request.jwt.claim.sub',actor::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor::text,'session_id',actor::text)::text,true);
  PERFORM public.loan_review_payment_claim(accepted_claim,true,NULL);
  SELECT coalesce(sum(amount),0) INTO allocation_total FROM public.loan_payment_allocations(loan);
  IF allocation_total<>250000 OR (SELECT 1200000-sum(amount) FROM public.loan_payments WHERE loan_id=loan AND status='confirmed')<>950000 THEN RAISE EXCEPTION 'Pembayaran pertama salah'; END IF;
  IF (SELECT 400000-coalesce(sum(amount),0) FROM public.loan_payment_allocations(loan) WHERE installment_number=1)<>150000 THEN RAISE EXCEPTION 'Tunggakan pertama salah'; END IF;
  PERFORM public.loan_record_payment(loan,today,550000,'tunai',NULL,gen_random_uuid());
  IF (SELECT 1200000-sum(amount) FROM public.loan_payments WHERE loan_id=loan AND status='confirmed')<>400000 THEN RAISE EXCEPTION 'Sisa setelah pembayaran kedua salah'; END IF;
  IF (SELECT count(*) FROM (SELECT installment_number FROM public.loan_payment_allocations(loan) GROUP BY installment_number HAVING sum(amount)=400000) q)<>2 THEN RAISE EXCEPTION 'Dua angsuran seharusnya lunas'; END IF;
  final_payment:=public.loan_record_payment(loan,today,400000,'tunai',NULL,gen_random_uuid());
  IF (SELECT status FROM public.loans WHERE id=loan)<>'paid' THEN RAISE EXCEPTION 'Pinjaman seharusnya lunas'; END IF;
  receipt_before:=public.loan_receipt(final_payment,true);
  PERFORM public.loan_cancel_payment(final_payment,'Koreksi sintetis');
  receipt_after:=public.loan_receipt(final_payment,false);
  IF (SELECT status FROM public.loans WHERE id=loan)<>'active' OR receipt_after->>'status'<>'cancelled' OR receipt_before->>'receipt_number'<>receipt_after->>'receipt_number' THEN RAISE EXCEPTION 'Koreksi atau tanda terima tidak konsisten'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.loan_audit WHERE loan_id=loan AND action='payment_cancelled' AND details->>'payment_id'=final_payment::text) THEN RAISE EXCEPTION 'Audit pembatalan tidak tersedia'; END IF;
  SELECT jsonb_build_object(
    'accounts',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.accounts t),
    'ledger',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.account_ledger_entries t),
    'uang',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_uang t),
    'beras',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pemasukan_beras t),
    'sedekah',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.bukti_sedekah t),
    'zakat',(SELECT jsonb_build_array(count(*),coalesce(sum(hashtextextended(to_jsonb(t)::text,0)::numeric),0)) FROM public.pembayaran_zakat t)
  ) INTO after_state;
  IF before_state IS DISTINCT FROM after_state THEN RAISE EXCEPTION 'Transaksi pinjaman mengubah kas atau penerimaan'; END IF;
  PERFORM set_config('test.task9_actor',actor::text,true);
  PERFORM set_config('test.task9_loan',loan::text,true);
  PERFORM set_config('test.task9_person',person::text,true);
  PERFORM set_config('test.task9_path',loan::text||'/'||request_two::text||'.png',true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE denied BOOLEAN;
BEGIN
  PERFORM set_config('request.jwt.claim.sub',current_setting('test.task9_actor'),true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.task9_actor'),'session_id',current_setting('test.task9_actor'))::text,true);
  BEGIN DELETE FROM public.loan_documents WHERE loan_id=current_setting('test.task9_loan')::uuid; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN DELETE FROM public.loan_audit WHERE loan_id=current_setting('test.task9_loan')::uuid; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN DELETE FROM storage.objects WHERE bucket_id='pinjaman-jamaah-private' AND name=current_setting('test.task9_path'); EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN DELETE FROM public.muzakki WHERE id=current_setting('test.task9_person')::uuid; EXCEPTION WHEN insufficient_privilege OR foreign_key_violation THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.loan_documents WHERE loan_id=current_setting('test.task9_loan')::uuid AND storage_path=current_setting('test.task9_path'))
     OR NOT EXISTS(SELECT 1 FROM public.loan_audit WHERE loan_id=current_setting('test.task9_loan')::uuid AND action='payment_cancelled')
     OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='pinjaman-jamaah-private' AND name=current_setting('test.task9_path'))
     OR NOT EXISTS(SELECT 1 FROM public.muzakki WHERE id=current_setting('test.task9_person')::uuid)
  THEN RAISE EXCEPTION 'Identitas atau dokumen terhapus melalui akses authenticated'; END IF;
END $$;
ROLLBACK;
