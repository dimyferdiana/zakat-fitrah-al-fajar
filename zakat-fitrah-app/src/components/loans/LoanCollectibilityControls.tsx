import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { loanDate } from '@/lib/loanDisplay';
import type { CollectibilityConfig, CollectibilityRange } from '@/lib/loanCollectibility';

const client = supabase as unknown as SupabaseClient;
type Row = { label:string; min:string; max:string };
const example: Row[] = [
  {label:'Lancar',min:'0',max:'0'},{label:'Perhatian',min:'1',max:'7'},
  {label:'Kurang lancar',min:'8',max:'30'},{label:'Bermasalah',min:'31',max:'90'},
  {label:'Macet',min:'91',max:''},
];

export function LoanCollectibilityControls({ isAdmin }: { isAdmin: boolean }) {
  const cache = useQueryClient();
  const [enabled,setEnabled] = useState(false);
  const [rows,setRows] = useState<Row[]>([]);
  const [formError,setFormError] = useState('');
  const config = useQuery({ queryKey:['loan-collectibility-config'], queryFn: async () => {
    const { data,error } = await client.rpc('loan_collectibility_config'); if (error) throw error;
    return data as CollectibilityConfig;
  } });
  const save = useMutation({ mutationFn: async () => {
    const ranges = rows.length ? rows.map((row):CollectibilityRange => {
      if (!row.label.trim() || !/^\d+$/.test(row.min) || (row.max && !/^\d+$/.test(row.max))) throw new Error('Label dan batas harus diisi dengan angka bulat.');
      return {label:row.label.trim(),min:Number(row.min),max:row.max ? Number(row.max) : null};
    }) : null;
    if (enabled && !ranges) throw new Error('Aturan harus ditetapkan sebelum diaktifkan.');
    const { error } = await client.rpc('loan_set_collectibility',{p_enabled:enabled,p_ranges:ranges}); if (error) throw error;
  }, onSuccess: () => { setFormError('');void cache.invalidateQueries({queryKey:['loan-collectibility-config']}); void cache.invalidateQueries({queryKey:['loan-collectibility-status']}); void cache.invalidateQueries({queryKey:['loan-customer-collectibility']}); toast.success('Versi kolektabilitas tersimpan.'); }, onError: error => {const text=error instanceof Error ? error.message : 'Pengaturan kolektabilitas belum dapat disimpan.';setFormError(text);toast.error(text);document.getElementById(rows.length?'loan-collectibility-label-0':'loan-collectibility-add')?.focus();} });
  function loadCurrent() {
    setEnabled(config.data?.enabled ?? false);
    setRows((config.data?.ranges ?? []).map(row=>({label:row.label,min:String(row.min),max:row.max === null ? '' : String(row.max)})));
  }
  function change(index:number,field:keyof Row,value:string) { setRows(current=>current.map((row,i)=>i===index?{...row,[field]:value}:row)); }
  return <section className="space-y-3 rounded border p-4"><h2 className="font-semibold">Kolektabilitas internal</h2>
    <p className="text-sm">{config.data?.enabled ? `Aktif, versi ${config.data.version}.` : 'Nonaktif.'} Label hanya acuan program berdasarkan hari keterlambatan, bukan skor kredit atau klasifikasi regulator.</p>
    {config.error && <p role="alert">Pengaturan kolektabilitas tidak dapat dimuat.</p>}
    {isAdmin && <>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={loadCurrent}>Muat pengaturan tersimpan</Button><Button variant="outline" onClick={()=>setRows(example.map(row=>({...row})))}>Muat contoh yang belum disahkan</Button></div>
      <p className="text-sm">Rentang harus mulai dari hari 0, berurutan tanpa celah, dan rentang terakhir tidak memiliki batas atas. Pengurus wajib menyetujui aturan sebelum mengaktifkan.</p>
      {rows.map((row,index)=><div key={index} className="grid gap-2 border-t pt-2 sm:grid-cols-4">
        <label>Label {index+1}<Input id={`loan-collectibility-label-${index}`} aria-describedby={formError?'loan-collectibility-error':undefined} value={row.label} onChange={event=>change(index,'label',event.target.value)} /></label>
        <label>Mulai hari<Input type="number" min="0" value={row.min} onChange={event=>change(index,'min',event.target.value)} /></label>
        <label>Sampai hari<Input type="number" min="0" value={row.max} onChange={event=>change(index,'max',event.target.value)} placeholder="Kosong untuk terakhir" /></label>
        <Button type="button" variant="outline" onClick={()=>setRows(current=>current.filter((_,i)=>i!==index))}>Hapus rentang</Button>
      </div>)}
      <Button id="loan-collectibility-add" variant="outline" disabled={rows.length>=20} onClick={()=>setRows(current=>[...current,{label:'',min:'',max:''}])}>Tambah rentang</Button>
      <label className="flex items-center gap-2"><Checkbox checked={enabled} onCheckedChange={value=>setEnabled(value === true)} /> Aktifkan aturan yang disetujui</label>
      {formError && <p id="loan-collectibility-error" role="alert" className="text-destructive">{formError}</p>}
      <Button disabled={save.isPending} onClick={()=>save.mutate()}>{save.isPending?'Menyimpan...':'Simpan versi kolektabilitas'}</Button>
    </>}
  </section>;
}

interface CollectibilityStatus { state:string; enabled:boolean; version:number|null; as_of:string; dpd?:number; overdue?:number; oldest_due?:string|null; label:string|null; incomplete?:number }
export function LoanCollectibilityStatus({ loanId, customerId, asOf }: { loanId?:string; customerId?:string; asOf?:string }) {
  const status = useQuery({ queryKey:[customerId?'loan-customer-collectibility':'loan-collectibility-status',loanId,customerId,asOf],enabled:!!(loanId || customerId),refetchInterval:60_000,queryFn:async()=>{
    const {data,error}=await client.rpc(customerId?'loan_customer_collectibility':'loan_collectibility_status',customerId?{p_customer:customerId,...(asOf?{p_asof:asOf}:{})}:{p_loan:loanId,...(asOf?{p_asof:asOf}:{})});
    if(error) throw error; return data as CollectibilityStatus;
  }});
  const data=status.data;
  if(status.error) return <p role="alert">Kolektabilitas belum dapat dihitung.</p>;
  if(!data) return null;
  if(data.state==='unavailable') return <p>Posisi kolektabilitas belum tersedia karena data tidak lengkap.</p>;
  if(data.state==='draft' || data.state==='not_disbursed') return <p>Belum dicairkan pada tanggal posisi.</p>;
  if(data.state==='no_obligation') return <p>Tidak ada kewajiban aktif.</p>;
  if(data.state!=='active') return null;
  return <div className="text-sm"><p>Posisi {loanDate(data.as_of)}: DPD {data.dpd} hari; jatuh tempo tertua belum lunas {loanDate(data.oldest_due,'tidak ada')}; tunggakan {new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(data.overdue ?? 0))}.</p>
    {data.enabled && data.label && <p>Kolektabilitas internal: <strong>{data.label}</strong> (versi {data.version}).</p>}
  </div>;
}
