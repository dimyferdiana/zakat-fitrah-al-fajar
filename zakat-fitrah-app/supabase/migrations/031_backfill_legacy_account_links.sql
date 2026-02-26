-- =========================================
-- COMPATIBILITY: LINK LEGACY ROWS TO ACCOUNTS
-- =========================================

BEGIN;

-- Add account_id to legacy transaction tables (safe/idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pembayaran_zakat'
  ) THEN
    ALTER TABLE public.pembayaran_zakat
      ADD COLUMN IF NOT EXISTS account_id UUID;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'pembayaran_zakat_account_id_fkey'
    ) THEN
      ALTER TABLE public.pembayaran_zakat
        ADD CONSTRAINT pembayaran_zakat_account_id_fkey
        FOREIGN KEY (account_id)
        REFERENCES public.accounts(id)
        ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_pembayaran_zakat_account_id
      ON public.pembayaran_zakat(account_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pemasukan_uang'
  ) THEN
    ALTER TABLE public.pemasukan_uang
      ADD COLUMN IF NOT EXISTS account_id UUID;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'pemasukan_uang_account_id_fkey'
    ) THEN
      ALTER TABLE public.pemasukan_uang
        ADD CONSTRAINT pemasukan_uang_account_id_fkey
        FOREIGN KEY (account_id)
        REFERENCES public.accounts(id)
        ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_pemasukan_uang_account_id
      ON public.pemasukan_uang(account_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pemasukan_beras'
  ) THEN
    ALTER TABLE public.pemasukan_beras
      ADD COLUMN IF NOT EXISTS account_id UUID;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'pemasukan_beras_account_id_fkey'
    ) THEN
      ALTER TABLE public.pemasukan_beras
        ADD CONSTRAINT pemasukan_beras_account_id_fkey
        FOREIGN KEY (account_id)
        REFERENCES public.accounts(id)
        ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_pemasukan_beras_account_id
      ON public.pemasukan_beras(account_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rekonsiliasi'
  ) THEN
    ALTER TABLE public.rekonsiliasi
      ADD COLUMN IF NOT EXISTS account_id UUID;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'rekonsiliasi_account_id_fkey'
    ) THEN
      ALTER TABLE public.rekonsiliasi
        ADD CONSTRAINT rekonsiliasi_account_id_fkey
        FOREIGN KEY (account_id)
        REFERENCES public.accounts(id)
        ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_rekonsiliasi_account_id
      ON public.rekonsiliasi(account_id);
  END IF;
END;
$$;

-- Backfill payment records
WITH mapped_accounts AS (
  SELECT
    (array_agg(id ORDER BY id) FILTER (WHERE account_name = 'KAS'))[1] AS kas_id,
    (array_agg(id ORDER BY id) FILTER (WHERE account_name = 'BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT'))[1] AS bca_zakat_id,
    (array_agg(id ORDER BY id) FILTER (WHERE account_name = 'BCA-SYARIAH : MPZ LAZ AL FAJAR INFAK'))[1] AS bca_infak_id
  FROM public.accounts
)
UPDATE public.pembayaran_zakat pz
SET account_id = COALESCE(
  CASE
    WHEN pz.akun_uang::text = 'bank' THEN ma.bca_zakat_id
    WHEN pz.akun_uang::text = 'kas' THEN ma.kas_id
    ELSE ma.kas_id
  END,
  ma.kas_id
)
FROM mapped_accounts ma
WHERE pz.account_id IS NULL
  AND ma.kas_id IS NOT NULL;

-- Backfill pemasukan_uang records
WITH mapped_accounts AS (
  SELECT
    (array_agg(id ORDER BY id) FILTER (WHERE account_name = 'KAS'))[1] AS kas_id,
    (array_agg(id ORDER BY id) FILTER (WHERE account_name = 'BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT'))[1] AS bca_zakat_id,
    (array_agg(id ORDER BY id) FILTER (WHERE account_name = 'BCA-SYARIAH : MPZ LAZ AL FAJAR INFAK'))[1] AS bca_infak_id
  FROM public.accounts
)
UPDATE public.pemasukan_uang pu
SET account_id = COALESCE(
  CASE
    WHEN pu.akun::text = 'bank' AND pu.kategori::text = 'infak_sedekah_uang' THEN ma.bca_infak_id
    WHEN pu.akun::text = 'bank' THEN ma.bca_zakat_id
    WHEN pu.akun::text = 'kas' THEN ma.kas_id
    ELSE ma.kas_id
  END,
  ma.kas_id
)
FROM mapped_accounts ma
WHERE pu.account_id IS NULL
  AND ma.kas_id IS NOT NULL;

-- Backfill pemasukan_beras records (fallback to KAS)
WITH mapped_accounts AS (
  SELECT (array_agg(id ORDER BY id) FILTER (WHERE account_name = 'KAS'))[1] AS kas_id
  FROM public.accounts
)
UPDATE public.pemasukan_beras pb
SET account_id = ma.kas_id
FROM mapped_accounts ma
WHERE pb.account_id IS NULL
  AND ma.kas_id IS NOT NULL;

-- Backfill rekonsiliasi records
WITH mapped_accounts AS (
  SELECT
    (array_agg(id ORDER BY id) FILTER (WHERE account_name = 'KAS'))[1] AS kas_id,
    (array_agg(id ORDER BY id) FILTER (WHERE account_name = 'BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT'))[1] AS bca_zakat_id
  FROM public.accounts
)
UPDATE public.rekonsiliasi rk
SET account_id = COALESCE(
  CASE
    WHEN rk.jenis::text = 'uang' AND rk.akun::text = 'bank' THEN ma.bca_zakat_id
    WHEN rk.jenis::text = 'uang' AND rk.akun::text = 'kas' THEN ma.kas_id
    ELSE ma.kas_id
  END,
  ma.kas_id
)
FROM mapped_accounts ma
WHERE rk.account_id IS NULL
  AND ma.kas_id IS NOT NULL;

COMMENT ON COLUMN public.pembayaran_zakat.account_id IS 'Compatibility link to new accounts master.';
COMMENT ON COLUMN public.pemasukan_uang.account_id IS 'Compatibility link to new accounts master.';
COMMENT ON COLUMN public.pemasukan_beras.account_id IS 'Compatibility link to new accounts master.';
COMMENT ON COLUMN public.rekonsiliasi.account_id IS 'Compatibility link to new accounts master.';

COMMIT;
