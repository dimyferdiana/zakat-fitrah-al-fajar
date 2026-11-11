import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  }, onSuccess: () => { void cache.invalidateQueries({ queryKey: ['loan-draft-controls', loanId] }); void cache.invalidateQueries({ queryKey: ['staff-loan-detail', loanId] }); toast.success('Rincian draft tersimpan. Kontrak lama mungkin perlu diperbarui.'); }, onError: error => toast.error(errorText(error)) });
  const exception = useMutation({ mutationFn: async () => {
    if (!disbursementDate || !reason.trim()) throw new Error('Tanggal pencairan dan alasan pengecualian wajib diisi.');
    const { error } = await client.rpc('loan_record_policy_exception', { p_loan: loanId, p_date: disbursementDate, p_type: exceptionType, p_reason: reason }); if (error) throw error;
  }, onSuccess: () => { setReason(''); toast.success('Pengecualian tercatat untuk versi kebijakan dan data saat ini.'); }, onError: error => toast.error(errorText(error)) });
  const cancel = useMutation({ mutationFn: async () => { const { error } = await client.rpc('loan_cancel_draft', { p_loan: loanId, p_reason: cancelReason }); if (error) throw error; },
    onSuccess: () => { void cache.invalidateQueries({ queryKey: ['staff-loans'] }); void cache.invalidateQueries({ queryKey: ['staff-loan-detail', loanId] }); toast.success('Draft dibatalkan.'); }, onError: error => toast.error(errorText(error)) });
  async function loadDetails() {
    if (!details.data) return; const row = details.data;
    setPlanned(row.planned_disbursement_date ?? ''); setNotes(row.notes ?? ''); setRelationship(row.guarantor_relationship ?? ''); setContact(row.guarantor_contact ?? '');
    if (!row.guarantor_id) { setPerson(null); setLoaded(true); return; }
    const { data, error } = await client.from('muzakki').select('id,nama_kk,nama_lengkap,alamat,no_telp').eq('id',row.guarantor_id).single();
    if (error) { toast.error('Penjamin tidak dapat dimuat.'); return; } setPerson(data as Person); setLoaded(true);
  }
  return <div className="space-y-3 rounded border p-4"><h2 className="font-semibold">Rincian draft dan penjamin</h2>
    <Button variant="outline" onClick={() => void loadDetails()}>Muat rincian tersimpan</Button>
    <p className="text-muted-foreground">Menyimpan tanpa penjamin akan menghapus pilihan penjamin pada draft. Perubahan setelah kontrak ditandatangani dapat mewajibkan kontrak baru.</p>
    <label className="block">Rencana tanggal pencairan<Input type="date" value={planned} onChange={e => setPlanned(e.target.value)} /></label>
    <label className="block">Catatan<Textarea value={notes} onChange={e => setNotes(e.target.value)} /></label>
    <label className="block">Cari penjamin (opsional)<Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama, alamat, atau nomor telepon" /></label>
    {people.data?.map(p => <button className="block w-full rounded border p-2 text-left" key={p.id} onClick={() => { setPerson(p); setSearch(''); setContact(p.no_telp ?? ''); }}>{p.nama_lengkap || p.nama_kk} · {p.alamat} · {p.no_telp}</button>)}
    {person && <div><p>Penjamin: {person.nama_lengkap || person.nama_kk} · {person.alamat}</p><Button variant="outline" onClick={() => setPerson(null)}>Hapus penjamin</Button><label className="block">Hubungan<Input value={relationship} onChange={e => setRelationship(e.target.value)} /></label><label className="block">Kontak<Input value={contact} onChange={e => setContact(e.target.value)} /></label></div>}
    <Button disabled={!loaded || save.isPending} onClick={() => save.mutate()}>Simpan rincian draft</Button>
    <h3 className="font-semibold">Pengecualian kebijakan</h3><p className="text-muted-foreground">Hanya jenis yang diizinkan admin. Pengecualian berlaku untuk tanggal dan data draft saat dicatat.</p>
    <select className="h-10 w-full rounded border bg-background px-3" value={exceptionType} onChange={e => setExceptionType(e.target.value)}><option value="principal">Batas pokok</option><option value="tenor">Batas tenor</option><option value="guarantor">Penjamin wajib</option></select>
    <Input placeholder="Alasan pengecualian" value={reason} onChange={e => setReason(e.target.value)} /><Button variant="outline" disabled={exception.isPending} onClick={() => exception.mutate()}>Catat pengecualian</Button>
    <h3 className="font-semibold">Batalkan draft</h3><Input placeholder="Alasan pembatalan" value={cancelReason} onChange={e => setCancelReason(e.target.value)} /><Button variant="outline" disabled={cancel.isPending || !cancelReason.trim()} onClick={() => cancel.mutate()}>Batalkan draft</Button>
  </div>;
}
