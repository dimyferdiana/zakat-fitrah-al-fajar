import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadDisbursementEvidence, type DisbursementEvidence } from '@/lib/loanDisbursementEvidence';

const client = supabase as unknown as SupabaseClient;

export function LoanDisbursementEvidence({ loanId, pending, onResolved }: { loanId: string; pending: DisbursementEvidence | null; onResolved: () => void }) {
  const queryClient = useQueryClient();
  const file = useRef<HTMLInputElement>(null);
  const requestId = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [formError,setFormError] = useState('');
  const disbursement = useQuery({ queryKey: ['loan-disbursement-id', loanId], queryFn: async () => {
    const { data, error } = await client.from('loan_disbursements').select('id').eq('loan_id', loanId).maybeSingle();
    if (error) throw error;
    return data as { id: string } | null;
  } });
  async function submit() {
    const evidence = pending?.file ?? file.current?.files?.[0];
    if (!evidence || !evidence.size || evidence.size > 5242880) { setFormError('Pilih PDF, JPG, atau PNG maksimal 5 MB.');file.current?.focus();return; }
    const id = pending?.disbursementId ?? disbursement.data?.id;
    if (!id) { setFormError('Data pencairan tidak tersedia.'); return; }
    const item = pending ?? { loanId, disbursementId: id, requestId: requestId.current, file: evidence };
    setBusy(true);
    try {
      await uploadDisbursementEvidence(item);
      requestId.current = crypto.randomUUID(); if (file.current) file.current.value = '';
      setFormError('');onResolved(); void queryClient.invalidateQueries({ queryKey: ['staff-loan-detail', loanId] });
      toast.success('Bukti pencairan tersimpan.');
    } catch { setFormError('Bukti belum tersimpan. Silakan ulangi unggah.');toast.error('Bukti belum tersimpan. Silakan ulangi unggah.'); }
    finally { setBusy(false); }
  }
  if (disbursement.isLoading) return <p>Memuat data pencairan...</p>;
  if (disbursement.error) return <p role="alert">Data pencairan belum dapat dimuat.</p>;
  if (!disbursement.data && !pending) return <p>Rincian pencairan historis belum tersedia.</p>;
  return <div className="space-y-2 rounded border p-3"><h2 className="font-semibold">Bukti pencairan</h2>
    {pending ? <p role="alert">Pencairan sudah tercatat, tetapi bukti belum tersimpan. Ulangi unggah bukti.</p> : <label className="block">Tambahkan bukti pencairan (opsional)<Input ref={file} type="file" accept="application/pdf,image/jpeg,image/png" aria-describedby={formError?'loan-disbursement-evidence-error':undefined} onChange={() => { requestId.current = crypto.randomUUID();setFormError(''); }} /></label>}
    {formError && <p id="loan-disbursement-evidence-error" role="alert" className="text-destructive">{formError}</p>}
    <Button variant="outline" disabled={busy} onClick={() => void submit()}>{busy?'Menyimpan...':pending ? 'Ulangi unggah bukti pencairan' : 'Simpan bukti pencairan'}</Button>
    {pending && <Button variant="outline" disabled={busy} onClick={onResolved}>Lanjutkan tanpa bukti</Button>}
  </div>;
}
