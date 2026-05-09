BEGIN;

-- Task 1: Allow a person to receive more than one coupon per event
DROP INDEX IF EXISTS public.qurban_coupons_mustahik_event_unique;

-- Task 4: Add 'al_fajar' as a valid sumber_hewan value
ALTER TABLE public.qurban_animals DROP CONSTRAINT IF EXISTS qurban_animals_sumber_hewan_check;
ALTER TABLE public.qurban_animals ADD CONSTRAINT qurban_animals_sumber_hewan_check
  CHECK (sumber_hewan IN ('beli', 'titipan', 'al_fajar'));

COMMIT;
