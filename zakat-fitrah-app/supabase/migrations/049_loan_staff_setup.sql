BEGIN;

INSERT INTO public.loan_categories (name) VALUES
  ('Modal usaha'), ('Pendidikan'), ('Kesehatan'), ('Kebutuhan mendesak'), ('Lainnya')
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.loan_confirm_individual(p_person_id UUID, p_name TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_person public.muzakki%ROWTYPE;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN RAISE EXCEPTION 'Nama lengkap wajib diisi'; END IF;
  SELECT * INTO v_person FROM public.muzakki WHERE id = p_person_id FOR UPDATE;
  IF NOT FOUND OR NOT v_person.aktif THEN RAISE EXCEPTION 'Orang tidak ditemukan atau tidak aktif'; END IF;
  IF v_person.jenis_identitas = 'rumah_tangga' THEN
    RAISE EXCEPTION 'Data rumah tangga tidak dapat digunakan sebagai individu; daftarkan anggota secara terpisah';
  END IF;
  UPDATE public.muzakki SET nama_lengkap = trim(p_name), jenis_identitas = 'individu',
    identitas_terverifikasi = true, updated_at = now() WHERE id = p_person_id;
  INSERT INTO public.loan_audit (actor_id, action, details)
    VALUES (auth.uid(), 'person_verified', jsonb_build_object('person_id', p_person_id));
  RETURN p_person_id;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_confirm_individual(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.loan_confirm_individual(UUID, TEXT) TO authenticated;
COMMIT;
