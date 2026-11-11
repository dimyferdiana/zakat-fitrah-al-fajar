import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { MuzakkiMaster } from '@/hooks/useMuzakki';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function MustahikLinkDialog({ beneficiary, onClose }: { beneficiary: { id: string; nama: string }; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [person, setPerson] = useState<MuzakkiMaster | null>(null);
  const queryClient = useQueryClient();
  const term = search.replace(/[,()%_]/g, ' ').trim();
  const people = useQuery({ queryKey: ['mustahik-person-search', term], enabled: term.length >= 2, queryFn: async () => {
    const { data, error } = await (supabase as unknown as SupabaseClient).from('muzakki')
      .select('id,nama_kk,nama_lengkap,alamat,aktif,jenis_identitas,identitas_terverifikasi')
      .eq('aktif', true).eq('jenis_identitas', 'individu').eq('identitas_terverifikasi', true)
      .or(`nama_kk.ilike.%${term}%,nama_lengkap.ilike.%${term}%,alamat.ilike.%${term}%,no_telp.ilike.%${term}%`).limit(20);
    if (error) throw error;
    return (data ?? []) as MuzakkiMaster[];
  } });
  const mapping = useMutation({ mutationFn: async () => {
    if (!person) throw new Error('Pilih individu yang sudah diverifikasi.');
    const { error } = await (supabase as unknown as SupabaseClient).rpc('person_map_mustahik', { p_mustahik_id: beneficiary.id, p_person_id: person.id });
    if (error) throw error;
  }, onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['mustahik-list'] });
    void queryClient.invalidateQueries({ queryKey: ['muzakki-history'] });
    toast.success('Mustahik berhasil ditautkan ke data orang.'); onClose();
  }, onError: error => toast.error(error instanceof Error ? error.message : 'Pemetaan tidak dapat disimpan.') });
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Hubungkan mustahik</DialogTitle></DialogHeader>
    <p className="text-sm">Pilih individu yang sudah diverifikasi untuk {beneficiary.nama}. ID dan transaksi distribusi mustahik tetap dipertahankan.</p>
    <label className="block text-sm">Cari nama, alamat, atau telepon<Input value={search} onChange={event => { setSearch(event.target.value); setPerson(null); }} /></label>
    {term.length >= 2 && <div className="max-h-48 space-y-2 overflow-y-auto">{people.isLoading && <p>Memuat...</p>}{people.error && <p role="alert">Data orang tidak dapat dimuat.</p>}{people.data?.map(item => <button type="button" className="block w-full rounded border p-2 text-left text-sm hover:bg-muted" key={item.id} onClick={() => setPerson(item)}>{item.nama_lengkap || item.nama_kk} · {item.alamat}</button>)}</div>}
    {person && <p className="text-sm">Pilihan: <strong>{person.nama_lengkap || person.nama_kk}</strong> · {person.alamat}</p>}
    <Button disabled={!person || mapping.isPending} onClick={() => mapping.mutate()}>Konfirmasi pemetaan</Button>
  </DialogContent></Dialog>;
}
