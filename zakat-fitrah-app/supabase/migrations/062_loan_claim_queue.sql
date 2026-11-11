BEGIN;
CREATE FUNCTION public.loan_claim_review_queue(p_offset INTEGER DEFAULT 0, p_limit INTEGER DEFAULT 25)
RETURNS TABLE (
  payment_id UUID, loan_id UUID, loan_number TEXT, customer_name TEXT, payment_date DATE,
  amount BIGINT, reference TEXT, submitted_at TIMESTAMPTZ, storage_path TEXT,
  possible_duplicate BOOLEAN, total_pending BIGINT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_offset IS NULL OR p_offset < 0 OR p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION 'Halaman tidak valid';
  END IF;
  RETURN QUERY
    SELECT p.id, l.id, l.loan_number, coalesce(m.nama_lengkap, m.nama_kk), p.payment_date,
      p.amount, p.reference, p.created_at, d.storage_path,
      EXISTS (
        SELECT 1 FROM public.loan_payments other
        WHERE other.id <> p.id AND other.loan_id = p.loan_id AND other.status IN ('pending', 'confirmed')
          AND ((other.payment_date = p.payment_date AND other.amount = p.amount)
            OR (p.reference IS NOT NULL AND other.reference = p.reference)
            OR (d.snapshot->>'file_sha256' IS NOT NULL AND EXISTS (
              SELECT 1 FROM public.loan_documents od WHERE od.payment_id = other.id AND od.kind = 'payment_evidence'
                AND od.snapshot->>'file_sha256' = d.snapshot->>'file_sha256'
            )))
      ), count(*) OVER ()
    FROM public.loan_payments p
    JOIN public.loans l ON l.id = p.loan_id
    JOIN public.loan_customers c ON c.id = l.customer_id
    JOIN public.muzakki m ON m.id = c.person_id
    LEFT JOIN LATERAL (SELECT doc.storage_path, doc.snapshot FROM public.loan_documents doc
      WHERE doc.payment_id = p.id AND doc.kind = 'payment_evidence' ORDER BY doc.created_at, doc.id LIMIT 1) d ON true
    WHERE p.status = 'pending'
    ORDER BY p.created_at, p.id OFFSET p_offset LIMIT p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_claim_review_queue(INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loan_claim_review_queue(INTEGER, INTEGER) TO authenticated;
COMMIT;
