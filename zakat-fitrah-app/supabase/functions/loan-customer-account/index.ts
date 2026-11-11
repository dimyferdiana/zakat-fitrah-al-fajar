// Admin-created customer accounts. This function must not be deployed/enabled
// until the full portal security audit and RLS/Storage tests have passed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return response(405, { error: 'Metode tidak didukung.' });
  const token = req.headers.get('Authorization');
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token?.startsWith('Bearer ') || !url || !anonKey || !serviceKey) return response(401, { error: 'Akses tidak tersedia.' });

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: token } }, auth: { persistSession: false } });
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  let createdUserId: string | null = null;
  try {
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return response(401, { error: 'Sesi tidak valid.' });
    const { data: allowed, error: roleError } = await userClient.rpc('loan_is_admin');
    if (roleError || allowed !== true) return response(403, { error: 'Hanya admin yang dapat membuat akun nasabah.' });
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') return response(400, { error: 'Data akun tidak valid.' });
    const { customerId, email, password, action } = body as Record<string, unknown>;
    if (action === 'recover_email' || action === 'recover_password') {
      if (typeof customerId !== 'string' || !/^[0-9a-f-]{36}$/i.test(customerId) ||
          (action === 'recover_email' && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) ||
          (action === 'recover_password' && (typeof password !== 'string' || password.length < 8 || password.length > 72))) {
        return response(400, { error: 'Data pemulihan tidak valid.' });
      }
      const operation = crypto.randomUUID();
      const { data: accountId, error: beginError } = await userClient.rpc('loan_begin_customer_recovery', { p_customer_id: customerId, p_operation: operation });
      if (beginError || !accountId) return response(409, { error: 'Pemulihan tidak dapat dimulai.' });
      const changes = action === 'recover_email'
        ? { email: (email as string).trim().toLowerCase(), email_confirm: true }
        : { password: password as string };
      const { error: updateError } = await adminClient.auth.admin.updateUserById(accountId, changes);
      const { error: finishError } = await adminClient.rpc('loan_complete_customer_recovery', {
        p_customer_id: customerId, p_operation: operation, p_actor: authData.user.id,
        p_kind: action === 'recover_email' ? 'email' : 'password', p_success: !updateError,
      });
      if (finishError) return response(500, { error: 'Akses masih ditangguhkan. Hubungi pengelola aplikasi.' });
      if (updateError) return response(409, { error: 'Akun belum dapat diperbarui; akses sementara ditangguhkan. Periksa data dan ulangi.' });
      return response(200, { success: true, customerId });
    }
    if (action !== undefined && action !== 'create') return response(400, { error: 'Tindakan tidak dikenal.' });
    const { data: enabled, error: enabledError } = await userClient.rpc('loan_customer_creation_enabled');
    if (enabledError || enabled !== true) return response(403, { error: 'Pembuatan akun nasabah belum diaktifkan.' });
    if (typeof customerId !== 'string' || !/^[0-9a-f-]{36}$/i.test(customerId) ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== 'string' || password.length < 8 || password.length > 72) {
      return response(400, { error: 'Nasabah, email, dan password minimal 8 karakter wajib diisi.' });
    }
    const { data: customer, error: customerError } = await userClient.from('loan_customers')
      .select('id, auth_user_id, is_active').eq('id', customerId).maybeSingle();
    if (customerError || !customer || !customer.is_active) return response(404, { error: 'Nasabah tidak ditemukan atau tidak aktif.' });
    if (customer.auth_user_id) return response(409, { error: 'Nasabah sudah memiliki akun.' });

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(), password, email_confirm: true,
    });
    if (createError || !created.user) return response(400, { error: 'Akun tidak dapat dibuat. Periksa email dan kebijakan password.' });
    createdUserId = created.user.id;
    const { error: linkError } = await userClient.rpc('loan_link_customer_account', { p_customer_id: customerId, p_auth_user_id: created.user.id });
    if (linkError) {
      // Only the account created by this request is eligible for compensation.
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id);
      return response(rollbackError ? 500 : 409, { error: rollbackError ? 'Akun perlu diperiksa admin sebelum mencoba kembali.' : 'Akun tidak dapat ditautkan. Periksa data nasabah.' });
    }
    createdUserId = null;
    return response(201, { success: true, customerId });
  } catch {
    // Never log request bodies, passwords, service keys or authentication tokens.
    if (createdUserId) await adminClient.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    return response(500, { error: 'Pembuatan akun gagal. Coba lagi atau hubungi administrator.' });
  }
});
