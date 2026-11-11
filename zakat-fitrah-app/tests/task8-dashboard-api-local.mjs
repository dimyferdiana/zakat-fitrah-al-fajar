// End-to-end authorization and projection against the local Supabase stack.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from './local-supabase.mjs';

const f = await task3Fixture();
const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86400000).toISOString().slice(0,10);
try {
  const admin = await f.authUser('admin'), staff = await f.authUser('petugas'), viewer = await f.authUser('viewer'), borrower = await f.authUser();
  const customer = await f.customer(borrower.id), loan = await f.loan(customer.id,admin.id);
  check(await f.service.from('loans').update({disbursement_date:yesterday,region_snapshot:{rt:'002',rw:'003',alamat:'Wilayah sintetis'},notes:'RAHASIA DASHBOARD SINTETIS'}).eq('id',loan.id));
  check(await f.service.from('loan_disbursements').insert({loan_id:loan.id,disbursement_date:yesterday,amount:1000,method:'tunai',created_by:admin.id,request_id:randomUUID()}));
  const payment = check(await staff.api.rpc('loan_record_staff_payment',{p_loan_id:loan.id,p_payment_date:today,p_amount:250,p_method:'tunai',p_reference:null,p_notes:'RAHASIA PEMBAYARAN SINTETIS',p_request_id:randomUUID()}));
  check(await staff.api.rpc('loan_add_followup',{p_loan_id:loan.id,p_followup_date:today,p_channel:'langsung',p_outcome:'Dihubungi',p_promise_date:today,p_promise_amount:100,p_next_followup_date:today,p_notes:'RAHASIA TINDAK LANJUT SINTETIS',p_request_id:randomUUID()}));
  for (const actor of [admin,staff]) {
    const rows=check(await actor.api.rpc('loan_dashboard_report_data'));
    const row=rows.find(item=>item.id===loan.id);
    assert.ok(row,'Pinjaman uji harus tampil kepada pengurus');
    assert.equal(row.customer_id,customer.id); assert.equal(row.region.rt,'002'); assert.equal(row.region.rw,'003');
    assert.equal(Number(row.disbursement.amount),1000); assert.equal(row.disbursement.date,yesterday);
    assert.ok(row.payments.some(item=>item.id===payment && Number(item.amount)===250 && item.status==='confirmed'));
    assert.equal(Number(row.followups[0].promise_amount),100);
    assert.ok(!JSON.stringify(row).includes('RAHASIA'),'Proyeksi laporan tidak boleh memuat catatan internal');
  }
  for (const actor of [viewer,borrower]) assert.ok((await actor.api.rpc('loan_dashboard_report_data')).error,'Viewer dan nasabah tidak boleh membaca laporan bernama');
  assert.ok((await f.client().rpc('loan_dashboard_report_data')).error,'Anon tidak boleh membaca laporan');
  const profile=check(await borrower.api.rpc('loan_customer_portal_profile'));
  assert.equal(profile.name,'Task3 Nasabah'); assert.equal(Number(profile.disbursed_known),1000); assert.equal(Number(profile.paid_known),250);
  assert.ok(!JSON.stringify(profile).includes('RAHASIA'));
  for (const actor of [admin,staff,viewer]) assert.ok((await actor.api.rpc('loan_customer_portal_profile')).error,'Profil portal hanya tersedia untuk sesi nasabah');
  check(await f.service.from('muzakki').update({alamat:'Alamat baru sintetis'}).eq('id',customer.personId));
  try {
    const row=check(await staff.api.rpc('loan_dashboard_report_data')).find(item=>item.id===loan.id);
    assert.equal(row.region.alamat,'Wilayah sintetis','Distribusi menggunakan snapshot, bukan alamat terkini');
  } finally { check(await f.service.from('muzakki').update({alamat:'Alamat sintetis task3'}).eq('id',customer.personId)); }
  console.log('PASS: proyeksi dashboard, transaksi, tindak lanjut, snapshot wilayah dan privasi catatan');
  console.log('PASS: akses admin/petugas dan penolakan viewer/nasabah/anon');
} finally { await f.cleanup(); }
