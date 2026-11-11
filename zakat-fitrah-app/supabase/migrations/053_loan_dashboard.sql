BEGIN;

-- Current position only. Historical reports need transaction-version history and
-- are intentionally not inferred from today's status or cancelled payments.
CREATE FUNCTION public.loan_dashboard_current() RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result JSONB;
BEGIN
  IF NOT public.loan_is_staff() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  WITH base AS (
    SELECT l.id, l.customer_id, l.principal, l.category_id, l.region_snapshot,
      l.migration_cutoff, l.opening_balance,
      COALESCE((SELECT sum(p.amount) FROM public.loan_payments p
        WHERE p.loan_id = l.id AND p.status = 'confirmed'
          AND p.payment_date <= (now() AT TIME ZONE 'Asia/Jakarta')::date
          AND (l.migration_cutoff IS NULL OR p.payment_date > l.migration_cutoff)), 0) AS paid,
      (SELECT count(*) FROM public.loan_installments i WHERE i.loan_id = l.id) AS installment_count,
      (SELECT count(*) FROM public.loan_installments i WHERE i.loan_id = l.id AND i.opening_remaining IS NULL) AS unknown_count
    FROM public.loans l WHERE l.status = 'active'
  ), installments AS (
    SELECT b.id, i.due_date, CASE WHEN b.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END AS starting,
      b.paid, sum(CASE WHEN b.migration_cutoff IS NULL THEN i.amount ELSE i.opening_remaining END)
        OVER (PARTITION BY b.id ORDER BY i.installment_number ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS earlier
    FROM base b JOIN public.loan_installments i ON i.loan_id = b.id
  ), positions AS (
    SELECT b.id, b.customer_id, b.principal, b.category_id, b.region_snapshot,
      CASE WHEN b.installment_count = 0 OR (b.migration_cutoff IS NOT NULL AND b.unknown_count > 0)
             OR (b.migration_cutoff IS NULL AND b.principal <> sum(i.starting))
             OR (b.migration_cutoff IS NOT NULL AND (b.opening_balance IS NULL OR b.opening_balance <> sum(i.starting)))
             OR b.paid > sum(i.starting)
        THEN NULL ELSE sum(i.starting) - b.paid END AS remaining,
      CASE WHEN b.installment_count = 0 OR (b.migration_cutoff IS NOT NULL AND b.unknown_count > 0)
             OR (b.migration_cutoff IS NULL AND b.principal <> sum(i.starting))
             OR (b.migration_cutoff IS NOT NULL AND (b.opening_balance IS NULL OR b.opening_balance <> sum(i.starting)))
             OR b.paid > sum(i.starting)
        THEN NULL ELSE sum(CASE WHEN i.due_date < (now() AT TIME ZONE 'Asia/Jakarta')::date
          THEN greatest(0, i.starting - greatest(0, b.paid - coalesce(i.earlier, 0))) ELSE 0 END) END AS overdue
    FROM base b LEFT JOIN installments i ON i.id = b.id
    GROUP BY b.id, b.customer_id, b.principal, b.category_id, b.region_snapshot, b.installment_count, b.migration_cutoff, b.unknown_count, b.opening_balance, b.paid
  ), categories AS (
    SELECT coalesce(c.name, 'Belum dikategorikan') AS name, count(*) AS loans,
      coalesce(sum(p.principal), 0) AS principal, coalesce(sum(p.remaining), 0) AS remaining,
      count(*) FILTER (WHERE p.remaining IS NULL) AS incomplete
    FROM positions p LEFT JOIN public.loan_categories c ON c.id = p.category_id GROUP BY c.name
  ), regions AS (
    SELECT coalesce(nullif(trim(p.region_snapshot->>'rt'), ''), 'Tidak diketahui') AS rt,
      coalesce(nullif(trim(p.region_snapshot->>'rw'), ''), 'Tidak diketahui') AS rw,
      count(*) AS loans, coalesce(sum(p.principal), 0) AS principal,
      coalesce(sum(p.remaining), 0) AS remaining, count(*) FILTER (WHERE p.remaining IS NULL) AS incomplete
    FROM positions p GROUP BY 1, 2
  ), customers AS (
    SELECT p.id, p.customer_id, coalesce(m.nama_lengkap, m.nama_kk, 'Nama belum tersedia') AS name,
      coalesce(nullif(trim(p.region_snapshot->>'alamat'), ''), 'Alamat belum tersedia') AS address,
      p.principal, p.remaining, p.overdue
    FROM positions p JOIN public.loan_customers c ON c.id = p.customer_id JOIN public.muzakki m ON m.id = c.person_id
    ORDER BY p.principal DESC, p.id LIMIT 20
  )
  SELECT jsonb_build_object(
    'as_of', (now() AT TIME ZONE 'Asia/Jakarta')::date,
    'active_loans', (SELECT count(*) FROM positions),
    'active_customers', (SELECT count(DISTINCT customer_id) FROM positions),
    'principal', (SELECT coalesce(sum(principal), 0) FROM positions),
    'remaining', (SELECT coalesce(sum(remaining), 0) FROM positions),
    'overdue', (SELECT coalesce(sum(overdue), 0) FROM positions),
    'incomplete', (SELECT count(*) FROM positions WHERE remaining IS NULL),
    'categories', (SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.principal DESC), '[]'::jsonb) FROM categories c),
    'regions', (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.principal DESC), '[]'::jsonb) FROM regions r),
    'customers', (SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.principal DESC), '[]'::jsonb) FROM customers c)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.loan_dashboard_current() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.loan_dashboard_current() TO authenticated;
COMMIT;
