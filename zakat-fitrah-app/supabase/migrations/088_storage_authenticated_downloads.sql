BEGIN;
-- Bearer signed URLs do not recheck a revoked session. App downloads use Auth
-- on each request; customers cannot mint signed links or list other objects.
CREATE POLICY loan_storage_session_downloads ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
 USING (
   NOT storage.allow_any_operation(ARRAY['object.sign','object.sign_many','object.sign_upload_url','render.image_sign'])
   AND (public.loan_has_active_legacy_profile() OR (
     bucket_id='pinjaman-jamaah-private' AND public.loan_customer_session_valid()
     AND storage.allow_any_operation(ARRAY['object.get_authenticated','object.get_authenticated_info','object.head_authenticated_info'])
   ))
 );
COMMIT;
