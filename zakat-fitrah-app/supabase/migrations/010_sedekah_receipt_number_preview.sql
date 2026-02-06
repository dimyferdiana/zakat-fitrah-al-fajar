-- ============================================================================
-- Preview next receipt number without incrementing counter
-- ============================================================================

CREATE OR REPLACE FUNCTION public.peek_bukti_sedekah_number(p_category_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_value INTEGER;
    next_value INTEGER;
    prefix TEXT;
BEGIN
    prefix := CASE p_category_key
        WHEN 'infak' THEN 'INF'
        WHEN 'zakat' THEN 'ZKT'
        WHEN 'sahabat quran' THEN 'QRN'
        WHEN 'bank infak' THEN 'BIN'
        WHEN 'santunan yatim dan dhuafa' THEN 'YTM'
        WHEN 'lainnya' THEN 'LAI'
        ELSE 'LAI'
    END;

    SELECT last_number INTO current_value
    FROM public.bukti_sedekah_counters
    WHERE category_key = p_category_key;

    next_value := COALESCE(current_value, 0) + 1;

    RETURN prefix || '/' || LPAD(next_value::TEXT, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.peek_bukti_sedekah_number(TEXT) TO authenticated;
