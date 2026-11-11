import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { validateSchedule, type Installment } from '@/lib/loanSchedule';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const client = supabase as unknown as SupabaseClient;

export function LoanScheduleEditor({ loanId, principal, plannedDate, schedule }: { loanId: string; principal: number; plannedDate: string | null; schedule: Installment[] }) {
  const cache = useQueryClient();
  const [value, setValue] = useState(() => schedule.map(item => `${item.dueDate},${item.amount}`).join('\n'));
  const [preview, setPreview] = useState<Installment[] | null>(null);
  function parse(): Installment[] {
    const items = value.split('\n').filter(line => line.trim()).map((line, index) => {
      const [dueDate, amount, ...rest] = line.split(',').map(part => part.trim());
      if (rest.length || !dueDate || !/^\d+$/.test(amount ?? '')) throw new Error(`Baris ${index + 1}: gunakan format tanggal,nominal.`);
      return { dueDate, amount: Number(amount) };
    });
    if (!plannedDate) throw new Error('Isi dan simpan rencana pencairan terlebih dahulu.');
    validateSchedule(items, principal, plannedDate);
    return items;
  }
  const save = useMutation({ mutationFn: async () => {
    const { error } = await client.rpc('loan_update_draft_schedule', { p_loan: loanId, p_schedule: parse() });
    if (error) throw error;
  }, onSuccess: () => {
    setPreview(null); void cache.invalidateQueries({ queryKey: ['staff-loan-detail',loanId] });
    toast.success('Jadwal disimpan. Kontrak dan pengecualian lama tidak berlaku jika jadwal berubah.');
  }, onError: error => toast.error(error instanceof Error ? error.message : 'Jadwal tidak dapat disimpan.') });
  return <div className="space-y-2 rounded border p-4"><h2 className="font-semibold">Ubah jadwal draft</h2>
    <p>Masukkan satu baris per angsuran: tanggal,nominal. Perubahan membatalkan kontrak bertanda tangan dan pengecualian sebelumnya.</p>
    <Textarea aria-label="Jadwal draft" rows={5} value={value} onChange={event => { setValue(event.target.value); setPreview(null); }} />
    <div className="flex gap-2"><Button variant="outline" onClick={() => { try { setPreview(parse()); } catch (error) { toast.error(error instanceof Error ? error.message : 'Jadwal tidak valid.'); } }}>Tinjau perubahan</Button>
      <Button disabled={!preview || save.isPending} onClick={() => save.mutate()}>Simpan jadwal</Button></div>
    {preview && <ul>{preview.map((item, index) => <li key={item.dueDate}>{index + 1}. {item.dueDate} — Rp{item.amount.toLocaleString('id-ID')}</li>)}</ul>}
  </div>;
}
