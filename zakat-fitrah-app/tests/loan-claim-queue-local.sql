-- Run only against a local test database. All synthetic rows are rolled back.
BEGIN;
DO $$
DECLARE
  v_actor UUID := gen_random_uuid(); v_customer_user UUID := gen_random_uuid();
  v_person UUID := gen_random_uuid(); v_customer UUID := gen_random_uuid(); v_loan UUID := gen_random_uuid();
  v_first UUID := gen_random_uuid(); v_second UUID := gen_random_uuid();
  v_path TEXT := 'test/' || gen_random_uuid()::text || '.pdf';
  v_today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_queue RECORD; v_rejected BOOLEAN := false;
BEGIN
  INSERT INTO auth.users(id,email) VALUES (v_actor,v_actor::text||'@example.test'),(v_customer_user,v_customer_user::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (v_actor,v_actor),(v_customer_user,v_customer_user);
  INSERT INTO public.users(id, nama_lengkap, email, role, is_active)
    VALUES (v_actor, 'Petugas Uji', v_actor::text || '@example.test', 'admin', true);
  INSERT INTO public.muzakki(id, nama_kk, nama_lengkap, alamat, jenis_identitas, identitas_terverifikasi)
    VALUES (v_person, 'Nasabah Uji', 'Nasabah Uji', 'Alamat Uji', 'individu', true);
  INSERT INTO public.loan_customers(id, person_id, auth_user_id, created_by) VALUES (v_customer, v_person, v_customer_user, v_actor);
  INSERT INTO public.loans(id, loan_number, customer_id, purpose, principal, status, disbursement_date, created_by)
    VALUES (v_loan, 'TEST-' || v_loan::text, v_customer, 'Uji', 1000, 'active', v_today, v_actor);
  INSERT INTO public.loan_installments(loan_id, installment_number, due_date, amount) VALUES (v_loan, 1, v_today, 1000);
  INSERT INTO public.loan_payments(id, loan_id, payment_date, amount, method, status, created_by, idempotency_key)
    VALUES (v_first, v_loan, v_today, 100, 'transfer', 'pending', v_customer_user, gen_random_uuid()),
           (v_second, v_loan, v_today, 100, 'transfer', 'pending', v_customer_user, gen_random_uuid());
  INSERT INTO public.loan_documents(loan_id, payment_id, kind, storage_path, snapshot, created_by)
    VALUES (v_loan, v_first, 'payment_evidence', v_path, jsonb_build_object('file_sha256', repeat('a', 64)), v_customer_user);
  PERFORM set_config('request.jwt.claim.sub', v_actor::text, true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v_actor::text,'session_id',v_actor::text)::text,true);
  SELECT * INTO v_queue FROM public.loan_claim_review_queue(0, 25) WHERE payment_id = v_first;
  IF NOT FOUND OR NOT v_queue.possible_duplicate THEN RAISE EXCEPTION 'Indikasi duplikasi tidak ditemukan'; END IF;
  BEGIN
    PERFORM public.loan_review_payment_claim(v_first, true, NULL);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Bukti pembayaran tidak tersedia%' THEN RAISE; END IF;
    v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'Klaim tanpa berkas seharusnya ditolak'; END IF;
  INSERT INTO storage.objects(bucket_id, name) VALUES ('pinjaman-jamaah-private', v_path);
  PERFORM public.loan_review_payment_claim(v_first, true, NULL);
  IF NOT EXISTS (SELECT 1 FROM public.loan_payments WHERE id = v_first AND status = 'confirmed') THEN
    RAISE EXCEPTION 'Klaim dengan bukti seharusnya dapat dikonfirmasi';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_customer_user::text, true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v_customer_user::text,'session_id',v_customer_user::text)::text,true);
  v_rejected := false;
  BEGIN
    PERFORM public.loan_claim_review_queue(0, 25);
  EXCEPTION WHEN insufficient_privilege THEN v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'Nasabah tidak boleh melihat antrean pengurus'; END IF;
  RAISE NOTICE 'PASS: antrean, indikasi duplikat, bukti wajib, dan pembatasan akses';
END;
$$;
ROLLBACK;
