-- Run only against a local test database. All synthetic rows are rolled back.
BEGIN;
DO $$
DECLARE
  v_actor UUID := gen_random_uuid(); v_person UUID := gen_random_uuid();
  v_customer UUID := gen_random_uuid(); v_loan UUID := gen_random_uuid();
  v_date DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_request UUID := gen_random_uuid(); v_schedule JSONB;
  v_rejected BOOLEAN := false;
BEGIN
  INSERT INTO auth.users(id,email) VALUES (v_actor,v_actor::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (v_actor,v_actor);
  INSERT INTO public.users(id, nama_lengkap, email, role, is_active)
    VALUES (v_actor, 'Petugas Uji', v_actor::text || '@example.test', 'admin', true);
  INSERT INTO public.muzakki(id, nama_kk, nama_lengkap, alamat, jenis_identitas, identitas_terverifikasi)
    VALUES (v_person, 'Nasabah Uji', 'Nasabah Uji', 'Alamat Uji', 'individu', true);
  INSERT INTO public.loan_customers(id, person_id, created_by) VALUES (v_customer, v_person, v_actor);
  INSERT INTO public.loans(id, loan_number, customer_id, purpose, principal, created_by)
    VALUES (v_loan, 'TEST-' || v_loan::text, v_customer, 'Uji', 1000, v_actor);
  INSERT INTO public.loan_installments(loan_id, installment_number, due_date, amount) VALUES (v_loan, 1, v_date, 1000);
  v_schedule := jsonb_build_array(jsonb_build_object('dueDate', v_date::text, 'amount', 1000));
  INSERT INTO public.loan_documents(loan_id, kind, storage_path, snapshot, created_by, verified_by, verified_at)
    VALUES (v_loan, 'contract_signed', 'test/' || v_loan::text,
      jsonb_build_object('loan_id', v_loan::text, 'customer_id', v_customer::text, 'purpose', 'Uji',
        'disbursement_date', v_date::text, 'guarantor_id', NULL, 'principal', 1000, 'schedule', v_schedule),
      v_actor, v_actor, now());
  PERFORM set_config('request.jwt.claim.sub', v_actor::text, true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v_actor::text,'session_id',v_actor::text)::text,true);
  UPDATE public.muzakki SET nama_lengkap = 'Nama Berubah' WHERE id = v_person;
  BEGIN
    PERFORM public.loan_disburse(v_loan, v_date, 'tunai', NULL, 'Dana Uji', v_request);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Identitas atau data kontrak berubah%' THEN RAISE; END IF;
    v_rejected := true;
  END;
  IF NOT v_rejected OR EXISTS (SELECT 1 FROM public.loan_disbursements WHERE loan_id = v_loan) THEN
    RAISE EXCEPTION 'Pencairan seharusnya ditolak dan tidak menghasilkan transaksi';
  END IF;
  UPDATE public.muzakki SET nama_lengkap = 'Nasabah Uji' WHERE id = v_person;
  v_rejected := false;
  BEGIN
    PERFORM public.loan_disburse(v_loan, v_date, 'tunai', NULL, 'Dana Uji', v_request);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Identitas atau data kontrak berubah%' THEN RAISE; END IF;
    v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'Kontrak lama tidak boleh berlaku kembali setelah identitas dikembalikan'; END IF;
  INSERT INTO public.loan_documents(loan_id, kind, storage_path, snapshot, created_by, verified_by, verified_at)
    VALUES (v_loan, 'contract_signed', 'test/new-' || v_loan::text,
      jsonb_build_object('loan_id', v_loan::text, 'customer_id', v_customer::text, 'purpose', 'Uji',
        'disbursement_date', v_date::text, 'guarantor_id', NULL, 'principal', 1000, 'schedule', v_schedule),
      v_actor, v_actor, now());
  PERFORM public.loan_disburse(v_loan, v_date, 'tunai', NULL, 'Dana Uji', v_request);
  IF NOT EXISTS (SELECT 1 FROM public.loans WHERE id = v_loan AND status = 'active') THEN
    RAISE EXCEPTION 'Pencairan dengan identitas yang sesuai seharusnya berhasil';
  END IF;
  UPDATE public.muzakki SET alamat = 'Alamat Baru' WHERE id = v_person;
  IF NOT EXISTS (SELECT 1 FROM public.loan_documents WHERE loan_id = v_loan AND kind = 'contract_signed'
      AND snapshot->'customer_identity'->>'alamat' = 'Alamat Uji')
    OR NOT EXISTS (SELECT 1 FROM public.loans WHERE id = v_loan AND region_snapshot->>'alamat' = 'Alamat Uji') THEN
    RAISE EXCEPTION 'Snapshot identitas dan wilayah historis harus tetap sama';
  END IF;
  RAISE NOTICE 'PASS: identitas kontrak diverifikasi dan pencairan atomik';
END;
$$;
ROLLBACK;
