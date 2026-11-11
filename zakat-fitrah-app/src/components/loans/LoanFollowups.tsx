import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Followup {
  id: string; followup_date: string; channel: string; outcome: string; promise_date: string | null;
  promise_amount: number | null; next_followup_date: string | null; notes: string | null; created_by: string;
}
const client = supabase as unknown as SupabaseClient;
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export function LoanFollowups({ loanId }: { loanId: string }) {
  const cache = useQueryClient();
  const [date, setDate] = useState('');
  const [channel, setChannel] = useState('langsung');
  const [outcome, setOutcome] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [promiseAmount, setPromiseAmount] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [notes, setNotes] = useState('');
  const requestId = useRef(crypto.randomUUID());
  const followups = useQuery({ queryKey: ['loan-followups', loanId], queryFn: async () => {
    const { data, error } = await client.from('loan_followups').select('id,followup_date,channel,outcome,promise_date,promise_amount,next_followup_date,notes,created_by').eq('loan_id', loanId).order('followup_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Followup[];
  } });
  const staff = useQuery({ queryKey: ['loan-followup-staff'], queryFn: async () => {
    const { data, error } = await client.from('users').select('id,nama_lengkap');
    if (error) throw error;
    return (data ?? []) as { id: string; nama_lengkap: string }[];
  } });
  const save = useMutation({ mutationFn: async () => {
    if (!date || !outcome.trim() || Boolean(promiseDate) !== Boolean(promiseAmount) || (promiseAmount && (!Number.isSafeInteger(Number(promiseAmount)) || Number(promiseAmount) <= 0))) throw new Error('Tanggal dan hasil wajib diisi; janji bayar memerlukan tanggal dan nominal yang valid.');
    const { error } = await client.rpc('loan_add_followup', { p_loan_id: loanId, p_followup_date: date, p_channel: channel, p_outcome: outcome.trim(), p_promise_date: promiseDate || null, p_promise_amount: promiseAmount ? Number(promiseAmount) : null, p_next_followup_date: nextDate || null, p_notes: notes || null, p_request_id: requestId.current });
    if (error) throw error;
  }, onSuccess: () => {
    requestId.current = crypto.randomUUID(); setOutcome(''); setPromiseDate(''); setPromiseAmount(''); setNextDate(''); setNotes('');
    void cache.invalidateQueries({ queryKey: ['loan-followups', loanId] }); void cache.invalidateQueries({ queryKey: ['loan-dashboard-current'] }); toast.success('Tindak lanjut tersimpan.');
  }, onError: error => toast.error(error instanceof Error ? error.message : 'Tindak lanjut belum dapat disimpan.') });
  return <section className="space-y-3 rounded border p-4"><h2 className="font-semibold">Tindak lanjut internal</h2>
    <p>Janji bayar hanya merupakan catatan dan tidak mengubah jadwal atau saldo.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label>Tanggal tindak lanjut<Input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
      <label>Kanal<select className="h-10 w-full rounded border bg-background px-3" value={channel} onChange={event => setChannel(event.target.value)}><option value="langsung">Langsung</option><option value="telepon">Telepon</option><option value="whatsapp">WhatsApp</option><option value="lainnya">Lainnya</option></select></label>
      <label>Tanggal janji bayar (opsional)<Input type="date" value={promiseDate} onChange={event => setPromiseDate(event.target.value)} /></label>
      <label>Nominal janji bayar (opsional)<Input type="number" min="1" step="1" value={promiseAmount} onChange={event => setPromiseAmount(event.target.value)} /></label>
      <label>Tindak lanjut berikutnya (opsional)<Input type="date" value={nextDate} onChange={event => setNextDate(event.target.value)} /></label>
    </div>
    <label className="block">Hasil komunikasi<Textarea maxLength={2000} value={outcome} onChange={event => setOutcome(event.target.value)} /></label>
    <label className="block">Catatan internal (opsional)<Textarea maxLength={4000} value={notes} onChange={event => setNotes(event.target.value)} /></label>
    <Button disabled={save.isPending} onClick={() => save.mutate()}>Simpan tindak lanjut</Button>
    {followups.error && <p role="alert" className="text-destructive">Riwayat tindak lanjut tidak dapat dimuat.</p>}
    {staff.error && <p className="text-muted-foreground">Nama petugas tidak dapat dimuat.</p>}
    {followups.data?.map(item => <div key={item.id} className="space-y-1 border-t pt-3"><p><strong>{item.followup_date}</strong> · {item.channel} · {staff.data?.find(person => person.id === item.created_by)?.nama_lengkap || 'Petugas'}</p><p>{item.outcome}</p>{item.promise_date && item.promise_amount !== null && <p>Janji bayar: {item.promise_date} · {rupiah(Number(item.promise_amount))}</p>}{item.next_followup_date && <p>Tindak lanjut berikutnya: {item.next_followup_date}</p>}{item.notes && <p>Catatan: {item.notes}</p>}</div>)}
  </section>;
}
