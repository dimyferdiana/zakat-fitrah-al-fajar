// Isolated PostgreSQL fixture; does not touch the user's local Supabase data.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const entry = process.env.LOAN_PGLITE_ENTRY ?? join(tmpdir(),'codex-loan-pg','node_modules','@electric-sql','pglite','dist','index.js');
const { PGlite } = await import(pathToFileURL(entry).href);
const db = new PGlite();
try {
  await db.exec(`
    CREATE ROLE authenticated; CREATE ROLE anon; CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('test.actor',true),'')::uuid $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE TABLE public.users(id uuid PRIMARY KEY,role text,is_active boolean);
    CREATE FUNCTION public.loan_is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce((SELECT role='admin' AND is_active FROM public.users WHERE id=auth.uid()),false) $$;
    CREATE FUNCTION public.loan_is_staff() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce((SELECT role IN ('admin','petugas') AND is_active FROM public.users WHERE id=auth.uid()),false) $$;
    CREATE TABLE public.loan_audit(id bigint GENERATED ALWAYS AS IDENTITY,actor_id uuid,action text,details jsonb);
    CREATE TABLE public.loan_customers(id uuid PRIMARY KEY);
    CREATE TABLE public.loans(id uuid PRIMARY KEY,customer_id uuid,status text,disbursement_date date,migration_cutoff date,opening_balance bigint,principal bigint);
    CREATE TABLE public.loan_installments(id uuid PRIMARY KEY,loan_id uuid,installment_number integer,due_date date,amount bigint,opening_remaining bigint);
    CREATE TABLE public.loan_payments(id uuid PRIMARY KEY,loan_id uuid,status text,payment_date date,amount bigint);
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/130_loan_collectibility.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/131_collectibility_schedule_integrity.sql',import.meta.url),'utf8'));
  await db.exec(`
    INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
    INSERT INTO public.users VALUES ('11111111-1111-4111-8111-111111111111','admin',true),('22222222-2222-4222-8222-222222222222','petugas',true);
    INSERT INTO public.loan_customers VALUES ('33333333-3333-4333-8333-333333333333');
    INSERT INTO public.loans VALUES ('44444444-4444-4444-8444-444444444444','33333333-3333-4333-8333-333333333333','active',(now() AT TIME ZONE 'Asia/Jakarta')::date-180,NULL,NULL,1000);
    INSERT INTO public.loan_installments VALUES ('55555555-5555-4555-8555-555555555555','44444444-4444-4444-8444-444444444444',1,(now() AT TIME ZONE 'Asia/Jakarta')::date,1000,NULL);
    SELECT set_config('test.actor','11111111-1111-4111-8111-111111111111',false);
  `);
  const query = async (sql,args=[]) => (await db.query(sql,args)).rows[0];
  const config = (await query('SELECT public.loan_collectibility_config() AS data')).data;
  assert.equal(config.enabled,false); assert.equal(config.ranges,null);
  const rules=[{label:'Lancar',min:0,max:0},{label:'Perhatian',min:1,max:7},{label:'Kurang lancar',min:8,max:30},{label:'Bermasalah',min:31,max:90},{label:'Macet',min:91,max:null}];
  await assert.rejects(()=>db.query('SELECT public.loan_set_collectibility(true,$1::jsonb)',[JSON.stringify([{label:'A',min:0,max:7},{label:'B',min:9,max:null}])]),/celah/);
  await assert.rejects(()=>db.query('SELECT public.loan_set_collectibility(true,$1::jsonb)',[JSON.stringify([{label:'A',min:0,max:7},{label:'B',min:7,max:null}])]),/tumpang tindih/);
  await assert.rejects(()=>db.query('SELECT public.loan_set_collectibility(true,$1::jsonb)',[JSON.stringify([{label:'A',min:0,max:7}])]),/terakhir/);
  await db.query('SELECT public.loan_set_collectibility(true,$1::jsonb)',[JSON.stringify(rules)]);
  for (const [days,label] of [[0,'Lancar'],[1,'Perhatian'],[7,'Perhatian'],[8,'Kurang lancar'],[30,'Kurang lancar'],[31,'Bermasalah'],[90,'Bermasalah'],[91,'Macet']]) {
    await db.query(`UPDATE public.loan_installments SET due_date=(now() AT TIME ZONE 'Asia/Jakarta')::date-$1::integer`,[days]);
    const state=(await query("SELECT public.loan_collectibility_status('44444444-4444-4444-8444-444444444444') AS data")).data;
    assert.equal(state.dpd,days); assert.equal(state.label,label); assert.equal(state.overdue,days?1000:0);
  }
  await db.exec(`INSERT INTO public.loan_payments VALUES ('66666666-6666-4666-8666-666666666666','44444444-4444-4444-8444-444444444444','confirmed',(now() AT TIME ZONE 'Asia/Jakarta')::date,1000)`);
  assert.equal((await query("SELECT public.loan_collectibility_status('44444444-4444-4444-8444-444444444444') AS data")).data.state,'no_obligation');
  await db.exec(`UPDATE public.loan_payments SET status='cancelled'`);
  assert.equal((await query("SELECT public.loan_collectibility_status('44444444-4444-4444-8444-444444444444') AS data")).data.label,'Macet');
  assert.equal((await query("SELECT public.loan_customer_collectibility('33333333-3333-4333-8333-333333333333') AS data")).data.label,'Macet');
  await db.query('SELECT public.loan_set_collectibility(false,NULL)');
  const disabled=(await query("SELECT public.loan_collectibility_status('44444444-4444-4444-8444-444444444444') AS data")).data;
  assert.equal(disabled.label,null); assert.equal(disabled.dpd,91); assert.equal(disabled.overdue,1000);
  await db.exec(`UPDATE public.loans SET migration_cutoff=(now() AT TIME ZONE 'Asia/Jakarta')::date-1,opening_balance=1000,principal=1200; UPDATE public.loan_installments SET opening_remaining=1000;`);
  assert.equal((await query("SELECT public.loan_collectibility_status('44444444-4444-4444-8444-444444444444') AS data")).data.state,'unavailable');
  await db.exec(`SELECT set_config('test.actor','22222222-2222-4222-8222-222222222222',false)`);
  await assert.rejects(()=>db.query('SELECT public.loan_set_collectibility(true,$1::jsonb)',[JSON.stringify(rules)]),/admin/);
  await db.exec("SELECT set_config('test.actor','',false)");
  await assert.rejects(()=>db.query('SELECT public.loan_collectibility_config()'),/Akses ditolak/);
  console.log('PASS: default nonaktif, validasi rentang, batas DPD, koreksi, ringkasan nasabah dan hak admin');
} finally { await db.close(); }
