-- Migration: Phase 2 - Dashboard Keuangan schema
-- Date: 2026-01-11
-- Purpose: Add money tracking tables (pemasukan_uang, hak_amil, rekonsiliasi) and extend pembayaran_zakat for akun/overpayment

-- =========================================
-- ENABLE REQUIRED EXTENSIONS
-- =========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- ENUMS
-- =========================================

DO $$ BEGIN
    CREATE TYPE akun_uang AS ENUM ('kas', 'bank');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pemasukan_uang_kategori AS ENUM (
        'zakat_fitrah_uang',
        'fidyah_uang',
        'maal_penghasilan_uang',
        'infak_sedekah_uang'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =========================================
-- EXISTING TABLE CHANGES
-- =========================================

ALTER TABLE pembayaran_zakat
    ADD COLUMN IF NOT EXISTS akun_uang akun_uang;

ALTER TABLE pembayaran_zakat
    ADD COLUMN IF NOT EXISTS jumlah_uang_dibayar_rp DECIMAL(15,2);

COMMENT ON COLUMN pembayaran_zakat.akun_uang IS 'Akun tujuan untuk pembayaran zakat fitrah uang: kas/bank (wajib jika jenis_zakat=uang)';
COMMENT ON COLUMN pembayaran_zakat.jumlah_uang_dibayar_rp IS 'Nominal uang yang diterima petugas (untuk deteksi overpayment). Default UI = kewajiban.';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'pembayaran_zakat_akun_uang_required_when_uang'
    ) THEN
        ALTER TABLE pembayaran_zakat
            ADD CONSTRAINT pembayaran_zakat_akun_uang_required_when_uang
            CHECK (jenis_zakat <> 'uang' OR akun_uang IS NOT NULL)
            NOT VALID;
    END IF;
END $$;

-- =========================================
-- NEW TABLES
-- =========================================

CREATE TABLE IF NOT EXISTS pemasukan_uang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_zakat_id UUID NOT NULL REFERENCES tahun_zakat(id) ON DELETE RESTRICT,
    muzakki_id UUID REFERENCES muzakki(id) ON DELETE SET NULL,
    kategori pemasukan_uang_kategori NOT NULL,
    akun akun_uang NOT NULL,
    jumlah_uang_rp DECIMAL(15,2) NOT NULL CHECK (jumlah_uang_rp > 0),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    catatan TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pemasukan_uang_tahun_zakat_id ON pemasukan_uang(tahun_zakat_id);
CREATE INDEX IF NOT EXISTS idx_pemasukan_uang_kategori ON pemasukan_uang(kategori);
CREATE INDEX IF NOT EXISTS idx_pemasukan_uang_tanggal ON pemasukan_uang(tanggal);
CREATE INDEX IF NOT EXISTS idx_pemasukan_uang_akun ON pemasukan_uang(akun);

CREATE TABLE IF NOT EXISTS hak_amil (
    tahun_zakat_id UUID PRIMARY KEY REFERENCES tahun_zakat(id) ON DELETE CASCADE,
    jumlah_uang_rp DECIMAL(15,2) NOT NULL DEFAULT 0,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE hak_amil IS 'Hak amil manual per tahun zakat (Phase 2: manual input, bukan auto persentase).';

CREATE TABLE IF NOT EXISTS rekonsiliasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_zakat_id UUID NOT NULL REFERENCES tahun_zakat(id) ON DELETE RESTRICT,
    jenis jenis_zakat NOT NULL,
    akun akun_uang,
    jumlah_uang_rp DECIMAL(15,2),
    jumlah_beras_kg DECIMAL(10,2),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    catatan TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT rekonsiliasi_check_amount_by_jenis CHECK (
        (jenis = 'uang' AND akun IS NOT NULL AND jumlah_uang_rp IS NOT NULL AND jumlah_uang_rp <> 0 AND jumlah_beras_kg IS NULL) OR
        (jenis = 'beras' AND akun IS NULL AND jumlah_uang_rp IS NULL AND jumlah_beras_kg IS NOT NULL AND jumlah_beras_kg <> 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_rekonsiliasi_tahun_zakat_id ON rekonsiliasi(tahun_zakat_id);
CREATE INDEX IF NOT EXISTS idx_rekonsiliasi_jenis ON rekonsiliasi(jenis);
CREATE INDEX IF NOT EXISTS idx_rekonsiliasi_akun ON rekonsiliasi(akun);
CREATE INDEX IF NOT EXISTS idx_rekonsiliasi_tanggal ON rekonsiliasi(tanggal);
