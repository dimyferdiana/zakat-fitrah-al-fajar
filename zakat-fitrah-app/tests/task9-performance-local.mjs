// Reproducible, synthetic-only benchmark. All cloned structures, indexes, and
// 1,000/12,000 test rows live in one PostgreSQL temporary session, then vanish.
// This measures SQL projection/serialization and the real report calculations;
// it does not measure browser rendering, PostgREST, network latency, or RLS.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { build } from 'esbuild';
import { localStatus, task3Fixture } from './local-supabase.mjs';

const status = localStatus();
assert.equal(new URL(status.API_URL).hostname,'127.0.0.1');
const sql=String.raw`
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE muzakki (LIKE public.muzakki INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE loan_customers (LIKE public.loan_customers INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE loan_categories (LIKE public.loan_categories INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE loans (LIKE public.loans INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE loan_installments (LIKE public.loan_installments INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE loan_payments (LIKE public.loan_payments INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE loan_disbursements (LIKE public.loan_disbursements INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE loan_followups (LIKE public.loan_followups INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE loan_documents (LIKE public.loan_documents INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE loan_contract_invalidations (LIKE public.loan_contract_invalidations INCLUDING DEFAULTS INCLUDING INDEXES) ON COMMIT DROP;
CREATE TEMP TABLE perf_ids ON COMMIT DROP AS SELECT n,gen_random_uuid() person_id,gen_random_uuid() customer_id,gen_random_uuid() loan_id FROM generate_series(1,1000) n;
INSERT INTO pg_temp.muzakki(id,nama_kk,nama_lengkap,alamat) SELECT person_id,'Nasabah sintetis '||n,'Nasabah sintetis '||n,'Wilayah sintetis' FROM pg_temp.perf_ids;
INSERT INTO pg_temp.loan_customers(id,person_id) SELECT customer_id,person_id FROM pg_temp.perf_ids;
INSERT INTO pg_temp.loans(id,loan_number,customer_id,purpose,principal,status,disbursement_date,created_by,responsible_id,region_snapshot)
 SELECT loan_id,'PERF-'||n,customer_id,'Usaha sintetis',1200000,'active',CURRENT_DATE-365,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',jsonb_build_object('rt',(n%10)::text,'rw',(n%5)::text) FROM pg_temp.perf_ids;
INSERT INTO pg_temp.loan_disbursements(loan_id,disbursement_date,amount,method,created_by,request_id)
 SELECT loan_id,CURRENT_DATE-365,1200000,'tunai','00000000-0000-0000-0000-000000000001',gen_random_uuid() FROM pg_temp.perf_ids;
INSERT INTO pg_temp.loan_installments(loan_id,installment_number,due_date,amount)
 SELECT loan_id,i,CURRENT_DATE-210+i*30,100000 FROM pg_temp.perf_ids CROSS JOIN generate_series(1,12) i;
INSERT INTO pg_temp.loan_payments(loan_id,payment_date,amount,method,status,created_by,idempotency_key)
 SELECT loan_id,CURRENT_DATE-180+i*14,75000,'tunai','confirmed','00000000-0000-0000-0000-000000000001',gen_random_uuid() FROM pg_temp.perf_ids CROSS JOIN generate_series(1,12) i;
INSERT INTO pg_temp.loan_documents(loan_id,kind,storage_path,created_by,verified_by,verified_at)
 SELECT loan_id,'contract_signed','synthetic/'||n,'00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',now() FROM pg_temp.perf_ids;
ANALYZE pg_temp.muzakki; ANALYZE pg_temp.loan_customers; ANALYZE pg_temp.loans; ANALYZE pg_temp.loan_installments;
ANALYZE pg_temp.loan_payments; ANALYZE pg_temp.loan_disbursements; ANALYZE pg_temp.loan_documents;
CREATE FUNCTION pg_temp.loan_is_staff() RETURNS BOOLEAN LANGUAGE sql STABLE AS $$ SELECT true $$;
DO $$ BEGIN EXECUTE replace(pg_get_functiondef('public.loan_dashboard_report_data()'::regprocedure),'public.','pg_temp.'); END $$;
\timing on
SELECT '__SYNTHETIC_PERF__'||pg_temp.loan_dashboard_report_data()::text;
\timing off
ROLLBACK;
`;
const start=performance.now();
const output=execFileSync('docker',['exec','-i','supabase_db_zakat-fitrah-app','psql','-X','-q','-A','-t','-U','postgres','-d','postgres'],{input:sql,encoding:'utf8',maxBuffer:32*1024*1024,stdio:['pipe','pipe','pipe']});
const wallWithSetup=performance.now()-start;
const line=output.split(/\r?\n/).find(s=>s.startsWith('__SYNTHETIC_PERF__'));
if(!line) throw new Error('Hasil proyeksi sintetis tidak ditemukan');
const timing=output.match(/Time:\s*([0-9.]+)\s*ms/i);
if(!timing) throw new Error('Waktu proyeksi PostgreSQL tidak tersedia');
const projectionMs=Number(timing[1]);
const data=JSON.parse(line.slice('__SYNTHETIC_PERF__'.length));
assert.equal(data.length,1000); assert.equal(data.reduce((n,row)=>n+row.payments.length,0),12000);
const source=await build({entryPoints:['src/lib/loanReport.ts'],bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
const {reportRows,groupReport}=await import('data:text/javascript;base64,'+Buffer.from(source.outputFiles[0].text).toString('base64'));
const asOf=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const filters={from:'2000-01-01',to:asOf,asOf,category:'',customer:'',region:'',status:''};
const computeStart=performance.now();
const rows=reportRows(data,filters);
const groups=groupReport(rows,row=>row.region);
const firstPage=rows.slice(0,20); const detail=rows.find(row=>row.loan.id===firstPage[0].loan.id);
const computeMs=performance.now()-computeStart;
assert.equal(rows.length,1000); assert.equal(firstPage.length,20); assert.ok(detail); assert.ok(groups.length>0);
assert.equal(rows.reduce((n,row)=>n+row.loan.payments.length,0),12000);
console.log(`PASS: dataset sintetis 1000 pinjaman, 12000 pembayaran, 12000 angsuran; hasil proyeksi ${(Buffer.byteLength(line)/1024/1024).toFixed(2)} MiB`);
console.log(`PostgreSQL projection + pengiriman ke psql lokal: ${projectionMs.toFixed(1)} ms`);
console.log(`Perhitungan JS reportRows + groupReport + ambil 20/detail: ${computeMs.toFixed(1)} ms`);
console.log(`Total termasuk pembuatan dataset dan pembersihan sesi: ${wallWithSetup.toFixed(1)} ms`);
console.log('Batas pengukuran: belum mencakup PostgREST, jaringan, login, atau render browser; bukan bukti penuh target antarmuka tiga detik.');

if (process.argv.includes('--browser')) {
  const { chromium, expect }=await import('@playwright/test');
  const f=await task3Fixture(); let server, browser;
  try {
    const admin=await f.authUser('admin');
    server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5179','--strictPort'],{
      env:{...process.env,VITE_SUPABASE_URL:status.API_URL,VITE_SUPABASE_ANON_KEY:status.ANON_KEY,VITE_OFFLINE_MODE:'false'},stdio:['ignore','ignore','ignore'],windowsHide:true,
    });
    let online=false;
    for(let i=0;i<100;i++) {
      if(server.exitCode!==null) throw new Error('Server benchmark tidak dapat dijalankan pada port 5179');
      try { if((await fetch('http://127.0.0.1:5179/login')).ok) { online=true; break; } } catch { /* Server masih mulai. */ }
      await new Promise(resolve=>setTimeout(resolve,200));
    }
    if(!online) throw new Error('Server benchmark tidak siap');
    browser=await chromium.launch({channel:process.platform==='win32'?'msedge':'chromium',headless:true});
    const context=await browser.newContext({viewport:{width:1280,height:900}}), page=await context.newPage();
    const sample=data[0];
    const list=data.slice(0,50).map(row=>({id:row.id,loan_number:row.number,purpose:row.purpose,principal:row.principal,status:row.status,customer:{person:{nama_kk:row.name,nama_lengkap:row.name}}}));
    const detail={id:sample.id,status:sample.status,planned_disbursement_date:sample.disbursement_date,migration_cutoff:null,guarantor_relationship:null,guarantor_contact:null,guarantor:null,
      loan_installments:sample.installments.map((item,index)=>({due_date:item.dueDate,amount:item.amount,opening_remaining:null,installment_number:index+1})),
      loan_payments:sample.payments.map(item=>({id:item.id,payment_date:item.date,amount:item.amount,status:item.status,method:'tunai',reason:null})),loan_documents:[]};
    await page.route('**/rest/v1/**',async route=>{
      const url=new URL(route.request().url()), path=url.pathname, select=url.searchParams.get('select')??'';
      const reply=value=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
      if(path.endsWith('/rpc/loan_dashboard_report_data')) return reply(data);
      if(path.endsWith('/rpc/loan_collectibility_config')) return reply({enabled:false,version:null,ranges:null});
      if(path.endsWith('/rpc/loan_collectibility_status')) return reply({state:'active',enabled:false,version:null,as_of:asOf,dpd:0,overdue:0,label:null});
      if(path.endsWith('/rpc/loan_customer_collectibility')) return reply({state:'active',enabled:false,version:null,as_of:asOf,dpd:0,overdue:0,label:null});
      if(path.endsWith('/rpc/loan_staff_choices')) return reply([{id:admin.id,nama_lengkap:'Admin sintetis'}]);
      if(path.endsWith('/rpc/loan_customer_creation_enabled')) return reply(false);
      if(path.endsWith('/rpc/loan_claim_review_queue')) return reply([]);
      if(path.endsWith('/loan_customers') || path.endsWith('/loan_categories') || path.endsWith('/loan_followups')) return reply([]);
      if(path.endsWith('/loans') && select.includes('loan_installments')) return reply(detail);
      if(path.endsWith('/loans')) return reply(list);
      if(path.endsWith('/loan_disbursements')) return reply(null);
      return route.continue();
    });
    await page.goto('http://127.0.0.1:5179/login');
    await page.getByLabel('Email',{exact:true}).fill(admin.email); await page.getByLabel('Password',{exact:true}).fill(admin.password);
    await page.getByRole('button',{name:'Login',exact:true}).click(); await expect(page).toHaveURL(/\/dashboard$/);
    const dashboard=page.getByText('Dashboard dan laporan pinjaman',{exact:true}).locator('../..');
    const recent=page.getByText('Pinjaman terbaru',{exact:true}).locator('../..');
    async function ready() {
      await expect(dashboard.getByText(/Pinjaman aktif terverifikasi/)).toContainText('1000',{timeout:30000});
      await expect(recent.getByRole('button')).toHaveCount(50,{timeout:30000});
    }
    await page.goto('http://127.0.0.1:5179/pinjaman'); await ready(); // warm the development bundle
    const listStart=performance.now();
    await page.reload({waitUntil:'domcontentloaded'}); await ready();
    const pageMs=performance.now()-listStart;
    const personGroups=dashboard.getByRole('heading',{name:'Distribusi nasabah'}).locator('..');
    await expect(personGroups.locator('tbody tr')).toHaveCount(20);
    const profile=dashboard.getByRole('heading',{name:'Profil nasabah',exact:true}).locator('..');
    const profileSelect=profile.getByLabel('Pilih nasabah'), profileSearch=profile.getByLabel('Cari profil nasabah');
    assert.ok(await profileSelect.locator('option').count()<=21,'Daftar profil awal harus dibatasi 20 nasabah');
    await profileSearch.fill(data[999].customer_id);
    await profileSelect.selectOption(data[999].customer_id);
    await profileSearch.fill('nama yang tidak cocok');
    await expect(profileSelect).toHaveValue(data[999].customer_id);
    await expect(profileSelect.locator(`option[value="${data[999].customer_id}"]`)).toHaveCount(1);
    await personGroups.getByRole('button',{name:'Halaman berikutnya Distribusi nasabah'}).click();
    await expect(personGroups.getByText(/Halaman 2 dari 50/)).toBeVisible();
    const csvEvent=page.waitForEvent('download'); await dashboard.getByRole('button',{name:'Unduh CSV'}).click();
    const csvDownload=await csvEvent, chunks=[];
    for await(const chunk of await csvDownload.createReadStream()) chunks.push(chunk);
    assert.equal((Buffer.concat(chunks).toString('utf8').match(/PERF-\d+/g)??[]).length,1000,'Ekspor harus mencakup seluruh data, bukan hanya 20 baris tampilan');
    const search=dashboard.getByLabel('Nama atau nomor pinjaman');
    await search.fill('PERF-1');
    await expect(personGroups.getByText(/Halaman 1 dari/)).toBeVisible();
    await search.fill(''); await ready();
    const detailStart=performance.now();
    await recent.getByRole('button',{name:new RegExp(`^${sample.number}\\s`)}).click();
    const details=page.getByText('Rincian pinjaman',{exact:true}).locator('../..');
    await expect(details.locator('table tbody tr')).toHaveCount(12,{timeout:30000});
    const detailMs=performance.now()-detailStart;
    console.log(`Browser Edge lokal (Vite hangat, API laporan/list/detail DIMOCK, 50 baris): siap ${pageMs.toFixed(1)} ms; klik sampai rincian 12 angsuran ${detailMs.toFixed(1)} ms`);
    console.log('PASS: paginasi 20 kelompok, halaman berikutnya, reset filter dan ekspor seluruh 1000 pinjaman sintetis');
    console.log('PASS: profil dibatasi 20 pilihan, pencarian ID menemukan seluruh nasabah dan pilihan tetap tersimpan');
    console.log('Batas: login memakai akun sintetis, tetapi data 1000 pinjaman dikirim lewat mock Playwright; belum mengukur PostgREST/RLS/jaringan nyata.');
    await context.close();
  } finally {
    if(browser) await browser.close();
    if(server) server.kill();
    await f.cleanup();
  }
}
