-- Draft creation is one transaction: no partial loan/schedule is visible.
BEGIN;

CREATE OR REPLACE FUNCTION public.loan_create_draft(
  p_customer_id UUID,
  p_category_id UUID,
  p_purpose TEXT,
  p_principal BIGINT,
  p_schedule JSONB,
  p_request_id UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_loan_id UUID := p_request_id;
  v_item JSONB;
  v_due DATE;
  v_previous DATE;
  v_amount BIGINT;
  v_total NUMERIC := 0;
  v_number INTEGER := 0;
  v_existing public.loans%ROWTYPE;
BEGIN
  IF NOT public.loan_is_staff() THEN
    RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_principal IS NULL OR p_principal <= 0 OR
     p_purpose IS NULL OR length(trim(p_purpose)) = 0 OR
     jsonb_typeof(p_schedule) IS DISTINCT FROM 'array' OR jsonb_array_length(p_schedule) = 0 THEN
    RAISE EXCEPTION 'Data draft pinjaman tidak lengkap';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.loan_customers c JOIN public.muzakki m ON m.id = c.person_id
    WHERE c.id = p_customer_id AND c.is_active AND m.aktif AND m.jenis_identitas = 'individu' AND m.identitas_terverifikasi
  ) THEN
    RAISE EXCEPTION 'Nasabah harus individu aktif yang terverifikasi';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.loan_categories WHERE id = p_category_id AND is_active) THEN
    RAISE EXCEPTION 'Kategori tidak aktif atau tidak ditemukan';
  END IF;

  -- Serialize retries for this request before checking for an existing draft.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  -- A replay is accepted only if it is the same request, never for changed input.
  SELECT * INTO v_existing FROM public.loans WHERE id = v_loan_id;
  IF FOUND THEN
    IF v_existing.created_by <> auth.uid() OR v_existing.customer_id <> p_customer_id OR
       v_existing.category_id <> p_category_id OR v_existing.purpose <> trim(p_purpose) OR
       v_existing.principal <> p_principal OR
       (SELECT COALESCE(jsonb_agg(jsonb_build_object('dueDate', i.due_date::text, 'amount', i.amount)
                ORDER BY i.installment_number), '[]'::jsonb)
          FROM public.loan_installments i WHERE i.loan_id = v_loan_id) <> p_schedule THEN
      RAISE EXCEPTION 'Kunci permintaan telah digunakan untuk data berbeda';
    END IF;
    RETURN v_loan_id;
  END IF;

  INSERT INTO public.loans (id, loan_number, customer_id, category_id, purpose, principal, created_by)
  VALUES (v_loan_id, 'PNJ-' || replace(v_loan_id::text, '-', ''), p_customer_id, p_category_id,
          trim(p_purpose), p_principal, auth.uid());

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_schedule) LOOP
    IF jsonb_typeof(v_item) <> 'object' OR (v_item->>'dueDate') !~ '^\d{4}-\d{2}-\d{2}$' OR
       (v_item->>'amount') !~ '^[0-9]+$' THEN
      RAISE EXCEPTION 'Format angsuran tidak valid';
    END IF;
    v_due := (v_item->>'dueDate')::date;
    v_amount := (v_item->>'amount')::bigint;
    IF v_amount <= 0 OR (v_previous IS NOT NULL AND v_due <= v_previous) THEN
      RAISE EXCEPTION 'Tanggal harus unik dan berurutan, nominal harus positif';
    END IF;
    v_number := v_number + 1;
    v_total := v_total + v_amount;
    INSERT INTO public.loan_installments (loan_id, installment_number, due_date, amount)
      VALUES (v_loan_id, v_number, v_due, v_amount);
    v_previous := v_due;
  END LOOP;
  IF v_total <> p_principal THEN
    RAISE EXCEPTION 'Total angsuran harus sama dengan pokok';
  END IF;
  INSERT INTO public.loan_audit (loan_id, actor_id, action) VALUES (v_loan_id, auth.uid(), 'draft_created');
  RETURN v_loan_id;
END;
$$;

REVOKE ALL ON FUNCTION public.loan_create_draft(UUID, UUID, TEXT, BIGINT, JSONB, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.loan_create_draft(UUID, UUID, TEXT, BIGINT, JSONB, UUID) TO authenticated;

COMMIT;
