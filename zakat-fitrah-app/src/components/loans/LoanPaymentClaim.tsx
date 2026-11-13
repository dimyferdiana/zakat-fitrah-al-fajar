import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshLoanProjections } from '@/lib/loanQueryRefresh';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function LoanPaymentClaim({ loanId }: { loanId: string }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [errors,setErrors] = useState<{date?:string;amount?:string;file?:string;form?:string}>({});
  const file = useRef<HTMLInputElement>(null);
  const dateField = useRef<HTMLInputElement>(null); const amountField = useRef<HTMLInputElement>(null);
  const requestId = useRef(crypto.randomUUID());

  async function submit() {
    const evidence = Array.from(file.current?.files ?? []);
    const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const next:typeof errors={};
    if(!date || date>today)next.date='Isi tanggal transfer yang tidak melewati hari ini.';
    if(!/^\d+$/.test(amount) || !Number.isSafeInteger(Number(amount)) || Number(amount)<=0)next.amount='Isi nominal positif dalam rupiah bulat.';
    if(evidence.length<1 || evidence.length>3 || evidence.some(item=>!item.size || item.size>5242880))next.file='Pilih satu sampai tiga bukti, maksimal 5 MB per berkas.';
    setErrors(next);if(next.date || next.amount || next.file){(next.date?dateField:next.amount?amountField:file).current?.focus();return;}
    const form = new FormData();
    form.set('loanId', loanId); form.set('paymentDate', date); form.set('amount', amount);
    form.set('reference', reference); form.set('note', note); form.set('requestId', requestId.current); evidence.forEach(item => form.append('files', item));
    setSending(true);
    try {
      const { data, error } = await (supabase as unknown as SupabaseClient).functions.invoke('loan-payment-claim', { body: form });
      if (error || !data?.success) throw new Error('Bukti belum dapat dikirim. Periksa data dan coba lagi.');
      requestId.current = crypto.randomUUID(); setAmount(''); setReference(''); setNote(''); if (file.current) file.current.value = '';
      void refreshLoanProjections(queryClient);
      void queryClient.invalidateQueries({ queryKey: ['customer-loans'] });
      toast.success('Bukti terkirim dan menunggu pemeriksaan pengurus.');
    } catch (error) { const text=error instanceof Error ? error.message : 'Bukti belum dapat dikirim.';setErrors({form:text});toast.error(text); }
    finally { setSending(false); }
  }
  return <div className="space-y-3 rounded border p-3"><h2 className="font-semibold">Kirim bukti transfer</h2>
    <p>Saldo diperbarui setelah pengurus memeriksa pembayaran. Pilih satu sampai tiga PDF, JPG, atau PNG, maksimal 5 MB per berkas.</p>
    <label className="block">Tanggal transfer<Input ref={dateField} aria-label="Tanggal transfer" type="date" value={date} aria-invalid={!!errors.date} aria-describedby={errors.date?'claim-date-error':undefined} onChange={event => {setDate(event.target.value);setErrors(previous=>({...previous,date:undefined,form:undefined}));}} />{errors.date && <span id="claim-date-error" role="alert" className="text-destructive">{errors.date}</span>}</label>
    <label className="block">Nominal (Rp)<Input ref={amountField} aria-label="Nominal (Rp)" type="number" min="1" step="1" value={amount} aria-invalid={!!errors.amount} aria-describedby={errors.amount?'claim-amount-error':undefined} onChange={event => {setAmount(event.target.value);setErrors(previous=>({...previous,amount:undefined,form:undefined}));}} />{errors.amount && <span id="claim-amount-error" role="alert" className="text-destructive">{errors.amount}</span>}</label>
    <label className="block">Referensi opsional<Input maxLength={200} value={reference} onChange={event => setReference(event.target.value)} /></label>
    <label className="block">Catatan opsional<Textarea maxLength={1000} value={note} onChange={event => setNote(event.target.value)} /></label>
    <label className="block">Bukti transfer<Input ref={file} aria-label="Bukti transfer" type="file" multiple accept="application/pdf,image/jpeg,image/png" aria-invalid={!!errors.file} aria-describedby={errors.file?'claim-file-error':undefined} onChange={()=>setErrors(previous=>({...previous,file:undefined}))} />{errors.file && <span id="claim-file-error" role="alert" className="text-destructive">{errors.file}</span>}</label>
    {errors.form && <p role="alert" className="text-destructive">{errors.form}</p>}
    <Button className="min-h-11" disabled={sending} onClick={() => void submit()}>{sending?'Mengirim...':'Kirim untuk diperiksa'}</Button>
  </div>;
}
