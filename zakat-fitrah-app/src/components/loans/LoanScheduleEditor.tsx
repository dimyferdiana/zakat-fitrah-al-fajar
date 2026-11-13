import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { refreshLoanProjections } from '@/lib/loanQueryRefresh';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { validateSchedule, type Installment } from '@/lib/loanSchedule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loanDate } from '@/lib/loanDisplay';

const client = supabase as unknown as SupabaseClient;

export function LoanScheduleEditor({ loanId, principal, plannedDate, schedule }: { loanId: string; principal: number; plannedDate: string | null; schedule: Installment[] }) {
  const cache = useQueryClient();
  const [rows, setRows] = useState(() => schedule.map(item => ({ id:crypto.randomUUID(), date:item.dueDate, amount:String(item.amount) })));
  const [preview, setPreview] = useState<Installment[] | null>(null);
  const [error, setError] = useState('');
  function parse(): Installment[] {
    const items = rows.map((row, index) => {
      if (!row.date || !/^\d+$/.test(row.amount)) throw new Error(`Isi tanggal dan nominal pada baris ${index + 1}.`);
      return { dueDate: row.date, amount: Number(row.amount) };
    });
    if (!plannedDate) throw new Error('Isi dan simpan rencana pencairan terlebih dahulu.');
    validateSchedule(items, principal, plannedDate);
    return items;
  }
  const save = useMutation({ mutationFn: async () => {
    const { error } = await client.rpc('loan_update_draft_schedule', { p_loan: loanId, p_schedule: parse() });
    if (error) throw error;
  }, onSuccess: () => {
    void refreshLoanProjections(cache);
    setPreview(null); void cache.invalidateQueries({ queryKey: ['staff-loan-detail',loanId] });
    toast.success('Jadwal disimpan. Kontrak dan pengecualian lama tidak berlaku jika jadwal berubah.');
  }, onError: error => {const text=error instanceof Error ? error.message : 'Jadwal tidak dapat disimpan.';setError(text);toast.error(text);} });
  return <div id="loan-schedule-editor" tabIndex={-1} aria-describedby={error ? 'loan-schedule-error' : undefined} className="space-y-2 rounded border p-4"><h2 className="font-semibold">Ubah jadwal draf</h2>
    <p>Perubahan membatalkan kontrak bertanda tangan dan pengecualian sebelumnya.</p>
    {rows.map((row,index)=><div key={row.id} className="flex flex-wrap items-end gap-2"><label className="min-w-36 flex-1">Tanggal {index+1}<Input type="date" value={row.date} onChange={event=>{setRows(current=>current.map(item=>item.id===row.id?{...item,date:event.target.value}:item));setPreview(null);}} /></label><label className="min-w-32 flex-1">Nominal {index+1}<Input type="number" min="1" step="1" value={row.amount} onChange={event=>{setRows(current=>current.map(item=>item.id===row.id?{...item,amount:event.target.value}:item));setPreview(null);}} /></label><Button variant="outline" disabled={rows.length===1} onClick={()=>{setRows(current=>current.filter(item=>item.id!==row.id));setPreview(null);}}>Hapus {index+1}</Button></div>)}
    <Button variant="outline" onClick={()=>{setRows(current=>[...current,{id:crypto.randomUUID(),date:'',amount:''}]);setPreview(null);}}>Tambah baris</Button>
    {error && <p id="loan-schedule-error" role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { try { setPreview(parse());setError(''); } catch (error) { const text=error instanceof Error ? error.message : 'Jadwal tidak valid.';setError(text);toast.error(text);document.getElementById('loan-schedule-editor')?.focus(); } }}>Tinjau perubahan</Button>
      <Button className="min-h-11" disabled={!preview || save.isPending} onClick={() => save.mutate()}>{save.isPending?'Menyimpan...':'Simpan jadwal'}</Button></div>
    {preview && <ul>{preview.map((item, index) => <li key={item.dueDate}>{index + 1}. {loanDate(item.dueDate)} — {new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(item.amount)}</li>)}</ul>}
  </div>;
}
