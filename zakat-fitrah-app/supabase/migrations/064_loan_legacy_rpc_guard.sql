BEGIN;

-- The legacy SECURITY DEFINER functions bypass table RLS; require an active
-- existing staff profile so a loan-only customer cannot read or increment them.
CREATE OR REPLACE FUNCTION public.next_bukti_sedekah_number(p_category_key TEXT) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE next_value INTEGER; prefix TEXT;
BEGIN
  IF NOT public.loan_has_active_legacy_profile() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  prefix := CASE p_category_key WHEN 'infak' THEN 'INF' WHEN 'zakat' THEN 'ZKT'
    WHEN 'sahabat quran' THEN 'QRN' WHEN 'bank infak' THEN 'BIN'
    WHEN 'santunan yatim dan dhuafa' THEN 'YTM' ELSE 'LAI' END;
  INSERT INTO public.bukti_sedekah_counters(category_key, last_number) VALUES (p_category_key, 1)
    ON CONFLICT (category_key) DO UPDATE SET last_number = public.bukti_sedekah_counters.last_number + 1
    RETURNING last_number INTO next_value;
  RETURN prefix || '/' || lpad(next_value::text, 6, '0');
END;
$$;
CREATE OR REPLACE FUNCTION public.peek_bukti_sedekah_number(p_category_key TEXT) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_value INTEGER; prefix TEXT;
BEGIN
  IF NOT public.loan_has_active_legacy_profile() THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  prefix := CASE p_category_key WHEN 'infak' THEN 'INF' WHEN 'zakat' THEN 'ZKT'
    WHEN 'sahabat quran' THEN 'QRN' WHEN 'bank infak' THEN 'BIN'
    WHEN 'santunan yatim dan dhuafa' THEN 'YTM' ELSE 'LAI' END;
  SELECT last_number INTO current_value FROM public.bukti_sedekah_counters WHERE category_key = p_category_key;
  RETURN prefix || '/' || lpad((coalesce(current_value, 0) + 1)::text, 6, '0');
END;
$$;
REVOKE ALL ON FUNCTION public.next_bukti_sedekah_number(TEXT), public.peek_bukti_sedekah_number(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_bukti_sedekah_number(TEXT), public.peek_bukti_sedekah_number(TEXT) TO authenticated;

-- Supabase default grants can explicitly grant anon in addition to PUBLIC.
DO $$
DECLARE fn RECORD;
BEGIN
  FOR fn IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname LIKE 'loan\_%' ESCAPE '\'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn.signature);
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.loan_is_staff(), public.loan_is_owner(UUID), public.loan_has_active_legacy_profile() TO authenticated;

-- This guards authenticated API access. It cannot make an existing public
-- bucket private or revoke its public object URLs; that requires separate work.
CREATE POLICY loan_guard_bukti_bayar_read ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
  USING (bucket_id <> 'bukti-bayar' OR public.loan_has_active_legacy_profile());
COMMIT;
