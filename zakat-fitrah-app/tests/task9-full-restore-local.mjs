// Restore schema-only into a synthetic source, then back up and restore that
// source to a second temporary database. No application rows are copied.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { localStatus } from './local-supabase.mjs';

localStatus();
const tag=randomUUID().replaceAll('-','').slice(0,16), source=`task9_source_${tag}`, target=`task9_restore_${tag}`;
assert.match(source,/^task9_source_[0-9a-f]{16}$/); assert.match(target,/^task9_restore_[0-9a-f]{16}$/);
const container='supabase_db_zakat-fitrah-app';
// The local container supplies its own password directly to the process; it is never printed.
const run=(args,options={})=>execFileSync('docker',['exec',...(options.input?['-i']:[]),container,'sh','-c','PGPASSWORD="$POSTGRES_PASSWORD" exec "$@"','--',...args],{...options,stdio:['pipe','pipe','pipe'],maxBuffer:64*1024*1024});
const sql=(db,statement)=>run(['psql','-U','supabase_admin','-d',db,'-v','ON_ERROR_STOP=1','-qAt','-c',statement],{encoding:'utf8'}).trim();
const actor=randomUUID(), borrower=randomUUID(), outsider=randomUUID(), person=randomUUID(), otherPerson=randomUUID(), customer=randomUUID(), otherCustomer=randomUUID(), loan=randomUUID(), payment=randomUUID(), document=randomUUID();
const created=[]; const listPath=`/tmp/${source}.list`; let listCreated=false;
try {
  // Schema-only: never dump the application's rows, auth credentials or objects.
  // Local GraphQL wrapper is installed by the platform; its extension-managed
  // function is absent from a plain database restore. Recreate its definition
  // and grants in the synthetic source before testing a second backup.
  const graphqlDefinition=sql('postgres',"SELECT pg_get_functiondef('graphql_public.graphql(text,text,jsonb,jsonb)'::regprocedure)");
  const schema=run(['pg_dump','-U','supabase_admin','-d','postgres','--schema-only','--no-owner','--exclude-schema=graphql_public','-Fc']);
  const toc=run(['pg_restore','--list'],{input:schema,encoding:'utf8'});
  // The local platform creates this wrapper outside the extension's pg_dump;
  // its ACL entry otherwise references a function missing in a clean DB.
  const filtered=toc.split('\n').filter(line=>!line.includes('graphql_public')).join('\n');
  run(['sh','-c','cat > "$1"','--',listPath],{input:Buffer.from(filtered)}); listCreated=true;
  for(const db of [source,target]) {
    run(['createdb','-U','supabase_admin','-T','template0',db]); created.push(db);
  }
  run(['pg_restore','-U','supabase_admin','--no-owner','--exit-on-error','--use-list',listPath,'-d',source],{input:schema});
  sql(source,`CREATE SCHEMA IF NOT EXISTS graphql_public; ${graphqlDefinition}; GRANT EXECUTE ON FUNCTION graphql_public.graphql(text,text,jsonb,jsonb) TO postgres,anon,authenticated,service_role;`);
  sql(source,`BEGIN;
    INSERT INTO auth.users(id,email) VALUES('${actor}','${actor}@example.test'),('${borrower}','${borrower}@example.test'),('${outsider}','${outsider}@example.test');
    INSERT INTO auth.sessions(id,user_id) VALUES('${actor}','${actor}'),('${borrower}','${borrower}'),('${outsider}','${outsider}');
    INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES('${actor}','Pengurus sintetis','${actor}@example.test','admin',true);
    INSERT INTO public.muzakki(id,nama_kk,nama_lengkap,alamat,jenis_identitas,identitas_terverifikasi) VALUES('${person}','Nasabah sintetis','Nasabah sintetis','Alamat sintetis','individu',true);
    INSERT INTO public.muzakki(id,nama_kk,nama_lengkap,alamat,jenis_identitas,identitas_terverifikasi) VALUES('${otherPerson}','Nasabah lain','Nasabah lain','Alamat sintetis','individu',true);
    INSERT INTO public.loan_customers(id,person_id,auth_user_id,created_by) VALUES('${customer}','${person}','${borrower}','${actor}');
    INSERT INTO public.loan_customers(id,person_id,auth_user_id,created_by) VALUES('${otherCustomer}','${otherPerson}','${outsider}','${actor}');
    INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,status,disbursement_date,created_by) VALUES('${loan}','RESTORE-${tag}','${customer}','Uji sintetis',1000000,'active',CURRENT_DATE,'${actor}');
    INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount) VALUES('${loan}',1,CURRENT_DATE+7,1000000);
    INSERT INTO public.loan_payments(id,loan_id,payment_date,amount,method,status,created_by,verified_by,idempotency_key) VALUES('${payment}','${loan}',CURRENT_DATE,250000,'tunai','confirmed','${actor}','${actor}',gen_random_uuid());
    INSERT INTO public.loan_audit(loan_id,actor_id,action,details) VALUES('${loan}','${actor}','payment_confirmed',jsonb_build_object('payment_id','${payment}'));
    INSERT INTO storage.buckets(id,name,public) VALUES('pinjaman-jamaah-private','pinjaman-jamaah-private',false);
    INSERT INTO storage.objects(bucket_id,name) VALUES('pinjaman-jamaah-private','${loan}/synthetic.pdf');
    INSERT INTO public.loan_documents(id,loan_id,payment_id,kind,storage_path,created_by,shared_with_customer) VALUES('${document}','${loan}','${payment}','payment_evidence','${loan}/synthetic.pdf','${actor}',true);
    COMMIT;`);
  const backup=run(['pg_dump','-U','supabase_admin','-d',source,'--no-owner','-Fc']);
  run(['pg_restore','-U','supabase_admin','--no-owner','--exit-on-error','-d',target],{input:backup});
  const result=sql(target,`SELECT concat_ws('|',m.nama_lengkap,l.loan_number,l.principal,p.amount,a.action,d.storage_path,(SELECT rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename='loans'),has_table_privilege('authenticated','public.loans','SELECT'),(SELECT count(*) FROM auth.users WHERE id IN ('${actor}','${borrower}','${outsider}'))) FROM public.muzakki m JOIN public.loan_customers c ON c.person_id=m.id JOIN public.loans l ON l.customer_id=c.id JOIN public.loan_payments p ON p.loan_id=l.id JOIN public.loan_audit a ON a.loan_id=l.id AND a.action='payment_confirmed' JOIN public.loan_documents d ON d.payment_id=p.id WHERE l.id='${loan}';`);
  assert.equal(result,`Nasabah sintetis|RESTORE-${tag}|1000000|250000|payment_confirmed|${loan}/synthetic.pdf|t|t|3`);
  const claims=JSON.stringify({sub:borrower,session_id:borrower,role:'authenticated'});
  const userCheck=sql(target,`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${borrower}',true); SELECT set_config('request.jwt.claims','${claims}',true); SELECT set_config('storage.operation','object.get_authenticated',true); SELECT concat_ws('|',public.loan_customer_session_valid(),(public.loan_print_document_data('${loan}')->>'loan_number')='RESTORE-${tag}',(SELECT count(*) FROM public.users),(SELECT count(*) FROM public.loans),(SELECT count(*) FROM storage.objects WHERE bucket_id='pinjaman-jamaah-private' AND name='${loan}/synthetic.pdf')); ROLLBACK;`);
  assert.equal(userCheck.split('\n').at(-1),'t|t|0|0|1');
  const otherClaims=JSON.stringify({sub:outsider,session_id:outsider,role:'authenticated'});
  const otherCheck=sql(target,`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${outsider}',true); SELECT set_config('request.jwt.claims','${otherClaims}',true); SELECT set_config('storage.operation','object.get_authenticated',true); SELECT concat_ws('|',(SELECT count(*) FROM public.loan_customer_loans()),(SELECT count(*) FROM storage.objects WHERE bucket_id='pinjaman-jamaah-private' AND name='${loan}/synthetic.pdf')); ROLLBACK;`);
  assert.equal(otherCheck.split('\n').at(-1),'0|0');
  assert.equal(sql(target,"SELECT (to_regprocedure('graphql_public.graphql(text,text,jsonb,jsonb)') IS NOT NULL) AND has_function_privilege('authenticated','graphql_public.graphql(text,text,jsonb,jsonb)','EXECUTE');"),'t');
  console.log('PASS: application/Auth/Storage schema and reconstructed GraphQL wrapper, synthetic data, RLS policies and privileges restored to an isolated local database');
  console.log('PASS: restored customer session can access its own projection and shared object; unrelated customer and direct staff/loan access remain blocked');
} finally {
  const errors=[];
  for(const db of created.reverse()) try { run(['dropdb','-U','supabase_admin','--if-exists',db]); } catch(error) { errors.push(error); }
  if(listCreated) try { run(['rm','-f','--',listPath]); } catch(error) { errors.push(error); }
  if(errors.length) throw new AggregateError(errors,'Temporary restore databases could not be removed');
}
