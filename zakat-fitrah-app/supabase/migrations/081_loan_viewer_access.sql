BEGIN;

-- An explicit opt-in grants a limited read-only projection; it does not change
-- legacy roles and never grants table writes or document-storage access.
CREATE TABLE public.loan_viewer_permissions (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE RESTRICT,
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_viewer_permissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.loan_viewer_permissions FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.loan_can_view_summary() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.loan_is_staff() OR EXISTS (
    SELECT 1 FROM public.users u JOIN public.loan_viewer_permissions p ON p.user_id = u.id
    WHERE u.id = auth.uid() AND u.is_active AND u.role::text = 'viewer'
  );
$$;

CREATE FUNCTION public.loan_set_viewer_access(p_user_id UUID, p_enabled BOOLEAN) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_user_id IS NULL OR p_enabled IS NULL THEN RAISE EXCEPTION 'Pengguna dan status wajib diisi'; END IF;
  IF p_enabled THEN
    PERFORM 1 FROM public.users WHERE id = p_user_id AND is_active AND role::text = 'viewer' FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pengguna harus viewer aktif'; END IF;
    INSERT INTO public.loan_viewer_permissions(user_id,granted_by) VALUES (p_user_id,auth.uid())
      ON CONFLICT (user_id) DO NOTHING;
  ELSE
    DELETE FROM public.loan_viewer_permissions WHERE user_id = p_user_id;
  END IF;
  IF FOUND THEN
    INSERT INTO public.loan_audit(actor_id,action,details) VALUES
      (auth.uid(), CASE WHEN p_enabled THEN 'viewer_access_granted' ELSE 'viewer_access_revoked' END,
       jsonb_build_object('user_id',p_user_id));
  END IF;
END;
$$;

CREATE FUNCTION public.loan_viewer_summary()
RETURNS TABLE (id UUID, loan_number TEXT, customer_id UUID, purpose TEXT, principal BIGINT,
  status TEXT, disbursement_date DATE, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.loan_can_view_summary() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT l.id,l.loan_number,l.customer_id,l.purpose,l.principal,l.status,l.disbursement_date,l.created_at
    FROM public.loans l ORDER BY l.created_at DESC;
END;
$$;

CREATE FUNCTION public.loan_list_viewers()
RETURNS TABLE (user_id UUID, nama_lengkap TEXT, is_active BOOLEAN, permitted BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT u.id,u.nama_lengkap,u.is_active,(p.user_id IS NOT NULL)
    FROM public.users u LEFT JOIN public.loan_viewer_permissions p ON p.user_id=u.id
    WHERE u.role::text='viewer' ORDER BY u.nama_lengkap,u.id;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_can_view_summary(), public.loan_set_viewer_access(UUID,BOOLEAN), public.loan_viewer_summary(), public.loan_list_viewers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loan_can_view_summary(), public.loan_set_viewer_access(UUID,BOOLEAN), public.loan_viewer_summary(), public.loan_list_viewers() TO authenticated;
COMMIT;
