// End-to-end against the local CLI stack only. Uses synthetic accounts and exact-ID cleanup.
// Start the local functions runtime before running this test.
import { localStatus, cliRun } from './local-supabase.mjs';
import { randomUUID } from 'node:crypto';
import { writeFileSync, unlinkSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const run = args => cliRun(args.slice(2));
const status = localStatus();
assert.equal(new URL(status.API_URL).hostname, '127.0.0.1', 'Pengujian hanya untuk Supabase lokal');
const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
const service = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const admin = createClient(status.API_URL, status.ANON_KEY, options);
const customer = createClient(status.API_URL, status.ANON_KEY, options);
const adminEmail = `${randomUUID()}@example.test`, customerEmail = `${randomUUID()}@example.test`;
const adminPassword = `A-${randomUUID()}-1z`, firstPassword = `B-${randomUUID()}-2z`, nextPassword = `C-${randomUUID()}-3z`;
const personId = randomUUID(), customerId = randomUUID();
let adminId, customerAuthId, originalGate;
const cleanupFile = `tests/.recovery-cleanup-${randomUUID()}.sql`;
try {
  const createdAdmin = await service.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true });
  assert.ifError(createdAdmin.error); adminId = createdAdmin.data.user.id;
  let result = await service.from('users').insert({ id: adminId, email: adminEmail, nama_lengkap: 'Admin Uji', role: 'admin', is_active: true });
  assert.ifError(result.error);
  result = await service.from('muzakki').insert({ id: personId, nama_kk: 'Nasabah Uji', nama_lengkap: 'Nasabah Uji', alamat: 'Uji', jenis_identitas: 'individu', identitas_terverifikasi: true });
  assert.ifError(result.error);
  result = await service.from('loan_customers').insert({ id: customerId, person_id: personId, created_by: adminId });
  assert.ifError(result.error);
  assert.ifError((await admin.auth.signInWithPassword({ email: adminEmail, password: adminPassword })).error);
  const gate = await service.from('loan_portal_settings').select('account_creation_enabled').eq('id', true).single();
  assert.ifError(gate.error); originalGate = gate.data.account_creation_enabled;
  assert.ifError((await service.from('loan_portal_settings').update({ account_creation_enabled: true }).eq('id', true)).error);
  const createdCustomer = await admin.functions.invoke('loan-customer-account', { body: { customerId, email: customerEmail, password: firstPassword } });
  assert.ifError(createdCustomer.error); assert.equal(createdCustomer.data?.success, true);
  assert.ifError((await service.from('loan_portal_settings').update({ account_creation_enabled: originalGate }).eq('id', true)).error);
  assert.ifError((await customer.auth.signInWithPassword({ email: customerEmail, password: firstPassword })).error);
  customerAuthId = (await customer.auth.getUser()).data.user.id;
  assert.equal((await customer.rpc('loan_customer_session_valid')).data, true);
  const rejected = await customer.functions.invoke('loan-customer-account', { body: { action: 'recover_password', customerId, password: nextPassword } });
  assert.ok(rejected.error, 'Nasabah tidak boleh memulihkan akunnya sebagai admin');
  const recovery = await admin.functions.invoke('loan-customer-account', { body: { action: 'recover_password', customerId, password: nextPassword } });
  assert.ifError(recovery.error); assert.equal(recovery.data?.success, true);
  assert.equal((await customer.rpc('loan_customer_session_valid')).data, false, 'Token lama harus ditolak');
  assert.ok((await customer.auth.signInWithPassword({ email: customerEmail, password: firstPassword })).error);
  assert.ifError((await customer.auth.signInWithPassword({ email: customerEmail, password: nextPassword })).error);
  assert.equal((await customer.rpc('loan_customer_session_valid')).data, true);
  const duplicateEmail = await admin.functions.invoke('loan-customer-account', { body: { action: 'recover_email', customerId, email: adminEmail } });
  assert.ok(duplicateEmail.error, 'Email duplikat harus ditolak');
  assert.equal((await customer.rpc('loan_customer_session_valid')).data, false, 'Akun harus tetap tertangguh jika perubahan gagal');
  const newEmail = `${randomUUID()}@example.test`;
  const emailRecovery = await admin.functions.invoke('loan-customer-account', { body: { action: 'recover_email', customerId, email: newEmail } });
  assert.ifError(emailRecovery.error); assert.equal(emailRecovery.data?.success, true);
  assert.ok((await customer.auth.signInWithPassword({ email: customerEmail, password: nextPassword })).error);
  assert.ifError((await customer.auth.signInWithPassword({ email: newEmail, password: nextPassword })).error);
  assert.equal((await customer.rpc('loan_customer_session_valid')).data, true);
  const audit = await service.from('loan_audit').select('action,details').eq('actor_id', adminId);
  assert.ifError(audit.error);
  assert.equal(audit.data.filter(row => row.action === 'customer_recovery_started').length, 3);
  assert.equal(audit.data.filter(row => row.action === 'customer_recovery_completed').length, 2);
  assert.ok(!JSON.stringify(audit.data).includes(nextPassword), 'Audit tidak boleh berisi password');
  console.log('PASS: pembuatan akun admin, login, pemulihan password/email, pencabutan sesi, email duplikat, dan penolakan nasabah');
} finally {
  // Synthetic identities alone bypass the permanent-delete trigger during cleanup.
  // Every target is a newly generated UUID and this script rejects non-local API URLs.
  const actor = adminId ?? '00000000-0000-0000-0000-000000000000';
  if (originalGate !== undefined) assert.ifError((await service.from('loan_portal_settings').update({ account_creation_enabled: originalGate }).eq('id', true)).error);
  if (!customerAuthId) {
    const linked = await service.from('loan_customers').select('auth_user_id').eq('id', customerId).maybeSingle();
    customerAuthId = linked.data?.auth_user_id;
  }
  writeFileSync(cleanupFile, `DO $$ BEGIN DELETE FROM public.loan_audit WHERE actor_id='${actor}'::uuid OR details->>'customer_id'='${customerId}'; DELETE FROM public.loan_customers WHERE id='${customerId}'::uuid; ALTER TABLE public.muzakki DISABLE TRIGGER person_block_permanent_delete; DELETE FROM public.muzakki WHERE id='${personId}'::uuid AND nama_kk='Nasabah Uji'; ALTER TABLE public.muzakki ENABLE TRIGGER person_block_permanent_delete; END $$;`);
  try { run(['--no-install', 'supabase', 'db', 'query', '--file', cleanupFile]); }
  finally { unlinkSync(cleanupFile); }
  if (customerAuthId) assert.ifError((await service.auth.admin.deleteUser(customerAuthId)).error);
  if (adminId) assert.ifError((await service.auth.admin.deleteUser(adminId)).error);
}
