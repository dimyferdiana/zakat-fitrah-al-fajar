import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loanDate } from '@/lib/loanDisplay';

const client = supabase as unknown as SupabaseClient;
const money = (amount: number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(amount);
interface Work { id:string; loan_id?:string; loan_number:string; name:string; overdue?:number; amount?:number }
interface Overview { as_of:string; remaining:number; overdue:number; active:number; incomplete:number; pending_count:number; pending:Work[]; overdue_count:number; overdue_items:Work[]; draft_count:number; drafts:Work[]; due_count:number; due:Work[] }

function WorkList({ title, items, count, to }: { title:string;items:Work[];count:number;to:string }) {
  return <Card><CardHeader><CardTitle>{title} · {count}</CardTitle></CardHeader><CardContent className="space-y-2">{items.length===0 && <p>Tidak ada pekerjaan.</p>}{items.map(item=><p key={item.id}><Button variant="link" className="h-auto p-0" asChild><Link to={`/pinjaman/daftar/${item.loan_id || item.id}`}>{item.loan_number} — {item.name}</Link></Button>{item.overdue != null && ` · ${money(Number(item.overdue))}`}{item.amount != null && ` · ${money(Number(item.amount))}`}</p>)}<Button variant="link" className="h-auto p-0" asChild><Link to={to}>Lihat semua</Link></Button></CardContent></Card>;
}

export function LoanOverview() {
  const query=useQuery({queryKey:['loan-dashboard-current','overview'],queryFn:async ({signal})=>{const {data,error}=await client.rpc('loan_navigation_overview').abortSignal(signal);if(error)throw error;return data as Overview;} });
  if(query.isLoading)return <p>Memuat ringkasan...</p>;
  if(query.error || !query.data)return <div role="alert" className="space-y-2"><p>Ringkasan tidak dapat dimuat.</p><Button variant="outline" onClick={()=>void query.refetch()}>Coba lagi</Button></div>;
  const data=query.data;
  return <div className="space-y-4"><p className="text-sm text-muted-foreground">Posisi per {loanDate(data.as_of)} (tanggal WIB); klaim menunggu dihitung saat ini. Saldo hanya mencakup data terverifikasi.</p>
    {data.incomplete>0 && <p role="alert" className="rounded border border-amber-500 p-3">{data.incomplete} pinjaman memiliki data atau riwayat tidak lengkap; saldo yang tidak dapat diverifikasi tidak disertakan.</p>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Sisa pokok',money(Number(data.remaining))],['Tunggakan',money(Number(data.overdue))],['Pinjaman aktif',String(data.active)],['Menunggu verifikasi',String(data.pending_count)]].map(([label,value])=><Card key={label}><CardHeader className="p-4 pb-2"><CardTitle className="text-base">{label}</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-lg font-semibold">{value}</CardContent></Card>)}</div>
    <div className="grid gap-4 lg:grid-cols-2"><WorkList title="Bukti menunggu verifikasi" items={data.pending} count={data.pending_count} to="/pinjaman/pembayaran?tab=verifikasi" /><WorkList title="Jatuh tempo tujuh hari" items={data.due} count={data.due_count} to="/pinjaman/daftar?perhatian=due" /><WorkList title="Tunggakan" items={data.overdue_items} count={data.overdue_count} to="/pinjaman/daftar?perhatian=overdue" /><WorkList title="Draf perlu dilengkapi" items={data.drafts} count={data.draft_count} to="/pinjaman/daftar?perhatian=incomplete_draft" /></div>
  </div>;
}
