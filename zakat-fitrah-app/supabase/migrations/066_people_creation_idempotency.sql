BEGIN;
CREATE TABLE public.person_creation_requests (
  request_id UUID PRIMARY KEY,
  person_id UUID NOT NULL UNIQUE REFERENCES public.muzakki(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.person_creation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.person_creation_requests FROM PUBLIC, anon, authenticated;

-- Do not assume the legacy muzakki table contains created_by: the local and
-- hosted schemas differ. Store retry ownership in our own additive table.
CREATE OR REPLACE FUNCTION public.person_add_household_member(p_household_id UUID, p_name TEXT, p_request_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_parent public.muzakki%ROWTYPE; v_existing public.muzakki%ROWTYPE; v_request public.person_creation_requests%ROWTYPE;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 OR length(p_name) > 200 OR p_request_id IS NULL THEN RAISE EXCEPTION 'Nama atau identitas permintaan tidak valid'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  SELECT * INTO v_parent FROM public.muzakki WHERE id = p_household_id FOR UPDATE;
  IF NOT FOUND OR NOT v_parent.aktif OR v_parent.jenis_identitas <> 'rumah_tangga' THEN RAISE EXCEPTION 'Rumah tangga tidak tersedia'; END IF;
  SELECT * INTO v_request FROM public.person_creation_requests WHERE request_id = p_request_id;
  IF FOUND THEN
    SELECT * INTO v_existing FROM public.muzakki WHERE id = v_request.person_id;
    IF v_request.created_by IS DISTINCT FROM auth.uid() OR v_existing.rumah_tangga_id IS DISTINCT FROM p_household_id
       OR v_existing.nama_lengkap IS DISTINCT FROM trim(p_name) THEN RAISE EXCEPTION 'Kunci permintaan digunakan untuk data berbeda'; END IF;
    RETURN v_request.person_id;
  END IF;
  IF EXISTS (SELECT 1 FROM public.muzakki WHERE id = p_request_id) THEN RAISE EXCEPTION 'Kunci permintaan digunakan untuk data berbeda'; END IF;
  INSERT INTO public.muzakki(id, nama_kk, nama_lengkap, alamat, rt, rw, jenis_identitas, identitas_terverifikasi, rumah_tangga_id)
    VALUES (p_request_id, trim(p_name), trim(p_name), v_parent.alamat, v_parent.rt, v_parent.rw, 'individu', true, p_household_id);
  INSERT INTO public.person_creation_requests(request_id, person_id, created_by) VALUES (p_request_id, p_request_id, auth.uid());
  INSERT INTO public.loan_audit(actor_id, action, details)
    VALUES (auth.uid(), 'household_member_created', jsonb_build_object('person_id', p_request_id, 'household_id', p_household_id));
  RETURN p_request_id;
END;
$$;
COMMIT;
