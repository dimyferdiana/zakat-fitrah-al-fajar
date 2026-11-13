import { useEffect, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { makeSchedule, scheduleDurationDays, validateSchedule, type Installment } from '@/lib/loanSchedule';
import { refreshLoanProjections } from '@/lib/loanQueryRefresh';
import { loanDate } from '@/lib/loanDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const client=supabase as unknown as SupabaseClient;
const money=(amount:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(amount);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Row={id:string;date:string;amount:string};
type Customer={id:string;name:string;alamat:string;is_active:boolean};
type Obligation={loan_number:string;status:string;remaining:number|null};
type Choice={id:string;name:string};
type Staff={id:string;nama_lengkap:string};
type Fields='customer'|'category'|'purpose'|'principal'|'planned'|'responsible'|'frequency'|'first'|'count'|'schedule';

export function LoanCreate() {
  const location=useLocation(); const navigate=useNavigate(); const cache=useQueryClient();
  const initial=typeof location.state?.customerId==='string' && uuid.test(location.state.customerId) ? location.state.customerId as string : '';
  const [customerId,setCustomerId]=useState(initial); const [customerSearch,setCustomerSearch]=useState('');
  const [category,setCategory]=useState(''); const [purpose,setPurpose]=useState(''); const [principal,setPrincipal]=useState('');
  const [planned,setPlanned]=useState(''); const [responsible,setResponsible]=useState(''); const [notes,setNotes]=useState('');
  const [frequency,setFrequency]=useState<'weekly'|'monthly'|'custom'>('monthly'); const [first,setFirst]=useState(''); const [count,setCount]=useState('3');
  const [rows,setRows]=useState<Row[]>([{id:crypto.randomUUID(),date:'',amount:''}]);
  const [stage,setStage]=useState(1); const [review,setReview]=useState<Installment[] | null>(null); const [errors,setErrors]=useState<Partial<Record<Fields,string>>>({});
  const [submitError,setSubmitError]=useState(''); const requestId=useRef(crypto.randomUUID()); const allowLeave=useRef(false);
  const leaveFocus=useRef<HTMLElement | null>(null);
  const dirty=customerId!==initial || !!(category || purpose || principal || planned || responsible || notes || first || customerSearch || rows.some(row=>row.date || row.amount)) || frequency!=='monthly' || count!=='3';
  const blocker=useBlocker(({currentLocation,nextLocation})=>{const blocked=dirty && !allowLeave.current && (currentLocation.pathname!==nextLocation.pathname || currentLocation.search!==nextLocation.search);if(blocked)leaveFocus.current=document.activeElement instanceof HTMLElement ? document.activeElement : null;return blocked;});
  useEffect(()=>{const handler=(event:BeforeUnloadEvent)=>{if(dirty && !allowLeave.current){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty]);

  const customers=useQuery({queryKey:['loan-create-customers',customerSearch],queryFn:async ({signal})=>{const {data,error}=await client.rpc('loan_navigation_customers',{p_search:customerSearch.trim(),p_page:1,p_size:25}).abortSignal(signal);if(error)throw error;return data as {items:Customer[];total:number};}});
  const selected=useQuery({queryKey:['loan-create-customer',customerId],enabled:!!customerId,queryFn:async ({signal})=>{const {data,error}=await client.from('loan_customers').select('id,is_active,person:muzakki!loan_customers_person_id_fkey(nama_kk,nama_lengkap,alamat)').eq('id',customerId).abortSignal(signal).single();if(error)throw error;return data as unknown as {id:string;is_active:boolean;person:{nama_kk:string;nama_lengkap:string|null;alamat:string}|null};}});
  const obligations=useQuery({queryKey:['loan-customer-obligations',customerId],enabled:!!customerId,queryFn:async ({signal})=>{const {data,error}=await client.rpc('loan_customer_obligations',{p_customer:customerId}).abortSignal(signal);if(error)throw error;return (data??[]) as Obligation[];}});
  const categories=useQuery({queryKey:['loan-categories'],queryFn:async ({signal})=>{const {data,error}=await client.from('loan_categories').select('id,name').eq('is_active',true).order('name').abortSignal(signal);if(error)throw error;return (data??[]) as Choice[];}});
  const staff=useQuery({queryKey:['loan-staff-choices'],queryFn:async ({signal})=>{const {data,error}=await client.rpc('loan_staff_choices').abortSignal(signal);if(error)throw error;return (data??[]) as Staff[];}});
  const customerName=selected.data?.person?.nama_lengkap || selected.data?.person?.nama_kk || '';
  const customerOptions=[...(customers.data?.items??[])];
  if(selected.data && !customerOptions.some(item=>item.id===customerId)) customerOptions.unshift({id:customerId,name:customerName,alamat:selected.data.person?.alamat??'',is_active:selected.data.is_active});

  function validationError(next:Partial<Record<Fields,string>>) { setErrors(next); const key=Object.keys(next)[0]; if(key) requestAnimationFrame(()=>document.getElementById(`loan-create-${key}`)?.focus()); }
  function nextCustomer(){
    const next:Partial<Record<Fields,string>>={};
    if(!customerId || selected.error || !selected.data?.is_active)next.customer='Pilih nasabah aktif yang tersedia.';
    else if(obligations.isLoading || obligations.error || !obligations.data)next.customer='Kewajiban nasabah belum dapat diperiksa.';
    if(Object.keys(next).length){validationError(next);return;}setErrors({});setStage(2);
  }
  function buildSchedule():Installment[]{
    const amount=Number(principal); let schedule:Installment[];
    if(frequency==='custom') schedule=rows.map((row,index)=>{if(!row.date || !/^\d+$/.test(row.amount))throw new Error(`Isi tanggal dan nominal pada baris ${index+1}.`);return {dueDate:row.date,amount:Number(row.amount)};});
    else {if(Number(count)>10000)throw new Error('Jumlah angsuran terlalu besar.');schedule=makeSchedule(amount,Number(count),first,frequency);}
    validateSchedule(schedule,amount,planned);return schedule;
  }
  function nextDetails(){
    const next:Partial<Record<Fields,string>>={};
    if(!category || !categories.data?.some(item=>item.id===category))next.category='Pilih kategori.';
    if(!purpose.trim())next.purpose='Isi tujuan pinjaman.';
    if(!Number.isSafeInteger(Number(principal)) || Number(principal)<=0)next.principal='Isi pokok positif dalam rupiah bulat.';
    if(!planned)next.planned='Isi rencana tanggal pencairan.';
    if(!responsible || !staff.data?.some(item=>item.id===responsible))next.responsible='Pilih penanggung jawab.';
    let schedule:Installment[] | null=null;
    if(!next.principal && !next.planned)try{schedule=buildSchedule();}catch(error){next.schedule=error instanceof Error ? error.message : 'Jadwal tidak valid.';}
    if(Object.keys(next).length || !schedule){validationError(next);return;}
    setErrors({});setReview(schedule);setStage(3);
  }
  const save=useMutation({mutationFn:async()=>{
    if(!review || !customerId || !selected.data?.is_active || !obligations.data)throw new Error('Tinjau kembali nasabah dan jadwal.');
    const schedule=buildSchedule(); if(JSON.stringify(schedule)!==JSON.stringify(review))throw new Error('Jadwal berubah; tinjau kembali sebelum menyimpan.');
    const {data,error}=await client.rpc('loan_create_complete_draft',{p_customer_id:customerId,p_category_id:category,p_purpose:purpose.trim(),p_principal:Number(principal),p_schedule:schedule,p_request_id:requestId.current,p_planned:planned,p_responsible:responsible,p_notes:notes.trim() || null});
    if(error)throw error;return data as string;
  },onSuccess:id=>{allowLeave.current=true;void refreshLoanProjections(cache);toast.success('Draf pinjaman tersimpan.');navigate(`/pinjaman/daftar/${id}`,{replace:true});},onError:error=>{setSubmitError(error instanceof Error ? error.message : 'Draf belum dapat disimpan. Periksa data lalu coba lagi.');}});
  const error=(field:Fields)=>errors[field] ? <p id={`loan-create-${field}-error`} role="alert" className="text-sm text-destructive">{errors[field]}</p> : null;
  const editSchedule=()=>{setReview(null);setErrors(previous=>({...previous,schedule:undefined}));};
  return <>
    <Card><CardHeader><CardTitle>Buat draf pinjaman</CardTitle><p className="text-sm text-muted-foreground">Tahap {stage} dari 3: {['Nasabah','Detail & Jadwal','Tinjau & Simpan'][stage-1]}</p></CardHeader><CardContent className="space-y-4">
      {stage===1 && <><label className="block space-y-1">Cari nasabah<Input value={customerSearch} onChange={event=>setCustomerSearch(event.target.value)} placeholder="Nama atau ID nasabah" maxLength={120} /></label>
        <div className="space-y-1"><label htmlFor="loan-create-customer">Nasabah</label><Select value={customerId} onValueChange={value=>{setCustomerId(value);setReview(null);setErrors({});}}><SelectTrigger id="loan-create-customer" aria-invalid={!!errors.customer} aria-describedby={errors.customer ? 'loan-create-customer-error' : undefined} aria-label="Nasabah"><SelectValue placeholder="Pilih nasabah" /></SelectTrigger><SelectContent>{customerOptions.map(item=><SelectItem key={item.id} value={item.id} disabled={!item.is_active}>{item.name} — {item.alamat} ({item.id}){!item.is_active && ' · Nonaktif'}</SelectItem>)}</SelectContent></Select>{error('customer')}</div>
        {customers.error && <div role="alert"><p>Daftar nasabah tidak dapat dimuat.</p><Button variant="outline" onClick={()=>void customers.refetch()}>Coba lagi</Button></div>}{customers.data && customers.data.total>25 && <p className="text-sm text-muted-foreground">Menampilkan 25 dari {customers.data.total} hasil; perjelas pencarian.</p>}
        {selected.error && <div role="alert"><p>Nasabah tidak tersedia atau tidak aktif.</p><Button variant="outline" onClick={()=>void selected.refetch()}>Coba lagi</Button></div>}{obligations.isFetching && customerId && <p>Memeriksa kewajiban nasabah...</p>}{obligations.error && <div role="alert"><p>Kewajiban tidak dapat diperiksa.</p><Button variant="outline" onClick={()=>void obligations.refetch()}>Coba lagi</Button></div>}
        {obligations.data && <div className="rounded-md border p-3 text-sm"><p>{obligations.data.length ? 'Pencairan diblokir selama kewajiban berikut masih perlu ditangani:' : 'Tidak ada kewajiban aktif yang perlu ditangani.'}</p>{obligations.data.map(item=><p key={item.loan_number}>{item.loan_number} · {item.status==='needs_reconciliation'?'Perlu Rekonsiliasi':'Aktif'} · {item.remaining===null?'Saldo belum tersedia':`Sisa ${money(Number(item.remaining))}`}</p>)}</div>}
        <Button disabled={!!customerId && (selected.isFetching || obligations.isFetching)} onClick={nextCustomer}>Lanjut ke Detail & Jadwal</Button></>}
      {stage===2 && <><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><label htmlFor="loan-create-category">Kategori</label><Select value={category} onValueChange={value=>{setCategory(value);setReview(null);}}><SelectTrigger id="loan-create-category" aria-invalid={!!errors.category} aria-describedby={errors.category ? 'loan-create-category-error' : undefined} aria-label="Kategori"><SelectValue placeholder="Pilih kategori" /></SelectTrigger><SelectContent>{categories.data?.map(item=><SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>{error('category')}</div>
        <label className="space-y-1">Nominal pokok (Rp)<Input id="loan-create-principal" aria-label="Nominal pokok (Rp)" aria-invalid={!!errors.principal} aria-describedby={errors.principal ? 'loan-create-principal-error' : undefined} type="number" min="1" step="1" value={principal} onChange={event=>{setPrincipal(event.target.value);editSchedule();}} />{error('principal')}</label>
        <label className="space-y-1">Rencana tanggal pencairan<Input id="loan-create-planned" aria-label="Rencana tanggal pencairan" aria-invalid={!!errors.planned} aria-describedby={errors.planned ? 'loan-create-planned-error' : undefined} type="date" value={planned} onChange={event=>{setPlanned(event.target.value);editSchedule();}} />{error('planned')}</label>
        <div className="space-y-1"><label htmlFor="loan-create-responsible">Petugas penanggung jawab</label><Select value={responsible} onValueChange={setResponsible}><SelectTrigger id="loan-create-responsible" aria-invalid={!!errors.responsible} aria-describedby={errors.responsible ? 'loan-create-responsible-error' : undefined} aria-label="Petugas penanggung jawab"><SelectValue placeholder="Pilih petugas" /></SelectTrigger><SelectContent>{staff.data?.map(item=><SelectItem key={item.id} value={item.id}>{item.nama_lengkap}</SelectItem>)}</SelectContent></Select>{error('responsible')}</div></div>
        {(categories.error || staff.error) && <p role="alert">Kategori atau petugas tidak dapat dimuat.</p>}
        <label className="block space-y-1">Digunakan untuk<Input id="loan-create-purpose" aria-label="Digunakan untuk" aria-invalid={!!errors.purpose} aria-describedby={errors.purpose ? 'loan-create-purpose-error' : undefined} value={purpose} onChange={event=>setPurpose(event.target.value)} />{error('purpose')}</label>
        <label className="block space-y-1">Catatan (opsional)<Textarea value={notes} onChange={event=>setNotes(event.target.value)} /></label>
        <div className="space-y-1"><label htmlFor="loan-create-frequency">Pola pembayaran</label><Select value={frequency} onValueChange={value=>{setFrequency(value as typeof frequency);editSchedule();}}><SelectTrigger id="loan-create-frequency" aria-label="Pola pembayaran"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Bulanan</SelectItem><SelectItem value="weekly">Mingguan</SelectItem><SelectItem value="custom">Tanggal khusus</SelectItem></SelectContent></Select></div>
        {frequency==='custom' ? <div id="loan-create-schedule" tabIndex={-1} aria-describedby={errors.schedule ? 'loan-create-schedule-error' : undefined} className="space-y-2"><p>Jadwal khusus</p>{rows.map((row,index)=><div key={row.id} className="flex flex-wrap items-end gap-2"><label className="min-w-36 flex-1">Tanggal {index+1}<Input type="date" value={row.date} onChange={event=>{setRows(current=>current.map(item=>item.id===row.id?{...item,date:event.target.value}:item));editSchedule();}} /></label><label className="min-w-32 flex-1">Nominal {index+1}<Input type="number" min="1" step="1" value={row.amount} onChange={event=>{setRows(current=>current.map(item=>item.id===row.id?{...item,amount:event.target.value}:item));editSchedule();}} /></label><Button variant="outline" disabled={rows.length===1} onClick={()=>{setRows(current=>current.filter(item=>item.id!==row.id));editSchedule();}}>Hapus {index+1}</Button></div>)}<Button variant="outline" onClick={()=>{setRows(current=>[...current,{id:crypto.randomUUID(),date:'',amount:''}]);editSchedule();}}>Tambah baris</Button></div> : <div id="loan-create-schedule" tabIndex={-1} aria-describedby={errors.schedule ? 'loan-create-schedule-error' : undefined} className="grid gap-4 sm:grid-cols-2"><label>Jatuh tempo pertama<Input type="date" value={first} onChange={event=>{setFirst(event.target.value);editSchedule();}} /></label><label>Jumlah angsuran<Input type="number" min="1" step="1" value={count} onChange={event=>{setCount(event.target.value);editSchedule();}} /></label></div>}
        {error('schedule')}
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setStage(1)}>Kembali</Button><Button onClick={nextDetails}>Tinjau & Simpan</Button></div></>}
      {stage===3 && review && <><div className="space-y-2 break-words text-sm"><p>Nasabah: <strong>{customerName}</strong> · ID {customerId}</p><p>Kewajiban: {obligations.data?.length ? obligations.data.map(item=>`${item.loan_number} (${item.status==='needs_reconciliation'?'Perlu Rekonsiliasi':'Aktif'}, ${item.remaining===null?'saldo belum tersedia':`sisa ${money(Number(item.remaining))}`})`).join(', ') : 'Tidak ada kewajiban aktif'}</p><p>Kategori: {categories.data?.find(item=>item.id===category)?.name} · Tujuan: {purpose}</p><p>Pokok: {money(Number(principal))} · Penanggung jawab: {staff.data?.find(item=>item.id===responsible)?.nama_lengkap}</p><p>Rencana pencairan: {loanDate(planned)} · Catatan: {notes || '-'}</p><p>{review.length} angsuran · {loanDate(review[0].dueDate)} s.d. {loanDate(review[review.length-1].dueDate)} · {scheduleDurationDays(planned,review)} hari · Total {money(review.reduce((sum,item)=>sum+item.amount,0))}</p></div>
        <p className="text-xs text-muted-foreground sm:hidden">Geser tabel ke samping untuk melihat seluruh kolom.</p><div className="overflow-x-auto"><Table className="min-w-[360px]"><TableHeader><TableRow><TableHead>Ke</TableHead><TableHead>Tanggal</TableHead><TableHead>Nominal</TableHead></TableRow></TableHeader><TableBody>{review.map((item,index)=><TableRow key={item.dueDate}><TableCell>{index+1}</TableCell><TableCell>{loanDate(item.dueDate)}</TableCell><TableCell>{money(item.amount)}</TableCell></TableRow>)}</TableBody></Table></div>
        {submitError && <p role="alert" className="text-destructive">{submitError}</p>}
        <div className="flex gap-2"><Button variant="outline" disabled={save.isPending} onClick={()=>setStage(2)}>Kembali</Button><Button disabled={save.isPending} onClick={()=>{setSubmitError('');save.mutate();}}>{save.isPending?'Menyimpan...':'Simpan draf'}</Button></div></>}
    </CardContent></Card>
    <AlertDialog open={blocker.state==='blocked'}><AlertDialogContent onEscapeKeyDown={event=>{event.preventDefault();blocker.reset?.();}} onCloseAutoFocus={event=>{if(leaveFocus.current?.isConnected){event.preventDefault();leaveFocus.current.focus();}}}><AlertDialogHeader><AlertDialogTitle>Tinggalkan perubahan?</AlertDialogTitle><AlertDialogDescription>Isian yang belum disimpan akan hilang.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={()=>blocker.reset?.()}>Tetap mengisi</AlertDialogCancel><AlertDialogAction onClick={()=>blocker.proceed?.()}>Tinggalkan perubahan</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
