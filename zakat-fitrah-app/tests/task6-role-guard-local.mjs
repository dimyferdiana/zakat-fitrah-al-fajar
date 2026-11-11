import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { task3Fixture, check } from './local-supabase.mjs';

// This fixture refuses non-local Supabase URLs and creates disposable users.
const f = await task3Fixture();
try {
  const admin = await f.authUser('admin');
  const staff = await f.authUser('petugas');
  const viewer = await f.authUser('viewer');
  const customer = await f.authUser();
  const dual = await f.authUser('admin');
  const dualCustomer = await f.customer();
  await f.enable();
  check(await admin.api.rpc('loan_link_staff_customer', { p_customer_id: dualCustomer.id, p_user_id: dual.id }));
  check(await dual.api.rpc('loan_set_session_mode', { p_mode: 'customer' }));

  for (const user of [staff, viewer, customer, dual]) {
    const before = check(await f.service.from('users').select('role,is_active,email').eq('id', user.id));
    for (const changes of [{ role: user.id === dual.id ? 'petugas' : 'admin' }, { is_active: false }, { email: `${randomUUID()}@example.test` }]) {
      const attempt = await user.api.from('users').update(changes).eq('id', user.id).select();
      assert.ok(attempt.error || attempt.data.length === 0, `Perubahan ${Object.keys(changes)[0]} sendiri tidak boleh berhasil`);
      assert.deepEqual(check(await f.service.from('users').select('role,is_active,email').eq('id', user.id)), before);
    }
  }
  console.log('PASS: petugas, viewer, nasabah dan admin mode nasabah tidak dapat mengubah role, status atau email sendiri');

  check(await admin.api.from('users').update({ role: 'viewer' }).eq('id', staff.id));
  assert.equal(check(await f.service.from('users').select('role').eq('id', staff.id).single()).role, 'viewer');
  console.log('PASS: admin dalam mode pengurus tetap dapat mengelola role');
} finally {
  await f.cleanup();
}
