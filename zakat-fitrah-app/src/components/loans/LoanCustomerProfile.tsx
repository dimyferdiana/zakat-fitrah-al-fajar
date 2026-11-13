import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { refreshLoanProjections } from '@/lib/loanQueryRefresh';
import { LoanAccountRecovery } from './LoanAccountRecovery';
import { LoanStaffAccountLink } from './LoanStaffAccountLink';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loanStatus } from '@/lib/loanDisplay';

const client = supabase as unknown as SupabaseClient;
const money = (amount:number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(amount);
interface Customer { id:string; is_active:boolean; person:{nama_kk:string;nama_lengkap:string|null;alamat:string;rt:string|null;rw:string|null}|null }
interface Loan { id:string;loan_number:string;status:string;principal:number }
interface Obligation { loan_number:string;status:string;remaining:number|null }

function CustomerAccess({ customer }: { customer:Customer }) {
  const cache=useQueryClient(); const password=useRef<HTMLInputElement>(null); const emailField=useRef<HTMLInputElement>(null);
  const [email,setEmail]=useState(''); const [pending,setPending]=useState(false); const [formError,setFormError]=useState('');
  const status=useQuery({queryKey:['loan-customer-account-status',customer.id],queryFn:async ({signal})=>{const {data,error}=await client.rpc('loan_customer_account_status',{p_customer_id:customer.id}).abortSignal(signal).single();if(error)throw error;return data as {has_account:boolean;is_active:boolean;access_paused:boolean};}});
  const gate=useQuery({queryKey:['loan-account-creation'],queryFn:async ({signal})=>{const {data,error}=await client.rpc('loan_customer_creation_enabled').abortSignal(signal);if(error)throw error;return data===true;}});
  function updated(){void cache.invalidateQueries({queryKey:['loan-customer-account-status',customer.id]});void refreshLoanProjections(cache);}
  async function create() {
    const secret=password.current?.value ?? '';
    if(!email.trim() || !emailField.current?.validity.valid || secret.length<8 || secret.length>72){setFormError('Isi email yang valid dan password 8–72 karakter.');(!email.trim() || !emailField.current?.validity.valid ? emailField : password).current?.focus();return;}
    setPending(true);
    try {const {data,error}=await client.functions.invoke('loan-customer-account',{body:{customerId:customer.id,email:email.trim(),password:secret}});if(error || !data?.success)throw new Error();setEmail('');if(password.current)password.current.value='';setFormError('');updated();toast.success('Akun nasabah berhasil dibuat.');}
    catch {setFormError('Akun tidak dapat dibuat. Periksa data dan coba lagi.');toast.error('Akun tidak dapat dibuat. Periksa data dan coba lagi.');} finally {setPending(false);}
  }
  return <Card data-testid="loan-account-panel"><CardHeader><CardTitle>Akses Akun</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="break-words text-sm">Nasabah: <strong>{customer.person?.nama_lengkap || customer.person?.nama_kk || 'Nasabah'}</strong> · ID <span className="break-all">{customer.id}</span></p>
    {status.isLoading && <p>Memuat status akun...</p>}{status.error && <p role="alert">Status akun tidak dapat dimuat.</p>}{gate.error && <p role="alert">Pengaturan pembuatan akun tidak dapat dimuat.</p>}
    {status.data && <><p>{status.data.has_account ? (status.data.access_paused ? 'Akses akun ditangguhkan.' : 'Akun sudah terhubung.') : 'Nasabah belum memiliki akun.'}</p>
      {!status.data.is_active ? <p>Nasabah tidak aktif; perubahan akses tidak tersedia.</p> : status.data.has_account ? <LoanAccountRecovery customerId={customer.id} onUpdated={updated} /> : <>
        {gate.data !== true && <p className="text-sm text-muted-foreground">Pembuatan atau penautan akun belum tersedia. Hubungi pengelola aplikasi.</p>}
        <section className="space-y-3"><h3 className="font-semibold">Buat akun nasabah</h3><label className="block space-y-1 text-sm">Email<Input ref={emailField} type="email" autoComplete="off" value={email} aria-describedby={formError?'account-create-error':undefined} onChange={event=>setEmail(event.target.value)} /></label><label className="block space-y-1 text-sm">Password awal<Input ref={password} type="password" autoComplete="new-password" minLength={8} maxLength={72} aria-describedby={formError?'account-create-error':undefined} /></label>{formError && <p id="account-create-error" role="alert" className="text-destructive">{formError}</p>}<Button disabled={gate.data!==true || !status.data.is_active || pending} onClick={()=>void create()}>{pending?'Menyimpan...':'Buat akun'}</Button></section>
        <LoanStaffAccountLink customerId={customer.id} enabled={gate.data===true && status.data.is_active} onLinked={updated} />
      </>}
    </>}
  </CardContent></Card>;
}

export function LoanCustomerProfile({ customerId, isAdmin }: {customerId:string;isAdmin:boolean}) {
  const [page,setPage]=useState(0); const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
  const customer=useQuery({queryKey:['loan-customer-detail',customerId],enabled:valid,queryFn:async ({signal})=>{const {data,error}=await client.from('loan_customers').select('id,is_active,person:muzakki!loan_customers_person_id_fkey(nama_kk,nama_lengkap,alamat,rt,rw)').eq('id',customerId).abortSignal(signal).single();if(error)throw error;return data as unknown as Customer;}});
  const loans=useQuery({queryKey:['loan-customer-loans',customerId,page],enabled:!!customer.data,queryFn:async ({signal})=>{const {data,error,count}=await client.from('loans').select('id,loan_number,status,principal',{count:'exact'}).eq('customer_id',customerId).order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*25,page*25+24).abortSignal(signal);if(error)throw error;return {items:(data ?? []) as Loan[],total:count ?? 0};}});
  const obligations=useQuery({queryKey:['loan-customer-obligations',customerId],enabled:!!customer.data,queryFn:async ({signal})=>{const {data,error}=await client.rpc('loan_customer_obligations',{p_customer:customerId}).abortSignal(signal);if(error)throw error;return (data ?? []) as Obligation[];}});
  if(!valid || customer.error)return <p role="alert">Nasabah tidak tersedia atau tidak dapat diakses.</p>;
  if(customer.isLoading || !customer.data)return <p>Memuat nasabah...</p>;
  const item=customer.data; const name=item.person?.nama_lengkap || item.person?.nama_kk || 'Nasabah';
  return <div className="space-y-4"><div className="space-y-1"><p className="text-lg font-semibold">{name}</p><p className="break-words text-sm text-muted-foreground">ID nasabah: <span className="break-all">{item.id}</span> · {item.is_active ? 'Aktif' : 'Nonaktif'}</p></div>
    {item.is_active && <Button className="min-h-11" asChild><Link to="/pinjaman/baru" state={{customerId:item.id}}>Buat Pinjaman</Link></Button>}
    <Tabs defaultValue="profil"><TabsList><TabsTrigger value="profil">Profil</TabsTrigger><TabsTrigger value="pinjaman">Pinjaman</TabsTrigger>{isAdmin && <TabsTrigger value="akses">Akses Akun</TabsTrigger>}</TabsList>
      <TabsContent value="profil"><Card><CardHeader><CardTitle>Profil</CardTitle></CardHeader><CardContent className="space-y-2"><p>Nama: {name}</p><p className="break-all">ID nasabah: {item.id}</p><p>Alamat: {item.person?.alamat || 'Belum tersedia'}</p><p>Wilayah: RT {item.person?.rt || '-'} / RW {item.person?.rw || '-'}</p><p>Status: {item.is_active ? 'Aktif' : 'Nonaktif'}</p></CardContent></Card></TabsContent>
      <TabsContent value="pinjaman"><Card><CardHeader><CardTitle>Pinjaman dan kewajiban</CardTitle></CardHeader><CardContent className="space-y-3">
        {obligations.error && <p role="alert">Kewajiban tidak dapat diperiksa.</p>}{obligations.isLoading && <p>Memeriksa kewajiban...</p>}{obligations.data && <div><p className="font-medium">Kewajiban yang masih perlu ditangani: {obligations.data.length}</p>{obligations.data.map(o=><p key={o.loan_number}>{o.loan_number} · {loanStatus(o.status)}{o.remaining===null && ' · Saldo belum dapat dihitung'}</p>)}</div>}
        {loans.isLoading && <p>Memuat pinjaman...</p>}{loans.error && <p role="alert">Pinjaman tidak dapat dimuat.</p>}{loans.data && <><p>{loans.data.total} pinjaman</p>{loans.data.total===0 && <p>Belum ada pinjaman.</p>}{loans.data.items.map(loan=><p key={loan.id}><Button variant="link" className="h-auto p-0" asChild><Link to={`/pinjaman/daftar/${loan.id}`}>{loan.loan_number}</Link></Button> · {loanStatus(loan.status)} · {money(Number(loan.principal))}</p>)}{loans.data.total>25 && <div className="flex items-center gap-2"><Button variant="outline" disabled={page===0 || loans.isFetching} onClick={()=>setPage(page-1)}>Sebelumnya</Button><span>Halaman {page+1}</span><Button variant="outline" disabled={(page+1)*25>=loans.data.total || loans.isFetching} onClick={()=>setPage(page+1)}>Berikutnya</Button></div>}</>}
      </CardContent></Card></TabsContent>
      {isAdmin && <TabsContent value="akses"><CustomerAccess customer={item} /></TabsContent>}
    </Tabs>
  </div>;
}
