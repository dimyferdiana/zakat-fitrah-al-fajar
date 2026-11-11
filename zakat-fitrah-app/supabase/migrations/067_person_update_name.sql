BEGIN;
CREATE FUNCTION public.person_update_name(p_person_id UUID, p_name TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_person public.muzakki%ROWTYPE;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 OR length(p_name) > 200 THEN RAISE EXCEPTION 'Nama lengkap tidak valid'; END IF;
  SELECT * INTO v_person FROM public.muzakki WHERE id = p_person_id FOR UPDATE;
  IF NOT FOUND OR v_person.jenis_identitas <> 'individu' OR NOT v_person.identitas_terverifikasi THEN
    RAISE EXCEPTION 'Pilih individu yang sudah terverifikasi';
  END IF;
  IF v_person.nama_lengkap IS DISTINCT FROM trim(p_name) THEN
    UPDATE public.muzakki SET nama_lengkap = trim(p_name), updated_at = now() WHERE id = p_person_id;
    INSERT INTO public.loan_audit(actor_id, action, details) VALUES (auth.uid(), 'person_name_changed',
      jsonb_build_object('person_id', p_person_id, 'old_name', v_person.nama_lengkap, 'new_name', trim(p_name)));
  END IF;
  RETURN p_person_id;
END;
$$;
REVOKE ALL ON FUNCTION public.person_update_name(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.person_update_name(UUID, TEXT) TO authenticated;
COMMIT;
