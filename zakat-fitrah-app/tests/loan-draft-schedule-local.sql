-- Self-contained synthetic regression. All fixtures and audit records roll back.
BEGIN;
DO $$
DECLARE
  actor UUID := gen_random_uuid(); person UUID := gen_random_uuid(); customer UUID := gen_random_uuid();
  category UUID := gen_random_uuid(); draft UUID := gen_random_uuid(); contract_id UUID;
  today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  schedule JSONB := jsonb_build_array(jsonb_build_object('dueDate',(today+7)::text,'amount',500),jsonb_build_object('dueDate',(today+14)::text,'amount',500));
  revised JSONB := jsonb_build_array(jsonb_build_object('dueDate',(today+8)::text,'amount',500),jsonb_build_object('dueDate',(today+15)::text,'amount',500));
  rejected BOOLEAN := false; version_before BIGINT;
BEGIN
  INSERT INTO auth.users(id,email) VALUES(actor,actor::text||'@example.test');
  INSERT INTO auth.sessions(id,user_id) VALUES(actor,actor);
  INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES(actor,'Admin Tes',actor::text||'@example.test','admin',true);
  INSERT INTO public.muzakki(id,nama_kk,nama_lengkap,alamat,jenis_identitas,identitas_terverifikasi)
    VALUES(person,'Nasabah Tes','Nasabah Tes','Alamat Tes','individu',true);
  INSERT INTO public.loan_customers(id,person_id,created_by) VALUES(customer,person,actor);
  INSERT INTO public.loan_categories(id,name) VALUES(category,'Kategori tes '||category::text);
  PERFORM set_config('request.jwt.claim.sub',actor::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor::text,'session_id',actor::text)::text,true);
  BEGIN
    PERFORM public.loan_create_complete_draft(customer,category,'Uji',1000,schedule,draft,today+20,actor,'Catatan');
  EXCEPTION WHEN raise_exception THEN rejected:=true; END;
  IF NOT rejected OR EXISTS(SELECT 1 FROM public.loans WHERE id=draft) THEN RAISE EXCEPTION 'Draft tidak boleh tertinggal setelah input tidak valid'; END IF;
  PERFORM public.loan_create_complete_draft(customer,category,'Uji',1000,schedule,draft,today,actor,'Catatan');
  PERFORM public.loan_create_complete_draft(customer,category,'Uji',1000,schedule,draft,today,actor,'Catatan');
  IF NOT EXISTS(SELECT 1 FROM public.loans WHERE id=draft AND responsible_id=actor AND notes='Catatan' AND planned_disbursement_date=today) THEN
    RAISE EXCEPTION 'Rincian draft tidak tersimpan';
  END IF;
  INSERT INTO public.loan_documents(loan_id,kind,storage_path,snapshot,created_by,verified_by,verified_at)
    VALUES(draft,'contract_signed','test/schedule-'||draft::text,
      jsonb_build_object('loan_id',draft::text,'customer_id',customer::text,'purpose','Uji','disbursement_date',today::text,'guarantor_id',NULL,'principal',1000,'schedule',schedule),actor,actor,now()) RETURNING id INTO contract_id;
  SELECT exception_version INTO version_before FROM public.loans WHERE id=draft;
  PERFORM public.loan_update_draft_schedule(draft,schedule);
  IF EXISTS(SELECT 1 FROM public.loan_contract_invalidations WHERE document_id=contract_id) THEN RAISE EXCEPTION 'Jadwal identik tidak boleh membatalkan kontrak'; END IF;
  PERFORM public.loan_update_draft_schedule(draft,revised);
  PERFORM public.loan_update_draft_schedule(draft,schedule);
  IF NOT EXISTS(SELECT 1 FROM public.loan_contract_invalidations WHERE document_id=contract_id) OR
     (SELECT exception_version FROM public.loans WHERE id=draft)<=version_before THEN
    RAISE EXCEPTION 'Perubahan dan pengembalian jadwal harus tetap membatalkan kontrak dan pengecualian';
  END IF;
  RAISE NOTICE 'PASS: draft atomik, retry, dan invalidasi kontrak/jadwal';
END $$;
ROLLBACK;
