BEGIN;
-- A migration snapshot is not valid unless the entire original schedule also matches principal.
CREATE OR REPLACE FUNCTION public.loan_collectibility_status(p_loan UUID,p_asof DATE DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.loans%ROWTYPE; cfg JSONB; paid NUMERIC; total NUMERIC; principal_total NUMERIC; overdue NUMERIC; oldest DATE; n BIGINT; unknowns BIGINT; balance NUMERIC; dpd INTEGER; base JSONB;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_asof IS NULL OR p_asof>(now() AT TIME ZONE 'Asia/Jakarta')::date THEN RAISE EXCEPTION 'Tanggal posisi tidak valid'; END IF;
 SELECT * INTO l FROM public.loans WHERE id=p_loan;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pinjaman tidak ditemukan'; END IF;
 cfg:=public.loan_collectibility_config();
 base:=jsonb_build_object('as_of',p_asof,'enabled',cfg->'enabled','version',cfg->'version');
 IF l.status IN('draft','cancelled') THEN RETURN base||jsonb_build_object('state',CASE WHEN l.status='draft' THEN 'draft' ELSE 'cancelled' END,'label',NULL); END IF;
 IF (l.migration_cutoff IS NOT NULL AND p_asof<l.migration_cutoff) OR (l.migration_cutoff IS NULL AND l.disbursement_date IS NULL) THEN
   RETURN base||jsonb_build_object('state','unavailable','label',NULL);
 END IF;
 IF l.disbursement_date IS NOT NULL AND l.disbursement_date>p_asof THEN RETURN base||jsonb_build_object('state','not_disbursed','label',NULL); END IF;
 SELECT count(*),count(*) FILTER(WHERE i.opening_remaining IS NULL),sum(CASE WHEN l.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END),sum(i.amount)
 INTO n,unknowns,total,principal_total FROM public.loan_installments i WHERE i.loan_id=l.id;
 IF n=0 OR total IS NULL OR principal_total IS DISTINCT FROM l.principal OR (l.migration_cutoff IS NULL AND total<>l.principal)
   OR (l.migration_cutoff IS NOT NULL AND (unknowns>0 OR l.opening_balance IS NULL OR total<>l.opening_balance)) THEN
   RETURN base||jsonb_build_object('state','unavailable','label',NULL);
 END IF;
 SELECT coalesce(sum(p.amount),0) INTO paid FROM public.loan_payments p WHERE p.loan_id=l.id AND p.status='confirmed'
   AND p.payment_date<=p_asof AND (l.migration_cutoff IS NULL OR p.payment_date>l.migration_cutoff);
 IF paid>total THEN RETURN base||jsonb_build_object('state','unavailable','label',NULL); END IF;
 balance:=total-paid;
 WITH steps AS (
   SELECT i.due_date,CASE WHEN l.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END amount,
     coalesce(sum(CASE WHEN l.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END)
       OVER(ORDER BY i.installment_number ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),0) earlier
   FROM public.loan_installments i WHERE i.loan_id=l.id
 ), due AS (SELECT due_date,greatest(0,amount-greatest(0,paid-earlier)) remaining FROM steps)
 SELECT coalesce(sum(remaining) FILTER(WHERE due_date<p_asof),0),min(due_date) FILTER(WHERE due_date<p_asof AND remaining>0)
 INTO overdue,oldest FROM due;
 dpd:=CASE WHEN oldest IS NULL THEN 0 ELSE p_asof-oldest END;
 RETURN base||jsonb_build_object('state',CASE WHEN balance=0 THEN 'no_obligation' ELSE 'active' END,
   'remaining',balance,'overdue',overdue,'oldest_due',oldest,'dpd',dpd,
   'label',CASE WHEN balance>0 AND (cfg->>'enabled')::BOOLEAN THEN public.loan_classify_dpd(dpd,cfg->'ranges') ELSE NULL END);
END; $$;
COMMIT;
