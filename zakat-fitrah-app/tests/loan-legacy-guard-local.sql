-- Run only against a local test database. All synthetic rows are rolled back.
BEGIN;
DO $$
DECLARE
  v_staff UUID := gen_random_uuid(); v_customer UUID := gen_random_uuid();
  v_key TEXT := 'audit-' || gen_random_uuid()::text; v_rejected BOOLEAN := false; v_result TEXT;
BEGIN
  INSERT INTO auth.users(id,email) VALUES (v_staff,v_staff::text||'@example.test'),(v_customer,v_customer::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES (v_staff,v_staff),(v_customer,v_customer);
  INSERT INTO public.users(id, nama_lengkap, email, role, is_active)
    VALUES (v_staff, 'Petugas Uji', v_staff::text || '@example.test', 'admin', true);
  PERFORM set_config('request.jwt.claim.sub', v_customer::text, true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v_customer::text,'session_id',v_customer::text)::text,true);
  BEGIN
    PERFORM public.next_bukti_sedekah_number(v_key);
  EXCEPTION WHEN insufficient_privilege THEN v_rejected := true;
  END;
  IF NOT v_rejected OR EXISTS (SELECT 1 FROM public.bukti_sedekah_counters WHERE category_key = v_key) THEN
    RAISE EXCEPTION 'Nasabah tidak boleh mengubah nomor bukti sedekah';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', v_staff::text, true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v_staff::text,'session_id',v_staff::text)::text,true);
  SELECT public.next_bukti_sedekah_number(v_key) INTO v_result;
  IF v_result <> 'LAI/000001' OR public.peek_bukti_sedekah_number(v_key) <> 'LAI/000002' THEN
    RAISE EXCEPTION 'Penomoran pengurus tidak bekerja';
  END IF;
  IF has_function_privilege('anon', 'public.loan_is_staff()', 'EXECUTE') OR
     has_function_privilege('anon', 'public.next_bukti_sedekah_number(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Fungsi seharusnya tidak dapat dipanggil anon';
  END IF;
  RAISE NOTICE 'PASS: akses fungsi lama, penomoran pengurus, dan izin anon';
END;
$$;
ROLLBACK;
