import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Claim {
  payment_id: string; loan_id: string; loan_number: string; customer_name: string | null;
  payment_date: string; amount: number; reference: string | null; submitted_at: string;
  storage_path: string | null; possible_duplicate: boolean; total_pending: number;
}
const client = supabase as unknown as SupabaseClient;
const pageSize = 25;
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export function LoanClaimQueue({ onSelectLoan }: { onSelectLoan?: (id: string) => void }) {
  const [page, setPage] = useState(0);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const cache = useQueryClient();
  const queue = useQuery({ queryKey: ['loan-claim-queue', page], queryFn: async () => {
    const { data, error } = await client.rpc('loan_claim_review_queue', { p_offset: page * pageSize, p_limit: pageSize });
    if (error) throw error;
    return (data ?? []) as Claim[];
  } });
  const claimIds = (queue.data ?? []).map(item => item.payment_id);
  const proofs = useQuery({ queryKey: ['loan-claim-documents', claimIds], enabled: claimIds.length > 0, queryFn: async () => {
    const { data, error } = await client.from('loan_documents').select('id,payment_id,storage_path').in('payment_id', claimIds).eq('kind', 'payment_evidence');
    if (error) throw error;
    return (data ?? []) as { id: string; payment_id: string; storage_path: string }[];
  } });
  const review = useMutation({ mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
    const reason = (reasons[id] ?? '').trim();
    if (!accept && !reason) throw new Error('Alasan penolakan wajib diisi.');
    const { error } = await client.rpc('loan_review_payment_claim', { p_payment_id: id, p_accept: accept, p_reason: accept ? null : reason });
    if (error) throw error;
  }, onSuccess: () => {
    if (page > 0 && queue.data?.length === 1) setPage(page - 1);
    void cache.invalidateQueries({ queryKey: ['loan-claim-queue'] });
    void cache.invalidateQueries({ queryKey: ['loan-claim-documents'] });
    void cache.invalidateQueries({ queryKey: ['staff-loan-detail'] });
    void cache.invalidateQueries({ queryKey: ['staff-loans'] });
    void cache.invalidateQueries({ queryKey: ['loan-dashboard-current'] });
    void cache.invalidateQueries({ queryKey: ['loan-collectibility-status'] });
    void cache.invalidateQueries({ queryKey: ['loan-customer-collectibility'] });
    toast.success('Pemeriksaan pembayaran tersimpan.');
  }, onError: error => toast.error(error instanceof Error ? error.message : 'Klaim belum dapat diperiksa. Perbarui daftar dan coba lagi.') });
  async function download(path: string) {
    try {
      const { data, error } = await client.storage.from('pinjaman-jamaah-private').download(path);
      if (error || !data) throw new Error('Bukti tidak dapat diunduh.');
      const url = URL.createObjectURL(data);
      const link = document.createElement('a'); link.href = url; link.download = `bukti-transfer.${path.split('.').pop() || 'bin'}`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { toast.error('Bukti tidak dapat diunduh.'); }
  }
  const items = queue.data ?? [];
  const total = Number(items[0]?.total_pending ?? 0);
  return <Card><CardHeader><CardTitle>Antrean bukti pembayaran</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
    <p className="text-muted-foreground">Periksa bukti dan transaksi terkait sebelum konfirmasi. Tanda kemungkinan duplikat perlu diperiksa pengurus.</p>
    {queue.isLoading && <p>Memuat antrean...</p>}
    {queue.error && <p role="alert" className="text-destructive">Antrean tidak dapat dimuat.</p>}
    {!queue.isLoading && !queue.error && items.length === 0 && <p>Tidak ada klaim pada halaman ini.</p>}
    {items.map(item => <div className="space-y-2 rounded border p-3" key={item.payment_id}>
      <p><strong>{item.customer_name || 'Nasabah'}</strong> · <button type="button" className="underline" onClick={() => onSelectLoan?.(item.loan_id)}>{item.loan_number}</button></p>
      <p>Tanggal bayar: {item.payment_date} · {rupiah(Number(item.amount))}{item.reference && ` · Referensi: ${item.reference}`}</p>
      <p>Dikirim: {new Date(item.submitted_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
      {item.possible_duplicate && <p role="alert" className="text-amber-700">Kemungkinan duplikat: tanggal dan nominal, referensi, atau berkas cocok dengan pembayaran lain pada pinjaman ini.</p>}
      {proofs.isLoading && <p>Memuat bukti...</p>}
      {proofs.error && <p role="alert" className="text-destructive">Daftar bukti tidak dapat dimuat; periksa kembali sebelum konfirmasi.</p>}
      {proofs.data?.filter(proof => proof.payment_id === item.payment_id).map((proof, index) => <Button key={proof.id} variant="outline" onClick={() => void download(proof.storage_path)}>Unduh bukti {index + 1}</Button>)}
      {proofs.data && !proofs.data.some(proof => proof.payment_id === item.payment_id) && <p role="alert" className="text-destructive">Bukti tidak tersedia; jangan konfirmasi sebelum diperiksa.</p>}
      <Input aria-label={`Alasan penolakan ${item.loan_number}`} placeholder="Alasan jika ditolak" value={reasons[item.payment_id] ?? ''} onChange={event => setReasons(previous => ({ ...previous, [item.payment_id]: event.target.value }))} />
      <div className="flex flex-wrap gap-2"><Button disabled={review.isPending || !item.storage_path || !proofs.data?.some(proof => proof.payment_id === item.payment_id)} onClick={() => review.mutate({ id: item.payment_id, accept: true })}>Konfirmasi</Button><Button variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: item.payment_id, accept: false })}>Tolak</Button></div>
    </div>)}
    <div className="flex items-center gap-2"><Button variant="outline" disabled={page === 0 || queue.isFetching} onClick={() => setPage(value => value - 1)}>Sebelumnya</Button><span>Halaman {page + 1}{items.length > 0 && ` · ${total} klaim`}</span><Button variant="outline" disabled={queue.isFetching || (page + 1) * pageSize >= total} onClick={() => setPage(value => value + 1)}>Berikutnya</Button></div>
  </CardContent></Card>;
}
