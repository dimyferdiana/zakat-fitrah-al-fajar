BEGIN;
CREATE FUNCTION public.loan_historical_contract_missing(p_loan_id UUID) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result BOOLEAN;
BEGIN
 IF NOT public.loan_is_staff() AND NOT public.loan_is_owner(p_loan_id) THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 SELECT l.migration_cutoff IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.loan_documents d WHERE d.loan_id=l.id AND d.kind='contract_signed')
 INTO result FROM public.loans l WHERE l.id=p_loan_id;
 IF result IS NULL THEN RAISE EXCEPTION 'Pinjaman tidak ditemukan'; END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.loan_historical_contract_missing(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.loan_historical_contract_missing(UUID) TO authenticated;
COMMIT;
