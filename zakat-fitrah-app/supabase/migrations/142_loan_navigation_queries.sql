BEGIN;

-- Internal calculation: the outer staff-only projections control access.
CREATE FUNCTION public.loan_navigation_position(p_loan UUID, p_asof DATE)
RETURNS TABLE(remaining NUMERIC, overdue NUMERIC, incomplete BOOLEAN)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
DECLARE l public.loans%ROWTYPE; n BIGINT; total NUMERIC; opening NUMERIC; due NUMERIC; paid NUMERIC; bad BIGINT;
BEGIN
 SELECT * INTO l FROM public.loans WHERE id=p_loan;
 IF NOT FOUND OR l.status IN ('draft','cancelled') OR (l.disbursement_date IS NOT NULL AND l.disbursement_date > p_asof) THEN
   RETURN QUERY SELECT NULL::NUMERIC,NULL::NUMERIC,false; RETURN;
 END IF;
 IF (l.disbursement_date IS NULL AND l.migration_cutoff IS NULL) OR (l.migration_cutoff IS NOT NULL AND l.migration_cutoff > p_asof) THEN
   RETURN QUERY SELECT NULL::NUMERIC,NULL::NUMERIC,true; RETURN;
 END IF;
 SELECT count(*),sum(i.amount),sum(i.opening_remaining),
   sum(CASE WHEN i.due_date < p_asof THEN CASE WHEN l.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END ELSE 0 END),
   count(*) FILTER (WHERE l.migration_cutoff IS NOT NULL AND i.opening_remaining IS NULL)
 INTO n,total,opening,due,bad FROM public.loan_installments i WHERE i.loan_id=l.id;
 SELECT coalesce(sum(p.amount),0) INTO paid FROM public.loan_payments p
 WHERE p.loan_id=l.id AND p.status='confirmed' AND p.payment_date<=p_asof AND (l.migration_cutoff IS NULL OR p.payment_date>l.migration_cutoff);
 IF n=0 OR total<>l.principal OR (l.migration_cutoff IS NOT NULL AND (bad>0 OR l.opening_balance IS NULL OR opening<>l.opening_balance)) OR paid>(CASE WHEN l.migration_cutoff IS NULL THEN total ELSE opening END)
   OR EXISTS (SELECT 1 FROM (SELECT due_date,lag(due_date) OVER (ORDER BY installment_number) AS prev FROM public.loan_installments WHERE loan_id=l.id) s WHERE s.due_date<=s.prev) THEN
   RETURN QUERY SELECT NULL::NUMERIC,NULL::NUMERIC,true; RETURN;
 END IF;
 RETURN QUERY SELECT (CASE WHEN l.migration_cutoff IS NULL THEN total ELSE opening END)-paid, greatest(0::NUMERIC,coalesce(due,0)-paid), false;
END; $$;
REVOKE ALL ON FUNCTION public.loan_navigation_position(UUID,DATE) FROM PUBLIC,anon,authenticated;

CREATE INDEX IF NOT EXISTS loans_navigation_created_idx ON public.loans(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS loan_payments_navigation_date_idx ON public.loan_payments(payment_date DESC,id DESC);
CREATE INDEX IF NOT EXISTS loan_customers_navigation_created_idx ON public.loan_customers(created_at DESC,id DESC);

CREATE FUNCTION public.loan_navigation_loans(p_search TEXT DEFAULT '', p_status TEXT DEFAULT '', p_category UUID DEFAULT NULL, p_page INTEGER DEFAULT 1, p_size INTEGER DEFAULT 25)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB; today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_page IS NULL OR p_page<1 OR p_page>100000 OR p_size IS NULL OR p_size NOT IN (25,50) OR length(coalesce(p_search,''))>120 OR coalesce(p_status,'') NOT IN ('','draft','active','paid','cancelled','needs_reconciliation') THEN RAISE EXCEPTION 'Filter tidak valid' USING ERRCODE='22023'; END IF;
 WITH filtered AS (
  SELECT l.id,l.loan_number,l.purpose,l.principal,l.status,l.created_at,coalesce(nullif(m.nama_lengkap,''),m.nama_kk) AS customer_name
  FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id JOIN public.muzakki m ON m.id=c.person_id
  WHERE (coalesce(p_search,'')='' OR strpos(lower(l.loan_number),lower(trim(p_search)))>0 OR strpos(lower(coalesce(nullif(m.nama_lengkap,''),m.nama_kk)),lower(trim(p_search)))>0)
    AND (coalesce(p_status,'')='' OR l.status=p_status) AND (p_category IS NULL OR l.category_id=p_category)
 ), selected AS (SELECT * FROM filtered ORDER BY created_at DESC,id DESC LIMIT p_size OFFSET (p_page-1)*p_size)
 SELECT jsonb_build_object('total',(SELECT count(*) FROM filtered),'items',coalesce(jsonb_agg(jsonb_build_object(
  'id',s.id,'loan_number',s.loan_number,'purpose',s.purpose,'principal',s.principal,'status',s.status,'customer_name',s.customer_name,
  'remaining',pos.remaining,'overdue',pos.overdue,'incomplete',pos.incomplete) ORDER BY s.created_at DESC,s.id DESC),'[]'::jsonb))
 INTO result FROM selected s CROSS JOIN LATERAL public.loan_navigation_position(s.id,today) pos;
 RETURN result;
END; $$;

CREATE FUNCTION public.loan_navigation_customers(p_search TEXT DEFAULT '', p_page INTEGER DEFAULT 1, p_size INTEGER DEFAULT 25)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_page IS NULL OR p_page<1 OR p_page>100000 OR p_size IS NULL OR p_size NOT IN (25,50) OR length(coalesce(p_search,''))>120 THEN RAISE EXCEPTION 'Filter tidak valid' USING ERRCODE='22023'; END IF;
 WITH filtered AS (
 SELECT c.id,c.is_active,c.created_at,coalesce(nullif(m.nama_lengkap,''),m.nama_kk) AS name,m.alamat
 FROM public.loan_customers c JOIN public.muzakki m ON m.id=c.person_id
 WHERE coalesce(p_search,'')='' OR strpos(lower(coalesce(nullif(m.nama_lengkap,''),m.nama_kk)),lower(trim(p_search)))>0 OR strpos(lower(c.id::text),lower(trim(p_search)))>0
 ), selected AS (SELECT * FROM filtered ORDER BY created_at DESC,id DESC LIMIT p_size OFFSET (p_page-1)*p_size)
 SELECT jsonb_build_object('total',(SELECT count(*) FROM filtered),'items',coalesce(jsonb_agg(to_jsonb(s)-'created_at' ORDER BY s.created_at DESC,s.id DESC),'[]'::jsonb)) INTO result FROM selected s;
 RETURN result;
END; $$;

CREATE FUNCTION public.loan_navigation_payments(p_search TEXT DEFAULT '',p_status TEXT DEFAULT '',p_from DATE DEFAULT NULL,p_to DATE DEFAULT NULL,p_page INTEGER DEFAULT 1,p_size INTEGER DEFAULT 25)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_page IS NULL OR p_page<1 OR p_page>100000 OR p_size IS NULL OR p_size NOT IN (25,50) OR length(coalesce(p_search,''))>120 OR coalesce(p_status,'') NOT IN ('','pending','confirmed','rejected','cancelled') OR (p_from IS NOT NULL AND p_to IS NOT NULL AND p_from>p_to) THEN RAISE EXCEPTION 'Filter tidak valid' USING ERRCODE='22023'; END IF;
 WITH filtered AS (
 SELECT p.id,p.loan_id,p.payment_date,p.amount,p.status,p.method,p.reason,l.loan_number,coalesce(nullif(m.nama_lengkap,''),m.nama_kk) AS customer_name
 FROM public.loan_payments p JOIN public.loans l ON l.id=p.loan_id JOIN public.loan_customers c ON c.id=l.customer_id JOIN public.muzakki m ON m.id=c.person_id
 WHERE (coalesce(p_search,'')='' OR strpos(lower(l.loan_number),lower(trim(p_search)))>0 OR strpos(lower(coalesce(nullif(m.nama_lengkap,''),m.nama_kk)),lower(trim(p_search)))>0)
 AND (coalesce(p_status,'')='' OR p.status=p_status) AND (p_from IS NULL OR p.payment_date>=p_from) AND (p_to IS NULL OR p.payment_date<=p_to)
 ), selected AS (SELECT * FROM filtered ORDER BY payment_date DESC,id DESC LIMIT p_size OFFSET (p_page-1)*p_size)
 SELECT jsonb_build_object('total',(SELECT count(*) FROM filtered),'items',coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.payment_date DESC,s.id DESC),'[]'::jsonb)) INTO result FROM selected s;
 RETURN result;
END; $$;

REVOKE ALL ON FUNCTION public.loan_navigation_loans(TEXT,TEXT,UUID,INTEGER,INTEGER), public.loan_navigation_customers(TEXT,INTEGER,INTEGER), public.loan_navigation_payments(TEXT,TEXT,DATE,DATE,INTEGER,INTEGER) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_navigation_loans(TEXT,TEXT,UUID,INTEGER,INTEGER), public.loan_navigation_customers(TEXT,INTEGER,INTEGER), public.loan_navigation_payments(TEXT,TEXT,DATE,DATE,INTEGER,INTEGER) TO authenticated;
COMMIT;
