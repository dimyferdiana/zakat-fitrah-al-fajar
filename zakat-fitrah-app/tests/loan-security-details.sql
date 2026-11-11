-- Read-only database object definitions, never personal or transaction rows.
SELECT jsonb_build_object(
  'receipt_functions', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('name', p.proname, 'definition', pg_get_functiondef(p.oid)) ORDER BY p.proname)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('next_bukti_sedekah_number', 'peek_bukti_sedekah_number')
  ), '[]'::jsonb),
  'storage_policies', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('name', policyname, 'command', cmd, 'roles', roles,
      'using', qual, 'check', with_check) ORDER BY policyname)
    FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
  ), '[]'::jsonb),
  'account_view', (SELECT pg_get_viewdef(c.oid, true) FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'account_latest_balances')
) AS inventory;
