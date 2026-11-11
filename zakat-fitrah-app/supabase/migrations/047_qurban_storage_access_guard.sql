-- The existing qurban photo bucket allows writes to every authenticated user.
-- Preserve its existing public read policy, while preventing loan-only accounts
-- from uploading, modifying, or deleting objects in the legacy bucket.
BEGIN;
CREATE POLICY loan_guard_qurban_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (bucket_id <> 'qurban-photos' OR public.loan_has_active_legacy_profile());
CREATE POLICY loan_guard_qurban_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (bucket_id <> 'qurban-photos' OR public.loan_has_active_legacy_profile())
  WITH CHECK (bucket_id <> 'qurban-photos' OR public.loan_has_active_legacy_profile());
CREATE POLICY loan_guard_qurban_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (bucket_id <> 'qurban-photos' OR public.loan_has_active_legacy_profile());
COMMIT;
