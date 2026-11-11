BEGIN;
ALTER TABLE public.loan_customers ADD COLUMN access_paused BOOLEAN NOT NULL DEFAULT false;

-- Check the server-side session on every customer access; a revoked access JWT
-- can otherwise remain usable until its expiry.
CREATE FUNCTION public.loan_customer_session_valid() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.sessions s JOIN public.loan_customers c ON c.auth_user_id=s.user_id
    WHERE s.user_id=auth.uid() AND s.id::text=auth.jwt()->>'session_id'
      AND (s.not_after IS NULL OR s.not_after>now()) AND c.is_active AND NOT c.access_paused
  );
$$;
REVOKE ALL ON FUNCTION public.loan_customer_session_valid() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_customer_session_valid() TO authenticated;

CREATE OR REPLACE FUNCTION public.loan_is_owner(p_loan_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.loan_customer_session_valid() AND EXISTS (
    SELECT 1 FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id
    WHERE l.id=p_loan_id AND c.auth_user_id=auth.uid() AND c.is_active AND NOT c.access_paused
      AND l.status IN ('active','paid')
  );
$$;
DROP POLICY loan_customers_read ON public.loan_customers;
CREATE POLICY loan_customers_read ON public.loan_customers FOR SELECT TO authenticated
  USING (public.loan_is_staff() OR (auth_user_id=auth.uid() AND is_active AND NOT access_paused AND public.loan_customer_session_valid()));

CREATE OR REPLACE FUNCTION public.loan_customer_loans()
RETURNS TABLE (id UUID, loan_number TEXT, status TEXT, principal BIGINT, migration_cutoff DATE, loan_installments JSONB)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT l.id,l.loan_number,l.status,l.principal,l.migration_cutoff,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('due_date',i.due_date,'amount',i.amount,'opening_remaining',i.opening_remaining,'installment_number',i.installment_number) ORDER BY i.installment_number)
      FROM public.loan_installments i WHERE i.loan_id=l.id),'[]'::jsonb)
  FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id
  WHERE c.auth_user_id=auth.uid() AND c.is_active AND NOT c.access_paused AND public.loan_customer_session_valid() AND l.status IN ('active','paid')
  ORDER BY l.created_at DESC;
$$;
CREATE OR REPLACE FUNCTION public.loan_customer_payment_history()
RETURNS TABLE (id UUID,loan_id UUID,payment_date DATE,amount BIGINT,status TEXT,rejection_reason TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT p.id,p.loan_id,p.payment_date,p.amount,p.status,CASE WHEN p.status='rejected' THEN p.reason ELSE NULL END
  FROM public.loan_payments p JOIN public.loans l ON l.id=p.loan_id JOIN public.loan_customers c ON c.id=l.customer_id
  WHERE c.auth_user_id=auth.uid() AND c.is_active AND NOT c.access_paused AND public.loan_customer_session_valid() AND l.status IN ('active','paid');
$$;

-- Only an admin can begin or finish recovery. A failed change stays paused.
CREATE FUNCTION public.loan_begin_account_recovery(p_customer_id UUID) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
DECLARE v_auth UUID;
BEGIN
  IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  SELECT auth_user_id INTO v_auth FROM public.loan_customers WHERE id=p_customer_id AND is_active FOR UPDATE;
  IF NOT FOUND OR v_auth IS NULL OR EXISTS (SELECT 1 FROM public.users WHERE id=v_auth) THEN
    RAISE EXCEPTION 'Akun nasabah tidak tersedia';
  END IF;
  UPDATE public.loan_customers SET access_paused=true WHERE id=p_customer_id;
  DELETE FROM auth.sessions WHERE user_id=v_auth;
  INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'customer_recovery_started',jsonb_build_object('customer_id',p_customer_id));
  RETURN v_auth;
END; $$;
CREATE FUNCTION public.loan_finish_account_recovery(p_customer_id UUID,p_auth_user UUID,p_action TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  IF p_action NOT IN ('email','password') THEN RAISE EXCEPTION 'Tindakan tidak valid'; END IF;
  UPDATE public.loan_customers SET access_paused=false WHERE id=p_customer_id AND auth_user_id=p_auth_user AND is_active AND access_paused;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pemulihan tidak tersedia'; END IF;
  INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'customer_recovery_completed',jsonb_build_object('customer_id',p_customer_id,'kind',p_action));
END; $$;
REVOKE ALL ON FUNCTION public.loan_begin_account_recovery(UUID),public.loan_finish_account_recovery(UUID,UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_begin_account_recovery(UUID),public.loan_finish_account_recovery(UUID,UUID,TEXT) TO authenticated;
COMMIT;
