import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const file = useRef<HTMLInputElement>(null);
  const requestId = useRef(crypto.randomUUID());

  async function submit() {
    const evidence = Array.from(file.current?.files ?? []);
    if (!date || !/^\d+$/.test(amount) || !Number.isSafeInteger(Number(amount)) || Number(amount) <= 0 || evidence.length < 1 || evidence.length > 3 || evidence.some(item => item.size > 5242880)) {
      toast.error('Isi tanggal, nominal, dan satu sampai tiga bukti maksimal 5 MB per berkas.'); return;
    }
    const form = new FormData();
    form.set('loanId', loanId); form.set('paymentDate', date); form.set('amount', amount);
    form.set('reference', reference); form.set('note', note); form.set('requestId', requestId.current); evidence.forEach(item => form.append('files', item));
    setSending(true);
    try {
      const { data, error } = await (supabase as unknown as SupabaseClient).functions.invoke('loan-payment-claim', { body: form });
      if (error || !data?.success) throw new Error('Bukti belum dapat dikirim. Periksa data dan coba lagi.');
      requestId.current = crypto.randomUUID(); setAmount(''); setReference(''); setNote(''); if (file.current) file.current.value = '';
      void queryClient.invalidateQueries({ queryKey: ['customer-loans'] });
      toast.success('Bukti terkirim dan menunggu pemeriksaan pengurus.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Bukti belum dapat dikirim.'); }
    finally { setSending(false); }
  }
  return <div className="space-y-3 rounded border p-3"><h2 className="font-semibold">Kirim bukti transfer</h2>
    <p>Saldo diperbarui setelah pengurus memeriksa pembayaran. Pilih satu sampai tiga PDF, JPG, atau PNG, maksimal 5 MB per berkas.</p>
    <label className="block">Tanggal transfer<Input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
    <label className="block">Nominal (Rp)<Input type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} /></label>
    <label className="block">Referensi opsional<Input maxLength={200} value={reference} onChange={event => setReference(event.target.value)} /></label>
    <label className="block">Catatan opsional<Textarea maxLength={1000} value={note} onChange={event => setNote(event.target.value)} /></label>
    <label className="block">Bukti transfer<Input ref={file} type="file" multiple accept="application/pdf,image/jpeg,image/png" /></label>
    <Button disabled={sending} onClick={() => void submit()}>Kirim untuk diperiksa</Button>
  </div>;
}
