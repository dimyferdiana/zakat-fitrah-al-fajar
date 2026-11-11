import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { task3Fixture, localSql, check } from './local-supabase.mjs';

const f = await task3Fixture();
const evidence = { environment: 'local', checkedAt: new Date().toISOString(), checks: [] };
const pass = message => { evidence.checks.push(message); console.log(`PASS: ${message}`); };
const denied = result => { assert.ok(result.error || !result.data || result.data.length === 0, 'Akses seharusnya ditolak'); };
try {
  const admin = await f.authUser('admin'), staff = await f.authUser('petugas'), viewer = await f.authUser('viewer');
  const user = await f.authUser(), other = await f.authUser(), dual = await f.authUser('admin');
  const customer = await f.customer(user.id), otherCustomer = await f.customer(other.id), dualCustomer = await f.customer();
  const ownLoan = await f.loan(customer.id, admin.id), otherLoan = await f.loan(otherCustomer.id, admin.id), dualLoan = await f.loan(dualCustomer.id, admin.id);
  await f.enable();
  check(await admin.api.rpc('loan_link_staff_customer', { p_customer_id: dualCustomer.id, p_user_id: dual.id }));
  assert.ok((await admin.api.rpc('loan_link_staff_customer', { p_customer_id: customer.id, p_user_id: dual.id })).error);
  const own = check(await user.api.rpc('loan_customer_loans'));
  assert.deepEqual(own.map(row => row.id), [ownLoan.id]);
  assert.ok(!JSON.stringify(own).includes('CATATAN INTERNAL'));
  const tables = localSql("SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN('r','p','v') ORDER BY c.relname");
  for (const table of tables) {
    const result = await user.api.from(table.name).select('*').limit(1);
    if (table.name === 'loan_installments') { assert.ok(!result.error); assert.equal(result.data[0]?.loan_id, ownLoan.id); }
    else denied(result);
  }
  pass(`isolasi nasabah pada ${tables.length} tabel/view termasuk direktori, kas dan ekspor PostgREST`);
  const accessToken = (await user.api.auth.getSession()).data.session.access_token;
  const headers = { apikey: f.status.ANON_KEY, Authorization: `Bearer ${accessToken}` };
  const csv = await fetch(`${f.status.API_URL}/rest/v1/muzakki?select=id,nama_kk`, { headers: { ...headers, Accept: 'text/csv' } });
  const csvText = await csv.text();
  assert.ok(!csv.ok || csvText.trim().split(/\r?\n/).filter(Boolean).every(line => line.replaceAll('"','') === 'id,nama_kk'));
  const graphql = await fetch(`${f.status.API_URL}/graphql/v1`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: '{ muzakkiCollection(first:1) { edges { node { id } } } }' }) });
  if (graphql.ok) {
    const result = await graphql.json();
    assert.ok(result.errors || result.data?.muzakkiCollection?.edges?.length === 0);
  }
  pass('ekspor CSV dan jalur GraphQL tidak membuka direktori jamaah');
  assert.equal((await user.api.rpc('loan_is_owner', { p_loan_id: otherLoan.id })).data, false);
  assert.ok((await user.api.rpc('loan_set_session_mode', { p_mode: 'staff' })).error);
  const inviteBody = { action: 'createInvitation', email: `${randomUUID()}@example.test`, role: 'admin' };
  assert.ok((await user.api.functions.invoke('invitation-manager', { body: inviteBody })).error);
  assert.ok((await staff.api.functions.invoke('invitation-manager', { body: inviteBody })).error);
  pass('nasabah dan petugas tidak dapat membuat undangan pengurus');
  const invitation = check(await admin.api.functions.invoke('invitation-manager', { body: inviteBody }));
  const token = new URL(invitation.invitationLink).searchParams.get('token');
  const invitedPassword = `Invitation-${randomUUID()}-1z`;
  const registration = check(await f.client().functions.invoke('invitation-manager', { body: { action: 'registerUser', email: inviteBody.email, token, password: invitedPassword } }));
  f.users.push(registration.user.id);
  assert.equal(check(await f.service.from('users').select('role').eq('id',registration.user.id).single()).role, 'admin');
  pass('alur undangan pengurus tetap dapat membuat profil melalui admin API saat signup umum nonaktif');
  assert.ok((await user.api.auth.updateUser({ password: `Bypass-${randomUUID()}-1z` })).error, 'Perubahan kredensial nasabah harus melalui pemulihan admin');
  pass('perubahan password nasabah secara langsung ditolak');

  check(await dual.api.rpc('loan_set_session_mode', { p_mode: 'customer' }));
  const context = check(await dual.api.rpc('loan_auth_context'));
  assert.equal(context.staff, null); assert.equal(context.customer.id, dualCustomer.id); assert.equal(context.can_staff, true);
  assert.equal((await dual.api.rpc('loan_is_admin')).data, false);
  assert.equal((await dual.api.rpc('is_admin')).data, false);
  assert.equal((await dual.api.rpc('get_user_role')).data, null);
  denied(await dual.api.from('muzakki').select('*').limit(1));
  assert.deepEqual(check(await dual.api.rpc('loan_customer_loans')).map(row => row.id), [dualLoan.id]);
  assert.ok((await dual.api.rpc('loan_set_category', { p_id: null, p_name: 'Tidak boleh', p_active: true })).error);
  assert.ok((await dual.api.rpc('loan_set_policy', { p_min: null, p_max: null, p_min_days: null, p_max_days: null, p_guarantor: false, p_exceptions: [] })).error);
  assert.ok((await dual.api.functions.invoke('invitation-manager', { body: inviteBody })).error);
  assert.ok((await dual.api.functions.invoke('loan-contract-upload', { body: new FormData() })).error);
  check(await dual.api.rpc('loan_set_session_mode', { p_mode: 'staff' }));
  assert.equal((await dual.api.rpc('loan_is_admin')).data, true);
  assert.ok(check(await dual.api.from('muzakki').select('id').eq('id', customer.personId)).length === 1);
  pass('pengurus merangkap nasabah dibatasi di server pada mode nasabah dan dapat kembali ke mode pengurus');

  assert.ok((await viewer.api.rpc('loan_viewer_summary')).error);
  check(await admin.api.rpc('loan_set_viewer_access', { p_user_id: viewer.id, p_enabled: true }));
  assert.ok(check(await viewer.api.rpc('loan_viewer_summary')).some(row => row.id === ownLoan.id));
  denied(await viewer.api.from('loans').select('*').limit(1));
  check(await admin.api.rpc('loan_set_viewer_access', { p_user_id: viewer.id, p_enabled: false }));
  assert.ok((await viewer.api.rpc('loan_viewer_summary')).error);
  pass('izin viewer eksplisit dan pencabutannya tanpa izin mutasi');

  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jOfoAAAAASUVORK5CYII=', 'base64');
  const photo = `task3/${randomUUID()}.png`; f.objects.push(['qurban-photos', photo]);
  check(await f.service.storage.from('qurban-photos').upload(photo, bytes, { contentType: 'image/png' }));
  assert.ifError((await staff.api.storage.from('qurban-photos').download(photo)).error);
  assert.ok((await user.api.storage.from('qurban-photos').download(photo)).error);
  assert.ok((await staff.api.storage.from('qurban-photos').createSignedUrl(photo, 60)).error);
  const publicUrl = f.service.storage.from('qurban-photos').getPublicUrl(photo).data.publicUrl;
  assert.ok(!(await fetch(publicUrl)).ok);
  pass('foto legacy tersedia bagi pengurus, URL publik dan signed URL ditolak');

  const request = randomUUID(), date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const path = `${ownLoan.id}/${request}.png`; f.objects.push(['pinjaman-jamaah-private', path]);
  const form = new FormData(); form.set('loanId',ownLoan.id); form.set('requestId',request); form.set('paymentDate',date); form.set('amount','100'); form.set('reference','Uji'); form.set('file', new Blob([bytes], { type: 'image/png' }), 'bukti.png');
  const submitted = await user.api.functions.invoke('loan-payment-claim', { body: form }); check(submitted);
  assert.ifError((await user.api.storage.from('pinjaman-jamaah-private').download(path)).error);
  assert.ok((await other.api.storage.from('pinjaman-jamaah-private').download(path)).error);
  assert.ok((await user.api.storage.from('pinjaman-jamaah-private').createSignedUrl(path, 60)).error);
  const documents = check(await user.api.rpc('loan_customer_documents')); assert.equal(documents[0]?.storage_path, path);
  const payment = check(await f.service.from('loan_payments').select('id').eq('loan_id',ownLoan.id).single());
  check(await staff.api.rpc('loan_review_payment_claim', { p_payment_id: payment.id, p_accept: true, p_reason: null }));
  check(await staff.api.rpc('loan_receipt', { p_payment_id: payment.id, p_issue: true }));
  assert.ok((await other.api.rpc('loan_receipt', { p_payment_id: payment.id, p_issue: false })).error);
  check(await staff.api.rpc('loan_cancel_payment', { p_payment_id: payment.id, p_reason: 'Koreksi sintetis' }));
  pass('bukti, verifikasi petugas, tanda terima dan pembatalan beralasan; ID dokumen orang lain ditolak');
  check(await f.service.from('loan_customers').update({ is_active: false }).eq('id',customer.id));
  assert.equal((await user.api.rpc('loan_customer_session_valid')).data, false);
  assert.deepEqual(check(await user.api.rpc('loan_customer_loans')), []);
  assert.ok((await user.api.storage.from('pinjaman-jamaah-private').download(path)).error);
  check(await f.service.from('users').update({ is_active: false }).eq('id',staff.id));
  denied(await staff.api.from('muzakki').select('*').limit(1)); assert.equal((await staff.api.rpc('loan_is_staff')).data,false);
  pass('akun nasabah dan petugas nonaktif kehilangan akses meskipun token lama masih tersedia');

  const audit = localSql("SELECT jsonb_build_object('unprotected', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN('r','p') AND NOT c.relrowsecurity AND has_table_privilege('authenticated',c.oid,'SELECT')), 'anon_functions',(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND has_function_privilege('anon',p.oid,'EXECUTE')), 'public_buckets',(SELECT count(*) FROM storage.buckets WHERE public),'unsafe_views',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v' AND NOT coalesce(c.reloptions @> ARRAY['security_invoker=true'],false))) AS audit")[0].audit;
  assert.deepEqual(audit, { unprotected: 0, anon_functions: 0, public_buckets: 0, unsafe_views: 0 });
  evidence.inventory = audit; evidence.tables = tables.map(row => row.name);
  pass('inventaris: seluruh tabel RLS, view invoker, bucket privat, dan RPC anonim ditutup');
} finally { await f.cleanup(); }
writeFileSync('tests/task3-security-local.results.json', JSON.stringify(evidence, null, 2));
