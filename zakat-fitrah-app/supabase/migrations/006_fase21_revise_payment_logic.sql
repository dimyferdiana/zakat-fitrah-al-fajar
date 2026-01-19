-- Migration 006: Revise Zakat Fitrah Payment Logic (Fase 2.1)
-- Based on Ustadz Imron consultation:
-- 1. Money payments: All amounts accepted as zakat (no overpayment split)
-- 2. Rice payments: Must meet minimum or be recorded as infaq after negotiation
-- 3. Remove reconciliation logic for money payments

-- Add comment to jumlah_uang_dibayar_rp explaining it's deprecated
COMMENT ON COLUMN pembayaran_zakat.jumlah_uang_dibayar_rp IS 
'DEPRECATED: This field is no longer used. The actual amount received is now stored in jumlah_uang_rp directly. Kept for historical data compatibility.';

-- Update comments to clarify new logic
COMMENT ON COLUMN pembayaran_zakat.jumlah_uang_rp IS 
'For uang type: stores actual amount received from muzakki (not calculated kewajiban). The nilai_uang_rp from tahun_zakat is used only as reference/suggestion.';

COMMENT ON COLUMN pembayaran_zakat.jumlah_beras_kg IS 
'For beras type: stores actual amount received from muzakki. Must meet or exceed minimum requirement (jumlah_jiwa × nilai_beras_kg), otherwise recorded as infaq/sadaqah after muzakki negotiation.';

-- Note: We keep jumlah_uang_dibayar_rp for historical compatibility but mark as deprecated
-- Future: Could create a migration to merge historical overpayment records if needed
