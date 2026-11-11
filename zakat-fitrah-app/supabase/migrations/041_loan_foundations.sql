-- Additive foundations for the loan programme. Existing transaction IDs are retained.
BEGIN;

ALTER TABLE public.muzakki
  ADD COLUMN IF NOT EXISTS nama_lengkap TEXT,
  ADD COLUMN IF NOT EXISTS jenis_identitas TEXT NOT NULL DEFAULT 'belum_diverifikasi'
    CHECK (jenis_identitas IN ('individu', 'rumah_tangga', 'belum_diverifikasi')),
  ADD COLUMN IF NOT EXISTS identitas_terverifikasi BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aktif BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rumah_tangga_id UUID REFERENCES public.muzakki(id) ON DELETE RESTRICT;

ALTER TABLE public.mustahik ADD COLUMN IF NOT EXISTS orang_id UUID REFERENCES public.muzakki(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS mustahik_orang_id_idx ON public.mustahik(orang_id);

-- NOT VALID preserves existing data for review while validating new or changed values.
ALTER TABLE public.muzakki ADD CONSTRAINT muzakki_nik_16_digits
  CHECK (nik IS NULL OR nik ~ '^[0-9]{16}$') NOT VALID;

CREATE TABLE public.loan_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL UNIQUE REFERENCES public.muzakki(id) ON DELETE RESTRICT,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE TABLE public.loan_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.loan_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_principal BIGINT CHECK (min_principal IS NULL OR min_principal > 0),
  max_principal BIGINT CHECK (max_principal IS NULL OR (max_principal > 0 AND (min_principal IS NULL OR max_principal >= min_principal))),
  min_tenor_days INTEGER CHECK (min_tenor_days IS NULL OR min_tenor_days >= 0),
  max_tenor_days INTEGER CHECK (max_tenor_days IS NULL OR (max_tenor_days >= 0 AND (min_tenor_days IS NULL OR max_tenor_days >= min_tenor_days))),
  guarantor_required BOOLEAN NOT NULL DEFAULT false,
  permitted_exceptions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX loan_policy_single_active ON public.loan_policies(is_active) WHERE is_active;

CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number TEXT NOT NULL UNIQUE CHECK (length(trim(loan_number)) > 0),
  customer_id UUID NOT NULL REFERENCES public.loan_customers(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.loan_categories(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL,
  principal BIGINT NOT NULL CHECK (principal > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paid', 'cancelled', 'needs_reconciliation')),
  funding_label TEXT,
  disbursement_date DATE,
  migration_cutoff DATE,
  opening_balance BIGINT CHECK (opening_balance >= 0 AND opening_balance <= principal),
  historical_incomplete BOOLEAN NOT NULL DEFAULT false,
  guarantor_id UUID REFERENCES public.muzakki(id) ON DELETE RESTRICT,
  policy_id UUID REFERENCES public.loan_policies(id) ON DELETE RESTRICT,
  region_snapshot JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX loans_customer_idx ON public.loans(customer_id);

CREATE TABLE public.loan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
  installment_number INTEGER NOT NULL CHECK (installment_number > 0),
  due_date DATE NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  opening_remaining BIGINT CHECK (opening_remaining >= 0 AND opening_remaining <= amount),
  UNIQUE (loan_id, installment_number),
  UNIQUE (loan_id, due_date)
);

CREATE TABLE public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  reference TEXT,
  notes TEXT,
  reason TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  verified_at TIMESTAMPTZ,
  idempotency_key UUID NOT NULL UNIQUE
);
CREATE INDEX loan_payments_loan_idx ON public.loan_payments(loan_id, payment_date, id);

CREATE TABLE public.loan_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES public.loan_payments(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('contract_draft', 'contract_signed', 'payment_evidence', 'receipt', 'disbursement')),
  storage_path TEXT NOT NULL UNIQUE,
  snapshot JSONB NOT NULL DEFAULT '{}',
  shared_with_customer BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.loan_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  loan_id UUID REFERENCES public.loans(id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.loan_is_staff() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active AND role::text IN ('admin', 'petugas')
                   FROM public.users WHERE id = auth.uid()), false)
$$;

CREATE OR REPLACE FUNCTION public.loan_is_owner(p_loan_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.loans l JOIN public.loan_customers c ON c.id = l.customer_id
    WHERE l.id = p_loan_id AND c.auth_user_id = auth.uid() AND c.is_active
      AND l.status IN ('active', 'paid')
  )
$$;

ALTER TABLE public.loan_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY loan_customers_read ON public.loan_customers FOR SELECT TO authenticated
  USING (public.loan_is_staff() OR (auth_user_id = auth.uid() AND is_active));
CREATE POLICY loan_categories_read ON public.loan_categories FOR SELECT TO authenticated USING (public.loan_is_staff());
CREATE POLICY loan_policies_read ON public.loan_policies FOR SELECT TO authenticated USING (public.loan_is_staff());
CREATE POLICY loans_read ON public.loans FOR SELECT TO authenticated USING (public.loan_is_staff() OR public.loan_is_owner(id));
CREATE POLICY installments_read ON public.loan_installments FOR SELECT TO authenticated USING (public.loan_is_staff() OR public.loan_is_owner(loan_id));
CREATE POLICY payments_read ON public.loan_payments FOR SELECT TO authenticated USING (public.loan_is_staff() OR public.loan_is_owner(loan_id));
CREATE POLICY documents_read ON public.loan_documents FOR SELECT TO authenticated
  USING (public.loan_is_staff() OR (shared_with_customer AND public.loan_is_owner(loan_id)));
CREATE POLICY loan_audit_read ON public.loan_audit FOR SELECT TO authenticated USING (public.loan_is_staff());

-- No direct authenticated writes: financial mutations must be implemented through validated server operations.
REVOKE INSERT, UPDATE, DELETE ON public.loan_customers, public.loan_categories, public.loan_policies,
  public.loans, public.loan_installments, public.loan_payments, public.loan_documents, public.loan_audit FROM authenticated;
GRANT SELECT ON public.loan_customers, public.loan_categories, public.loan_policies,
  public.loans, public.loan_installments, public.loan_payments, public.loan_documents, public.loan_audit TO authenticated;

COMMIT;
