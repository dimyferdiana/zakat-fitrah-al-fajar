import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { recoverUploads, stageUpload } from '../_shared/loan-upload-staging.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const response = (status: number, error?: string) => new Response(JSON.stringify(error ? { error } : { success: true }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash = async (bytes: ArrayBuffer) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return response(405, 'Metode tidak didukung.');
  const token = req.headers.get('Authorization'), url = Deno.env.get('SUPABASE_URL'), anon = Deno.env.get('SUPABASE_ANON_KEY'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token?.startsWith('Bearer ') || !url || !anon || !key) return response(401, 'Sesi tidak tersedia.');
  const user = createClient(url, anon, { global: { headers: { Authorization: token } }, auth: { persistSession: false } });
  const service = createClient(url, key, { auth: { persistSession: false } });
  try {
    const { data: auth, error: authError } = await user.auth.getUser();
    if (authError || !auth.user) return response(401, 'Sesi tidak valid.');
    const { data: sessionId, error: sessionError } = await user.rpc('loan_current_session_id');
    if (sessionError || !sessionId) return response(401, 'Sesi telah berakhir.');
    const form = await req.formData();
    const loanId = form.get('loanId'), requestId = form.get('requestId'), date = form.get('paymentDate'), amount = form.get('amount'), reference = form.get('reference'), note = form.get('note') ?? '';
    const files = form.getAll('files').length ? form.getAll('files') : form.getAll('file');
    if (typeof loanId !== 'string' || !uuid.test(loanId) || typeof requestId !== 'string' || !uuid.test(requestId) || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof amount !== 'string' || !/^\d{1,15}$/.test(amount) || !Number.isSafeInteger(Number(amount)) || Number(amount) <= 0 || typeof reference !== 'string' || reference.length > 200 || typeof note !== 'string' || note.length > 1000 || files.length < 1 || files.length > 3 || files.some(file => !(file instanceof File) || !file.size || file.size > 5242880)) return response(400, 'Data atau ukuran berkas tidak valid.');
    // Check ownership before accepting an object; the database repeats this check atomically.
    const { data: owned, error: ownershipError } = await user.rpc('loan_is_owner', { p_loan_id: loanId });
    if (ownershipError || owned !== true) return response(403, 'Pinjaman tidak tersedia.');
    const { data: loan, error: loanError } = await service.from('loans').select('id, customer_id, status').eq('id', loanId).maybeSingle();
    const { data: customer, error: customerError } = loan ? await service.from('loan_customers').select('id').eq('id', loan.customer_id).eq('auth_user_id', auth.user.id).eq('is_active', true).eq('access_paused', false).maybeSingle() : { data: null, error: null };
    if (loanError || customerError || !customer || !['active', 'needs_reconciliation'].includes(loan?.status)) return response(403, 'Pinjaman tidak tersedia.');
    const attachments: { path: string; sha256: string; bytes: ArrayBuffer; contentType: string }[] = [];
    for (const [index, item] of files.entries()) {
      const bytes = await (item as File).arrayBuffer(), b = new Uint8Array(bytes);
      const pdf = b.length >= 5 && [37, 80, 68, 70, 45].every((n, i) => b[i] === n);
      const jpg = b.length >= 3 && [255, 216, 255].every((n, i) => b[i] === n);
      const png = b.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => b[i] === n);
      if (!pdf && !jpg && !png) return response(400, 'Gunakan PDF, JPEG, atau PNG.');
      attachments.push({ path: `${loanId}/${requestId}${index ? `-${index}` : ''}.${pdf ? 'pdf' : jpg ? 'jpg' : 'png'}`, sha256: await hash(bytes), bytes, contentType: pdf ? 'application/pdf' : jpg ? 'image/jpeg' : 'image/png' });
    }
    const bucket = service.storage.from('pinjaman-jamaah-private');
    await recoverUploads(service);
    await stageUpload(service, requestId, loanId, auth.user.id, sessionId, 'customer', attachments.map(item => item.path));
    for (const item of attachments) {
      const { error: uploadError } = await bucket.upload(item.path, item.bytes, { contentType: item.contentType, upsert: false });
      if (uploadError) {
        const { data: existing, error: downloadError } = await bucket.download(item.path);
        if (downloadError || !existing || await hash(await existing.arrayBuffer()) !== item.sha256) return response(409, 'Berkas tidak dapat disimpan atau permintaan sudah digunakan.');
      }
    }
    const { error } = await service.rpc('loan_submit_session_claim_v3', { p_loan_id: loanId, p_payment_date: date, p_amount: Number(amount), p_reference: reference, p_note: note, p_actor_id: auth.user.id, p_request_id: requestId, p_files: attachments.map(({ path, sha256 }) => ({ path, sha256 })), p_session: sessionId });
    if (error) return response(409, 'Klaim belum dapat dicatat. Periksa data dan coba lagi.');
    return response(200);
  } catch { return response(500, 'Klaim belum dapat dikirim.'); }
});
