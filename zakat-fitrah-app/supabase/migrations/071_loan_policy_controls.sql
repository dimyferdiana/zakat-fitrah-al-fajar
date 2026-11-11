BEGIN;

ALTER TABLE public.loans ADD COLUMN planned_disbursement_date DATE,
  ADD COLUMN notes TEXT, ADD COLUMN guarantor_relationship TEXT, ADD COLUMN guarantor_contact TEXT;

CREATE TABLE public.loan_policy_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
  policy_id UUID NOT NULL REFERENCES public.loan_policies(id) ON DELETE RESTRICT,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('principal','tenor','guarantor')),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  fingerprint JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_policy_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY loan_policy_exceptions_read ON public.loan_policy_exceptions FOR SELECT TO authenticated USING (public.loan_is_staff());
REVOKE ALL ON public.loan_policy_exceptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.loan_policy_exceptions TO authenticated;

CREATE FUNCTION public.loan_set_policy(p_min BIGINT, p_max BIGINT, p_min_days INTEGER, p_max_days INTEGER,
  p_guarantor BOOLEAN, p_exceptions TEXT[]) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id=auth.uid() AND is_active AND role::text='admin') THEN
    RAISE EXCEPTION 'Hanya admin dapat mengubah kebijakan' USING ERRCODE='42501';
  END IF;
  IF p_guarantor IS NULL OR p_exceptions IS NULL OR NOT p_exceptions <@ ARRAY['principal','tenor','guarantor']::TEXT[] THEN
    RAISE EXCEPTION 'Kebijakan tidak valid';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('loan_policy_settings'));
  UPDATE public.loan_policies SET is_active=false WHERE is_active;
  INSERT INTO public.loan_policies(min_principal,max_principal,min_tenor_days,max_tenor_days,guarantor_required,permitted_exceptions,created_by,is_active)
    VALUES(p_min,p_max,p_min_days,p_max_days,p_guarantor,p_exceptions,auth.uid(),true) RETURNING id INTO v_id;
  INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'policy_created',jsonb_build_object('policy_id',v_id));
  RETURN v_id;
END; $$;

CREATE FUNCTION public.loan_set_category(p_id UUID, p_name TEXT, p_active BOOLEAN) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id=auth.uid() AND is_active AND role::text='admin') THEN
    RAISE EXCEPTION 'Hanya admin dapat mengubah kategori' USING ERRCODE='42501';
  END IF;
  IF p_name IS NULL OR length(trim(p_name))=0 OR p_active IS NULL THEN RAISE EXCEPTION 'Kategori tidak valid'; END IF;
  IF p_id IS NULL THEN INSERT INTO public.loan_categories(name,is_active) VALUES(trim(p_name),p_active) RETURNING id INTO v_id;
  ELSE UPDATE public.loan_categories SET name=trim(p_name),is_active=p_active WHERE id=p_id RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'Kategori tidak ditemukan'; END IF;
  END IF;
  INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'category_updated',jsonb_build_object('category_id',v_id,'name',trim(p_name),'active',p_active));
  RETURN v_id;
END; $$;

CREATE FUNCTION public.loan_set_draft_details(p_loan UUID, p_planned DATE, p_notes TEXT, p_guarantor UUID,
  p_relationship TEXT, p_contact TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_loan public.loans%ROWTYPE; v_person UUID;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_loan FROM public.loans WHERE id=p_loan FOR UPDATE;
  IF NOT FOUND OR v_loan.status <> 'draft' THEN RAISE EXCEPTION 'Pinjaman bukan draft'; END IF;
  SELECT person_id INTO v_person FROM public.loan_customers WHERE id=v_loan.customer_id;
  IF p_planned IS NULL OR EXISTS (SELECT 1 FROM public.loan_installments WHERE loan_id=p_loan AND due_date < p_planned) THEN
    RAISE EXCEPTION 'Tanggal rencana harus diisi dan tidak boleh sesudah angsuran';
  END IF;
  IF p_guarantor IS NOT NULL THEN
    IF p_guarantor=v_person OR NULLIF(trim(p_relationship),'') IS NULL OR NULLIF(trim(p_contact),'') IS NULL THEN
      RAISE EXCEPTION 'Penjamin harus berbeda dari nasabah dan memiliki hubungan serta kontak';
    END IF;
    PERFORM 1 FROM public.muzakki WHERE id=p_guarantor AND aktif AND jenis_identitas='individu' AND identitas_terverifikasi FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Penjamin harus individu aktif yang terverifikasi'; END IF;
  END IF;
  UPDATE public.loans SET planned_disbursement_date=p_planned, notes=NULLIF(trim(p_notes),''), guarantor_id=p_guarantor,
    guarantor_relationship=CASE WHEN p_guarantor IS NULL THEN NULL ELSE trim(p_relationship) END,
    guarantor_contact=CASE WHEN p_guarantor IS NULL THEN NULL ELSE trim(p_contact) END, updated_at=now() WHERE id=p_loan;
  INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(p_loan,auth.uid(),'draft_details_updated',jsonb_build_object('guarantor_id',p_guarantor));
END; $$;

CREATE FUNCTION public.loan_exception_fingerprint(p_loan UUID, p_date DATE) RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object('principal',l.principal,'guarantor_id',l.guarantor_id,'relationship',l.guarantor_relationship,
    'contact',l.guarantor_contact,'date',p_date,
    'customer_identity',public.loan_contract_person_snapshot((SELECT person_id FROM public.loan_customers WHERE id=l.customer_id)),
    'guarantor_identity',CASE WHEN l.guarantor_id IS NULL THEN NULL ELSE public.loan_contract_person_snapshot(l.guarantor_id) END,
    'schedule',(SELECT jsonb_agg(jsonb_build_object('date',due_date,'amount',amount) ORDER BY installment_number) FROM public.loan_installments WHERE loan_id=l.id))
  FROM public.loans l WHERE l.id=p_loan
$$;

CREATE FUNCTION public.loan_record_policy_exception(p_loan UUID,p_date DATE,p_type TEXT,p_reason TEXT) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_policy public.loan_policies%ROWTYPE; v_id UUID;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.loans WHERE id=p_loan AND status='draft' FOR UPDATE;
  IF NOT FOUND OR p_date IS NULL OR NULLIF(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'Draft, tanggal, dan alasan wajib diisi'; END IF;
  SELECT * INTO v_policy FROM public.loan_policies WHERE is_active FOR SHARE;
  IF NOT FOUND OR p_type IS NULL OR NOT p_type=ANY(v_policy.permitted_exceptions) THEN RAISE EXCEPTION 'Pengecualian tidak diizinkan kebijakan'; END IF;
  INSERT INTO public.loan_policy_exceptions(loan_id,policy_id,exception_type,reason,fingerprint,created_by)
    VALUES(p_loan,v_policy.id,p_type,trim(p_reason),public.loan_exception_fingerprint(p_loan,p_date),auth.uid()) RETURNING id INTO v_id;
  INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(p_loan,auth.uid(),'policy_exception',jsonb_build_object('exception_id',v_id,'policy_id',v_policy.id,'type',p_type,'reason',trim(p_reason)));
  RETURN v_id;
END; $$;

CREATE FUNCTION public.loan_cancel_draft(p_loan UUID,p_reason TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  IF NULLIF(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'Alasan pembatalan wajib diisi'; END IF;
  UPDATE public.loans SET status='cancelled',updated_at=now() WHERE id=p_loan AND status='draft';
  IF NOT FOUND THEN RAISE EXCEPTION 'Hanya draft yang dapat dibatalkan'; END IF;
  INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES(p_loan,auth.uid(),'draft_cancelled',jsonb_build_object('reason',trim(p_reason)));
END; $$;

REVOKE ALL ON FUNCTION public.loan_set_policy(BIGINT,BIGINT,INTEGER,INTEGER,BOOLEAN,TEXT[]), public.loan_set_category(UUID,TEXT,BOOLEAN),
 public.loan_set_draft_details(UUID,DATE,TEXT,UUID,TEXT,TEXT), public.loan_record_policy_exception(UUID,DATE,TEXT,TEXT),
 public.loan_cancel_draft(UUID,TEXT), public.loan_exception_fingerprint(UUID,DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.loan_set_policy(BIGINT,BIGINT,INTEGER,INTEGER,BOOLEAN,TEXT[]), public.loan_set_category(UUID,TEXT,BOOLEAN),
 public.loan_set_draft_details(UUID,DATE,TEXT,UUID,TEXT,TEXT), public.loan_record_policy_exception(UUID,DATE,TEXT,TEXT),
 public.loan_cancel_draft(UUID,TEXT) TO authenticated;
COMMIT;
