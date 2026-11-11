BEGIN;
CREATE OR REPLACE FUNCTION public.person_map_mustahik(p_mustahik_id UUID, p_person_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current UUID;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_mustahik_id IS NULL OR p_person_id IS NULL THEN RAISE EXCEPTION 'Pilih mustahik dan individu terverifikasi'; END IF;
  SELECT orang_id INTO v_current FROM public.mustahik WHERE id = p_mustahik_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Mustahik tidak ditemukan'; END IF;
  IF v_current = p_person_id THEN RETURN p_mustahik_id; END IF;
  IF v_current IS NOT NULL THEN RAISE EXCEPTION 'Mustahik sudah dipetakan; koreksi memerlukan alur khusus'; END IF;
  UPDATE public.mustahik SET orang_id = p_person_id WHERE id = p_mustahik_id;
  RETURN p_mustahik_id;
END;
$$;
COMMIT;
