import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const client = supabase as unknown as SupabaseClient;
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
type LoanOption = { id:string; loan_number:string; customer_name:string; remaining:number|null };

export function LoanPaymentPicker() {
  const navigate = useNavigate(); const [open, setOpen] = useState(false); const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active'); const [page, setPage] = useState(1);
  const loans = useQuery({ queryKey:['loan-payment-picker',search,status,page], enabled:open, queryFn:async ({signal}) => {
    const {data,error} = await client.rpc('loan_navigation_loans',{p_search:search.trim(),p_status:status,p_page:page,p_size:25}).abortSignal(signal);
    if(error) throw error; return data as {items:LoanOption[];total:number};
  } });
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>Catat Pembayaran</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Pilih pinjaman</DialogTitle><DialogDescription>Pilih pinjaman yang dapat dibayar untuk membuka formulir dan memeriksa sisa pokok.</DialogDescription></DialogHeader>
    <Input aria-label="Cari pinjaman untuk pembayaran" placeholder="Cari nama atau nomor pinjaman" value={search} onChange={event => {setSearch(event.target.value);setPage(1);}} />
    <Select value={status} onValueChange={value => {setStatus(value);setPage(1);}}><SelectTrigger aria-label="Status pinjaman untuk pembayaran"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="needs_reconciliation">Perlu Rekonsiliasi</SelectItem></SelectContent></Select>
    {loans.isLoading && <p>Memuat pinjaman...</p>}{loans.error && <div role="alert"><p>Pinjaman tidak dapat dimuat.</p><Button variant="outline" onClick={()=>void loans.refetch()}>Coba lagi</Button></div>}
    {loans.data && <><p>{loans.data.total} hasil</p>{loans.data.items.length === 0 && (search ? <div><p>Tidak ada pinjaman yang cocok.</p><Button variant="outline" onClick={()=>{setSearch('');setPage(1);}}>Reset pencarian</Button></div> : <p>Tidak ada pinjaman yang dapat dibayar pada halaman ini.</p>)}{loans.data.items.map(loan => <div key={loan.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-2"><div className="min-w-0 break-words"><p>{loan.customer_name} · {loan.loan_number}</p><p>Sisa: {loan.remaining === null ? 'Belum tersedia' : money(Number(loan.remaining))}</p></div><Button className="min-h-11" variant="outline" onClick={() => {setOpen(false);navigate(`/pinjaman/daftar/${loan.id}?tab=pembayaran`);}}>Pilih</Button></div>)}<div className="flex flex-wrap items-center gap-2"><Button variant="outline" disabled={page===1 || loans.isFetching} onClick={()=>setPage(value=>value-1)}>Sebelumnya</Button><span>Halaman {page}</span><Button variant="outline" disabled={loans.isFetching || page*25>=loans.data.total} onClick={()=>setPage(value=>value+1)}>Berikutnya</Button></div></>}
  </DialogContent></Dialog>;
}
