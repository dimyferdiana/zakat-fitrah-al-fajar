BEGIN;

-- Add packages_per_coupon column to qurban_coupons
-- Default 1 = one coupon represents one distribution package
-- For qurban, a muzakki with sapi can receive 7 packages on one coupon
ALTER TABLE public.qurban_coupons
  ADD COLUMN IF NOT EXISTS packages_per_coupon INTEGER NOT NULL DEFAULT 1
    CHECK (packages_per_coupon >= 1);

-- Backfill any existing rows (should already default to 1, but be explicit)
UPDATE public.qurban_coupons
  SET packages_per_coupon = 1
  WHERE packages_per_coupon IS NULL;

COMMIT;
