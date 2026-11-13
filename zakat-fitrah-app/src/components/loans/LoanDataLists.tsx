import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadPaymentProof } from '@/lib/loanPaymentProof';
import { downloadLoanReceipt } from '@/lib/loanReceipt';
import { toast } from 'sonner';
import { loanDate, loanStatus } from '@/lib/loanDisplay';

const client = supabase as unknown as SupabaseClient;
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const loanStatuses: Record<string, string> = { draft: 'Draf', active: 'Aktif', paid: 'Lunas', cancelled: 'Dibatalkan', needs_reconciliation: 'Perlu Rekonsiliasi' };
const paymentStatuses: Record<string, string> = { pending: 'Menunggu Verifikasi', confirmed: 'Terkonfirmasi', rejected: 'Ditolak', cancelled: 'Dibatalkan' };
interface Page<T> { total: number; items: T[] }
interface LoanItem { id: string; loan_number: string; customer_name: string; principal: number; status: string; remaining: number | null; overdue: number | null; incomplete: boolean; due_date: string | null }
interface CustomerItem { id: string; name: string; alamat: string; rt: string | null; rw: string | null; is_active: boolean; obligations: number; remaining: number | null; incomplete: number }
interface PaymentItem { id: string; loan_id: string; loan_number: string; customer_name: string; payment_date: string; amount: number; method: string; status: string; reason: string | null }
type ListKind = 'loans' | 'customers' | 'payments';

function useListFilters(kind: ListKind, statuses: Record<string, string>) {
  const location = useLocation(); const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const rawPage = params.get('halaman') ?? '1';
  const page = /^[1-9]\d{0,5}$/.test(rawPage) && Number(rawPage) <= 100000 ? Number(rawPage) : 1;
  const size = params.get('ukuran') === '50' ? 50 : 25;
  const status = params.get('status') && statuses[params.get('status')!] ? params.get('status')! : '';
  const attention = ['due','overdue','incomplete_draft'].includes(params.get('perhatian') ?? '') ? params.get('perhatian')! : '';
  const rawCategory = params.get('kategori') ?? '';
  const category = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(rawCategory) ? rawCategory : '';
  const date = (key: string) => { const value = params.get(key) ?? ''; if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''; const d = new Date(`${value}T00:00:00Z`); return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10) === value ? value : ''; };
  const from = date('dari'); const to = date('sampai');
  const state = (location.state && typeof location.state === 'object' ? location.state : {}) as Record<string, unknown>;
  const search = typeof state[`search-${kind}`] === 'string' ? (state[`search-${kind}`] as string).slice(0,120) : '';
  function update(values: Record<string, string>, newSearch = search) {
    const next = new URLSearchParams();
    const current: Record<string, string> = { ...(kind === 'payments' ? { tab: 'riwayat' } : {}), halaman: String(page), ukuran: String(size), status, kategori: category, perhatian: attention, dari: from, sampai: to, ...values };
    for (const [key, value] of Object.entries(current)) if (value && !(key === 'halaman' && value === '1') && !(key === 'ukuran' && value === '25')) next.set(key,value);
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next}` : '' }, { replace: true, state: { ...state, [`search-${kind}`]: newSearch } });
  }
  return { page, size, status, category, attention, from, to, search, update, location };
}

function Pager({ page, size, total, update }: { page: number; size: number; total: number; update: (values: Record<string,string>) => void }) {
  const pages = Math.ceil(total / size);
  if (page > Math.max(1,pages)) return <p role="status">Halaman tidak tersedia. <Button variant="link" onClick={() => update({ halaman: '1' })}>Kembali ke halaman pertama</Button></p>;
  return <PaginationBar currentPage={page} totalPages={pages} totalCount={total} pageSize={size} pageSizeOptions={[25,50]} onPageChange={value => update({ halaman: String(value) })} onPageSizeChange={value => update({ ukuran: String(value), halaman: '1' })} />;
}

function StatusFilter({ value, statuses, onChange }: { value: string; statuses: Record<string,string>; onChange: (value: string) => void }) {
  return <Select value={value || 'all'} onValueChange={v => onChange(v === 'all' ? '' : v)}><SelectTrigger aria-label="Status"><SelectValue placeholder="Semua status" /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{Object.entries(statuses).map(([key,label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>;
}

export function LoanListData() {
  const f = useListFilters('loans',loanStatuses);
  const categories = useQuery({ queryKey: ['loan-categories-list-all'], queryFn: async ({ signal }) => { const { data,error } = await client.from('loan_categories').select('id,name').order('name').abortSignal(signal); if(error) throw error; return data as {id:string;name:string}[]; } });
  const query = useQuery({ queryKey: ['staff-loans', f.search,f.status,f.category,f.attention,f.page,f.size], queryFn: async ({ signal }) => {
    const { data,error } = await client.rpc('loan_navigation_loans',{ p_search:f.search.trim(),p_status:f.status,p_category:f.category || null,p_attention:f.attention,p_page:f.page,p_size:f.size }).abortSignal(signal); if(error) throw error; return data as Page<LoanItem>;
  } });
  return <Card><CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"><CardTitle>Daftar pinjaman</CardTitle><Button className="min-h-11 w-full sm:w-auto" asChild><Link to="/pinjaman/baru">Buat Pinjaman</Link></Button></CardHeader><CardContent className="space-y-4">
    <div className="grid gap-2 sm:grid-cols-3"><Input aria-label="Cari nama atau nomor pinjaman" placeholder="Cari nama atau nomor pinjaman" value={f.search} onChange={e => f.update({halaman:'1'},e.target.value)} />
      <StatusFilter value={f.status} statuses={loanStatuses} onChange={v => f.update({status:v,halaman:'1'})} />
      <Select value={f.category || 'all'} onValueChange={v => f.update({kategori:v === 'all' ? '' : v,halaman:'1'})}><SelectTrigger aria-label="Kategori"><SelectValue placeholder="Semua kategori" /></SelectTrigger><SelectContent><SelectItem value="all">Semua kategori</SelectItem>{categories.data?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
    {categories.error && <p role="alert">Kategori tidak dapat dimuat.</p>}
    {f.attention && <p>Perhatian: {({due:'Jatuh tempo tujuh hari',overdue:'Tunggakan',incomplete_draft:'Draf perlu dilengkapi'} as Record<string,string>)[f.attention]} <Button variant="link" onClick={()=>f.update({perhatian:'',halaman:'1'})}>Hapus filter</Button></p>}
    {query.isLoading && <p>Memuat pinjaman...</p>}{query.error && <div role="alert"><p>Daftar pinjaman tidak dapat dimuat.</p><Button variant="outline" onClick={()=>void query.refetch()}>Coba lagi</Button></div>}
    {query.data && <><p>{query.data.total} hasil</p>{query.data.total === 0 && (f.search || f.status || f.category || f.attention ? <div><p>Tidak ada pinjaman yang cocok.</p><Button variant="outline" onClick={()=>f.update({status:'',kategori:'',perhatian:'',halaman:'1'},'')}>Reset filter</Button></div> : <p>Belum ada pinjaman. Gunakan Buat Pinjaman untuk memulai.</p>)}
      <div className="space-y-3 sm:hidden">{query.data.items.map(loan=><Card key={loan.id} data-testid="loan-mobile-card"><CardContent className="space-y-2 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><p className="min-w-0 break-all font-medium">{loan.loan_number}</p><span className="text-sm">{loanStatus(loan.status)}</span></div><p>{loan.customer_name}</p><p className="text-sm text-muted-foreground">Sisa pokok: {loan.remaining===null?'Belum tersedia':money(Number(loan.remaining))}</p><p className="text-sm text-muted-foreground">Jatuh tempo: {loanDate(loan.due_date)}</p><Button variant="outline" className="min-h-11" asChild><Link aria-label={`Lihat rincian ${loan.loan_number}`} to={`/pinjaman/daftar/${loan.id}${f.location.search}`} state={f.location.state}>Lihat rincian</Link></Button></CardContent></Card>)}</div>
      <div className="hidden overflow-x-auto sm:block"><Table className="min-w-[850px]"><TableHeader><TableRow><TableHead>Nomor</TableHead><TableHead>Nasabah</TableHead><TableHead>Pokok</TableHead><TableHead>Sisa pokok</TableHead><TableHead className="whitespace-nowrap">Status</TableHead><TableHead>Jatuh tempo</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{query.data.items.map(loan=><TableRow key={loan.id}><TableCell className="w-48 max-w-48 break-all">{loan.loan_number}</TableCell><TableCell className="whitespace-nowrap">{loan.customer_name}</TableCell><TableCell className="whitespace-nowrap">{money(Number(loan.principal))}</TableCell><TableCell className="whitespace-nowrap">{loan.remaining===null?'Belum tersedia':money(Number(loan.remaining))}</TableCell><TableCell className="whitespace-nowrap">{loanStatus(loan.status)}</TableCell><TableCell className="whitespace-nowrap">{loanDate(loan.due_date)}</TableCell><TableCell><Button variant="outline" size="sm" className="min-h-11" asChild><Link aria-label={`Lihat rincian ${loan.loan_number}`} to={`/pinjaman/daftar/${loan.id}${f.location.search}`} state={f.location.state}>Lihat rincian</Link></Button></TableCell></TableRow>)}</TableBody></Table></div>
      <Pager page={f.page} size={f.size} total={query.data.total} update={f.update} /></>}
  </CardContent></Card>;
}

export function CustomerListData() {
  const f = useListFilters('customers',{});
  const query = useQuery({ queryKey:['loan-customers-page',f.search,f.page,f.size], queryFn:async ({signal}) => { const {data,error}=await client.rpc('loan_navigation_customers',{p_search:f.search.trim(),p_page:f.page,p_size:f.size}).abortSignal(signal); if(error) throw error; return data as Page<CustomerItem>; } });
  return <Card><CardHeader><CardTitle>Daftar nasabah</CardTitle><div><Button className="min-h-11" asChild><Link to="/pinjaman/nasabah/baru">Daftarkan Nasabah</Link></Button></div></CardHeader><CardContent className="space-y-3"><Input aria-label="Cari nasabah" placeholder="Cari nama atau ID nasabah" value={f.search} onChange={e=>f.update({halaman:'1'},e.target.value)} />
    {query.isLoading && <p>Memuat nasabah...</p>}{query.error && <div role="alert"><p>Daftar nasabah tidak dapat dimuat.</p><Button variant="outline" onClick={()=>void query.refetch()}>Coba lagi</Button></div>}
    {query.data && <><p>{query.data.total} hasil</p>{query.data.total===0 && (f.search ? <div><p>Tidak ada nasabah yang cocok.</p><Button variant="outline" onClick={()=>f.update({halaman:'1'},'')}>Reset pencarian</Button></div> : <p>Belum ada nasabah. Gunakan Daftarkan Nasabah untuk memulai.</p>)}<div className="divide-y">{query.data.items.map(item => <div key={item.id} className="space-y-1 py-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><Button variant="link" className="h-auto p-0 text-left" asChild><Link to={`/pinjaman/nasabah/${item.id}${f.location.search}`} state={f.location.state}>{item.name}</Link></Button><span>{item.is_active ? 'Aktif' : 'Nonaktif'}</span></div><p className="break-all">ID nasabah: {item.id}</p><p>{item.alamat}{(item.rt || item.rw) && ` · RT ${item.rt || '-'} / RW ${item.rw || '-'}`}</p><p>{Number(item.obligations) === 0 ? 'Tidak ada kewajiban aktif' : `${item.obligations} kewajiban · Sisa terverifikasi: ${item.remaining === null ? 'belum tersedia' : money(Number(item.remaining))}`}{Number(item.incomplete) > 0 && ` · ${item.incomplete} belum dapat dihitung`}</p></div>)}</div><Pager page={f.page} size={f.size} total={query.data.total} update={f.update} /></>}
  </CardContent></Card>;
}

export function PaymentHistoryData({ onSelectLoan }: { onSelectLoan: (id:string) => void }) {
  const f=useListFilters('payments',paymentStatuses); const invalidPeriod=!!f.from && !!f.to && f.from>f.to;
  const query=useQuery({queryKey:['loan-payment-history',f.search,f.status,f.from,f.to,f.page,f.size],enabled:!invalidPeriod,queryFn:async ({signal})=>{const {data,error}=await client.rpc('loan_navigation_payments',{p_search:f.search.trim(),p_status:f.status,p_from:f.from || null,p_to:f.to || null,p_page:f.page,p_size:f.size}).abortSignal(signal);if(error)throw error;return data as Page<PaymentItem>;} });
  const ids=(query.data?.items ?? []).map(item=>item.id);
  const proofs=useQuery({queryKey:['loan-claim-documents','history',ids],enabled:ids.length>0,queryFn:async ({signal})=>{const {data,error}=await client.from('loan_documents').select('id,payment_id,storage_path').in('payment_id',ids).eq('kind','payment_evidence').abortSignal(signal);if(error)throw error;return (data ?? []) as {id:string;payment_id:string;storage_path:string}[];}});
  return <Card><CardHeader><CardTitle>Riwayat pembayaran</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 sm:grid-cols-2"><Input aria-label="Cari pembayaran" placeholder="Cari nama atau nomor pinjaman" value={f.search} onChange={e=>f.update({halaman:'1'},e.target.value)} /><StatusFilter value={f.status} statuses={paymentStatuses} onChange={v=>f.update({status:v,halaman:'1'})} /><label>Dari<Input type="date" value={f.from} onChange={e=>f.update({dari:e.target.value,halaman:'1'})} /></label><label>Sampai<Input type="date" value={f.to} onChange={e=>f.update({sampai:e.target.value,halaman:'1'})} /></label></div>
    {invalidPeriod && <p role="alert">Tanggal awal harus sebelum atau sama dengan tanggal akhir.</p>}{query.isLoading && !invalidPeriod && <p>Memuat riwayat...</p>}{query.error && <div role="alert"><p>Riwayat pembayaran tidak dapat dimuat.</p><Button variant="outline" onClick={()=>void query.refetch()}>Coba lagi</Button></div>}
    {proofs.error && <p role="alert">Bukti pembayaran tidak dapat dimuat.</p>}
    {query.data && !invalidPeriod && <><p>{query.data.total} hasil</p>{query.data.total===0 && (f.search || f.status || f.from || f.to ? <div><p>Tidak ada pembayaran yang cocok.</p><Button variant="outline" onClick={()=>f.update({status:'',dari:'',sampai:'',halaman:'1'},'')}>Reset filter</Button></div> : <p>Belum ada pembayaran. Gunakan Catat Pembayaran untuk memulai.</p>)}{query.data.items.map(item=><div key={item.id} className="space-y-2 border-t py-3"><p>{item.customer_name} · <Button variant="link" onClick={()=>onSelectLoan(item.loan_id)}>{item.loan_number}</Button></p><p>{loanDate(item.payment_date)} · {money(Number(item.amount))} · {loanStatus(item.status)} · {item.method}</p>{item.reason && <p>Alasan: {item.reason}</p>}<div className="flex flex-wrap gap-2">{proofs.data?.filter(proof=>proof.payment_id===item.id).map((proof,index)=><Button key={proof.id} variant="outline" onClick={()=>void downloadPaymentProof(proof.storage_path)}>Unduh bukti {index+1}</Button>)}{(item.status==='confirmed' || item.status==='cancelled') && <Button variant="outline" onClick={()=>void downloadLoanReceipt(item.id,item.status==='confirmed').catch(()=>toast.error('Tanda terima tidak dapat diunduh.'))}>Unduh tanda terima</Button>}</div></div>)}<Pager page={f.page} size={f.size} total={query.data.total} update={f.update} /></>}
  </CardContent></Card>;
}
