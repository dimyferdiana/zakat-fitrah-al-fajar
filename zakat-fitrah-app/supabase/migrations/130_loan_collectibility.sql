BEGIN;

-- Absence of any row means disabled; every admin decision is a new version.
CREATE TABLE public.loan_collectibility_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  ranges JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_collectibility_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY loan_collectibility_staff_read ON public.loan_collectibility_versions FOR SELECT TO authenticated USING (public.loan_is_staff());
REVOKE ALL ON public.loan_collectibility_versions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.loan_collectibility_versions TO authenticated;

CREATE FUNCTION public.loan_set_collectibility(p_enabled BOOLEAN,p_ranges JSONB) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item JSONB; expected BIGINT:=0; low BIGINT; high BIGINT; idx INTEGER:=0; n INTEGER; labels TEXT[]:=ARRAY[]::TEXT[]; label TEXT; v_id UUID;
BEGIN
 IF NOT public.loan_is_admin() THEN RAISE EXCEPTION 'Hanya admin dapat mengubah kolektabilitas' USING ERRCODE='42501'; END IF;
 IF p_enabled IS NULL THEN RAISE EXCEPTION 'Status tidak valid'; END IF;
 IF p_enabled OR p_ranges IS NOT NULL THEN
   IF jsonb_typeof(p_ranges) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Rentang kolektabilitas harus berupa daftar'; END IF;
   n:=jsonb_array_length(p_ranges);
   IF n<1 OR n>20 THEN RAISE EXCEPTION 'Masukkan satu sampai dua puluh rentang'; END IF;
   FOR item IN SELECT value FROM jsonb_array_elements(p_ranges) LOOP
     idx:=idx+1;
     IF jsonb_typeof(item)<>'object' OR jsonb_typeof(item->'min') IS DISTINCT FROM 'number'
       OR coalesce(item->>'min','') !~ '^[0-9]{1,9}$' OR jsonb_typeof(item->'label') IS DISTINCT FROM 'string'
       OR length(trim(item->>'label')) NOT BETWEEN 1 AND 60
       OR (item->'max' IS DISTINCT FROM 'null'::jsonb AND (jsonb_typeof(item->'max') IS DISTINCT FROM 'number' OR coalesce(item->>'max','') !~ '^[0-9]{1,9}$')) THEN
       RAISE EXCEPTION 'Label dan batas hari harus valid';
     END IF;
     label:=trim(item->>'label');
     IF lower(label)=ANY(labels) THEN RAISE EXCEPTION 'Label tidak boleh sama'; END IF;
     labels:=array_append(labels,lower(label)); low:=(item->>'min')::BIGINT;
     IF low<>expected THEN RAISE EXCEPTION 'Rentang harus berurutan tanpa celah atau tumpang tindih mulai dari 0'; END IF;
     IF item->'max'='null'::jsonb THEN
       IF idx<>n THEN RAISE EXCEPTION 'Hanya rentang terakhir boleh tanpa batas atas'; END IF;
     ELSE
       high:=(item->>'max')::BIGINT;
       IF high<low OR idx=n THEN RAISE EXCEPTION 'Rentang terakhir harus tanpa batas atas'; END IF;
       expected:=high+1;
     END IF;
   END LOOP;
 ELSIF p_enabled THEN RAISE EXCEPTION 'Aturan harus disetujui sebelum aktivasi';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtext('loan_collectibility_settings'));
 INSERT INTO public.loan_collectibility_versions(enabled,ranges,created_by) VALUES(p_enabled,p_ranges,auth.uid()) RETURNING id INTO v_id;
 INSERT INTO public.loan_audit(actor_id,action,details) VALUES(auth.uid(),'collectibility_policy_created',jsonb_build_object('policy_id',v_id,'enabled',p_enabled,'ranges',p_ranges));
 RETURN v_id;
END; $$;

CREATE FUNCTION public.loan_collectibility_config() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.loan_collectibility_versions%ROWTYPE;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 SELECT * INTO v FROM public.loan_collectibility_versions ORDER BY version DESC LIMIT 1;
 IF NOT FOUND THEN RETURN jsonb_build_object('enabled',false,'version',NULL,'ranges',NULL); END IF;
 RETURN jsonb_build_object('enabled',v.enabled,'version',v.version,'ranges',v.ranges,'created_at',v.created_at,'created_by',v.created_by);
END; $$;

-- Pure classification helper. It does not expose information about a loan.
CREATE FUNCTION public.loan_classify_dpd(p_dpd INTEGER,p_ranges JSONB) RETURNS TEXT
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT r->>'label' FROM jsonb_array_elements(coalesce(p_ranges,'[]'::jsonb)) r
 WHERE p_dpd>=0 AND p_dpd >= (r->>'min')::INTEGER AND ((r->>'max') IS NULL OR p_dpd<=(r->>'max')::INTEGER)
 LIMIT 1
$$;

-- Derived from verified balances, not a manually edited label. Current payment
-- status is used even for past as-of dates; cancellation can change history.
CREATE FUNCTION public.loan_collectibility_status(p_loan UUID,p_asof DATE DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.loans%ROWTYPE; cfg JSONB; paid NUMERIC; total NUMERIC; overdue NUMERIC; oldest DATE; n BIGINT; unknowns BIGINT; balance NUMERIC; dpd INTEGER; base JSONB;
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
 SELECT count(*),count(*) FILTER(WHERE i.opening_remaining IS NULL),sum(CASE WHEN l.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END)
 INTO n,unknowns,total FROM public.loan_installments i WHERE i.loan_id=l.id;
 IF n=0 OR total IS NULL OR (l.migration_cutoff IS NULL AND total<>l.principal)
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

CREATE FUNCTION public.loan_customer_collectibility(p_customer UUID,p_asof DATE DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date) RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE item RECORD; s JSONB; worst JSONB; unknowns INTEGER:=0; cfg JSONB;
BEGIN
 IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.loan_customers WHERE id=p_customer) THEN RAISE EXCEPTION 'Nasabah tidak ditemukan'; END IF;
 cfg:=public.loan_collectibility_config();
 FOR item IN SELECT id FROM public.loans WHERE customer_id=p_customer AND status IN('active','paid','needs_reconciliation') LOOP
   s:=public.loan_collectibility_status(item.id,p_asof);
   IF s->>'state'='unavailable' THEN unknowns:=unknowns+1;
   ELSIF s->>'state'='active' AND (worst IS NULL OR (s->>'dpd')::INTEGER>(worst->>'dpd')::INTEGER) THEN worst:=s; END IF;
 END LOOP;
 IF unknowns>0 THEN RETURN jsonb_build_object('state','unavailable','enabled',cfg->'enabled','version',cfg->'version','as_of',p_asof,'incomplete',unknowns,'label',NULL); END IF;
 IF worst IS NULL THEN RETURN jsonb_build_object('state','no_obligation','enabled',cfg->'enabled','version',cfg->'version','as_of',p_asof,'label',NULL); END IF;
 RETURN worst;
END; $$;

REVOKE ALL ON FUNCTION public.loan_set_collectibility(BOOLEAN,JSONB),public.loan_collectibility_config(),public.loan_classify_dpd(INTEGER,JSONB),public.loan_collectibility_status(UUID,DATE),public.loan_customer_collectibility(UUID,DATE) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_set_collectibility(BOOLEAN,JSONB),public.loan_collectibility_config(),public.loan_collectibility_status(UUID,DATE),public.loan_customer_collectibility(UUID,DATE) TO authenticated;
COMMIT;
