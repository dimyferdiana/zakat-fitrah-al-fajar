// Synthetic-only backup/restore on the local PostgreSQL container and private Storage.
// Dumps and restored bytes stay in memory; existing schemas and user data are not copied.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { localSql, localStatus, check } from './local-supabase.mjs';

const status = localStatus();
const service = createClient(status.API_URL,status.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const tag = randomUUID().replaceAll('-','').slice(0,16);
const schema = `task9_backup_${tag}`, target = `task9_restore_${tag}`;
assert.match(schema,/^task9_backup_[0-9a-f]{16}$/); assert.match(target,/^task9_restore_[0-9a-f]{16}$/);
const container = 'supabase_db_zakat-fitrah-app';
const run = (args,opts={}) => execFileSync('docker',['exec',...(opts.input ? ['-i'] : []),container,...args],{...opts,stdio:['pipe','pipe','pipe'],maxBuffer:8*1024*1024});
const person=randomUUID(), customer=randomUUID(), loan=randomUUID(), payment=randomUUID(), actor=randomUUID(), document=randomUUID();
const bucket = service.storage.from('pinjaman-jamaah-private');
const original = `task9-backup/${tag}-source.pdf`, restored = `task9-backup/${tag}-restored.pdf`;
const bytes = Buffer.from('%PDF-1.4\n% synthetic task9 backup\n%%EOF');
const sha = value => createHash('sha256').update(value).digest('hex');
let schemaCreated=false, databaseCreated=false, originalCreated=false, restoredCreated=false;
try {
  localSql(`DO $$ BEGIN
    CREATE SCHEMA ${schema};
    CREATE TABLE ${schema}.muzakki AS SELECT * FROM public.muzakki WITH NO DATA;
    CREATE TABLE ${schema}.loan_customers AS SELECT * FROM public.loan_customers WITH NO DATA;
    CREATE TABLE ${schema}.loans AS SELECT * FROM public.loans WITH NO DATA;
    CREATE TABLE ${schema}.loan_payments AS SELECT * FROM public.loan_payments WITH NO DATA;
    CREATE TABLE ${schema}.loan_audit AS SELECT * FROM public.loan_audit WITH NO DATA;
    CREATE TABLE ${schema}.loan_documents AS SELECT * FROM public.loan_documents WITH NO DATA;
    INSERT INTO ${schema}.muzakki(id,nama_kk,nama_lengkap,alamat) VALUES('${person}','Nasabah sintetis','Nasabah sintetis','Alamat sintetis');
    INSERT INTO ${schema}.loan_customers(id,person_id) VALUES('${customer}','${person}');
    INSERT INTO ${schema}.loans(id,customer_id,loan_number,principal,purpose,status) VALUES('${loan}','${customer}','BACKUP-SYNTHETIC',1000000,'Uji pemulihan','active');
    INSERT INTO ${schema}.loan_payments(id,loan_id,amount,status) VALUES('${payment}','${loan}',250000,'confirmed');
    INSERT INTO ${schema}.loan_audit(loan_id,actor_id,action,details) VALUES('${loan}','${actor}','payment_confirmed',jsonb_build_object('payment_id','${payment}'));
    INSERT INTO ${schema}.loan_documents(id,loan_id,payment_id,kind,storage_path) VALUES('${document}','${loan}','${payment}','payment_evidence','${original}');
  END $$;`);
  schemaCreated=true;
  check(await bucket.upload(original,bytes,{contentType:'application/pdf',upsert:false}));
  originalCreated=true;
  const backedUpFile = Buffer.from(await check(await bucket.download(original)).arrayBuffer());
  const archive = run(['pg_dump','-U','postgres','-d','postgres','-n',schema,'-Fc','--no-owner','--no-privileges']);
  assert.ok(archive.length > 0);
  run(['createdb','-U','postgres',target]); databaseCreated=true;
  run(['pg_restore','-U','postgres','--no-owner','--no-privileges','-d',target],{input:archive});
  const verify = `SELECT concat_ws('|',m.nama_lengkap,(c.person_id=m.id),l.loan_number,l.principal,p.amount,a.action,d.storage_path) FROM ${schema}.muzakki m JOIN ${schema}.loan_customers c ON c.person_id=m.id JOIN ${schema}.loans l ON l.customer_id=c.id JOIN ${schema}.loan_payments p ON p.loan_id=l.id JOIN ${schema}.loan_audit a ON a.loan_id=l.id JOIN ${schema}.loan_documents d ON d.payment_id=p.id;`;
  const row = run(['psql','-U','postgres','-d',target,'-At','-c',verify],{encoding:'utf8'}).trim();
  assert.equal(row,`Nasabah sintetis|t|BACKUP-SYNTHETIC|1000000|250000|payment_confirmed|${original}`);
  check(await bucket.upload(restored,backedUpFile,{contentType:'application/pdf',upsert:false}));
  restoredCreated=true;
  assert.equal(sha(Buffer.from(await check(await bucket.download(restored)).arrayBuffer())),sha(bytes));
  console.log('PASS: backup dan restore PostgreSQL sintetis untuk identitas, pinjaman, pembayaran, audit dan metadata dokumen');
  console.log('PASS: backup dan restore byte dokumen sintetis pada Storage privat dengan hash yang cocok');
} finally {
  const cleanupErrors = [];
  const createdPaths = [originalCreated && original,restoredCreated && restored].filter(Boolean);
  if (createdPaths.length) try { check(await bucket.remove(createdPaths)); } catch (error) { cleanupErrors.push(error); }
  if (databaseCreated) try { run(['dropdb','-U','postgres','--if-exists',target]); } catch (error) { cleanupErrors.push(error); }
  if (schemaCreated) try { localSql(`DROP SCHEMA ${schema} CASCADE;`); } catch (error) { cleanupErrors.push(error); }
  if (cleanupErrors.length) throw new AggregateError(cleanupErrors,'Pembersihan fixture backup lokal gagal');
}
