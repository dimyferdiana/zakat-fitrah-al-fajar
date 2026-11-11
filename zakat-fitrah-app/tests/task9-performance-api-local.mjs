// Synthetic benchmark against a disposable database and real PostgREST/RLS.
// Only schema is copied from the local project. No application data is copied.
import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { performance } from 'node:perf_hooks';
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, isAbsolute } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { localStatus, task3Fixture } from './local-supabase.mjs';

const status = localStatus();
assert.equal(new URL(status.API_URL).hostname, '127.0.0.1');
const tag = randomUUID().replaceAll('-', '').slice(0, 16);
const db = `task9_perf_${tag}`, container = `task9_perf_rest_${tag}`;
const listPath = `/tmp/${db}.list`;
const dbContainer = 'supabase_db_zakat-fitrah-app';
assert.match(db, /^task9_perf_[0-9a-f]{16}$/);
const docker = (args, opts = {}) => execFileSync('docker', args, { stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, ...opts });
const dbRun = (args, opts = {}) => docker(['exec', ...(opts.input ? ['-i'] : []), dbContainer, 'sh', '-c', 'PGPASSWORD="$POSTGRES_PASSWORD" exec "$@"', '--', ...args], opts);
const sql = (statement) => dbRun(['psql', '-U', 'supabase_admin', '-d', db, '-v', 'ON_ERROR_STOP=1', '-qAt', '-c', statement], { encoding: 'utf8' }).trim();
let createdDb = false, createdContainer = false, createdList = false, fixture, server, proxy, browser, buildDir;
try {
  fixture = await task3Fixture();
  const admin = await fixture.authUser('admin');
  const { data: { session } } = await admin.api.auth.getSession();
  assert.ok(session?.access_token);
  const claims = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64url').toString());
  const borrower = randomUUID(), borrowerSession = randomUUID(), inactive = randomUUID(), inactiveSession = randomUUID(), viewer = randomUUID(), viewerSession = randomUUID();
  assert.equal(claims.sub, admin.id);
  assert.match(claims.session_id, /^[0-9a-f-]{36}$/);

  const schema = dbRun(['pg_dump', '-U', 'supabase_admin', '-d', 'postgres', '--schema-only', '--no-owner', '--exclude-schema=graphql_public', '-Fc']);
  const toc = dbRun(['pg_restore', '--list'], { input: schema, encoding: 'utf8' });
  dbRun(['sh', '-c', 'cat > "$1"', '--', listPath], { input: Buffer.from(toc.split('\n').filter(line => !line.includes('graphql_public')).join('\n')) });
  createdList = true;
  dbRun(['createdb', '-U', 'supabase_admin', '-T', 'template0', db]);
  createdDb = true;
  dbRun(['pg_restore', '-U', 'supabase_admin', '--no-owner', '--exit-on-error', '--use-list', listPath, '-d', db], { input: schema });
  sql('CREATE SCHEMA graphql_public; GRANT USAGE ON SCHEMA graphql_public TO anon, authenticated, service_role;');
  sql(`BEGIN;
    INSERT INTO auth.users(id,email) VALUES('${admin.id}','${admin.id}@example.test'),('${borrower}','${borrower}@example.test'),('${inactive}','${inactive}@example.test'),('${viewer}','${viewer}@example.test');
    INSERT INTO auth.sessions(id,user_id) VALUES('${claims.session_id}','${admin.id}'),('${borrowerSession}','${borrower}'),('${inactiveSession}','${inactive}'),('${viewerSession}','${viewer}');
    INSERT INTO public.users(id,nama_lengkap,email,role,is_active) VALUES('${admin.id}','Admin benchmark','${admin.id}@example.test','admin',true),('${inactive}','Admin nonaktif','${inactive}@example.test','admin',false),('${viewer}','Viewer benchmark','${viewer}@example.test','viewer',true);
    CREATE TEMP TABLE perf_ids ON COMMIT DROP AS SELECT n,gen_random_uuid() person_id,gen_random_uuid() customer_id,gen_random_uuid() loan_id FROM generate_series(1,1000) n;
    INSERT INTO public.muzakki(id,nama_kk,nama_lengkap,alamat,jenis_identitas,identitas_terverifikasi)
      SELECT person_id,'Nasabah sintetis '||n,'Nasabah sintetis '||n,'Wilayah sintetis','individu',true FROM perf_ids;
    INSERT INTO public.loan_customers(id,person_id) SELECT customer_id,person_id FROM perf_ids;
    UPDATE public.loan_customers SET auth_user_id='${borrower}' WHERE id=(SELECT customer_id FROM perf_ids WHERE n=1);
    INSERT INTO public.loans(id,loan_number,customer_id,purpose,principal,status,disbursement_date,created_by,responsible_id,region_snapshot)
      SELECT loan_id,'PERF-'||n,customer_id,'Usaha sintetis',1200000,'active',CURRENT_DATE-365,'${admin.id}','${admin.id}',jsonb_build_object('rt',(n%10)::text,'rw',(n%5)::text) FROM perf_ids;
    INSERT INTO public.loan_disbursements(loan_id,disbursement_date,amount,method,created_by,request_id)
      SELECT loan_id,CURRENT_DATE-365,1200000,'tunai','${admin.id}',gen_random_uuid() FROM perf_ids;
    INSERT INTO public.loan_installments(loan_id,installment_number,due_date,amount)
      SELECT loan_id,i,CURRENT_DATE-365+i*14,100000 FROM perf_ids CROSS JOIN generate_series(1,12) i;
    INSERT INTO public.loan_payments(loan_id,payment_date,amount,method,status,created_by,idempotency_key)
      SELECT loan_id,CURRENT_DATE-180+i*14,75000,'tunai','confirmed','${admin.id}',gen_random_uuid() FROM perf_ids CROSS JOIN generate_series(1,12) i;
    COMMIT; ANALYZE public.loans; ANALYZE public.loan_installments; ANALYZE public.loan_payments;`);

  function visibleCounts(userId, sessionId) {
    const token = JSON.stringify({ sub: userId, session_id: sessionId, role: 'authenticated' });
    const counts = sql(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','${token}',true); SELECT set_config('request.jwt.claim.sub','${userId}',true); SELECT (SELECT count(*) FROM public.loans)||'|'||(SELECT count(*) FROM public.loan_customers)||'|'||(SELECT count(*) FROM public.muzakki); ROLLBACK;`);
    return counts.split('\n').at(-1);
  }
  const actors = [[admin.id, claims.session_id], [borrower, borrowerSession], [inactive, inactiveSession], [viewer, viewerSession]];
  const before = actors.map(([userId, sessionId]) => visibleCounts(userId, sessionId));
  assert.equal(before[0], '1000|1000|1000', 'Admin must see the synthetic staff data');
  assert.equal(before[1], '0|0|0', 'Borrower must not see staff tables');
  assert.equal(before[2], '0|0|0', 'Inactive staff must not see staff tables');
  assert.ok(before[3].startsWith('0|0|'), 'Viewer must not see private loan tables');
  sql(readFileSync('supabase/migrations/141_loan_staff_rls_performance.sql', 'utf8'));
  for (const [index, [userId, sessionId]] of actors.entries()) {
    assert.equal(visibleCounts(userId, sessionId), before[index], 'RLS visibility must remain identical after optimization');
  }

  const inspect = JSON.parse(docker(['inspect', 'supabase_rest_zakat-fitrah-app'], { encoding: 'utf8' }))[0];
  const env = Object.fromEntries(inspect.Config.Env.map(entry => { const i = entry.indexOf('='); return [entry.slice(0, i), entry.slice(i + 1)]; }));
  const uri = new URL(env.PGRST_DB_URI); uri.pathname = `/${db}`;
  const network = Object.keys(inspect.NetworkSettings.Networks)[0];
  assert.equal(network, 'supabase_network_zakat-fitrah-app');
  const args = ['run', '-d', '--name', container, '--network', network, '-p', '127.0.0.1::3000'];
  const containerEnv = { ...process.env };
  for (const [key, value] of Object.entries(env)) if (key.startsWith('PGRST_')) {
    args.push('-e', key);
    containerEnv[key] = key === 'PGRST_DB_URI' ? uri.toString() : value;
  }
  args.push(inspect.Config.Image);
  docker(args, { env: containerEnv }); createdContainer = true;
  const mapped = docker(['port', container, '3000/tcp'], { encoding: 'utf8' }).trim();
  assert.match(mapped, /^127\.0\.0\.1:\d+$/);
  const restPort = Number(mapped.split(':').at(-1));

  // Route auth to the real local Supabase, REST to the isolated PostgREST.
  // The proxy forwards bytes over HTTP and never replaces API responses.
  proxy = createServer((req, res) => {
    const rest = req.url.startsWith('/rest/v1/');
    const path = rest ? req.url.slice('/rest/v1'.length) : req.url;
    const upstream = httpRequest({ hostname: '127.0.0.1', port: rest ? restPort : Number(new URL(status.API_URL).port), path, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${rest ? restPort : new URL(status.API_URL).port}` } }, response => {
      res.writeHead(response.statusCode, response.headers); response.pipe(res);
    });
    upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
    req.pipe(upstream);
  });
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
  const api = `http://127.0.0.1:${proxy.address().port}`;
  let response;
  for (let i = 0; i < 25; i++) {
    try { response = await fetch(`${api}/rest/v1/rpc/loan_dashboard_report_data`, { method: 'POST', headers: { authorization: `Bearer ${session.access_token}`, apikey: status.ANON_KEY, 'content-type': 'application/json' }, body: '{}' }); if (response.ok) break; } catch { /* PostgREST starting. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!response?.ok) {
    const body = await response?.json().catch(() => null);
    const safeCode = typeof body?.code === 'string' ? body.code : 'unknown';
    const logs = spawnSync('docker', ['logs', container], { encoding: 'utf8' });
    const safeLogs = String(logs.stderr ?? '').replaceAll(env.PGRST_JWT_SECRET, '[redacted]').replaceAll(env.PGRST_DB_URI, '[redacted]').replaceAll(uri.password, '[redacted]');
    console.error(safeLogs.slice(-3000));
    const safeMessage = String(body?.message ?? '').replaceAll(uri.password, '[redacted]');
    throw new Error(`PostgREST isolated benchmark unavailable (${response?.status ?? 'no response'}, code ${safeCode}): ${safeMessage}`);
  }
  const first = await response.json();
  assert.equal(first.length, 1000);
  assert.equal(first.reduce((sum, row) => sum + row.payments.length, 0), 12000);
  const apiSamples = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    const result = await fetch(`${api}/rest/v1/rpc/loan_dashboard_report_data`, { method: 'POST', headers: { authorization: `Bearer ${session.access_token}`, apikey: status.ANON_KEY, 'content-type': 'application/json' }, body: '{}' });
    assert.equal(result.status, 200);
    assert.equal((await result.json()).length, 1000);
    apiSamples.push(performance.now() - start);
  }
  const forbidden = await fetch(`${api}/rest/v1/rpc/loan_dashboard_report_data`, { method: 'POST', headers: { apikey: status.ANON_KEY, authorization: `Bearer ${status.ANON_KEY}`, 'content-type': 'application/json' }, body: '{}' });
  assert.ok(!forbidden.ok, 'Anonymous access must fail');
  const customersResponse = await fetch(`${api}/rest/v1/loan_customers?select=id,person_id,person:muzakki!loan_customers_person_id_fkey(nama_kk,nama_lengkap,alamat)&is_active=eq.true&order=created_at.desc`, { headers: { apikey: status.ANON_KEY, authorization: `Bearer ${session.access_token}` } });
  assert.equal(customersResponse.status, 200, 'Synthetic customer list must be accessible');
  const customers = await customersResponse.json();
  assert.equal(customers.length, 1000, 'Synthetic customer list must contain all 1,000 records');

  const buildEnv = { ...process.env, VITE_SUPABASE_URL: api, VITE_SUPABASE_ANON_KEY: status.ANON_KEY, VITE_OFFLINE_MODE: 'false' };
  buildDir = mkdtempSync(join(tmpdir(), 'task9-perf-build-'));
  const rel = relative(realpathSync(tmpdir()), realpathSync(buildDir));
  assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel), 'Temporary build must remain inside the system temporary directory');
  console.log('Building production bundle for the isolated local API...');
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', buildDir], { env: buildEnv, stdio: 'ignore', windowsHide: true });
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', buildDir, '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { env: buildEnv, stdio: 'ignore', windowsHide: true });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error('Vite benchmark server failed');
    try { if ((await fetch('http://127.0.0.1:5179/login')).ok) { ready = true; break; } } catch { /* Vite starting. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(ready, 'Vite benchmark not ready');
  browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : 'chromium', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(value => localStorage.setItem('sb-127-auth-token', JSON.stringify(value)), session);
  const page = await context.newPage();
  const dashboard = page.getByText('Dashboard dan laporan pinjaman', { exact: true }).locator('../..');
  const recent = page.getByText('Pinjaman terbaru', { exact: true }).locator('../..');
  const dashboardReady = async () => {
    await expect(dashboard.getByText(/Pinjaman aktif terverifikasi/)).toContainText('1000', { timeout: 45000 });
    await expect(recent.getByRole('button')).toHaveCount(50, { timeout: 45000 });
  };
  await page.goto('http://127.0.0.1:5179/pinjaman'); await dashboardReady();
  const samples = [];
  let slowResources = [];
  for (let i = 0; i < 5; i++) {
    const begin = performance.now();
    const report = page.waitForResponse(response => response.url().includes('/rpc/loan_dashboard_report_data') && response.request().method() === 'POST', { timeout: 45000 });
    await page.reload({ waitUntil: 'domcontentloaded' }); await dashboardReady();
    const dashboardMs = performance.now() - begin;
    assert.equal((await report).status(), 200);
    if (i === 0) slowResources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => ({ path: new URL(entry.name).pathname, duration: entry.duration, start: entry.startTime })).filter(entry => entry.duration > 100).sort((a, b) => b.duration - a.duration).slice(0, 8));
    const detailStart = performance.now();
    await recent.getByRole('button').first().click();
    await expect(page.getByText('Rincian pinjaman', { exact: true }).locator('../..').locator('table tbody tr')).toHaveCount(12, { timeout: 45000 });
    samples.push({ dashboardMs, detailMs: performance.now() - detailStart });
  }
  const overdue = dashboard.getByRole('heading', { name: 'Tunggakan berdasarkan hari keterlambatan' }).locator('..');
  await expect(overdue.getByRole('button', { name: 'Siapkan pengingat' })).toHaveCount(20);
  await overdue.getByRole('button', { name: 'Halaman berikutnya Tunggakan berdasarkan hari keterlambatan' }).click();
  await expect(overdue.getByText(/Halaman 2 dari 50/)).toBeVisible();
  const account = page.getByTestId('loan-account-panel');
  const accountSearch = account.getByLabel('Cari nasabah', { exact: true }).first();
  const accountSelect = account.getByLabel('Nasabah', { exact: true }).first();
  assert.ok(await accountSelect.locator('option').count() <= 21);
  await accountSearch.fill(customers[999].id);
  await accountSelect.selectOption(customers[999].id, { timeout: 5000 });
  await accountSearch.fill('tidak ada hasil');
  await expect(accountSelect).toHaveValue(customers[999].id);
  const values = key => samples.map(sample => sample[key]).sort((a, b) => a - b);
  console.log('PASS: 1,000 synthetic loans, 12,000 payments, 12,000 installments; actual HTTP, PostgREST, JWT, RLS and browser, using an isolated local database.');
  console.log(`API + JSON parsing ms: ${apiSamples.map(value => value.toFixed(1)).join(', ')}`);
  console.log(`Slow browser requests: ${JSON.stringify(slowResources.map(item => ({ ...item, duration: Math.round(item.duration), start: Math.round(item.start) })))}`);
  console.log(`Dashboard ms: ${samples.map(s => s.dashboardMs.toFixed(1)).join(', ')}; median ${values('dashboardMs')[2].toFixed(1)}, max ${values('dashboardMs')[4].toFixed(1)}`);
  console.log(`Detail ms: ${samples.map(s => s.detailMs.toFixed(1)).join(', ')}; median ${values('detailMs')[2].toFixed(1)}, max ${values('detailMs')[4].toFixed(1)}`);
  console.log('Local production build, warm cache, headless browser, localhost proxy; does not represent production network or device.');
  if (values('dashboardMs')[4] > 3000 || values('detailMs')[4] > 2000) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
  if (proxy) await new Promise(resolve => proxy.close(resolve));
  const errors = [];
  if (createdContainer) try { docker(['rm', '-f', container]); } catch (error) { errors.push(error); }
  if (createdDb) try { dbRun(['dropdb', '-U', 'supabase_admin', '--if-exists', db]); } catch (error) { errors.push(error); }
  if (createdList) try { dbRun(['rm', '-f', '--', listPath]); } catch (error) { errors.push(error); }
  if (buildDir) try {
    const rel = relative(realpathSync(tmpdir()), realpathSync(buildDir));
    assert.ok(rel.startsWith('task9-perf-build-') && !isAbsolute(rel) && !rel.includes('..'));
    rmSync(buildDir, { recursive: true });
  } catch (error) { errors.push(error); }
  if (fixture) try { await fixture.cleanup(); } catch (error) { errors.push(error); }
  if (errors.length) throw new AggregateError(errors, 'Benchmark cleanup failed');
}
