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
