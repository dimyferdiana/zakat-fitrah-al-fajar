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
    const { data: staff, error: roleError } = await user.rpc('loan_is_staff');
    const { data: session, error: sessionError } = await user.rpc('loan_current_session_id');
    if (roleError || sessionError || staff !== true || !session) return response(403, 'Akses ditolak.');
    const form = await req.formData();
    const paymentId = form.get('paymentId'), requestId = form.get('requestId'), file = form.get('file');
    if (typeof paymentId !== 'string' || !uuid.test(paymentId) || typeof requestId !== 'string' || !uuid.test(requestId) || !(file instanceof File) || !file.size || file.size > 5242880) return response(400, 'Data atau ukuran berkas tidak valid.');
    const { data: payment, error: paymentError } = await user.from('loan_payments').select('loan_id,status').eq('id', paymentId).maybeSingle();
    if (paymentError || !payment || !['confirmed', 'cancelled'].includes(payment.status)) return response(403, 'Pembayaran tidak tersedia.');
    const bytes = await file.arrayBuffer(), b = new Uint8Array(bytes);
    const pdf = b.length >= 5 && [37,80,68,70,45].every((n,i) => b[i] === n);
    const jpg = b.length >= 3 && [255,216,255].every((n,i) => b[i] === n);
    const png = b.length >= 8 && [137,80,78,71,13,10,26,10].every((n,i) => b[i] === n);
    if (!pdf && !jpg && !png) return response(400, 'Gunakan PDF, JPEG, atau PNG.');
    const path = `${payment.loan_id}/${requestId}.${pdf ? 'pdf' : jpg ? 'jpg' : 'png'}`, digest = await hash(bytes);
    const bucket = service.storage.from('pinjaman-jamaah-private');
    await recoverUploads(service);
    await stageUpload(service, requestId, payment.loan_id, auth.user.id, session, 'staff', [path]);
    const { error: uploadError } = await bucket.upload(path, bytes, { contentType: pdf ? 'application/pdf' : jpg ? 'image/jpeg' : 'image/png', upsert: false });
    if (uploadError) {
      const { data: existing, error } = await bucket.download(path);
      if (error || !existing || await hash(await existing.arrayBuffer()) !== digest) return response(409, 'Berkas tidak dapat disimpan atau permintaan sudah digunakan.');
    }
    const { error } = await service.rpc('loan_save_staff_payment_evidence', { p_payment_id: paymentId, p_actor: auth.user.id, p_session: session, p_path: path, p_sha256: digest, p_request_id: requestId });
    if (error) return response(409, 'Bukti belum dapat dikaitkan. Silakan coba kembali.');
    return response(200);
  } catch { return response(500, 'Bukti belum dapat disimpan.'); }
});
