BEGIN;

-- Disabled until the deployment's complete table/view/function/Storage access
-- audit and end-to-end tests have been completed by the operator.
CREATE TABLE public.loan_portal_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  account_creation_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.loan_portal_settings (id) VALUES (true);
ALTER TABLE public.loan_portal_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.loan_portal_settings FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.loan_is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active AND role::text = 'admin' FROM public.users WHERE id = auth.uid()), false)
$$;

CREATE OR REPLACE FUNCTION public.loan_customer_creation_enabled() RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  RETURN COALESCE((SELECT account_creation_enabled FROM public.loan_portal_settings WHERE id), false);
END;
$$;

CREATE OR REPLACE FUNCTION public.loan_link_customer_account(p_customer_id UUID, p_auth_user_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_customer public.loan_customers%ROWTYPE;
BEGIN
  IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF NOT public.loan_customer_creation_enabled() THEN RAISE EXCEPTION 'Pembuatan akun belum diaktifkan'; END IF;
  SELECT * INTO v_customer FROM public.loan_customers WHERE id = p_customer_id FOR UPDATE;
  IF NOT FOUND OR NOT v_customer.is_active THEN RAISE EXCEPTION 'Nasabah tidak ditemukan atau tidak aktif'; END IF;
  IF v_customer.auth_user_id = p_auth_user_id THEN RETURN p_customer_id; END IF;
  IF v_customer.auth_user_id IS NOT NULL THEN RAISE EXCEPTION 'Nasabah sudah memiliki akun'; END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_auth_user_id) OR
     EXISTS (SELECT 1 FROM public.users WHERE id = p_auth_user_id) THEN
    RAISE EXCEPTION 'Akun nasabah tidak valid atau memiliki profil pengurus';
  END IF;
  UPDATE public.loan_customers SET auth_user_id = p_auth_user_id WHERE id = p_customer_id;
  INSERT INTO public.loan_audit (actor_id, action, details)
    VALUES (auth.uid(), 'customer_account_linked', jsonb_build_object('customer_id', p_customer_id, 'auth_user_id', p_auth_user_id));
  RETURN p_customer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.loan_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.loan_customer_creation_enabled() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.loan_link_customer_account(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.loan_is_admin(), public.loan_customer_creation_enabled() TO authenticated;
GRANT EXECUTE ON FUNCTION public.loan_link_customer_account(UUID, UUID) TO authenticated;
COMMIT;
