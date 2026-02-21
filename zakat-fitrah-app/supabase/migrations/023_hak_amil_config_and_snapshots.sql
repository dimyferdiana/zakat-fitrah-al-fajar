-- Migration 021: Hak Amil configuration per tahun zakat and transaction snapshots
-- Purpose: Add automatic hak amil config (basis + percentages) and immutable snapshot storage for reporting

-- =========================================
-- ENUMS
-- =========================================

DO $$ BEGIN
    CREATE TYPE public.hak_amil_basis_mode AS ENUM (
        'net_after_reconciliation',
        'gross_before_reconciliation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.hak_amil_kategori AS ENUM (
        'zakat_fitrah',
        'zakat_maal',
        'infak',
        'fidyah',
        'beras'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =========================================
-- HAK AMIL CONFIGS (PER TAHUN ZAKAT)
-- =========================================

CREATE TABLE IF NOT EXISTS public.hak_amil_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_zakat_id UUID NOT NULL REFERENCES public.tahun_zakat(id) ON DELETE CASCADE,
    basis_mode public.hak_amil_basis_mode NOT NULL DEFAULT 'net_after_reconciliation',
    persen_zakat_fitrah NUMERIC(5,2) NOT NULL DEFAULT 12.50,
    persen_zakat_maal NUMERIC(5,2) NOT NULL DEFAULT 12.50,
    persen_infak NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    persen_fidyah NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    persen_beras NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT hak_amil_configs_tahun_zakat_unique UNIQUE (tahun_zakat_id),
    CONSTRAINT hak_amil_configs_persen_range CHECK (
        persen_zakat_fitrah BETWEEN 0 AND 100
        AND persen_zakat_maal BETWEEN 0 AND 100
        AND persen_infak BETWEEN 0 AND 100
        AND persen_fidyah BETWEEN 0 AND 100
        AND persen_beras BETWEEN 0 AND 100
    )
);

CREATE INDEX IF NOT EXISTS idx_hak_amil_configs_tahun_zakat_id
    ON public.hak_amil_configs(tahun_zakat_id);

-- =========================================
-- HAK AMIL SNAPSHOTS (PER TRANSACTION)
-- =========================================

CREATE TABLE IF NOT EXISTS public.hak_amil_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_zakat_id UUID NOT NULL REFERENCES public.tahun_zakat(id) ON DELETE RESTRICT,
    kategori public.hak_amil_kategori NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    basis_mode public.hak_amil_basis_mode NOT NULL,

    -- transaction-source references (nullable, strategy: one snapshot row references one source transaction)
    pembayaran_zakat_id UUID REFERENCES public.pembayaran_zakat(id) ON DELETE CASCADE,
    pemasukan_uang_id UUID REFERENCES public.pemasukan_uang(id) ON DELETE CASCADE,
    rekonsiliasi_id UUID REFERENCES public.rekonsiliasi(id) ON DELETE CASCADE,

    total_bruto NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_rekonsiliasi NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_neto NUMERIC(15,2) NOT NULL DEFAULT 0,
    nominal_basis NUMERIC(15,2) NOT NULL DEFAULT 0,
    persen_hak_amil NUMERIC(5,2) NOT NULL,
    nominal_hak_amil NUMERIC(15,2) NOT NULL,

    catatan TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT hak_amil_snapshots_amount_non_negative CHECK (
        total_bruto >= 0
        AND total_neto >= 0
        AND nominal_basis >= 0
        AND nominal_hak_amil >= 0
    ),
    CONSTRAINT hak_amil_snapshots_persen_range CHECK (persen_hak_amil BETWEEN 0 AND 100),
    CONSTRAINT hak_amil_snapshots_source_required CHECK (
        pembayaran_zakat_id IS NOT NULL
        OR pemasukan_uang_id IS NOT NULL
        OR rekonsiliasi_id IS NOT NULL
    )
);

-- Optional foreign key for pemasukan_beras (table exists in active schema, but guarded for portability)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'pemasukan_beras'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'hak_amil_snapshots_pemasukan_beras_id_fkey'
        ) THEN
            ALTER TABLE public.hak_amil_snapshots
                ADD COLUMN IF NOT EXISTS pemasukan_beras_id UUID;

            ALTER TABLE public.hak_amil_snapshots
                ADD CONSTRAINT hak_amil_snapshots_pemasukan_beras_id_fkey
                FOREIGN KEY (pemasukan_beras_id)
                REFERENCES public.pemasukan_beras(id)
                ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Enforce one-source strategy (including optional pemasukan_beras_id if present)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'hak_amil_snapshots'
          AND column_name = 'pemasukan_beras_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'hak_amil_snapshots_exactly_one_source'
        ) THEN
            ALTER TABLE public.hak_amil_snapshots
                ADD CONSTRAINT hak_amil_snapshots_exactly_one_source
                CHECK (
                    (
                        (CASE WHEN pembayaran_zakat_id IS NULL THEN 0 ELSE 1 END)
                        + (CASE WHEN pemasukan_uang_id IS NULL THEN 0 ELSE 1 END)
                        + (CASE WHEN rekonsiliasi_id IS NULL THEN 0 ELSE 1 END)
                        + (CASE WHEN pemasukan_beras_id IS NULL THEN 0 ELSE 1 END)
                    ) = 1
                );
        END IF;
    ELSE
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'hak_amil_snapshots_exactly_one_source'
        ) THEN
            ALTER TABLE public.hak_amil_snapshots
                ADD CONSTRAINT hak_amil_snapshots_exactly_one_source
                CHECK (
                    (
                        (CASE WHEN pembayaran_zakat_id IS NULL THEN 0 ELSE 1 END)
                        + (CASE WHEN pemasukan_uang_id IS NULL THEN 0 ELSE 1 END)
                        + (CASE WHEN rekonsiliasi_id IS NULL THEN 0 ELSE 1 END)
                    ) = 1
                );
        END IF;
    END IF;
END $$;

-- Reporting indexes
CREATE INDEX IF NOT EXISTS idx_hak_amil_snapshots_tahun_zakat_id
    ON public.hak_amil_snapshots(tahun_zakat_id);

CREATE INDEX IF NOT EXISTS idx_hak_amil_snapshots_kategori
    ON public.hak_amil_snapshots(kategori);

CREATE INDEX IF NOT EXISTS idx_hak_amil_snapshots_tanggal
    ON public.hak_amil_snapshots(tanggal);

CREATE INDEX IF NOT EXISTS idx_hak_amil_snapshots_tahun_kategori_tanggal
    ON public.hak_amil_snapshots(tahun_zakat_id, kategori, tanggal);

-- Uniqueness per source transaction (avoid duplicate snapshots)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hak_amil_snapshots_unique_pembayaran
    ON public.hak_amil_snapshots(pembayaran_zakat_id)
    WHERE pembayaran_zakat_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hak_amil_snapshots_unique_pemasukan_uang
    ON public.hak_amil_snapshots(pemasukan_uang_id)
    WHERE pemasukan_uang_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hak_amil_snapshots_unique_rekonsiliasi
    ON public.hak_amil_snapshots(rekonsiliasi_id)
    WHERE rekonsiliasi_id IS NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'hak_amil_snapshots'
          AND column_name = 'pemasukan_beras_id'
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_hak_amil_snapshots_unique_pemasukan_beras
            ON public.hak_amil_snapshots(pemasukan_beras_id)
            WHERE pemasukan_beras_id IS NOT NULL;
    END IF;
END $$;

-- Reuse shared updated_at trigger function if available
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'update_updated_at_column'
          AND pg_function_is_visible(oid)
    ) THEN
        DROP TRIGGER IF EXISTS update_hak_amil_configs_updated_at ON public.hak_amil_configs;
        CREATE TRIGGER update_hak_amil_configs_updated_at
            BEFORE UPDATE ON public.hak_amil_configs
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

COMMENT ON TABLE public.hak_amil_configs
    IS 'Konfigurasi hak amil per tahun zakat (basis mode + persen per kategori).';

COMMENT ON TABLE public.hak_amil_snapshots
    IS 'Snapshot kalkulasi hak amil per transaksi untuk menjaga histori lintas perubahan konfigurasi tahun berikutnya.';
