BEGIN;
DROP FUNCTION IF EXISTS public.loan_navigation_loans(TEXT,TEXT,UUID,INTEGER,INTEGER);
CREATE OR REPLACE FUNCTION public.loan_navigation_loans(p_search TEXT DEFAULT '', p_status TEXT DEFAULT '', p_category UUID DEFAULT NULL, p_page INTEGER DEFAULT 1, p_size INTEGER DEFAULT 25, p_attention TEXT DEFAULT '')
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB; today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_page IS NULL OR p_page<1 OR p_page>100000 OR p_size IS NULL OR p_size NOT IN (25,50) OR length(coalesce(p_search,''))>120 OR coalesce(p_status,'') NOT IN ('','draft','active','paid','cancelled','needs_reconciliation') OR coalesce(p_attention,'') NOT IN ('','due','overdue','incomplete_draft') THEN RAISE EXCEPTION 'Filter tidak valid' USING ERRCODE='22023'; END IF;
 IF coalesce(p_attention,'')='' THEN
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
  ) ORDER BY s.created_at DESC,s.id DESC),'[]'::jsonb)) INTO result FROM selected s CROSS JOIN LATERAL public.loan_navigation_position(s.id,today) pos;
  RETURN result;
 END IF;
 WITH candidates AS MATERIALIZED (
  SELECT l.id,l.loan_number,l.purpose,l.principal,l.status,l.created_at,l.migration_cutoff,l.planned_disbursement_date,coalesce(nullif(m.nama_lengkap,''),m.nama_kk) AS customer_name,
   pos.remaining,pos.overdue,pos.incomplete,
   CASE WHEN l.status='draft' THEN (SELECT min(i.due_date) FROM public.loan_installments i WHERE i.loan_id=l.id)
    WHEN pos.remaining>0 THEN (SELECT min(i.due_date) FROM public.loan_installments i WHERE i.loan_id=l.id
       AND (SELECT sum(CASE WHEN l.migration_cutoff IS NULL THEN j.amount ELSE j.opening_remaining END) FROM public.loan_installments j WHERE j.loan_id=l.id AND j.installment_number<=i.installment_number)
         > (SELECT coalesce(sum(p.amount),0) FROM public.loan_payments p WHERE p.loan_id=l.id AND p.status='confirmed' AND p.payment_date<=today AND (l.migration_cutoff IS NULL OR p.payment_date>l.migration_cutoff))) ELSE NULL END AS due_date,
   CASE WHEN l.status='draft' AND p_attention='incomplete_draft' THEN public.loan_draft_readiness(l.id,l.planned_disbursement_date) ELSE NULL END AS readiness
  FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id JOIN public.muzakki m ON m.id=c.person_id
  CROSS JOIN LATERAL public.loan_navigation_position(l.id,today) pos
  WHERE (coalesce(p_search,'')='' OR strpos(lower(l.loan_number),lower(trim(p_search)))>0 OR strpos(lower(coalesce(nullif(m.nama_lengkap,''),m.nama_kk)),lower(trim(p_search)))>0)
    AND (coalesce(p_status,'')='' OR l.status=p_status) AND (p_category IS NULL OR l.category_id=p_category)
 ), filtered AS (
  SELECT * FROM candidates s WHERE coalesce(p_attention,'')='' OR
   (p_attention='overdue' AND s.remaining>0 AND s.overdue>0) OR
   (p_attention='incomplete_draft' AND s.status='draft' AND (s.planned_disbursement_date IS NULL OR NOT coalesce((s.readiness->>'person_ok')::boolean,false) OR NOT coalesce((s.readiness->>'schedule_ok')::boolean,false) OR NOT coalesce((s.readiness->>'contract_ok')::boolean,false) OR NOT coalesce((s.readiness->>'guarantor_ok')::boolean,false) OR s.readiness->>'conflict_number' IS NOT NULL OR jsonb_array_length(s.readiness->'policy_reasons')>0)) OR
   (p_attention='due' AND s.remaining>0 AND EXISTS(SELECT 1 FROM public.loan_installments i WHERE i.loan_id=s.id AND i.due_date BETWEEN today AND today+7
    AND (SELECT coalesce(sum(CASE WHEN s.migration_cutoff IS NULL THEN j.amount ELSE j.opening_remaining END),0) FROM public.loan_installments j WHERE j.loan_id=s.id AND j.installment_number<=i.installment_number)
       > (SELECT coalesce(sum(p.amount),0) FROM public.loan_payments p WHERE p.loan_id=s.id AND p.status='confirmed' AND p.payment_date<=today AND (s.migration_cutoff IS NULL OR p.payment_date>s.migration_cutoff))))
 ), selected AS (SELECT * FROM filtered ORDER BY created_at DESC,id DESC LIMIT p_size OFFSET (p_page-1)*p_size)
 SELECT jsonb_build_object('total',(SELECT count(*) FROM filtered),'items',coalesce(jsonb_agg(jsonb_build_object(
  'id',s.id,'loan_number',s.loan_number,'purpose',s.purpose,'principal',s.principal,'status',s.status,'customer_name',s.customer_name,
  'remaining',s.remaining,'overdue',s.overdue,'incomplete',s.incomplete,'due_date',s.due_date
 ) ORDER BY s.created_at DESC,s.id DESC),'[]'::jsonb)) INTO result FROM selected s;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.loan_navigation_loans(TEXT,TEXT,UUID,INTEGER,INTEGER,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_navigation_loans(TEXT,TEXT,UUID,INTEGER,INTEGER,TEXT) TO authenticated;
COMMIT;
