BEGIN;

-- Recheck the identity at the time of linking, not just at registration.
-- The row lock serializes this operation with identity deactivation.
CREATE OR REPLACE FUNCTION public.loan_link_customer_account(p_customer_id UUID, p_auth_user_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_customer public.loan_customers%ROWTYPE;
BEGIN
  IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF NOT public.loan_customer_creation_enabled() THEN RAISE EXCEPTION 'Pembuatan akun belum diaktifkan'; END IF;
  IF p_customer_id IS NULL OR p_auth_user_id IS NULL THEN RAISE EXCEPTION 'Nasabah dan akun wajib diisi'; END IF;
  SELECT * INTO v_customer FROM public.loan_customers WHERE id = p_customer_id FOR UPDATE;
  IF NOT FOUND OR NOT v_customer.is_active THEN RAISE EXCEPTION 'Nasabah tidak ditemukan atau tidak aktif'; END IF;
  PERFORM 1 FROM public.muzakki WHERE id = v_customer.person_id AND aktif
    AND jenis_identitas = 'individu' AND identitas_terverifikasi FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Identitas nasabah harus individu aktif dan terverifikasi'; END IF;
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
COMMIT;
