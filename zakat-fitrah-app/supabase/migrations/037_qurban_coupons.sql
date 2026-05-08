BEGIN;

-- Enable pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.qurban_coupons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES public.qurban_events(id) ON DELETE RESTRICT,
  recipient_type    TEXT NOT NULL CHECK (recipient_type IN ('muzakki', 'mustahik')),
  recipient_id      UUID NOT NULL,
  qurban_share_id   UUID REFERENCES public.qurban_shares(id) ON DELETE SET NULL,
  coupon_number     TEXT NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  token             UUID NOT NULL DEFAULT gen_random_uuid(),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'cancelled')),
  expires_at        TIMESTAMPTZ NOT NULL,
  redeemed_at       TIMESTAMPTZ,
  redeemed_by       UUID REFERENCES auth.users(id),
  catatan           TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique: one coupon per muzakki share
CREATE UNIQUE INDEX IF NOT EXISTS qurban_coupons_share_unique
  ON public.qurban_coupons(qurban_share_id)
  WHERE qurban_share_id IS NOT NULL;

-- Unique: one coupon per mustahik per event
CREATE UNIQUE INDEX IF NOT EXISTS qurban_coupons_mustahik_event_unique
  ON public.qurban_coupons(event_id, recipient_type, recipient_id)
  WHERE recipient_type = 'mustahik';

-- Unique token
CREATE UNIQUE INDEX IF NOT EXISTS qurban_coupons_token_unique
  ON public.qurban_coupons(token);

-- updated_at trigger (reuse pattern)
CREATE OR REPLACE TRIGGER update_qurban_coupons_updated_at
  BEFORE UPDATE ON public.qurban_coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.qurban_coupons ENABLE ROW LEVEL SECURITY;

-- RLS policies (follow exact naming/structure from 035 migration)
DROP POLICY IF EXISTS "qurban_coupons_select_all_active" ON public.qurban_coupons;
DROP POLICY IF EXISTS "qurban_coupons_insert_admin_petugas_active" ON public.qurban_coupons;
DROP POLICY IF EXISTS "qurban_coupons_update_admin_petugas_active" ON public.qurban_coupons;
DROP POLICY IF EXISTS "qurban_coupons_delete_admin_active" ON public.qurban_coupons;

CREATE POLICY "qurban_coupons_select_all_active"
  ON public.qurban_coupons FOR SELECT TO authenticated
  USING (public.get_current_user_is_active() AND public.get_current_user_role() IN ('admin', 'petugas', 'viewer'));

CREATE POLICY "qurban_coupons_insert_admin_petugas_active"
  ON public.qurban_coupons FOR INSERT TO authenticated
  WITH CHECK (public.get_current_user_is_active() AND public.get_current_user_role() IN ('admin', 'petugas'));

CREATE POLICY "qurban_coupons_update_admin_petugas_active"
  ON public.qurban_coupons FOR UPDATE TO authenticated
  USING (public.get_current_user_is_active() AND public.get_current_user_role() IN ('admin', 'petugas'))
  WITH CHECK (public.get_current_user_is_active() AND public.get_current_user_role() IN ('admin', 'petugas'));

CREATE POLICY "qurban_coupons_delete_admin_active"
  ON public.qurban_coupons FOR DELETE TO authenticated
  USING (public.get_current_user_is_active() AND public.get_current_user_role() = 'admin');

COMMIT;
