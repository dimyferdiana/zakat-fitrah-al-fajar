BEGIN;
CREATE TABLE public.loan_contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY loan_contract_templates_staff_read ON public.loan_contract_templates FOR SELECT TO authenticated USING (public.loan_is_staff());
REVOKE ALL ON public.loan_contract_templates FROM PUBLIC, authenticated, anon;
GRANT SELECT ON public.loan_contract_templates TO authenticated;
CREATE FUNCTION public.loan_create_contract_template(p_title TEXT, p_body TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_title IS NULL OR p_body IS NULL OR length(trim(p_title)) = 0 OR length(trim(p_body)) = 0
    OR length(p_title) > 200 OR length(p_body) > 30000 THEN RAISE EXCEPTION 'Template tidak valid'; END IF;
  INSERT INTO public.loan_contract_templates (title, body, created_by) VALUES (trim(p_title), p_body, auth.uid()) RETURNING id INTO v_id;
  INSERT INTO public.loan_audit (actor_id, action, details) VALUES (auth.uid(), 'contract_template_created', jsonb_build_object('template_id', v_id));
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_create_contract_template(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loan_create_contract_template(TEXT, TEXT) TO authenticated;
COMMIT;
