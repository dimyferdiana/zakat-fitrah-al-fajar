BEGIN;

-- Person and beneficiary records are retained even if the legacy FK cascades.
CREATE FUNCTION public.person_block_permanent_delete() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Data identitas tidak dapat dihapus permanen; nonaktifkan data' USING ERRCODE = '23503';
END;
$$;
REVOKE ALL ON FUNCTION public.person_block_permanent_delete() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER person_block_permanent_delete BEFORE DELETE ON public.muzakki
  FOR EACH ROW EXECUTE FUNCTION public.person_block_permanent_delete();
CREATE TRIGGER mustahik_block_permanent_delete BEFORE DELETE ON public.mustahik
  FOR EACH ROW EXECUTE FUNCTION public.person_block_permanent_delete();

-- Verification, household relationships and activation require audited RPCs.
-- Existing application writes to legacy name/address fields remain compatible.
CREATE FUNCTION public.person_guard_system_fields() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' AND (NEW.nama_lengkap IS NOT NULL OR NEW.jenis_identitas <> 'belum_diverifikasi'
       OR NEW.identitas_terverifikasi OR NEW.rumah_tangga_id IS NOT NULL OR NOT NEW.aktif) THEN
      RAISE EXCEPTION 'Identitas harus diverifikasi melalui alur data orang' USING ERRCODE = '42501';
    ELSIF TG_OP = 'UPDATE' AND ROW(NEW.nama_lengkap, NEW.jenis_identitas, NEW.identitas_terverifikasi, NEW.rumah_tangga_id, NEW.aktif)
       IS DISTINCT FROM ROW(OLD.nama_lengkap, OLD.jenis_identitas, OLD.identitas_terverifikasi, OLD.rumah_tangga_id, OLD.aktif) THEN
      RAISE EXCEPTION 'Gunakan alur verifikasi atau status data orang' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.person_guard_system_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER person_guard_system_fields BEFORE INSERT OR UPDATE ON public.muzakki
  FOR EACH ROW EXECUTE FUNCTION public.person_guard_system_fields();

CREATE FUNCTION public.person_set_active(p_person_id UUID, p_active BOOLEAN) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old BOOLEAN;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_active IS NULL THEN RAISE EXCEPTION 'Status tidak valid'; END IF;
  SELECT aktif INTO v_old FROM public.muzakki WHERE id = p_person_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Data orang tidak ditemukan'; END IF;
  IF v_old IS DISTINCT FROM p_active THEN
    UPDATE public.muzakki SET aktif = p_active, updated_at = now() WHERE id = p_person_id;
    INSERT INTO public.loan_audit(actor_id, action, details) VALUES
      (auth.uid(), 'person_active_changed', jsonb_build_object('person_id', p_person_id, 'old', v_old, 'new', p_active));
  END IF;
  RETURN p_person_id;
END;
$$;
REVOKE ALL ON FUNCTION public.person_set_active(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.person_set_active(UUID, BOOLEAN) TO authenticated;

CREATE FUNCTION public.person_confirm_household(p_person_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_person public.muzakki%ROWTYPE;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_person FROM public.muzakki WHERE id = p_person_id FOR UPDATE;
  IF NOT FOUND OR NOT v_person.aktif THEN RAISE EXCEPTION 'Data orang tidak ditemukan atau nonaktif'; END IF;
  IF v_person.jenis_identitas = 'rumah_tangga' THEN RETURN p_person_id; END IF;
  IF v_person.jenis_identitas <> 'belum_diverifikasi' OR v_person.identitas_terverifikasi
     OR EXISTS (SELECT 1 FROM public.loan_customers WHERE person_id = p_person_id)
     OR EXISTS (SELECT 1 FROM public.mustahik WHERE orang_id = p_person_id) THEN
    RAISE EXCEPTION 'Data sudah terverifikasi atau terhubung sebagai individu';
  END IF;
  UPDATE public.muzakki SET jenis_identitas = 'rumah_tangga', updated_at = now() WHERE id = p_person_id;
  INSERT INTO public.loan_audit(actor_id, action, details) VALUES (auth.uid(), 'household_confirmed', jsonb_build_object('person_id', p_person_id));
  RETURN p_person_id;
END;
$$;
REVOKE ALL ON FUNCTION public.person_confirm_household(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.person_confirm_household(UUID) TO authenticated;

CREATE FUNCTION public.person_add_household_member(p_household_id UUID, p_name TEXT, p_request_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_parent public.muzakki%ROWTYPE; v_existing public.muzakki%ROWTYPE;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 OR length(p_name) > 200 OR p_request_id IS NULL THEN RAISE EXCEPTION 'Nama atau identitas permintaan tidak valid'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  SELECT * INTO v_parent FROM public.muzakki WHERE id = p_household_id FOR UPDATE;
  IF NOT FOUND OR NOT v_parent.aktif OR v_parent.jenis_identitas <> 'rumah_tangga' THEN RAISE EXCEPTION 'Rumah tangga tidak tersedia'; END IF;
  SELECT * INTO v_existing FROM public.muzakki WHERE id = p_request_id;
  IF FOUND THEN
    IF v_existing.rumah_tangga_id IS DISTINCT FROM p_household_id OR v_existing.nama_lengkap IS DISTINCT FROM trim(p_name)
       OR v_existing.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Kunci permintaan digunakan untuk data berbeda'; END IF;
    RETURN p_request_id;
  END IF;
  INSERT INTO public.muzakki(id, nama_kk, nama_lengkap, alamat, rt, rw, jenis_identitas, identitas_terverifikasi, rumah_tangga_id, created_by)
    VALUES (p_request_id, trim(p_name), trim(p_name), v_parent.alamat, v_parent.rt, v_parent.rw, 'individu', true, p_household_id, auth.uid());
  INSERT INTO public.loan_audit(actor_id, action, details)
    VALUES (auth.uid(), 'household_member_created', jsonb_build_object('person_id', p_request_id, 'household_id', p_household_id));
  RETURN p_request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.person_add_household_member(UUID, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.person_add_household_member(UUID, TEXT, UUID) TO authenticated;

CREATE FUNCTION public.person_guard_mustahik_mapping() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.orang_id IS NOT NULL) OR (TG_OP = 'UPDATE' AND NEW.orang_id IS DISTINCT FROM OLD.orang_id) THEN
    IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
    IF TG_OP = 'UPDATE' AND OLD.orang_id IS NOT NULL THEN RAISE EXCEPTION 'Pemetaan yang sudah terverifikasi memerlukan koreksi khusus'; END IF;
    IF NEW.orang_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.muzakki WHERE id = NEW.orang_id AND aktif AND jenis_identitas = 'individu' AND identitas_terverifikasi) THEN
      RAISE EXCEPTION 'Pilih individu aktif yang sudah diverifikasi';
    END IF;
    INSERT INTO public.loan_audit(actor_id, action, details)
      VALUES (auth.uid(), 'mustahik_mapped', jsonb_build_object('mustahik_id', NEW.id, 'person_id', NEW.orang_id));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.person_guard_mustahik_mapping() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER person_guard_mustahik_mapping BEFORE INSERT OR UPDATE OF orang_id ON public.mustahik
  FOR EACH ROW EXECUTE FUNCTION public.person_guard_mustahik_mapping();

CREATE FUNCTION public.person_map_mustahik(p_mustahik_id UUID, p_person_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current UUID;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  SELECT orang_id INTO v_current FROM public.mustahik WHERE id = p_mustahik_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Mustahik tidak ditemukan'; END IF;
  IF v_current = p_person_id THEN RETURN p_mustahik_id; END IF;
  IF v_current IS NOT NULL THEN RAISE EXCEPTION 'Mustahik sudah dipetakan; koreksi memerlukan alur khusus'; END IF;
  UPDATE public.mustahik SET orang_id = p_person_id WHERE id = p_mustahik_id;
  RETURN p_mustahik_id;
END;
$$;
REVOKE ALL ON FUNCTION public.person_map_mustahik(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.person_map_mustahik(UUID, UUID) TO authenticated;
COMMIT;
