BEGIN;

CREATE TABLE public.loan_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
  followup_date DATE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('langsung', 'telepon', 'whatsapp', 'lainnya')),
  outcome TEXT NOT NULL CHECK (length(trim(outcome)) > 0),
  promise_date DATE,
  promise_amount BIGINT CHECK (promise_amount IS NULL OR promise_amount > 0),
  next_followup_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_id UUID NOT NULL UNIQUE,
  CHECK ((promise_date IS NULL) = (promise_amount IS NULL))
);
CREATE INDEX loan_followups_loan_idx ON public.loan_followups(loan_id, followup_date DESC);
ALTER TABLE public.loan_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY loan_followups_staff_read ON public.loan_followups FOR SELECT TO authenticated USING (public.loan_is_staff());
REVOKE ALL ON public.loan_followups FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.loan_followups TO authenticated;

CREATE FUNCTION public.loan_add_followup(
  p_loan_id UUID, p_followup_date DATE, p_channel TEXT, p_outcome TEXT,
  p_promise_date DATE, p_promise_amount BIGINT, p_next_followup_date DATE,
  p_notes TEXT, p_request_id UUID
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_existing public.loan_followups%ROWTYPE; v_id UUID;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_request_id IS NULL OR p_followup_date IS NULL OR p_followup_date > (now() AT TIME ZONE 'Asia/Jakarta')::date
     OR p_channel IS NULL OR p_channel NOT IN ('langsung', 'telepon', 'whatsapp', 'lainnya')
     OR p_outcome IS NULL OR length(trim(p_outcome)) = 0 OR length(p_outcome) > 2000
     OR length(coalesce(p_notes, '')) > 4000
     OR (p_promise_date IS NULL) <> (p_promise_amount IS NULL)
     OR (p_promise_amount IS NOT NULL AND p_promise_amount <= 0)
     OR (p_promise_date IS NOT NULL AND p_promise_date < p_followup_date)
     OR (p_next_followup_date IS NOT NULL AND p_next_followup_date < p_followup_date) THEN
    RAISE EXCEPTION 'Data tindak lanjut tidak valid';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  SELECT * INTO v_existing FROM public.loan_followups WHERE request_id = p_request_id;
  IF FOUND THEN
    IF v_existing.loan_id <> p_loan_id OR v_existing.created_by <> auth.uid()
       OR v_existing.followup_date <> p_followup_date OR v_existing.channel <> p_channel
       OR v_existing.outcome <> trim(p_outcome) OR v_existing.promise_date IS DISTINCT FROM p_promise_date
       OR v_existing.promise_amount IS DISTINCT FROM p_promise_amount
       OR v_existing.next_followup_date IS DISTINCT FROM p_next_followup_date
       OR v_existing.notes IS DISTINCT FROM NULLIF(trim(p_notes), '') THEN
      RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk data berbeda';
    END IF;
    RETURN v_existing.id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.loans WHERE id = p_loan_id AND status IN ('active', 'paid')) THEN
    RAISE EXCEPTION 'Pinjaman tidak tersedia untuk tindak lanjut';
  END IF;
  INSERT INTO public.loan_followups(loan_id, followup_date, channel, outcome, promise_date, promise_amount, next_followup_date, notes, created_by, request_id)
    VALUES (p_loan_id, p_followup_date, p_channel, trim(p_outcome), p_promise_date, p_promise_amount, p_next_followup_date, NULLIF(trim(p_notes), ''), auth.uid(), p_request_id)
    RETURNING id INTO v_id;
  INSERT INTO public.loan_audit(loan_id, actor_id, action, details)
    VALUES (p_loan_id, auth.uid(), 'followup_added', jsonb_build_object('followup_id', v_id));
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_add_followup(UUID, DATE, TEXT, TEXT, DATE, BIGINT, DATE, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loan_add_followup(UUID, DATE, TEXT, TEXT, DATE, BIGINT, DATE, TEXT, UUID) TO authenticated;
COMMIT;
