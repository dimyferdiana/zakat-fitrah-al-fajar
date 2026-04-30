-- Migration: Transaction Tags Support
-- Date: 2026-04-30
-- Purpose: Add transaction tag support for categorizing transactions by event/season

-- =========================================
-- CREATE TRANSACTION_TAGS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS transaction_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transaction_tags IS 'Tags for categorizing transactions by event or season (e.g., Umum, Idul Fitri)';
COMMENT ON COLUMN transaction_tags.name IS 'Tag name (e.g., Umum, Idul Fitri)';
COMMENT ON COLUMN transaction_tags.color IS 'Optional hex color code for UI display';

-- =========================================
-- SEED DEFAULT TAGS
-- =========================================

INSERT INTO transaction_tags (name, description, color, is_active)
VALUES
    ('Umum', 'Transaksi umum tanpa event khusus', '#808080', true),
    ('Idul Fitri', 'Transaksi terkait Idul Fitri', '#4CAF50', true)
ON CONFLICT (name) DO NOTHING;

-- =========================================
-- ADD TAG_ID COLUMNS TO EXISTING TABLES
-- =========================================

-- Add tag_id to pemasukan_uang
ALTER TABLE pemasukan_uang
    ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES transaction_tags(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pemasukan_uang_tag_id ON pemasukan_uang(tag_id);

-- Add tag_id to pemasukan_beras
ALTER TABLE pemasukan_beras
    ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES transaction_tags(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pemasukan_beras_tag_id ON pemasukan_beras(tag_id);

-- Add tag_id to pembayaran_zakat
ALTER TABLE pembayaran_zakat
    ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES transaction_tags(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pembayaran_zakat_tag_id ON pembayaran_zakat(tag_id);

-- Add tag_id to distribusi_zakat
ALTER TABLE distribusi_zakat
    ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES transaction_tags(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_distribusi_zakat_tag_id ON distribusi_zakat(tag_id);

-- =========================================
-- RLS POLICIES FOR TRANSACTION_TAGS
-- =========================================

ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read transaction_tags
CREATE POLICY transaction_tags_read_all ON transaction_tags
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow admins to manage transaction_tags
CREATE POLICY transaction_tags_insert_admin ON transaction_tags
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY transaction_tags_update_admin ON transaction_tags
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY transaction_tags_delete_admin ON transaction_tags
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
