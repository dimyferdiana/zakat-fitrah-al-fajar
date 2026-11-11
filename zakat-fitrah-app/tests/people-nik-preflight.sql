-- Read-only aggregate: never returns NIK values or person records.
SELECT count(*) FILTER (WHERE nik IS NOT NULL AND nik !~ '^[0-9]{16}$') AS invalid_nik_rows,
  (SELECT coalesce(sum(n - 1), 0) FROM (SELECT count(*) AS n FROM public.muzakki WHERE nik IS NOT NULL GROUP BY nik HAVING count(*) > 1) duplicate_groups) AS duplicate_nik_rows
FROM public.muzakki;
