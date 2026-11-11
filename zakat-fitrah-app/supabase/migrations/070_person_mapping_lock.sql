BEGIN;
CREATE OR REPLACE FUNCTION public.person_guard_mustahik_mapping() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.orang_id IS NOT NULL) OR (TG_OP = 'UPDATE' AND NEW.orang_id IS DISTINCT FROM OLD.orang_id) THEN
    IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
    IF TG_OP = 'UPDATE' AND OLD.orang_id IS NOT NULL THEN RAISE EXCEPTION 'Pemetaan yang sudah terverifikasi memerlukan koreksi khusus'; END IF;
    -- Serialize against deactivation and verification while the mapping commits.
    PERFORM 1 FROM public.muzakki WHERE id = NEW.orang_id AND aktif AND jenis_identitas = 'individu' AND identitas_terverifikasi FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pilih individu aktif yang sudah diverifikasi'; END IF;
    INSERT INTO public.loan_audit(actor_id, action, details)
      VALUES (auth.uid(), 'mustahik_mapped', jsonb_build_object('mustahik_id', NEW.id, 'person_id', NEW.orang_id));
  END IF;
  RETURN NEW;
END;
$$;
COMMIT;
