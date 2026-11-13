BEGIN;
CREATE OR REPLACE FUNCTION public.loan_navigation_loans(p_search TEXT DEFAULT '', p_status TEXT DEFAULT '', p_category UUID DEFAULT NULL, p_page INTEGER DEFAULT 1, p_size INTEGER DEFAULT 25)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB; today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_page IS NULL OR p_page<1 OR p_page>100000 OR p_size IS NULL OR p_size NOT IN (25,50) OR length(coalesce(p_search,''))>120 OR coalesce(p_status,'') NOT IN ('','draft','active','paid','cancelled','needs_reconciliation') THEN RAISE EXCEPTION 'Filter tidak valid' USING ERRCODE='22023'; END IF;
 WITH filtered AS (
  SELECT l.id,l.loan_number,l.purpose,l.principal,l.status,l.created_at,l.migration_cutoff,coalesce(nullif(m.nama_lengkap,''),m.nama_kk) AS customer_name
  FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id JOIN public.muzakki m ON m.id=c.person_id
  WHERE (coalesce(p_search,'')='' OR strpos(lower(l.loan_number),lower(trim(p_search)))>0 OR strpos(lower(coalesce(nullif(m.nama_lengkap,''),m.nama_kk)),lower(trim(p_search)))>0)
    AND (coalesce(p_status,'')='' OR l.status=p_status) AND (p_category IS NULL OR l.category_id=p_category)
 ), selected AS (SELECT * FROM filtered ORDER BY created_at DESC,id DESC LIMIT p_size OFFSET (p_page-1)*p_size)
 SELECT jsonb_build_object('total',(SELECT count(*) FROM filtered),'items',coalesce(jsonb_agg(jsonb_build_object(
  'id',s.id,'loan_number',s.loan_number,'purpose',s.purpose,'principal',s.principal,'status',s.status,'customer_name',s.customer_name,
  'remaining',pos.remaining,'overdue',pos.overdue,'incomplete',pos.incomplete,
  'due_date',CASE WHEN s.status='draft' THEN (SELECT min(i.due_date) FROM public.loan_installments i WHERE i.loan_id=s.id)
    WHEN pos.remaining>0 THEN (SELECT min(i.due_date) FROM public.loan_installments i WHERE i.loan_id=s.id
       AND (SELECT sum(CASE WHEN s.migration_cutoff IS NULL THEN j.amount ELSE j.opening_remaining END) FROM public.loan_installments j WHERE j.loan_id=s.id AND j.installment_number<=i.installment_number)
         > (SELECT coalesce(sum(p.amount),0) FROM public.loan_payments p WHERE p.loan_id=s.id AND p.status='confirmed' AND p.payment_date<=today AND (s.migration_cutoff IS NULL OR p.payment_date>s.migration_cutoff))) ELSE NULL END
 ) ORDER BY s.created_at DESC,s.id DESC),'[]'::jsonb)) INTO result
 FROM selected s CROSS JOIN LATERAL public.loan_navigation_position(s.id,today) pos;
 RETURN result;
END; $$;
COMMIT;
