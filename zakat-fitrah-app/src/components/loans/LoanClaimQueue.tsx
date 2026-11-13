import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClaimReview } from '@/components/loans/LoanPaymentActions';
import { loanDate, loanDateTime } from '@/lib/loanDisplay';

interface Claim { payment_id: string; loan_id: string; loan_number: string; customer_name: string | null; payment_date: string; amount: number; reference: string | null; submitted_at: string; storage_path: string | null; possible_duplicate: boolean; total_pending: number }
const client = supabase as unknown as SupabaseClient;
const pageSize = 25;
const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export function LoanClaimQueue({ onSelectLoan }: { onSelectLoan?: (id: string) => void }) {
  const [page, setPage] = useState(0);
  const queue = useQuery({ queryKey: ['loan-claim-queue', page], queryFn: async ({ signal }) => {
    const { data, error } = await client.rpc('loan_claim_review_queue', { p_offset: page * pageSize, p_limit: pageSize }).abortSignal(signal);
    if (error) throw error; return (data ?? []) as Claim[];
  } });
  const items = queue.data ?? [];
  const claimIds = items.map(item => item.payment_id);
  const proofs = useQuery({ queryKey: ['loan-claim-documents', claimIds], enabled: claimIds.length > 0, queryFn: async ({ signal }) => {
    const { data, error } = await client.from('loan_documents').select('id,payment_id,storage_path').in('payment_id', claimIds).eq('kind', 'payment_evidence').abortSignal(signal);
    if (error) throw error; return (data ?? []) as { id: string; payment_id: string; storage_path: string }[];
  } });
  const total = Number(items[0]?.total_pending ?? 0);
  return <Card><CardHeader><CardTitle>Antrean bukti pembayaran</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
    <p className="text-muted-foreground">Periksa bukti dan transaksi terkait sebelum konfirmasi.</p>
    {queue.isLoading && <p>Memuat antrean...</p>}{queue.error && <div role="alert"><p>Antrean tidak dapat dimuat.</p><Button variant="outline" onClick={()=>void queue.refetch()}>Coba lagi</Button></div>}
    {!queue.isLoading && !queue.error && items.length === 0 && <p>{page===0?'Tidak ada bukti menunggu verifikasi.':'Tidak ada klaim pada halaman ini; kembali ke halaman sebelumnya.'}</p>}
    {items.map(item => <div className="space-y-2 rounded-md border p-3" key={item.payment_id}>
      <p><strong>{item.customer_name || 'Nasabah'}</strong> · <Button variant="link" className="h-auto p-0" onClick={() => onSelectLoan?.(item.loan_id)}>{item.loan_number}</Button></p>
      <p>Tanggal bayar: {loanDate(item.payment_date)} · {rupiah(Number(item.amount))}{item.reference && ` · Referensi: ${item.reference}`}</p>
      <p>Dikirim: {loanDateTime(item.submitted_at)}</p>
      {item.possible_duplicate && <p role="alert" className="text-amber-700 dark:text-amber-300">Kemungkinan duplikat; periksa sebelum konfirmasi.</p>}
      <p>{proofs.isFetching ? 'Memuat bukti...' : proofs.error ? 'Bukti tidak dapat dimuat.' : proofs.data?.some(proof => proof.payment_id === item.payment_id) ? 'Bukti tersedia untuk diperiksa.' : 'Bukti tidak tersedia.'}</p>
      <ClaimReview payment={{id:item.payment_id,loanNumber:item.loan_number,customer:item.customer_name || 'Nasabah',date:item.payment_date,amount:item.amount}} proofs={proofs.error ? undefined : proofs.data?.filter(proof => proof.payment_id === item.payment_id)} proofsLoading={proofs.isFetching} duplicate={item.possible_duplicate} submitted={item.submitted_at} reference={item.reference} onReviewed={() => { if (page > 0 && items.length === 1) setPage(value => value - 1); }} />
    </div>)}
    <div className="flex items-center gap-2"><Button variant="outline" disabled={page === 0 || queue.isFetching} onClick={() => setPage(value => value - 1)}>Sebelumnya</Button><span>Halaman {page + 1}{items.length > 0 && ` · ${total} klaim`}</span><Button variant="outline" disabled={queue.isFetching || (page + 1) * pageSize >= total} onClick={() => setPage(value => value + 1)}>Berikutnya</Button></div>
  </CardContent></Card>;
}
