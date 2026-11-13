BEGIN;
CREATE OR REPLACE FUNCTION public.loan_navigation_overview()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result JSONB; today DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 WITH positions AS MATERIALIZED (
   SELECT l.id,l.loan_number,l.status,l.created_at,l.migration_cutoff,coalesce(nullif(m.nama_lengkap,''),m.nama_kk) AS name,
     pos.remaining,pos.overdue,(pos.incomplete OR l.historical_incomplete) AS incomplete
   FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id JOIN public.muzakki m ON m.id=c.person_id
   CROSS JOIN LATERAL public.loan_navigation_position(l.id,today) pos
 ), overdue_rows AS (SELECT * FROM positions WHERE remaining>0 AND overdue>0),
 draft_rows AS (SELECT pos.* FROM positions pos JOIN public.loans l ON l.id=pos.id
   CROSS JOIN LATERAL (SELECT CASE WHEN pos.status='draft' THEN public.loan_draft_readiness(pos.id,l.planned_disbursement_date) END AS value) r
   CROSS JOIN LATERAL (SELECT r.value AS readiness) q
   WHERE pos.status='draft' AND (l.planned_disbursement_date IS NULL OR NOT coalesce((readiness->>'person_ok')::boolean,false)
    OR NOT coalesce((readiness->>'schedule_ok')::boolean,false) OR NOT coalesce((readiness->>'contract_ok')::boolean,false)
    OR NOT coalesce((readiness->>'guarantor_ok')::boolean,false) OR readiness->>'conflict_number' IS NOT NULL
    OR jsonb_array_length(readiness->'policy_reasons')>0)),
 pending_rows AS (SELECT p.id,p.loan_id,p.amount,p.created_at,l.loan_number,coalesce(nullif(m.nama_lengkap,''),m.nama_kk) AS name
   FROM public.loan_payments p JOIN public.loans l ON l.id=p.loan_id JOIN public.loan_customers c ON c.id=l.customer_id JOIN public.muzakki m ON m.id=c.person_id WHERE p.status='pending'),
 due_rows AS (
   SELECT DISTINCT pos.id,pos.loan_number,pos.name
   FROM positions pos JOIN public.loan_installments i ON i.loan_id=pos.id
   WHERE pos.remaining>0 AND i.due_date BETWEEN today AND today+7
    AND (SELECT coalesce(sum(CASE WHEN pos.migration_cutoff IS NULL THEN j.amount ELSE j.opening_remaining END),0) FROM public.loan_installments j WHERE j.loan_id=pos.id AND j.installment_number<=i.installment_number)
       > (SELECT coalesce(sum(p.amount),0) FROM public.loan_payments p WHERE p.loan_id=pos.id AND p.status='confirmed' AND p.payment_date<=today AND (pos.migration_cutoff IS NULL OR p.payment_date>pos.migration_cutoff))
 )
 SELECT jsonb_build_object(
  'as_of',today,'remaining',coalesce((SELECT sum(remaining) FROM positions),0),
  'overdue',coalesce((SELECT sum(overdue) FROM positions),0), 'active',(SELECT count(*) FROM positions WHERE remaining>0),
  'incomplete',(SELECT count(*) FROM positions WHERE incomplete),'pending_count',(SELECT count(*) FROM pending_rows),
  'pending',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM (SELECT id,loan_id,loan_number,name,amount FROM pending_rows ORDER BY created_at,id LIMIT 5) s),'[]'::jsonb),
  'overdue_count',(SELECT count(*) FROM overdue_rows), 'overdue_items',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM (SELECT id,loan_number,name,overdue FROM overdue_rows ORDER BY overdue DESC,id LIMIT 5) s),'[]'::jsonb),
  'draft_count',(SELECT count(*) FROM draft_rows), 'drafts',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM (SELECT id,loan_number,name FROM draft_rows ORDER BY created_at DESC,id DESC LIMIT 5) s),'[]'::jsonb),
  'due_count',(SELECT count(*) FROM due_rows), 'due',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM (SELECT id,loan_number,name FROM due_rows ORDER BY loan_number,id LIMIT 5) s),'[]'::jsonb)
 ) INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.loan_navigation_overview() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_navigation_overview() TO authenticated;
COMMIT;
