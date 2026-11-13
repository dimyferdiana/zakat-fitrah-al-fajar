BEGIN;
CREATE OR REPLACE FUNCTION public.loan_navigation_customers(p_search TEXT DEFAULT '', p_page INTEGER DEFAULT 1, p_size INTEGER DEFAULT 25)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB; today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF p_page IS NULL OR p_page<1 OR p_page>100000 OR p_size IS NULL OR p_size NOT IN (25,50) OR length(coalesce(p_search,''))>120 THEN RAISE EXCEPTION 'Filter tidak valid' USING ERRCODE='22023'; END IF;
 WITH filtered AS (
  SELECT c.id,c.is_active,c.created_at,coalesce(nullif(m.nama_lengkap,''),m.nama_kk) AS name,m.alamat,m.rt,m.rw
  FROM public.loan_customers c JOIN public.muzakki m ON m.id=c.person_id
  WHERE coalesce(p_search,'')='' OR strpos(lower(coalesce(nullif(m.nama_lengkap,''),m.nama_kk)),lower(trim(p_search)))>0 OR strpos(lower(c.id::text),lower(trim(p_search)))>0
 ), selected AS (SELECT * FROM filtered ORDER BY created_at DESC,id DESC LIMIT p_size OFFSET (p_page-1)*p_size)
 SELECT jsonb_build_object('total',(SELECT count(*) FROM filtered),'items',coalesce(jsonb_agg(
  (to_jsonb(s)-'created_at') || jsonb_build_object('obligations', o.total, 'remaining', o.remaining, 'incomplete', o.incomplete)
  ORDER BY s.created_at DESC,s.id DESC),'[]'::jsonb)) INTO result
 FROM selected s CROSS JOIN LATERAL (
  SELECT count(*) AS total, sum(pos.remaining) AS remaining, count(*) FILTER (WHERE pos.remaining IS NULL OR pos.incomplete) AS incomplete
  FROM public.loans l CROSS JOIN LATERAL public.loan_navigation_position(l.id,today) pos
  WHERE l.customer_id=s.id AND l.status IN ('active','needs_reconciliation')
 ) o;
 RETURN result;
END; $$;
COMMIT;
