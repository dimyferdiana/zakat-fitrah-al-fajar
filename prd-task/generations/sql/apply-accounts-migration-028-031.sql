-- =========================================
-- ACCOUNTS + ACCOUNT LEDGER SCHEMA
-- =========================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  CREATE TYPE public.account_channel AS ENUM ('kas', 'bank', 'qris');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.account_ledger_entry_type AS ENUM ('IN', 'OUT', 'REKONSILIASI');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name    TEXT NOT NULL UNIQUE,
  account_channel public.account_channel NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order      INTEGER NOT NULL DEFAULT 100,
  created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounts_name_not_empty CHECK (LENGTH(BTRIM(account_name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_accounts_channel ON public.accounts(account_channel);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON public.accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_accounts_sort_order ON public.accounts(sort_order, account_name);

CREATE TABLE IF NOT EXISTS public.account_ledger_entries (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id                      UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  entry_type                      public.account_ledger_entry_type NOT NULL,
  amount_rp                       NUMERIC(15,2) NOT NULL CHECK (amount_rp > 0),
  running_balance_before_rp       NUMERIC(15,2) NOT NULL DEFAULT 0,
  running_balance_after_rp        NUMERIC(15,2) NOT NULL DEFAULT 0,
  entry_date                      DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes                           TEXT,
  reference_no                    TEXT,
  source_pembayaran_zakat_id      UUID REFERENCES public.pembayaran_zakat(id) ON DELETE SET NULL,
  source_pemasukan_uang_id        UUID REFERENCES public.pemasukan_uang(id) ON DELETE SET NULL,
  source_pemasukan_beras_id       UUID REFERENCES public.pemasukan_beras(id) ON DELETE SET NULL,
  source_rekonsiliasi_id          UUID REFERENCES public.rekonsiliasi(id) ON DELETE SET NULL,
  manual_reconciliation_ref       TEXT,
  created_by                      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT account_ledger_entries_running_balance_consistency CHECK (
    CASE entry_type
      WHEN 'IN' THEN running_balance_after_rp = running_balance_before_rp + amount_rp
      WHEN 'OUT' THEN running_balance_after_rp = running_balance_before_rp - amount_rp
      ELSE true
    END
  ),
  CONSTRAINT account_ledger_entries_linkage_present CHECK (
    (
      (CASE WHEN source_pembayaran_zakat_id IS NULL THEN 0 ELSE 1 END) +
      (CASE WHEN source_pemasukan_uang_id IS NULL THEN 0 ELSE 1 END) +
      (CASE WHEN source_pemasukan_beras_id IS NULL THEN 0 ELSE 1 END) +
      (CASE WHEN source_rekonsiliasi_id IS NULL THEN 0 ELSE 1 END)
    ) >= 1
    OR manual_reconciliation_ref IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_account_ledger_entries_account_id ON public.account_ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_account_ledger_entries_entry_date ON public.account_ledger_entries(entry_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_ledger_entries_entry_type ON public.account_ledger_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_account_ledger_entries_effective_at ON public.account_ledger_entries(effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_ledger_entries_source_pembayaran_zakat_id
  ON public.account_ledger_entries(source_pembayaran_zakat_id)
  WHERE source_pembayaran_zakat_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_ledger_entries_source_pemasukan_uang_id
  ON public.account_ledger_entries(source_pemasukan_uang_id)
  WHERE source_pemasukan_uang_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_ledger_entries_source_pemasukan_beras_id
  ON public.account_ledger_entries(source_pemasukan_beras_id)
  WHERE source_pemasukan_beras_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_ledger_entries_source_rekonsiliasi_id
  ON public.account_ledger_entries(source_rekonsiliasi_id)
  WHERE source_rekonsiliasi_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at_column'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP TRIGGER IF EXISTS update_accounts_updated_at ON public.accounts;
    CREATE TRIGGER update_accounts_updated_at
      BEFORE UPDATE ON public.accounts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_account_ledger_entries_updated_at ON public.account_ledger_entries;
    CREATE TRIGGER update_account_ledger_entries_updated_at
      BEFORE UPDATE ON public.account_ledger_entries
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;

COMMENT ON TABLE public.accounts IS 'Master account registry for kas/bank/qris channels with active flag and metadata.';
COMMENT ON TABLE public.account_ledger_entries IS 'Per-account money ledger entries with linkage to legacy transaction sources and running balance fields.';
COMMENT ON COLUMN public.account_ledger_entries.manual_reconciliation_ref IS 'Optional manual reconciliation reference for entries not tied to a source table row.';

COMMIT;
-- =========================================
-- RLS: ACCOUNTS + ACCOUNT LEDGER ENTRIES
-- =========================================

BEGIN;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_ledger_entries ENABLE ROW LEVEL SECURITY;

-- ACCOUNTS POLICIES
DROP POLICY IF EXISTS "accounts_select_admin_bendahara_petugas_active" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert_admin_bendahara_active" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update_admin_bendahara_active" ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete_admin_bendahara_active" ON public.accounts;

CREATE POLICY "accounts_select_admin_bendahara_petugas_active"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara', 'petugas')
  );

CREATE POLICY "accounts_insert_admin_bendahara_active"
  ON public.accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

CREATE POLICY "accounts_update_admin_bendahara_active"
  ON public.accounts FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

CREATE POLICY "accounts_delete_admin_bendahara_active"
  ON public.accounts FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

-- ACCOUNT_LEDGER_ENTRIES POLICIES
DROP POLICY IF EXISTS "account_ledger_entries_select_admin_bendahara_petugas_active" ON public.account_ledger_entries;
DROP POLICY IF EXISTS "account_ledger_entries_insert_admin_bendahara_active" ON public.account_ledger_entries;
DROP POLICY IF EXISTS "account_ledger_entries_update_admin_bendahara_active" ON public.account_ledger_entries;
DROP POLICY IF EXISTS "account_ledger_entries_delete_admin_bendahara_active" ON public.account_ledger_entries;

CREATE POLICY "account_ledger_entries_select_admin_bendahara_petugas_active"
  ON public.account_ledger_entries FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara', 'petugas')
  );

CREATE POLICY "account_ledger_entries_insert_admin_bendahara_active"
  ON public.account_ledger_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

CREATE POLICY "account_ledger_entries_update_admin_bendahara_active"
  ON public.account_ledger_entries FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

CREATE POLICY "account_ledger_entries_delete_admin_bendahara_active"
  ON public.account_ledger_entries FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'bendahara')
  );

COMMIT;
-- =========================================
-- SEED DEFAULT ACCOUNTS
-- =========================================

BEGIN;

INSERT INTO public.accounts (
  account_name,
  account_channel,
  is_active,
  metadata,
  sort_order
)
VALUES
  ('KAS', 'kas', true, '{"is_default": true}'::jsonb, 10),
  ('BCA-SYARIAH : MPZ LAZ AL FAJAR ZAKAT', 'bank', true, '{"is_default": true}'::jsonb, 20),
  ('BCA-SYARIAH : MPZ LAZ AL FAJAR INFAK', 'bank', true, '{"is_default": true}'::jsonb, 30),
  ('BCA-SYARIAH : SAHABAT QURAN BAKTI JAYA', 'bank', true, '{"is_default": true}'::jsonb, 40),
  ('QRIS-BSI : UPZ BAZNAS AL FAJAR ZAKAT', 'qris', true, '{"is_default": true}'::jsonb, 50),
  ('QRIS-BSI : UPZ BAZNAS AL FAJAR INFAK', 'qris', true, '{"is_default": true}'::jsonb, 60)
ON CONFLICT (account_name)
DO UPDATE
SET
  account_channel = EXCLUDED.account_channel,
  is_active = true,
  metadata = COALESCE(public.accounts.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

COMMIT;
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

-- Repair dirty rows: some legacy rows have jenis_zakat='uang' but akun_uang=NULL
-- (inserted before the check constraint was enforced). Fix them to 'kas' default
-- so the subsequent UPDATE (which triggers constraint re-validation) doesn't fail.
UPDATE public.pembayaran_zakat
SET akun_uang = 'kas'
WHERE jenis_zakat = 'uang' AND akun_uang IS NULL;

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
