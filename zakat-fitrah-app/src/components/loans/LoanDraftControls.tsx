import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { refreshLoanProjections } from '@/lib/loanQueryRefresh';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const client = supabase as unknown as SupabaseClient;
type Person = { id: string; nama_kk: string; nama_lengkap: string | null; alamat: string; no_telp: string | null };
type Detail = { planned_disbursement_date: string | null; notes: string | null; guarantor_id: string | null; guarantor_relationship: string | null; guarantor_contact: string | null };
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Permintaan tidak berhasil.';

export function LoanDraftControls({ loanId, disbursementDate }: { loanId: string; disbursementDate: string }) {
  const cache = useQueryClient();
  const [search, setSearch] = useState(''); const [person, setPerson] = useState<Person | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [planned, setPlanned] = useState(''); const [notes, setNotes] = useState('');
  const [relationship, setRelationship] = useState(''); const [contact, setContact] = useState('');
  const [exceptionType, setExceptionType] = useState('principal'); const [reason, setReason] = useState(''); const [cancelReason, setCancelReason] = useState('');
  const [cancelOpen,setCancelOpen] = useState(false); const [cancelError,setCancelError] = useState('');
  const [detailsError,setDetailsError] = useState(''); const [exceptionError,setExceptionError] = useState('');
  const details = useQuery({ queryKey: ['loan-draft-controls', loanId], queryFn: async () => {
    const { data, error } = await client.from('loans').select('planned_disbursement_date,notes,guarantor_id,guarantor_relationship,guarantor_contact').eq('id', loanId).single();
    if (error) throw error; return data as Detail;
  } });
  const people = useQuery({ queryKey: ['loan-guarantor-search', search], enabled: search.trim().length >= 2, queryFn: async () => {
    const term = search.replace(/[,()%_]/g, ' ').trim(); if (term.length < 2) return [];
    const { data, error } = await client.from('muzakki').select('id,nama_kk,nama_lengkap,alamat,no_telp').eq('aktif',true).eq('jenis_identitas','individu').eq('identitas_terverifikasi',true).or(`nama_kk.ilike.%${term}%,nama_lengkap.ilike.%${term}%,alamat.ilike.%${term}%,no_telp.ilike.%${term}%`).limit(15);
    if (error) throw error; return (data ?? []) as Person[];
  } });
  const save = useMutation({ mutationFn: async () => {
    const { error } = await client.rpc('loan_set_draft_details', { p_loan: loanId, p_planned: planned, p_notes: notes || null, p_guarantor: person?.id ?? null, p_relationship: relationship || null, p_contact: contact || null }); if (error) throw error;
  }, onSuccess: () => { setDetailsError('');void refreshLoanProjections(cache); void cache.invalidateQueries({ queryKey: ['loan-draft-controls', loanId] }); void cache.invalidateQueries({ queryKey: ['staff-loan-detail', loanId] }); toast.success('Rincian draf tersimpan. Kontrak lama mungkin perlu diperbarui.'); }, onError: error => {const text=errorText(error);setDetailsError(text);toast.error(text);document.getElementById('loan-draft-planned')?.focus();} });
  const exception = useMutation({ mutationFn: async () => {
    if (!disbursementDate || !reason.trim()) throw new Error('Tanggal pencairan dan alasan pengecualian wajib diisi.');
    const { error } = await client.rpc('loan_record_policy_exception', { p_loan: loanId, p_date: disbursementDate, p_type: exceptionType, p_reason: reason }); if (error) throw error;
  }, onSuccess: () => { setReason('');setExceptionError(''); void refreshLoanProjections(cache); toast.success('Pengecualian tercatat untuk versi kebijakan dan data saat ini.'); }, onError: error => {const text=errorText(error);setExceptionError(text);toast.error(text);document.getElementById('loan-exception-reason')?.focus();} });
  const cancel = useMutation({ mutationFn: async () => { const { error } = await client.rpc('loan_cancel_draft', { p_loan: loanId, p_reason: cancelReason }); if (error) throw error; },
    onSuccess: () => { setCancelOpen(false);setCancelError(''); void refreshLoanProjections(cache); void cache.invalidateQueries({ queryKey: ['staff-loans'] }); void cache.invalidateQueries({ queryKey: ['staff-loan-detail', loanId] }); toast.success('Draf dibatalkan.'); }, onError: error => {setCancelError(errorText(error));toast.error(errorText(error));} });
  async function loadDetails() {
    if (!details.data) return; const row = details.data;
    setPlanned(row.planned_disbursement_date ?? ''); setNotes(row.notes ?? ''); setRelationship(row.guarantor_relationship ?? ''); setContact(row.guarantor_contact ?? '');
    if (!row.guarantor_id) { setPerson(null); setLoaded(true); return; }
    const { data, error } = await client.from('muzakki').select('id,nama_kk,nama_lengkap,alamat,no_telp').eq('id',row.guarantor_id).single();
    if (error) { toast.error('Penjamin tidak dapat dimuat.'); return; } setPerson(data as Person); setLoaded(true);
  }
  return <div className="space-y-3 rounded border p-4"><h2 className="font-semibold">Rincian draf dan penjamin</h2>
    {details.isLoading && <p>Memuat rincian draf...</p>}{details.error && <div role="alert"><p>Rincian draf tidak dapat dimuat.</p><Button variant="outline" onClick={()=>void details.refetch()}>Coba lagi</Button></div>}
    <Button variant="outline" disabled={details.isLoading || !!details.error} onClick={() => void loadDetails()}>Muat rincian tersimpan</Button>
    <p className="text-muted-foreground">Menyimpan tanpa penjamin akan menghapus pilihan penjamin pada draf. Perubahan setelah kontrak ditandatangani dapat mewajibkan kontrak baru.</p>
    <label className="block">Rencana tanggal pencairan<Input id="loan-draft-planned" type="date" value={planned} aria-describedby={detailsError?'loan-draft-error':undefined} onChange={e => setPlanned(e.target.value)} /></label>
    <label className="block">Catatan<Textarea value={notes} onChange={e => setNotes(e.target.value)} /></label>
    <label className="block">Cari penjamin (opsional)<Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama, alamat, atau nomor telepon" /></label>
    {people.isFetching && <p>Memuat penjamin...</p>}{people.error && <div role="alert"><p>Penjamin tidak dapat dicari.</p><Button variant="outline" onClick={()=>void people.refetch()}>Coba lagi</Button></div>}{search.trim().length>=2 && people.data?.length===0 && <p>Tidak ada penjamin yang cocok.</p>}
    {people.data?.map(p => <Button variant="outline" className="h-auto w-full justify-start whitespace-normal text-left" key={p.id} onClick={() => { setPerson(p); setSearch(''); setContact(p.no_telp ?? ''); }}>{p.nama_lengkap || p.nama_kk} · {p.alamat} · {p.no_telp}</Button>)}
    {person && <div><p>Penjamin: {person.nama_lengkap || person.nama_kk} · {person.alamat}</p><Button variant="outline" onClick={() => setPerson(null)}>Hapus penjamin</Button><label className="block">Hubungan<Input value={relationship} onChange={e => setRelationship(e.target.value)} /></label><label className="block">Kontak<Input value={contact} onChange={e => setContact(e.target.value)} /></label></div>}
    {detailsError && <p id="loan-draft-error" role="alert" className="text-destructive">{detailsError}</p>}
    <Button disabled={!loaded || save.isPending} onClick={() => save.mutate()}>{save.isPending?'Menyimpan...':'Simpan rincian draf'}</Button>
    <h3 className="font-semibold">Pengecualian kebijakan</h3><p className="text-muted-foreground">Hanya jenis yang diizinkan admin. Pengecualian berlaku untuk tanggal dan data draf saat dicatat.</p>
    <Select value={exceptionType} onValueChange={setExceptionType}><SelectTrigger aria-label="Jenis pengecualian"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="principal">Batas pokok</SelectItem><SelectItem value="tenor">Batas tenor</SelectItem><SelectItem value="guarantor">Penjamin wajib</SelectItem></SelectContent></Select>
    <label className="block">Alasan pengecualian<Input id="loan-exception-reason" aria-describedby={exceptionError?'loan-exception-error':undefined} value={reason} onChange={e => setReason(e.target.value)} /></label>{exceptionError && <p id="loan-exception-error" role="alert" className="text-destructive">{exceptionError}</p>}<Button variant="outline" disabled={exception.isPending || !disbursementDate || !reason.trim()} onClick={() => exception.mutate()}>{exception.isPending?'Menyimpan...':'Catat pengecualian'}</Button>
    <h3 className="font-semibold">Batalkan draf</h3><Button variant="destructive" onClick={()=>setCancelOpen(true)}>Batalkan draf</Button>
    <AlertDialog open={cancelOpen} onOpenChange={value=>{if(!cancel.isPending)setCancelOpen(value);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Batalkan draf pinjaman?</AlertDialogTitle><AlertDialogDescription>Alasan pembatalan akan dicatat pada pinjaman ini.</AlertDialogDescription></AlertDialogHeader><label>Alasan pembatalan<Input value={cancelReason} onChange={event=>setCancelReason(event.target.value)} /></label>{cancelError && <p role="alert" className="text-destructive">{cancelError}</p>}<AlertDialogFooter><AlertDialogCancel disabled={cancel.isPending}>Kembali</AlertDialogCancel><AlertDialogAction disabled={cancel.isPending || !cancelReason.trim()} onClick={event=>{event.preventDefault();cancel.mutate();}}>{cancel.isPending?'Membatalkan...':'Konfirmasi pembatalan'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
