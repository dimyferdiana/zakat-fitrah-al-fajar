import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const client = supabase as unknown as SupabaseClient;
type PendingEvidence = { paymentId: string; requestId: string; file: File };

export function LoanPaymentForm({ loanId }: { loanId: string }) {
  const cache = useQueryClient();
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('tunai');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [pendingEvidence, setPendingEvidence] = useState<PendingEvidence | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const paymentRequest = useRef(crypto.randomUUID());
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  function refresh() {
    for (const key of [['staff-loan-detail', loanId], ['staff-loans'], ['loan-dashboard-current'], ['customer-loans'], ['customer-portal-profile'], ['loan-customer-obligations'], ['loan-collectibility-status'], ['loan-customer-collectibility']]) void cache.invalidateQueries({ queryKey: key });
  }
  async function upload(item: PendingEvidence) {
    const form = new FormData(); form.set('paymentId', item.paymentId); form.set('requestId', item.requestId); form.set('file', item.file);
    const { data, error } = await client.functions.invoke('loan-staff-payment-evidence', { body: form });
    if (error || !data?.success) throw new Error('Bukti belum dapat disimpan.');
    setPendingEvidence(null); refresh(); toast.success('Bukti pembayaran tersimpan.');
  }
  async function submit() {
    const evidence = file.current?.files?.[0];
    if (!date || !/^\d+$/.test(amount) || !Number.isSafeInteger(Number(amount)) || Number(amount) <= 0 || (evidence && evidence.size > 5242880)) {
      toast.error('Isi tanggal dan nominal valid. Bukti maksimal 5 MB.'); return;
    }
    setBusy(true);
    try {
      const { data: paymentId, error } = await client.rpc('loan_record_staff_payment', {
        p_loan_id: loanId, p_payment_date: date, p_amount: Number(amount), p_method: method,
        p_reference: reference || null, p_notes: notes || null, p_request_id: paymentRequest.current,
      });
      if (error) throw error;
      paymentRequest.current = crypto.randomUUID(); setAmount(''); setReference(''); setNotes('');
      if (file.current) file.current.value = '';
      refresh();
      if (!evidence) { toast.success('Pembayaran terkonfirmasi.'); return; }
      const item = { paymentId: paymentId as string, requestId: crypto.randomUUID(), file: evidence };
      setPendingEvidence(item);
      try { await upload(item); }
      catch { toast.error('Pembayaran sudah tercatat, tetapi bukti belum tersimpan. Ulangi unggah bukti.'); }
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Pembayaran belum dapat dicatat.'); }
    finally { setBusy(false); }
  }
  async function retry() {
    if (!pendingEvidence) return;
    setBusy(true);
    try { await upload(pendingEvidence); }
    catch { toast.error('Bukti belum tersimpan. Coba kembali.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3 rounded border p-4"><h2 className="font-semibold">Catat pembayaran</h2>
    {pendingEvidence ? <div role="alert" className="space-y-2"><p>Pembayaran sudah terkonfirmasi. Bukti belum tersimpan.</p><div className="flex gap-2"><Button disabled={busy} onClick={() => void retry()}>Ulangi unggah bukti</Button><Button variant="outline" disabled={busy} onClick={() => setPendingEvidence(null)}>Lanjutkan tanpa bukti</Button></div></div> : <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Tanggal<Input type="date" max={today} value={date} onChange={event => setDate(event.target.value)} /></label>
        <label>Nominal (Rp)<Input type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} /></label>
        <label>Metode<select className="h-10 w-full rounded border bg-background px-3" value={method} onChange={event => setMethod(event.target.value)}><option value="tunai">Tunai</option><option value="transfer">Transfer</option><option value="lainnya">Lainnya</option></select></label>
        <label>Referensi opsional<Input maxLength={200} value={reference} onChange={event => setReference(event.target.value)} /></label>
      </div>
      <label className="block">Catatan internal opsional<Textarea maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} /></label>
      <label className="block">Lampiran bukti opsional<Input ref={file} type="file" accept="application/pdf,image/jpeg,image/png" /></label>
      <Button disabled={busy} onClick={() => void submit()}>Konfirmasi pembayaran</Button>
    </>}
  </div>;
}
