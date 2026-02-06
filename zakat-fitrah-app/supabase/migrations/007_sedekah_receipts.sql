-- ============================================================================
-- Sedekah Receipts
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.bukti_sedekah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL,
    category TEXT NOT NULL,
    category_key TEXT NOT NULL,
    donor_id UUID REFERENCES public.muzakki(id) ON DELETE SET NULL,
    donor_name TEXT NOT NULL,
    donor_address TEXT NOT NULL,
    donor_phone TEXT,
    amount DECIMAL(15,2) NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bukti_sedekah_unique_per_category UNIQUE (category_key, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_bukti_sedekah_category_key ON public.bukti_sedekah(category_key);
CREATE INDEX IF NOT EXISTS idx_bukti_sedekah_tanggal ON public.bukti_sedekah(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_bukti_sedekah_created_by ON public.bukti_sedekah(created_by);

DROP TRIGGER IF EXISTS update_bukti_sedekah_updated_at ON public.bukti_sedekah;
CREATE TRIGGER update_bukti_sedekah_updated_at
    BEFORE UPDATE ON public.bukti_sedekah
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
