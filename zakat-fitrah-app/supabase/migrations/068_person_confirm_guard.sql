BEGIN;
CREATE OR REPLACE FUNCTION public.loan_confirm_individual(p_person_id UUID, p_name TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_person public.muzakki%ROWTYPE;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 OR length(p_name) > 200 THEN RAISE EXCEPTION 'Nama lengkap tidak valid'; END IF;
  SELECT * INTO v_person FROM public.muzakki WHERE id = p_person_id FOR UPDATE;
  IF NOT FOUND OR NOT v_person.aktif THEN RAISE EXCEPTION 'Orang tidak ditemukan atau tidak aktif'; END IF;
  IF v_person.jenis_identitas = 'rumah_tangga' THEN RAISE EXCEPTION 'Data rumah tangga tidak dapat digunakan sebagai individu; daftarkan anggota secara terpisah'; END IF;
  IF v_person.identitas_terverifikasi THEN
    IF v_person.jenis_identitas <> 'individu' OR v_person.nama_lengkap IS DISTINCT FROM trim(p_name) THEN
      RAISE EXCEPTION 'Gunakan perubahan nama yang tercatat untuk individu terverifikasi';
    END IF;
    RETURN p_person_id;
  END IF;
  UPDATE public.muzakki SET nama_lengkap = trim(p_name), jenis_identitas = 'individu',
    identitas_terverifikasi = true, updated_at = now() WHERE id = p_person_id;
  INSERT INTO public.loan_audit(actor_id, action, details) VALUES (auth.uid(), 'person_verified', jsonb_build_object('person_id', p_person_id));
  RETURN p_person_id;
END;
$$;
COMMIT;
