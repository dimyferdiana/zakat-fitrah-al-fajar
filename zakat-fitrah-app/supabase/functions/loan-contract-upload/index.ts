import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { recoverUploads, stageUpload } from '../_shared/loan-upload-staging.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const response = (status: number, error?: string) => new Response(JSON.stringify(error ? { error } : { success: true }), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash = async (bytes: ArrayBuffer) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return response(405, 'Metode tidak didukung.');
  const token = req.headers.get('Authorization');
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token?.startsWith('Bearer ') || !url || !anonKey || !serviceKey) return response(401, 'Sesi tidak tersedia.');
  const user = createClient(url, anonKey, { global: { headers: { Authorization: token } }, auth: { persistSession: false } });
  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  try {
    const { data: auth, error: authError } = await user.auth.getUser();
    if (authError || !auth.user) return response(401, 'Sesi tidak valid.');
    const { data: staff, error: staffError } = await user.rpc('loan_is_staff');
    if (staffError || staff !== true) return response(403, 'Akses ditolak.');
    const { data: sessionId, error: sessionError } = await user.rpc('loan_current_session_id');
    if (sessionError || !sessionId) return response(401, 'Sesi telah berakhir.');
    const form = await req.formData();
    const loanId = form.get('loanId');
    const requestId = form.get('requestId');
    const date = form.get('disbursementDate');
    const templateId = form.get('templateId');
    const verified = form.get('verified');
    const file = form.get('file');
    if (typeof loanId !== 'string' || !uuid.test(loanId) || typeof requestId !== 'string' || !uuid.test(requestId) || typeof templateId !== 'string' || !uuid.test(templateId) || verified !== 'true' || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(file instanceof File) || file.size === 0 || file.size > 5242880) return response(400, 'Data, pemeriksaan, versi template, atau ukuran berkas tidak valid.');
    const bytes = await file.arrayBuffer();
    const b = new Uint8Array(bytes);
    const pdf = b.length >= 5 && [37, 80, 68, 70, 45].every((n, i) => b[i] === n);
    const jpg = b.length >= 3 && [255, 216, 255].every((n, i) => b[i] === n);
    const png = b.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => b[i] === n);
    if (!pdf && !jpg && !png) return response(400, 'Gunakan PDF, JPEG, atau PNG.');
    const contentType = pdf ? 'application/pdf' : jpg ? 'image/jpeg' : 'image/png';
    const path = `${loanId}/${requestId}.${pdf ? 'pdf' : jpg ? 'jpg' : 'png'}`;
    const digest = await hash(bytes);
    const bucket = service.storage.from('pinjaman-jamaah-private');
    await recoverUploads(service);
    await stageUpload(service, requestId, loanId, auth.user.id, sessionId, 'staff', [path]);
    const { error: uploadError } = await bucket.upload(path, bytes, { contentType, upsert: false });
    if (uploadError) {
      const { data: existing, error: downloadError } = await bucket.download(path);
      if (downloadError || !existing || await hash(await existing.arrayBuffer()) !== digest) return response(409, 'Berkas tidak dapat disimpan atau permintaan sudah digunakan.');
    }
    const { error } = await service.rpc('loan_save_session_contract_v2', { p_loan_id: loanId, p_storage_path: path, p_disbursement_date: date, p_actor_id: auth.user.id, p_request_id: requestId, p_file_sha256: digest, p_session: sessionId, p_template_id: templateId });
    if (error) return response(409, 'Kontrak belum dapat dicatat. Periksa draft dan tanggal pencairan.');
    return response(200);
  } catch {
    return response(500, 'Unggahan gagal. Silakan coba lagi.');
  }
});
