-- Validation Script for tasks 6.3, 6.4, 6.5
-- Run on production/staging DB with privileged role.

-- ================================================================
-- 6.3 Verify no orphan account linkage on transaction tables
-- ================================================================

SELECT '6.3_pembayaran_zakat_orphan_account' AS check_name,
       COUNT(*)::bigint AS issue_count
FROM public.pembayaran_zakat pz
LEFT JOIN public.accounts a ON a.id = pz.account_id
WHERE pz.account_id IS NULL OR a.id IS NULL
UNION ALL
SELECT '6.3_pemasukan_uang_orphan_account',
       COUNT(*)::bigint
FROM public.pemasukan_uang pu
LEFT JOIN public.accounts a ON a.id = pu.account_id
WHERE pu.account_id IS NULL OR a.id IS NULL
UNION ALL
SELECT '6.3_pemasukan_beras_orphan_account',
       COUNT(*)::bigint
FROM public.pemasukan_beras pb
LEFT JOIN public.accounts a ON a.id = pb.account_id
WHERE pb.account_id IS NULL OR a.id IS NULL
UNION ALL
SELECT '6.3_rekonsiliasi_orphan_account',
       COUNT(*)::bigint
FROM public.rekonsiliasi rk
LEFT JOIN public.accounts a ON a.id = rk.account_id
WHERE rk.account_id IS NULL OR a.id IS NULL;

-- ================================================================
-- 6.4 Verify required RLS policies exist for accounts/ledger
-- ================================================================

WITH expected(policy_name) AS (
  VALUES
    ('accounts_select_admin_bendahara_petugas_active'),
    ('accounts_insert_admin_bendahara_active'),
    ('accounts_update_admin_bendahara_active'),
    ('accounts_delete_admin_bendahara_active'),
    ('account_ledger_entries_select_admin_bendahara_petugas_active'),
    ('account_ledger_entries_insert_admin_bendahara_active'),
    ('account_ledger_entries_update_admin_bendahara_active'),
    ('account_ledger_entries_delete_admin_bendahara_active')
)
SELECT '6.4_missing_rls_policy' AS check_name,
       e.policy_name AS issue_key
FROM expected e
LEFT JOIN pg_policies p
  ON p.schemaname = 'public'
 AND p.policyname = e.policy_name
WHERE p.policyname IS NULL;

-- ================================================================
-- 6.5 Consistency checks (ledger vs summary sources)
-- ================================================================

-- 6.5.a Ledger internal consistency per account:
-- latest running balance should equal net mutation sum.
WITH ledger_net AS (
  SELECT
    account_id,
    SUM(
      CASE entry_type
        WHEN 'IN' THEN amount_rp
        WHEN 'OUT' THEN -amount_rp
        ELSE 0
      END
    )::numeric(18,2) AS net_mutation_rp
  FROM public.account_ledger_entries
  GROUP BY account_id
),
ledger_latest AS (
  SELECT DISTINCT ON (account_id)
    account_id,
    COALESCE(running_balance_after_rp, 0)::numeric(18,2) AS latest_balance_rp
  FROM public.account_ledger_entries
  ORDER BY account_id, entry_date DESC, created_at DESC
)
SELECT
  '6.5_account_balance_mismatch' AS check_name,
  ln.account_id::text AS issue_key,
  ln.net_mutation_rp,
  ll.latest_balance_rp,
  (ln.net_mutation_rp - ll.latest_balance_rp)::numeric(18,2) AS diff_rp
FROM ledger_net ln
JOIN ledger_latest ll USING (account_id)
WHERE ABS(ln.net_mutation_rp - ll.latest_balance_rp) > 0.01;

-- 6.5.b New-flow uang consistency by tahun:
-- pemasukan_uang + rekonsiliasi( uang ) must match linked ledger amounts.
WITH uang_source AS (
  SELECT tahun_zakat_id, SUM(jumlah_uang_rp)::numeric(18,2) AS source_amount_rp
  FROM public.pemasukan_uang
  GROUP BY tahun_zakat_id
),
rekonsiliasi_source AS (
  SELECT tahun_zakat_id, SUM(jumlah_uang_rp)::numeric(18,2) AS source_amount_rp
  FROM public.rekonsiliasi
  WHERE jenis = 'uang'
  GROUP BY tahun_zakat_id
),
ledger_uang AS (
  SELECT
    COALESCE(pu.tahun_zakat_id, rk.tahun_zakat_id) AS tahun_zakat_id,
    SUM(ale.amount_rp)::numeric(18,2) AS ledger_amount_rp
  FROM public.account_ledger_entries ale
  LEFT JOIN public.pemasukan_uang pu ON pu.id = ale.source_pemasukan_uang_id
  LEFT JOIN public.rekonsiliasi rk ON rk.id = ale.source_rekonsiliasi_id
  WHERE ale.source_pemasukan_uang_id IS NOT NULL
     OR ale.source_rekonsiliasi_id IS NOT NULL
  GROUP BY COALESCE(pu.tahun_zakat_id, rk.tahun_zakat_id)
),
expected_uang AS (
  SELECT
    COALESCE(u.tahun_zakat_id, r.tahun_zakat_id) AS tahun_zakat_id,
    COALESCE(u.source_amount_rp, 0) + COALESCE(r.source_amount_rp, 0) AS expected_amount_rp
  FROM uang_source u
  FULL OUTER JOIN rekonsiliasi_source r ON r.tahun_zakat_id = u.tahun_zakat_id
)
SELECT
  '6.5_uang_source_vs_ledger_mismatch' AS check_name,
  eu.tahun_zakat_id::text AS issue_key,
  eu.expected_amount_rp,
  COALESCE(lu.ledger_amount_rp, 0) AS ledger_amount_rp,
  (eu.expected_amount_rp - COALESCE(lu.ledger_amount_rp, 0))::numeric(18,2) AS diff_rp
FROM expected_uang eu
LEFT JOIN ledger_uang lu ON lu.tahun_zakat_id = eu.tahun_zakat_id
WHERE ABS(eu.expected_amount_rp - COALESCE(lu.ledger_amount_rp, 0)) > 0.01;

-- 6.5.c New-flow beras consistency (converted to Rp by nilai_beras_kg):
WITH beras_source AS (
  SELECT
    pb.tahun_zakat_id,
    SUM(pb.jumlah_beras_kg * tz.nilai_beras_kg)::numeric(18,2) AS source_amount_rp
  FROM public.pemasukan_beras pb
  JOIN public.tahun_zakat tz ON tz.id = pb.tahun_zakat_id
  GROUP BY pb.tahun_zakat_id
),
ledger_beras AS (
  SELECT
    pb.tahun_zakat_id,
    SUM(ale.amount_rp)::numeric(18,2) AS ledger_amount_rp
  FROM public.account_ledger_entries ale
  JOIN public.pemasukan_beras pb ON pb.id = ale.source_pemasukan_beras_id
  GROUP BY pb.tahun_zakat_id
)
SELECT
  '6.5_beras_source_vs_ledger_mismatch' AS check_name,
  bs.tahun_zakat_id::text AS issue_key,
  bs.source_amount_rp,
  COALESCE(lb.ledger_amount_rp, 0) AS ledger_amount_rp,
  (bs.source_amount_rp - COALESCE(lb.ledger_amount_rp, 0))::numeric(18,2) AS diff_rp
FROM beras_source bs
LEFT JOIN ledger_beras lb ON lb.tahun_zakat_id = bs.tahun_zakat_id
WHERE ABS(bs.source_amount_rp - COALESCE(lb.ledger_amount_rp, 0)) > 0.01;
