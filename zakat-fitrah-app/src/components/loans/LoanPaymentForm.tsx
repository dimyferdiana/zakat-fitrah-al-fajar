import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshLoanProjections } from '@/lib/loanQueryRefresh';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const client = supabase as unknown as SupabaseClient;
type PendingEvidence = { paymentId: string; requestId: string; file: File };

export function LoanPaymentForm({ loanId, loanNumber, customerName, remaining }: { loanId: string; loanNumber: string; customerName: string; remaining: number | null }) {
  const cache = useQueryClient();
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('tunai');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [pendingEvidence, setPendingEvidence] = useState<PendingEvidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{date?:string;amount?:string;file?:string;form?:string}>({});
  const file = useRef<HTMLInputElement>(null);
  const dateField = useRef<HTMLInputElement>(null); const amountField = useRef<HTMLInputElement>(null);
  const paymentRequest = useRef(crypto.randomUUID());
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  function refresh() {
    void refreshLoanProjections(cache);
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
    const next: typeof errors = {};
    if (!date || date > today) next.date = 'Isi tanggal pembayaran yang tidak melewati hari ini.';
    if (!/^\d+$/.test(amount) || !Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) next.amount = 'Isi nominal positif dalam rupiah bulat.';
    if (evidence && (!evidence.size || evidence.size > 5242880)) next.file = 'Bukti harus berisi data dan maksimal 5 MB.';
    setErrors(next);
    if (next.date || next.amount || next.file) { (next.date ? dateField : next.amount ? amountField : file).current?.focus(); return; }
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
    } catch (error) { const text = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message : 'Pembayaran belum dapat dicatat.'; setErrors({form:text}); toast.error(text); }
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
    <p>{customerName} · {loanNumber} · Sisa pokok: {remaining === null ? 'Belum tersedia' : new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(remaining)}</p>
    {pendingEvidence ? <div role="alert" className="space-y-2"><p>Pembayaran sudah terkonfirmasi. Bukti belum tersimpan.</p><div className="flex gap-2"><Button disabled={busy} onClick={() => void retry()}>Ulangi unggah bukti</Button><Button variant="outline" disabled={busy} onClick={() => setPendingEvidence(null)}>Lanjutkan tanpa bukti</Button></div></div> : <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Tanggal<Input ref={dateField} aria-label="Tanggal" type="date" max={today} value={date} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'payment-date-error' : undefined} onChange={event => {setDate(event.target.value);setErrors(previous=>({...previous,date:undefined,form:undefined}));}} />{errors.date && <span id="payment-date-error" role="alert" className="text-sm text-destructive">{errors.date}</span>}</label>
        <label>Nominal (Rp)<Input ref={amountField} aria-label="Nominal (Rp)" type="number" min="1" step="1" value={amount} aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'payment-amount-error' : undefined} onChange={event => {setAmount(event.target.value);setErrors(previous=>({...previous,amount:undefined,form:undefined}));}} />{errors.amount && <span id="payment-amount-error" role="alert" className="text-sm text-destructive">{errors.amount}</span>}</label>
        <div><label htmlFor="loan-payment-method">Metode</label><Select value={method} onValueChange={setMethod}><SelectTrigger id="loan-payment-method" aria-label="Metode"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tunai">Tunai</SelectItem><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="lainnya">Lainnya</SelectItem></SelectContent></Select></div>
        <label>Referensi opsional<Input maxLength={200} value={reference} onChange={event => setReference(event.target.value)} /></label>
      </div>
      <label className="block">Catatan internal opsional<Textarea maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} /></label>
      <label className="block">Lampiran bukti opsional<Input ref={file} aria-label="Lampiran bukti opsional" type="file" accept="application/pdf,image/jpeg,image/png" aria-invalid={!!errors.file} aria-describedby={errors.file ? 'payment-file-error' : undefined} onChange={()=>setErrors(previous=>({...previous,file:undefined}))} />{errors.file && <span id="payment-file-error" role="alert" className="text-sm text-destructive">{errors.file}</span>}</label>
      {errors.form && <p role="alert" className="text-destructive">{errors.form}</p>}
      <Button className="min-h-11" disabled={busy} onClick={() => void submit()}>{busy ? 'Menyimpan...' : 'Konfirmasi pembayaran'}</Button>
    </>}
  </div>;
}
