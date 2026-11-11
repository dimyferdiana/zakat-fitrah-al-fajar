import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cleanup only reservations the database has atomically marked aborted.
// Attached documents are never deleted even if the client lost its response.
export async function recoverUploads(service: SupabaseClient) {
  const { data, error } = await service.rpc('loan_recover_staged_uploads');
  if (!error && Array.isArray(data) && data.length) {
    const { error: removeError } = await service.storage.from('pinjaman-jamaah-private').remove(data);
    if (!removeError) await service.rpc('loan_mark_uploads_cleaned', { p_paths: data });
  }
}
export async function stageUpload(service: SupabaseClient, request: string, loan: string, actor: string, session: string, mode: 'staff' | 'customer', paths: string[]) {
  const { error } = await service.rpc('loan_stage_upload', { p_request: request, p_loan: loan, p_actor: actor, p_session: session, p_mode: mode, p_paths: paths });
  if (error) throw error;
}
