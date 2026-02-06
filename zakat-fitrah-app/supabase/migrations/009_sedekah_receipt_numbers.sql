-- ============================================================================
-- Auto Numbering for Sedekah Receipts (per category)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bukti_sedekah_counters (
    category_key TEXT PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bukti_sedekah_counters_updated_at
    ON public.bukti_sedekah_counters(updated_at DESC);

DROP TRIGGER IF EXISTS update_bukti_sedekah_counters_updated_at ON public.bukti_sedekah_counters;
CREATE TRIGGER update_bukti_sedekah_counters_updated_at
    BEFORE UPDATE ON public.bukti_sedekah_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.bukti_sedekah_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.next_bukti_sedekah_number(p_category_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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

    INSERT INTO public.bukti_sedekah_counters (category_key, last_number)
    VALUES (p_category_key, 1)
    ON CONFLICT (category_key)
    DO UPDATE SET last_number = public.bukti_sedekah_counters.last_number + 1
    RETURNING last_number INTO next_value;

    RETURN prefix || '/' || LPAD(next_value::TEXT, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_bukti_sedekah_number(TEXT) TO authenticated;
