BEGIN;
ALTER FUNCTION public.loan_review_payment_claim(UUID, BOOLEAN, TEXT) RENAME TO loan_review_payment_claim_unchecked;
REVOKE ALL ON FUNCTION public.loan_review_payment_claim_unchecked(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.loan_review_payment_claim(p_payment_id UUID, p_accept BOOLEAN, p_reason TEXT DEFAULT NULL) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF p_accept IS TRUE AND NOT EXISTS (
    SELECT 1 FROM public.loan_documents d JOIN storage.objects o
      ON o.bucket_id = 'pinjaman-jamaah-private' AND o.name = d.storage_path
    WHERE d.payment_id = p_payment_id AND d.kind = 'payment_evidence'
  ) THEN RAISE EXCEPTION 'Bukti pembayaran tidak tersedia'; END IF;
  PERFORM public.loan_review_payment_claim_unchecked(p_payment_id, p_accept, p_reason);
END;
$$;
REVOKE ALL ON FUNCTION public.loan_review_payment_claim(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loan_review_payment_claim(UUID, BOOLEAN, TEXT) TO authenticated;
COMMIT;
