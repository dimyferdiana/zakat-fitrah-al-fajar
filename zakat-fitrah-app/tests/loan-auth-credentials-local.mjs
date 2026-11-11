// Real local Auth API test. Creates only a synthetic Auth user and deletes it in finally.
import { localStatus } from './local-supabase.mjs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const status = localStatus();
assert.equal(new URL(status.API_URL).hostname, '127.0.0.1', 'Pengujian hanya untuk Supabase lokal');
const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
const service = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const user = createClient(status.API_URL, status.ANON_KEY, options);
const email = `${randomUUID()}@example.test`;
const original = `A-${randomUUID()}-1z`;
const replacement = `B-${randomUUID()}-2z`;
let createdId;
try {
  const weak = await service.auth.admin.createUser({ email: `${randomUUID()}@example.test`, password: '1234567', email_confirm: true });
  if (weak.data?.user) await service.auth.admin.deleteUser(weak.data.user.id);
  assert.ok(weak.error, 'Server harus menolak password di bawah delapan karakter');
  const created = await service.auth.admin.createUser({ email, password: original, email_confirm: true });
  assert.ifError(created.error);
  createdId = created.data.user.id;
  const duplicate = await service.auth.admin.createUser({ email, password: original, email_confirm: true });
  assert.ok(duplicate.error, 'Email duplikat harus ditolak');
  const bad = await user.auth.signInWithPassword({ email, password: 'password-salah' });
  assert.ok(bad.error, 'Password salah harus ditolak');
  const loggedIn = await user.auth.signInWithPassword({ email, password: original });
  assert.ifError(loggedIn.error);
  const change = await service.auth.admin.updateUserById(createdId, { password: replacement });
  assert.ifError(change.error);
  const oldLogin = await user.auth.signInWithPassword({ email, password: original });
  assert.ok(oldLogin.error, 'Password lama harus ditolak');
  const newLogin = await user.auth.signInWithPassword({ email, password: replacement });
  assert.ifError(newLogin.error);
  console.log('PASS: email unik, password salah, login, dan perubahan password pada Auth lokal');
} finally {
  if (createdId) {
    const removed = await service.auth.admin.deleteUser(createdId);
    if (removed.error) throw new Error('Gagal membersihkan pengguna Auth sintetis lokal');
  }
}
