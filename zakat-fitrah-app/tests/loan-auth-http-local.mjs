// Black-box checks against the local Supabase CLI stack; never prints credentials.
// Start the local Edge runtime first: npx supabase functions serve loan-customer-account
import { localStatus } from './local-supabase.mjs';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

const status = localStatus();
const base = new URL(status.API_URL);
assert.equal(base.hostname, '127.0.0.1', 'Pengujian hanya boleh berjalan di Supabase lokal');
const key = status.ANON_KEY;
assert.ok(key, 'Kunci anonim lokal tidak ditemukan');
const settings = await fetch(new URL('/auth/v1/settings', base), { headers: { apikey: key } });
assert.equal(settings.status, 200);
const authSettings = await settings.json();
assert.equal(authSettings.disable_signup, true, 'Signup publik harus nonaktif');
assert.equal(authSettings.external.email, true, 'Login email harus aktif');
const signup = await fetch(new URL('/auth/v1/signup', base), {
  method: 'POST', headers: { apikey: key, 'content-type': 'application/json' },
  body: JSON.stringify({ email: `${randomUUID()}@example.test`, password: `X-${randomUUID()}-a1` }),
});
assert.ok([400, 403, 422].includes(signup.status), 'Signup publik harus ditolak');
const create = await fetch(new URL('/functions/v1/loan-customer-account', base), {
  method: 'POST', headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: '{}',
});
assert.ok([401, 403].includes(create.status), 'Pembuatan akun tanpa sesi admin harus ditolak');
console.log('PASS: signup publik dan pembuatan akun anonim ditolak');
