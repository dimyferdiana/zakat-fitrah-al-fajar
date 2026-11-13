import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export async function downloadPaymentProof(path: string) {
  try {
    const { data, error } = await (supabase as unknown as SupabaseClient).storage.from('pinjaman-jamaah-private').download(path);
    if (error || !data) throw new Error('Bukti tidak dapat diunduh.');
    const url = URL.createObjectURL(data); const link = document.createElement('a');
    link.href = url; link.download = `bukti-pembayaran.${path.split('.').pop() || 'bin'}`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch { toast.error('Bukti tidak dapat diunduh. Periksa izin dan coba lagi.'); }
}
