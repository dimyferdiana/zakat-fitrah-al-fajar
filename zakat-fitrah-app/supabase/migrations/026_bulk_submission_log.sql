-- =========================================
-- BULK SUBMISSION LOG + MAAL_BERAS ENUM
-- =========================================
-- Adds maal_beras kategori for pemasukan_beras and creates
-- bulk_submission_logs table for audit trail of bulk submissions.

BEGIN;

-- Add maal_beras to pemasukan_beras_kategori enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'maal_beras'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'pemasukan_beras_kategori'
      )
  ) THEN
    ALTER TYPE public.pemasukan_beras_kategori ADD VALUE 'maal_beras';
  END IF;
END;
$$;

-- Also ensure zakat_fitrah_beras is present (earlier migration may have only had infak_sedekah_beras)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'zakat_fitrah_beras'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'pemasukan_beras_kategori'
      )
  ) THEN
    ALTER TYPE public.pemasukan_beras_kategori ADD VALUE 'zakat_fitrah_beras';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'fidyah_beras'
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'pemasukan_beras_kategori'
      )
  ) THEN
    ALTER TYPE public.pemasukan_beras_kategori ADD VALUE 'fidyah_beras';
  END IF;
END;
$$;

-- =========================================
-- BULK SUBMISSION LOGS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.bulk_submission_logs (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id    UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tahun_zakat_id UUID         NOT NULL REFERENCES public.tahun_zakat(id) ON DELETE CASCADE,
  receipt_no     TEXT         NOT NULL UNIQUE,
  row_count      INT          NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.bulk_submission_logs IS
  'Audit trail for bulk transaction submissions. One row per bulk submission event.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bulk_submission_logs_operator
  ON public.bulk_submission_logs(operator_id);

CREATE INDEX IF NOT EXISTS idx_bulk_submission_logs_tahun_zakat
  ON public.bulk_submission_logs(tahun_zakat_id);

CREATE INDEX IF NOT EXISTS idx_bulk_submission_logs_created_at
  ON public.bulk_submission_logs(created_at DESC);

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.bulk_submission_logs ENABLE ROW LEVEL SECURITY;

-- Admin: full CRUD
DROP POLICY IF EXISTS "Admin full access on bulk_submission_logs" ON public.bulk_submission_logs;
CREATE POLICY "Admin full access on bulk_submission_logs"
  ON public.bulk_submission_logs
  FOR ALL
  TO authenticated
  USING (
    public.get_current_user_role() = 'admin'
    AND public.get_current_user_is_active() = true
  )
  WITH CHECK (
    public.get_current_user_role() = 'admin'
    AND public.get_current_user_is_active() = true
  );

-- Petugas: insert own rows
DROP POLICY IF EXISTS "Petugas can insert bulk_submission_logs" ON public.bulk_submission_logs;
CREATE POLICY "Petugas can insert bulk_submission_logs"
  ON public.bulk_submission_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active() = true
    AND operator_id = auth.uid()
  );

-- Petugas: read own rows only
DROP POLICY IF EXISTS "Petugas can read own bulk_submission_logs" ON public.bulk_submission_logs;
CREATE POLICY "Petugas can read own bulk_submission_logs"
  ON public.bulk_submission_logs
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active() = true
    AND operator_id = auth.uid()
  );

COMMIT;
