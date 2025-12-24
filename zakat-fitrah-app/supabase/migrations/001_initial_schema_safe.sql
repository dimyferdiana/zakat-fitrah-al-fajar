-- ============================================================================
-- Initial Schema for Zakat Fitrah Management System (SAFE VERSION)
-- This version checks if objects exist before creating them
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS (with IF NOT EXISTS alternative)
-- ============================================================================

-- Check and create user_role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'petugas', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check and create jenis_zakat enum
DO $$ BEGIN
    CREATE TYPE jenis_zakat AS ENUM ('beras', 'uang');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check and create status_distribusi enum
DO $$ BEGIN
    CREATE TYPE status_distribusi AS ENUM ('pending', 'selesai');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama_lengkap TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'petugas',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tahun Zakat table
CREATE TABLE IF NOT EXISTS public.tahun_zakat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tahun_hijriah TEXT NOT NULL,
    tahun_masehi INTEGER NOT NULL,
    nilai_beras_kg DECIMAL(10,2) NOT NULL,
    nilai_uang_rp DECIMAL(15,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tahun_hijriah),
    UNIQUE(tahun_masehi)
);

-- Kategori Mustahik table (8 Asnaf)
CREATE TABLE IF NOT EXISTS public.kategori_mustahik (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama TEXT NOT NULL UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Muzakki table
CREATE TABLE IF NOT EXISTS public.muzakki (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_kk TEXT NOT NULL,
    alamat TEXT NOT NULL,
    no_telp TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pembayaran Zakat table
CREATE TABLE IF NOT EXISTS public.pembayaran_zakat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    muzakki_id UUID NOT NULL REFERENCES public.muzakki(id) ON DELETE CASCADE,
    tahun_zakat_id UUID NOT NULL REFERENCES public.tahun_zakat(id) ON DELETE RESTRICT,
    jumlah_jiwa INTEGER NOT NULL CHECK (jumlah_jiwa > 0),
    jenis_zakat jenis_zakat NOT NULL,
    jumlah_beras_kg DECIMAL(10,2),
    jumlah_uang_rp DECIMAL(15,2),
    tanggal_bayar DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_jumlah_by_jenis CHECK (
        (jenis_zakat = 'beras' AND jumlah_beras_kg IS NOT NULL AND jumlah_beras_kg > 0) OR
        (jenis_zakat = 'uang' AND jumlah_uang_rp IS NOT NULL AND jumlah_uang_rp > 0)
    )
);

-- Mustahik table
CREATE TABLE IF NOT EXISTS public.mustahik (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama TEXT NOT NULL,
    alamat TEXT NOT NULL,
    kategori_id UUID NOT NULL REFERENCES public.kategori_mustahik(id) ON DELETE RESTRICT,
    jumlah_anggota INTEGER NOT NULL CHECK (jumlah_anggota > 0),
    no_telp TEXT,
    catatan TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Distribusi Zakat table
CREATE TABLE IF NOT EXISTS public.distribusi_zakat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mustahik_id UUID NOT NULL REFERENCES public.mustahik(id) ON DELETE RESTRICT,
    tahun_zakat_id UUID NOT NULL REFERENCES public.tahun_zakat(id) ON DELETE RESTRICT,
    jenis_distribusi jenis_zakat NOT NULL,
    jumlah_beras_kg DECIMAL(10,2),
    jumlah_uang_rp DECIMAL(15,2),
    tanggal_distribusi DATE NOT NULL DEFAULT CURRENT_DATE,
    status status_distribusi NOT NULL DEFAULT 'pending',
    catatan TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_distribusi_jumlah CHECK (
        (jenis_distribusi = 'beras' AND jumlah_beras_kg IS NOT NULL AND jumlah_beras_kg > 0) OR
        (jenis_distribusi = 'uang' AND jumlah_uang_rp IS NOT NULL AND jumlah_uang_rp > 0)
    )
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Tahun Zakat indexes
CREATE INDEX IF NOT EXISTS idx_tahun_zakat_is_active ON public.tahun_zakat(is_active);
CREATE INDEX IF NOT EXISTS idx_tahun_zakat_tahun_masehi ON public.tahun_zakat(tahun_masehi);

-- Muzakki indexes
CREATE INDEX IF NOT EXISTS idx_muzakki_nama_kk ON public.muzakki(nama_kk);
CREATE INDEX IF NOT EXISTS idx_muzakki_created_at ON public.muzakki(created_at DESC);

-- Pembayaran Zakat indexes
CREATE INDEX IF NOT EXISTS idx_pembayaran_muzakki_id ON public.pembayaran_zakat(muzakki_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_tahun_zakat_id ON public.pembayaran_zakat(tahun_zakat_id);
CREATE INDEX IF NOT EXISTS idx_pembayaran_tanggal_bayar ON public.pembayaran_zakat(tanggal_bayar DESC);
CREATE INDEX IF NOT EXISTS idx_pembayaran_created_by ON public.pembayaran_zakat(created_by);
CREATE INDEX IF NOT EXISTS idx_pembayaran_jenis_zakat ON public.pembayaran_zakat(jenis_zakat);

-- Mustahik indexes
CREATE INDEX IF NOT EXISTS idx_mustahik_kategori_id ON public.mustahik(kategori_id);
CREATE INDEX IF NOT EXISTS idx_mustahik_nama ON public.mustahik(nama);
CREATE INDEX IF NOT EXISTS idx_mustahik_is_active ON public.mustahik(is_active);

-- Distribusi Zakat indexes
CREATE INDEX IF NOT EXISTS idx_distribusi_mustahik_id ON public.distribusi_zakat(mustahik_id);
CREATE INDEX IF NOT EXISTS idx_distribusi_tahun_zakat_id ON public.distribusi_zakat(tahun_zakat_id);
CREATE INDEX IF NOT EXISTS idx_distribusi_tanggal ON public.distribusi_zakat(tanggal_distribusi DESC);
CREATE INDEX IF NOT EXISTS idx_distribusi_status ON public.distribusi_zakat(status);
CREATE INDEX IF NOT EXISTS idx_distribusi_created_by ON public.distribusi_zakat(created_by);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist, then create them
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_tahun_zakat_updated_at ON public.tahun_zakat;
    CREATE TRIGGER update_tahun_zakat_updated_at BEFORE UPDATE ON public.tahun_zakat
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_muzakki_updated_at ON public.muzakki;
    CREATE TRIGGER update_muzakki_updated_at BEFORE UPDATE ON public.muzakki
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_pembayaran_zakat_updated_at ON public.pembayaran_zakat;
    CREATE TRIGGER update_pembayaran_zakat_updated_at BEFORE UPDATE ON public.pembayaran_zakat
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_mustahik_updated_at ON public.mustahik;
    CREATE TRIGGER update_mustahik_updated_at BEFORE UPDATE ON public.mustahik
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_distribusi_zakat_updated_at ON public.distribusi_zakat;
    CREATE TRIGGER update_distribusi_zakat_updated_at BEFORE UPDATE ON public.distribusi_zakat
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- Function to ensure only one active tahun_zakat
CREATE OR REPLACE FUNCTION ensure_single_active_tahun()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE public.tahun_zakat
        SET is_active = false
        WHERE id != NEW.id AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS ensure_single_active_tahun_trigger ON public.tahun_zakat;
    CREATE TRIGGER ensure_single_active_tahun_trigger
        AFTER INSERT OR UPDATE ON public.tahun_zakat
        FOR EACH ROW
        WHEN (NEW.is_active = true)
        EXECUTE FUNCTION ensure_single_active_tahun();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'User accounts with role-based access control';
COMMENT ON TABLE public.tahun_zakat IS 'Yearly zakat configuration with nilai beras and uang';
COMMENT ON TABLE public.kategori_mustahik IS 'Categories of zakat recipients (8 Asnaf)';
COMMENT ON TABLE public.muzakki IS 'Zakat payers (heads of household)';
COMMENT ON TABLE public.pembayaran_zakat IS 'Zakat payments from muzakki';
COMMENT ON TABLE public.mustahik IS 'Zakat recipients';
COMMENT ON TABLE public.distribusi_zakat IS 'Zakat distribution to mustahik';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all data changes';
