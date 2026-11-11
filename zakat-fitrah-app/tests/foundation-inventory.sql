-- Read-only catalog inventory: no personal records, transaction values or credentials.
SELECT jsonb_build_object(
  'server_version', current_setting('server_version'),
  'tables', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', n.nspname, 'name', c.relname,
      'rls', c.relrowsecurity, 'force_rls', c.relforcerowsecurity) ORDER BY n.nspname, c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')), '[]'::jsonb),
  'identity_columns', COALESCE((SELECT jsonb_agg(jsonb_build_object('table', table_name, 'column', column_name,
      'type', data_type, 'nullable', is_nullable) ORDER BY table_name, ordinal_position)
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('muzakki', 'mustahik', 'users', 'accounts')), '[]'::jsonb),
  'loan_candidates', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', table_schema, 'table', table_name,
      'column', column_name, 'type', data_type) ORDER BY table_schema, table_name, ordinal_position)
    FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'auth', 'storage', 'realtime', 'extensions', 'graphql', 'graphql_public', 'supabase_migrations', 'vault')
      AND (table_name ~* '(pinjam|hutang|utang|piutang|loan|angsuran|cicilan|kredit|debt)' OR column_name ~* '(pinjam|hutang|utang|piutang|loan|angsuran|cicilan|kredit|debt)')), '[]'::jsonb),
  'foreign_keys', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', con.conname,
      'table', src.relname, 'target', dst.relname, 'definition', pg_get_constraintdef(con.oid), 'on_delete', con.confdeltype)
      ORDER BY src.relname, con.conname)
    FROM pg_constraint con JOIN pg_class src ON src.oid = con.conrelid JOIN pg_namespace n ON n.oid = src.relnamespace
    JOIN pg_class dst ON dst.oid = con.confrelid
    WHERE n.nspname = 'public' AND con.contype = 'f' AND (con.confdeltype = 'c' OR src.relname IN ('muzakki', 'mustahik') OR dst.relname IN ('muzakki', 'mustahik'))), '[]'::jsonb),
  'policies', COALESCE((SELECT jsonb_agg(jsonb_build_object('schema', schemaname, 'table', tablename, 'name', policyname,
      'permissive', permissive, 'roles', roles, 'command', cmd, 'using', qual, 'check', with_check)
      ORDER BY schemaname, tablename, policyname)
    FROM pg_policies WHERE schemaname IN ('public', 'storage')), '[]'::jsonb),
  'views', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', c.relname, 'kind', c.relkind,
      'security_invoker', COALESCE(c.reloptions @> ARRAY['security_invoker=true'], false),
      'anon_select', has_table_privilege('anon', c.oid, 'SELECT'),
      'authenticated_select', has_table_privilege('authenticated', c.oid, 'SELECT')) ORDER BY c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm')), '[]'::jsonb),
  'functions', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', p.proname,
      'arguments', pg_get_function_identity_arguments(p.oid), 'security_definer', p.prosecdef,
      'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
      'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE')) ORDER BY p.proname, p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'), '[]'::jsonb),
  'role_values', COALESCE((SELECT jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_role'), '[]'::jsonb),
  'buckets', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'public', public) ORDER BY id) FROM storage.buckets), '[]'::jsonb)
) AS inventory;
