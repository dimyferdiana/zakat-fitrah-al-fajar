import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { refreshLoanProjections } from '@/lib/loanQueryRefresh';
import { WargaForm } from '@/components/data-master/WargaForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Person { id:string; nama_kk:string; nama_lengkap:string | null; alamat:string; rt:string | null; rw:string | null; jenis_identitas:'individu' | 'rumah_tangga' | 'belum_diverifikasi'; identitas_terverifikasi:boolean }
const client = supabase as unknown as SupabaseClient;

export function LoanCustomerRegistration() {
  const navigate=useNavigate(); const cache=useQueryClient();
  const [input,setInput]=useState(''); const [term,setTerm]=useState('');
  const [selected,setSelected]=useState<Person | null>(null); const [name,setName]=useState(''); const [creating,setCreating]=useState(false);
  const [formError,setFormError]=useState('');
  const [searchError,setSearchError]=useState('');
  const people=useQuery({queryKey:['loan-person-search',term],enabled:term.length>=2,queryFn:async ({signal})=>{
    const safe=term.replace(/[,()%_]/g,' ').trim(); if(safe.length<2)return [];
    const {data,error}=await client.from('muzakki').select('id,nama_kk,nama_lengkap,alamat,rt,rw,jenis_identitas,identitas_terverifikasi').eq('aktif',true).or(`nama_kk.ilike.%${safe}%,nama_lengkap.ilike.%${safe}%,alamat.ilike.%${safe}%`).order('nama_kk').order('id').limit(25).abortSignal(signal);
    if(error)throw error; return (data ?? []) as Person[];
  }});
  const existing=useQuery({queryKey:['loan-existing-customer',selected?.id],enabled:!!selected,queryFn:async ({signal})=>{const {data,error}=await client.from('loan_customers').select('id').eq('person_id',selected!.id).abortSignal(signal).maybeSingle();if(error)throw error;return data as {id:string}|null;}});
  const register=useMutation({mutationFn:async ()=>{
    if(!selected || selected.jenis_identitas==='rumah_tangga')throw new Error('Pilih individu, bukan data rumah tangga.');
    if(!selected.identitas_terverifikasi || selected.jenis_identitas!=='individu') { const {error}=await client.rpc('loan_confirm_individual',{p_person_id:selected.id,p_name:name.trim()});if(error)throw error; }
    const {data,error}=await client.rpc('loan_register_customer',{p_person_id:selected.id});if(error)throw error;return data as string;
  },onSuccess:id=>{setFormError('');void cache.invalidateQueries({queryKey:['loan-customers']});void refreshLoanProjections(cache);toast.success('Nasabah berhasil didaftarkan.');navigate(`/pinjaman/nasabah/${id}`,{replace:true});},onError:error=>{const text=error instanceof Error ? error.message : 'Pendaftaran tidak berhasil. Periksa data dan coba lagi.';setFormError(text);toast.error(text);}});
  function search() { const safe=input.replace(/[,()%_]/g,' ').trim(); setSelected(null); if(safe.length<2){setTerm('');setSearchError('Masukkan minimal dua karakter untuk mencari.');document.getElementById('loan-person-search')?.focus();return;} setSearchError('');setTerm(safe); }
  const searched=term.length>=2 && people.isSuccess && input.replace(/[,()%_]/g,' ').trim()===term;
  return <Card><CardHeader><CardTitle>Cari individu di Data Master</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">Cari data yang sudah ada untuk menjaga hubungan dengan program lain. Data rumah tangga tidak dapat langsung menjadi nasabah.</p>
    <form className="flex flex-wrap gap-2" onSubmit={event=>{event.preventDefault();search();}}><Input id="loan-person-search" aria-label="Cari orang di Data Master" aria-invalid={!!searchError} aria-describedby={searchError?'loan-person-search-error':undefined} className="min-w-0 flex-1" placeholder="Nama atau alamat, minimal 2 karakter" value={input} onChange={event=>{setInput(event.target.value);setSelected(null);setSearchError('');}} /><Button type="submit">Cari</Button></form>{searchError && <p id="loan-person-search-error" role="alert" className="text-destructive">{searchError}</p>}
    {people.isFetching && <p>Memuat hasil pencarian...</p>}{people.error && <p role="alert">Pencarian tidak dapat dimuat. Coba lagi.</p>}
    {searched && <><p>{people.data.length === 0 ? 'Tidak ada orang yang cocok.' : `Menampilkan ${people.data.length} hasil, maksimal 25.`}</p><div className="space-y-2">{people.data.map(person=><Button key={person.id} type="button" variant="outline" className="h-auto w-full justify-start whitespace-normal text-left" onClick={()=>{setSelected(person);setName(person.nama_lengkap || person.nama_kk);}}><span><strong>{person.nama_lengkap || person.nama_kk}</strong> · {person.alamat} · ID {person.id}<br />{person.jenis_identitas.replaceAll('_',' ')}{(person.rt || person.rw) && ` · RT ${person.rt || '-'} / RW ${person.rw || '-'}`}</span></Button>)}</div>
      <Button type="button" variant="outline" onClick={()=>setCreating(true)}>Tambah data orang baru</Button></>}
    <WargaForm open={creating} onOpenChange={open=>{setCreating(open);if(!open)void cache.invalidateQueries({queryKey:['loan-person-search']});}} />
    {selected && <Card><CardHeader><CardTitle>Konfirmasi pilihan</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><strong>{selected.nama_lengkap || selected.nama_kk}</strong> · {selected.alamat}</p><p>ID orang: {selected.id}</p>
      {selected.jenis_identitas==='rumah_tangga' ? <p role="alert">Data rumah tangga tidak dapat didaftarkan. Buat atau pilih anggota keluarga sebagai individu di Data Master.</p> : <>
        {existing.isLoading && <p>Memeriksa pendaftaran...</p>}{existing.error && <p role="alert">Status pendaftaran tidak dapat diperiksa.</p>}
        {existing.data ? <p>Individu ini sudah menjadi nasabah. <Button variant="link" className="h-auto p-0" asChild><Link to={`/pinjaman/nasabah/${existing.data.id}`}>Buka profil nasabah</Link></Button></p> : <>
          {!selected.identitas_terverifikasi && <label className="block">Pastikan ini satu individu. Nama lengkap<Input value={name} onChange={event=>setName(event.target.value)} /></label>}
          {formError && <p role="alert" className="text-destructive">{formError}</p>}
          <Button disabled={register.isPending || existing.isLoading || !!existing.error || (!selected.identitas_terverifikasi && !name.trim())} onClick={()=>register.mutate()}>{register.isPending?'Mendaftarkan...':'Konfirmasi individu dan daftarkan'}</Button>
        </>}
      </>}
    </CardContent></Card>}
  </CardContent></Card>;
}
