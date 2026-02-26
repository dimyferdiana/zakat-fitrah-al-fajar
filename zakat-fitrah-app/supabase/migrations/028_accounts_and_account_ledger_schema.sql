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
