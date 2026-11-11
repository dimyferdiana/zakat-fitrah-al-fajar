// Deliberate local-only activation after the task 3 verification suite passes.
import assert from 'node:assert/strict';
import { localStatus, localSql } from './local-supabase.mjs';

const status = localStatus();
const response = await fetch(`${status.API_URL}/auth/v1/settings`, { headers: { apikey: status.ANON_KEY } });
assert.equal(response.status,200);
const settings = await response.json();
assert.equal(settings.external.email,true,'Login email harus aktif');
assert.equal(settings.disable_signup,true,'Pendaftaran publik harus nonaktif');
localSql(`DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM storage.buckets WHERE public) THEN RAISE EXCEPTION 'Masih ada bucket publik'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN('r','p') AND NOT c.relrowsecurity AND has_table_privilege('authenticated',c.oid,'SELECT')) THEN RAISE EXCEPTION 'Ada tabel tanpa RLS'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v' AND has_table_privilege('authenticated',c.oid,'SELECT') AND NOT coalesce(c.reloptions @> ARRAY['security_invoker=true'],false)) THEN RAISE EXCEPTION 'Ada view tanpa invoker'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND has_function_privilege('anon',p.oid,'EXECUTE')) THEN RAISE EXCEPTION 'Ada fungsi publik yang dapat dipanggil anonim'; END IF;
 UPDATE public.loan_portal_settings SET account_creation_enabled=true,updated_at=now() WHERE id;
END $$;`);
console.log('PASS: pembuatan akun nasabah diaktifkan hanya pada Supabase lokal');
