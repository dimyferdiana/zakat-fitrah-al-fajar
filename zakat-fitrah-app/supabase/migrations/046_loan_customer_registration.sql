BEGIN;

CREATE OR REPLACE FUNCTION public.loan_register_customer(p_person_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  PERFORM 1 FROM public.muzakki
    WHERE id = p_person_id AND aktif AND jenis_identitas = 'individu' AND identitas_terverifikasi
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nasabah harus individu aktif yang terverifikasi'; END IF;
  SELECT id INTO v_id FROM public.loan_customers WHERE person_id = p_person_id;
  IF FOUND THEN RETURN v_id; END IF;
  INSERT INTO public.loan_customers (person_id, created_by) VALUES (p_person_id, auth.uid()) RETURNING id INTO v_id;
  INSERT INTO public.loan_audit (actor_id, action, details)
    VALUES (auth.uid(), 'customer_registered', jsonb_build_object('customer_id', v_id, 'person_id', p_person_id));
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_register_customer(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.loan_register_customer(UUID) TO authenticated;
COMMIT;
