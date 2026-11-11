BEGIN;

ALTER TABLE public.loans ADD COLUMN responsible_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT;
UPDATE public.loans SET responsible_id=created_by WHERE responsible_id IS NULL;

-- The draft, its schedule, planned date, responsible officer and note share one transaction.
CREATE FUNCTION public.loan_create_complete_draft(
  p_customer_id UUID,p_category_id UUID,p_purpose TEXT,p_principal BIGINT,p_schedule JSONB,
  p_request_id UUID,p_planned DATE,p_responsible UUID,p_notes TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id UUID; v_existing public.loans%ROWTYPE; v_notes TEXT := NULLIF(trim(p_notes),'');
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_planned IS NULL OR p_responsible IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users WHERE id=p_responsible AND is_active AND role::text IN ('admin','petugas')
  ) THEN RAISE EXCEPTION 'Tanggal rencana dan petugas penanggung jawab aktif wajib diisi'; END IF;
  IF jsonb_typeof(p_schedule) IS DISTINCT FROM 'array' OR jsonb_array_length(p_schedule)=0 THEN RAISE EXCEPTION 'Jadwal wajib diisi'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_schedule) x WHERE (x->>'dueDate')::date<p_planned) THEN
    RAISE EXCEPTION 'Tanggal angsuran tidak boleh sebelum rencana pencairan';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  SELECT * INTO v_existing FROM public.loans WHERE id=p_request_id;
  IF FOUND AND (v_existing.planned_disbursement_date IS DISTINCT FROM p_planned OR
      v_existing.responsible_id IS DISTINCT FROM p_responsible OR v_existing.notes IS DISTINCT FROM v_notes) THEN
    RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk data berbeda';
  END IF;
  v_id := public.loan_create_draft(p_customer_id,p_category_id,p_purpose,p_principal,p_schedule,p_request_id);
  IF v_existing.id IS NULL THEN
    UPDATE public.loans SET planned_disbursement_date=p_planned,responsible_id=p_responsible,notes=v_notes WHERE id=v_id;
    INSERT INTO public.loan_audit(loan_id,actor_id,action,details)
      VALUES(v_id,auth.uid(),'draft_details_created',jsonb_build_object('planned_date',p_planned,'responsible_id',p_responsible));
  END IF;
  RETURN v_id;
END; $$;

-- Schedule edits are allowed only for drafts and invalidate contracts permanently, even if reverted.
CREATE FUNCTION public.loan_update_draft_schedule(p_loan UUID,p_schedule JSONB) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_loan public.loans%ROWTYPE; v_item JSONB; v_due DATE; v_previous DATE; v_amount BIGINT;
  v_total NUMERIC := 0; v_number INTEGER := 0; v_current JSONB; v_person UUID;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_loan FROM public.loans WHERE id=p_loan FOR UPDATE;
  IF NOT FOUND OR v_loan.status <> 'draft' THEN RAISE EXCEPTION 'Hanya jadwal draft dapat diubah'; END IF;
  IF v_loan.planned_disbursement_date IS NULL OR jsonb_typeof(p_schedule) IS DISTINCT FROM 'array' OR jsonb_array_length(p_schedule)=0 THEN
    RAISE EXCEPTION 'Tanggal rencana dan jadwal wajib diisi';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_schedule) LOOP
    IF jsonb_typeof(v_item)<>'object' OR COALESCE(v_item->>'dueDate','') !~ '^\d{4}-\d{2}-\d{2}$' OR
       COALESCE(v_item->>'amount','') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Format angsuran tidak valid'; END IF;
    v_due := (v_item->>'dueDate')::date; v_amount := (v_item->>'amount')::BIGINT;
    IF v_amount<=0 OR v_due<v_loan.planned_disbursement_date OR (v_previous IS NOT NULL AND v_due<=v_previous) THEN
      RAISE EXCEPTION 'Tanggal harus unik, berurutan, tidak sebelum rencana, dan nominal positif';
    END IF;
    v_number := v_number+1; v_total := v_total+v_amount; v_previous := v_due;
  END LOOP;
  IF v_total<>v_loan.principal THEN RAISE EXCEPTION 'Total angsuran harus sama dengan pokok'; END IF;
  SELECT jsonb_agg(jsonb_build_object('dueDate',due_date::text,'amount',amount) ORDER BY installment_number)
    INTO v_current FROM public.loan_installments WHERE loan_id=p_loan;
  IF v_current=p_schedule THEN RETURN; END IF;
  SELECT person_id INTO v_person FROM public.loan_customers WHERE id=v_loan.customer_id;
  INSERT INTO public.loan_contract_invalidations(document_id,person_id,invalidated_by)
    SELECT id,v_person,auth.uid() FROM public.loan_documents WHERE loan_id=p_loan AND kind='contract_signed'
    ON CONFLICT(document_id) DO NOTHING;
  DELETE FROM public.loan_installments WHERE loan_id=p_loan;
  INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount)
    SELECT p_loan, ordinality::integer,(value->>'dueDate')::date,(value->>'amount')::BIGINT
    FROM jsonb_array_elements(p_schedule) WITH ORDINALITY;
  INSERT INTO public.loan_audit(loan_id,actor_id,action,details)
    VALUES(p_loan,auth.uid(),'schedule_updated',jsonb_build_object('old',v_current,'new',p_schedule));
END; $$;
REVOKE ALL ON FUNCTION public.loan_create_complete_draft(UUID,UUID,TEXT,BIGINT,JSONB,UUID,DATE,UUID,TEXT),
 public.loan_update_draft_schedule(UUID,JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_create_complete_draft(UUID,UUID,TEXT,BIGINT,JSONB,UUID,DATE,UUID,TEXT),
 public.loan_update_draft_schedule(UUID,JSONB) TO authenticated;
COMMIT;
