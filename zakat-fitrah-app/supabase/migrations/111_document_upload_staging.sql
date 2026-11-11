BEGIN;
-- Objects are reserved before upload so failed or interrupted uploads remain
-- identifiable. An aborted reservation can never be linked to a document.
CREATE TABLE public.loan_upload_staging (
 storage_path TEXT PRIMARY KEY, request_id UUID NOT NULL, loan_id UUID NOT NULL,
 actor_id UUID NOT NULL, state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','attached','aborted','cleaned')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_upload_staging ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.loan_upload_staging FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.loan_stage_upload(p_request UUID,p_loan UUID,p_actor UUID,p_session UUID,p_mode TEXT,p_paths TEXT[]) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE path TEXT; s public.loan_upload_staging%ROWTYPE;
BEGIN
 IF p_mode NOT IN ('staff','customer') OR p_request IS NULL OR p_loan IS NULL OR cardinality(p_paths) NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Data unggahan tidak valid'; END IF;
 PERFORM public.loan_check_service_session(p_actor,p_session,p_mode);
 IF p_mode='customer' AND NOT EXISTS(SELECT 1 FROM public.loans l JOIN public.loan_customers c ON c.id=l.customer_id WHERE l.id=p_loan AND c.auth_user_id=p_actor AND c.is_active AND NOT c.access_paused AND l.status IN('active','needs_reconciliation')) THEN RAISE EXCEPTION 'Akses ditolak'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.loans WHERE id=p_loan) THEN RAISE EXCEPTION 'Pinjaman tidak tersedia'; END IF;
 FOREACH path IN ARRAY p_paths LOOP
   IF path IS NULL OR split_part(path,'/',1)<>p_loan::text OR split_part(path,'/',2) NOT LIKE p_request::text||'%' OR length(path)>200 THEN RAISE EXCEPTION 'Path tidak valid'; END IF;
   INSERT INTO public.loan_upload_staging(storage_path,request_id,loan_id,actor_id) VALUES(path,p_request,p_loan,p_actor) ON CONFLICT(storage_path) DO NOTHING;
   SELECT * INTO s FROM public.loan_upload_staging WHERE storage_path=path FOR UPDATE;
   IF s.request_id<>p_request OR s.loan_id<>p_loan OR s.actor_id<>p_actor OR s.state NOT IN('pending','attached') THEN RAISE EXCEPTION 'Permintaan unggahan tidak tersedia'; END IF;
 END LOOP;
END; $$;

CREATE FUNCTION public.loan_attach_staged_upload() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.loan_upload_staging%ROWTYPE;
BEGIN
 SELECT * INTO s FROM public.loan_upload_staging WHERE storage_path=NEW.storage_path FOR UPDATE;
 IF FOUND THEN
   IF s.state NOT IN('pending','attached') OR s.loan_id<>NEW.loan_id OR s.actor_id<>NEW.created_by THEN RAISE EXCEPTION 'Unggahan telah dibatalkan'; END IF;
   UPDATE public.loan_upload_staging SET state='attached' WHERE storage_path=NEW.storage_path;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER loan_attach_staged_upload BEFORE INSERT ON public.loan_documents FOR EACH ROW EXECUTE FUNCTION public.loan_attach_staged_upload();

CREATE FUNCTION public.loan_abort_staged_upload(p_request UUID,p_actor UUID) RETURNS TEXT[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE paths TEXT[];
BEGIN
 WITH changed AS (UPDATE public.loan_upload_staging SET state='aborted' WHERE request_id=p_request AND actor_id=p_actor AND state='pending' RETURNING storage_path)
 SELECT coalesce(array_agg(storage_path),ARRAY[]::text[]) INTO paths FROM changed;
 RETURN paths;
END; $$;

-- A later upload retries cleanup of abandoned reservations. Already attached
-- paths are never returned, even if a prior client lost the success response.
CREATE FUNCTION public.loan_recover_staged_uploads() RETURNS TEXT[]
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE paths TEXT[];
BEGIN
 UPDATE public.loan_upload_staging SET state='aborted' WHERE state='pending' AND created_at<now()-interval '1 day';
 SELECT coalesce(array_agg(storage_path),ARRAY[]::text[]) INTO paths FROM (SELECT storage_path FROM public.loan_upload_staging WHERE state='aborted' ORDER BY created_at LIMIT 100) x;
 RETURN paths;
END; $$;
CREATE FUNCTION public.loan_mark_uploads_cleaned(p_paths TEXT[]) RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 UPDATE public.loan_upload_staging SET state='cleaned' WHERE state='aborted' AND storage_path=ANY(p_paths);
$$;
REVOKE ALL ON FUNCTION public.loan_stage_upload(UUID,UUID,UUID,UUID,TEXT,TEXT[]),public.loan_abort_staged_upload(UUID,UUID),public.loan_recover_staged_uploads(),public.loan_mark_uploads_cleaned(TEXT[]),public.loan_attach_staged_upload() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.loan_stage_upload(UUID,UUID,UUID,UUID,TEXT,TEXT[]),public.loan_abort_staged_upload(UUID,UUID),public.loan_recover_staged_uploads(),public.loan_mark_uploads_cleaned(TEXT[]) TO service_role;
COMMIT;
