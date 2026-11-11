import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { MuzakkiMaster } from '@/hooks/useMuzakki';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function PersonIdentityDialog({ person, onClose }: { person: MuzakkiMaster; onClose: () => void }) {
  const [name, setName] = useState(person.nama_lengkap || person.nama_kk);
  const [memberName, setMemberName] = useState('');
  const requestId = useRef(crypto.randomUUID());
  const cache = useQueryClient();
  const action = useMutation({ mutationFn: async (kind: 'individual' | 'household' | 'member' | 'rename') => {
    if ((kind === 'individual' || kind === 'rename') && !name.trim()) throw new Error('Nama lengkap wajib diisi.');
    if (kind === 'member' && !memberName.trim()) throw new Error('Nama anggota wajib diisi.');
    const client = supabase as unknown as SupabaseClient;
    const result = kind === 'rename'
      ? await client.rpc('person_update_name', { p_person_id: person.id, p_name: name.trim() })
      : kind === 'individual'
      ? await client.rpc('loan_confirm_individual', { p_person_id: person.id, p_name: name.trim() })
      : kind === 'household'
        ? await client.rpc('person_confirm_household', { p_person_id: person.id })
        : await client.rpc('person_add_household_member', { p_household_id: person.id, p_name: memberName.trim(), p_request_id: requestId.current });
    if (result.error) throw result.error;
  }, onSuccess: () => {
    requestId.current = crypto.randomUUID();
    void cache.invalidateQueries({ queryKey: ['muzakki-list'] });
    void cache.invalidateQueries({ queryKey: ['loan-person-search'] });
    toast.success('Identitas berhasil disimpan.'); onClose();
  }, onError: error => toast.error(error instanceof Error ? error.message : 'Identitas belum dapat disimpan.') });
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>Verifikasi data orang</DialogTitle></DialogHeader>
    <p className="text-sm">Data sumber: {person.nama_kk} · {person.alamat}. Transaksi lama tetap terhubung pada data sumber.</p>
    {person.jenis_identitas !== 'rumah_tangga' && !person.identitas_terverifikasi && <div className="space-y-3"><p className="text-sm">Pastikan apakah baris ini mewakili satu orang atau satu rumah tangga.</p><label className="block text-sm">Nama lengkap individu<Input value={name} onChange={event => setName(event.target.value)} /></label><div className="flex flex-wrap gap-2"><Button disabled={action.isPending} onClick={() => action.mutate('individual')}>Konfirmasi sebagai individu</Button>{person.jenis_identitas !== 'individu' && <Button variant="outline" disabled={action.isPending} onClick={() => action.mutate('household')}>Konfirmasi sebagai rumah tangga</Button>}</div></div>}
    {person.jenis_identitas === 'rumah_tangga' && <div className="space-y-3"><p className="text-sm">Tambahkan anggota sebagai individu baru. Riwayat rumah tangga tidak dipindahkan.</p><label className="block text-sm">Nama lengkap anggota<Input value={memberName} onChange={event => setMemberName(event.target.value)} /></label><Button disabled={action.isPending} onClick={() => action.mutate('member')}>Tambahkan anggota</Button></div>}
    {person.jenis_identitas === 'individu' && person.identitas_terverifikasi && <div className="space-y-3"><p className="text-sm">Perubahan nama dicatat dan dapat membatalkan kontrak draft yang sudah ditandatangani.</p><label className="block text-sm">Nama lengkap<Input value={name} onChange={event => setName(event.target.value)} /></label><Button disabled={action.isPending || !name.trim() || name.trim() === person.nama_lengkap} onClick={() => action.mutate('rename')}>Simpan nama lengkap</Button></div>}
  </DialogContent></Dialog>;
}
