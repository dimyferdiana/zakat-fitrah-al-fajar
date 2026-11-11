import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../node_modules/supabase/dist/supabase.js', import.meta.url));
export function cliRun(args) { return execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
export function localStatus() {
  const status = JSON.parse(cliRun(['status', '-o', 'json']));
  if (new URL(status.API_URL).hostname !== '127.0.0.1') throw new Error('Pengujian hanya boleh menggunakan Supabase lokal');
  return status;
}
export function localSql(sql) {
  const file = `tests/.task3-${randomUUID()}.sql`;
  writeFileSync(file, sql);
  try { const out = cliRun(['db', 'query', '--file', file]); return out.trim().startsWith('{') ? JSON.parse(out).rows : []; }
  finally { unlinkSync(file); }
}
const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
export async function task3Fixture() {
  const status = localStatus();
  const service = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
  const client = () => createClient(status.API_URL, status.ANON_KEY, options);
  const users = [], people = [], customers = [], loans = [], objects = [];
  const gate = await service.from('loan_portal_settings').select('account_creation_enabled').eq('id', true).single();
  if (gate.error) throw new Error('Pengaturan portal lokal tidak tersedia');
  const originalGate = gate.data.account_creation_enabled;
  async function authUser(role = null) {
    const credentials = { email: `${randomUUID()}@example.test`, password: `T-${randomUUID()}-1z` };
    const result = await service.auth.admin.createUser({ ...credentials, email_confirm: true });
    if (result.error) throw new Error('Akun uji lokal tidak dapat dibuat');
    const id = result.data.user.id; users.push(id);
    if (role) check(await service.from('users').insert({ id, email: credentials.email, nama_lengkap: `Task3 ${role}`, role, is_active: true }));
    const api = client(); check(await api.auth.signInWithPassword(credentials));
    return { id, ...credentials, api };
  }
  async function person(name = 'Task3 Nasabah') {
    const id = randomUUID(); people.push(id);
    check(await service.from('muzakki').insert({ id, nama_kk: name, nama_lengkap: name, alamat: 'Alamat sintetis task3', no_telp: '0800000000', jenis_identitas: 'individu', identitas_terverifikasi: true }));
    return id;
  }
  async function customer(authId = null, personId = null) {
    const pid = personId ?? await person(); const id = randomUUID(); customers.push(id);
    check(await service.from('loan_customers').insert({ id, person_id: pid, auth_user_id: authId }));
    return { id, personId: pid };
  }
  async function loan(customerId, actor, number = `TASK3-${randomUUID()}`) {
    const id = randomUUID(); loans.push(id);
    check(await service.from('loans').insert({ id, loan_number: number, customer_id: customerId, purpose: 'Uji task3', principal: 1000, status: 'active', created_by: actor, notes: 'CATATAN INTERNAL TASK3' }));
    check(await service.from('loan_installments').insert({ loan_id: id, installment_number: 1, due_date: '2027-12-31', amount: 1000 }));
    return { id, number };
  }
  async function enable(value = true) { check(await service.from('loan_portal_settings').update({ account_creation_enabled: value }).eq('id', true)); }
  async function cleanup() {
    await enable(originalGate);
    for (const [bucket, path] of objects) check(await service.storage.from(bucket).remove([path]));
    // Targets are exclusively newly generated IDs in this local-only fixture.
    const ids = list => list.length ? list.map(id => `'${id}'::uuid`).join(',') : "'00000000-0000-0000-0000-000000000000'::uuid";
    const textIds = list => list.length ? list.map(id => `'${id}'`).join(',') : "''";
    localSql(`DO $$ BEGIN
      PERFORM set_config('request.jwt.claim.sub','${users[0] ?? ''}',true);
      DELETE FROM public.loan_receipts WHERE payment_id IN(SELECT id FROM public.loan_payments WHERE loan_id IN(${ids(loans)}));
      DELETE FROM public.loan_contract_invalidations WHERE document_id IN(SELECT id FROM public.loan_documents WHERE loan_id IN(${ids(loans)}));
      DELETE FROM public.loan_documents WHERE loan_id IN(${ids(loans)});
      DELETE FROM public.loan_upload_staging WHERE loan_id IN(${ids(loans)}) OR actor_id IN(${ids(users)});
      DELETE FROM public.loan_payments WHERE loan_id IN(${ids(loans)});
      DELETE FROM public.loan_installments WHERE loan_id IN(${ids(loans)});
      DELETE FROM public.loan_policy_exceptions WHERE loan_id IN(${ids(loans)});
      DELETE FROM public.loan_disbursements WHERE loan_id IN(${ids(loans)});
      DELETE FROM public.loan_followups WHERE loan_id IN(${ids(loans)});
      DELETE FROM public.loan_contract_templates WHERE created_by IN(${ids(users)});
      DELETE FROM public.loan_audit WHERE actor_id IN(${ids(users)}) OR loan_id IN(${ids(loans)})
        OR details->>'customer_id' IN(${textIds(customers)}) OR details->>'person_id' IN(${textIds(people)}) OR details->>'user_id' IN(${textIds(users)});
      DELETE FROM public.loans WHERE id IN(${ids(loans)});
      DELETE FROM public.loan_viewer_permissions WHERE user_id IN(${ids(users)}) OR granted_by IN(${ids(users)});
      DELETE FROM public.loan_customers WHERE id IN(${ids(customers)});
      ALTER TABLE public.muzakki DISABLE TRIGGER person_block_permanent_delete;
      DELETE FROM public.muzakki WHERE id IN(${ids(people)}) AND alamat='Alamat sintetis task3';
      ALTER TABLE public.muzakki ENABLE TRIGGER person_block_permanent_delete;
      DELETE FROM public.user_invitations WHERE created_by IN(${ids(users)});
      DELETE FROM public.users WHERE id IN(${ids(users)});
      DELETE FROM public.loan_audit WHERE actor_id IN(${ids(users)}) OR details->>'customer_id' IN(${textIds(customers)})
        OR details->>'person_id' IN(${textIds(people)}) OR details->>'user_id' IN(${textIds(users)});
    END $$;`);
    for (const id of users) check(await service.auth.admin.deleteUser(id));
  }
  return { status, service, client, authUser, person, customer, loan, enable, cleanup, objects, users, customers, loans };
}
export function check(result) { if (result.error) throw new Error(`Supabase lokal: ${result.error.message}`); return result.data; }
