import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface DisbursementEvidence { loanId: string; disbursementId: string; requestId: string; file: File }

export async function uploadDisbursementEvidence(item: DisbursementEvidence) {
  const form = new FormData();
  form.set('disbursementId', item.disbursementId); form.set('requestId', item.requestId); form.set('file', item.file);
  const { data, error } = await (supabase as unknown as SupabaseClient).functions.invoke('loan-disbursement-evidence', { body: form });
  if (error || !data?.success) throw new Error('Bukti pencairan belum dapat disimpan.');
}
