-- Read-only metadata inventory. Does not read or return personal/financial rows.
SELECT jsonb_build_object(
  'unprotected_tables', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('name', c.relname,
      'anon_select', has_table_privilege('anon', c.oid, 'SELECT'),
      'authenticated_select', has_table_privilege('authenticated', c.oid, 'SELECT')) ORDER BY c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity
      AND (has_table_privilege('anon', c.oid, 'SELECT') OR has_table_privilege('authenticated', c.oid, 'SELECT'))
  ), '[]'::jsonb),
  'views', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('name', c.relname,
      'security_invoker', COALESCE(c.reloptions @> ARRAY['security_invoker=true'], false),
      'anon_select', has_table_privilege('anon', c.oid, 'SELECT'),
      'authenticated_select', has_table_privilege('authenticated', c.oid, 'SELECT')) ORDER BY c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm')
      AND (has_table_privilege('anon', c.oid, 'SELECT') OR has_table_privilege('authenticated', c.oid, 'SELECT'))
  ), '[]'::jsonb),
  'security_definer_functions', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('name', p.proname, 'arguments', pg_get_function_identity_arguments(p.oid),
      'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
      'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE')) ORDER BY p.proname, p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
      AND (has_function_privilege('anon', p.oid, 'EXECUTE') OR has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  ), '[]'::jsonb),
  'storage_buckets', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'public', public) ORDER BY id) FROM storage.buckets), '[]'::jsonb)
) AS inventory;
