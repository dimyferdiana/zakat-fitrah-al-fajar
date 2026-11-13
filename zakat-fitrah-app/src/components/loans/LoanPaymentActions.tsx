import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { refreshLoanProjections } from '@/lib/loanQueryRefresh';
import { downloadPaymentProof } from '@/lib/loanPaymentProof';
import { loanDate, loanDateTime } from '@/lib/loanDisplay';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const client = supabase as unknown as SupabaseClient;
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export type PaymentContext = { id: string; loanNumber: string; customer: string; date: string; amount: number };
export type PaymentProof = { id: string; storage_path: string };

function summary(payment: PaymentContext) {
  return `${payment.customer} · ${payment.loanNumber} · ${loanDate(payment.date)} · ${money(Number(payment.amount))}`;
}

export function ClaimReview({ payment, proofs, proofsLoading = false, duplicate = false, submitted, reference, onReviewed }: {
  payment: PaymentContext; proofs: PaymentProof[] | undefined; proofsLoading?: boolean; duplicate?: boolean;
  submitted?: string; reference?: string | null; onReviewed?: () => void;
}) {
  const cache = useQueryClient();
  const [open, setOpen] = useState(false); const [confirm, setConfirm] = useState(false);
  const [reject, setReject] = useState(false); const [reason, setReason] = useState(''); const [error, setError] = useState('');
  const proofAccess = useQuery({ queryKey: ['loan-claim-proof-access', payment.id, proofs?.map(proof => proof.storage_path)], enabled: open && !!proofs?.length,
    staleTime: 0, queryFn: async () => { for (const proof of proofs ?? []) { const { data, error } = await client.storage.from('pinjaman-jamaah-private').download(proof.storage_path); if (!error && data) return true; } return false; } });
  const review = useMutation({ mutationFn: async (accept: boolean) => {
    if (!accept && !reason.trim()) throw new Error('Alasan penolakan wajib diisi.');
    const { error } = await client.rpc('loan_review_payment_claim', { p_payment_id: payment.id, p_accept: accept, p_reason: accept ? null : reason.trim() });
    if (error) throw error;
  }, onSuccess: () => {
    setOpen(false); setConfirm(false); setReject(false); setReason(''); setError('');
    void refreshLoanProjections(cache); onReviewed?.(); toast.success('Pemeriksaan pembayaran tersimpan.');
  }, onError: async () => {
    const { data } = await client.from('loan_payments').select('status').eq('id',payment.id).maybeSingle();
    const labels: Record<string,string> = { pending:'Menunggu Verifikasi', confirmed:'Terkonfirmasi', rejected:'Ditolak', cancelled:'Dibatalkan' };
    const status = data && typeof data.status === 'string' ? labels[data.status] : undefined;
    const text = status ? `Pembayaran belum dapat diproses. Status terbaru: ${status}.` : 'Pembayaran belum dapat diproses. Status terbaru tidak tersedia.';
    setConfirm(false); setError(text); toast.error(text); void refreshLoanProjections(cache);
  } });
  return <>
    <Dialog open={open} onOpenChange={value => { if (!review.isPending) { setOpen(value); setError(''); } }}>
      <DialogTrigger asChild><Button variant="outline">Periksa klaim</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Periksa bukti pembayaran</DialogTitle><DialogDescription>{summary(payment)}</DialogDescription></DialogHeader>
        {submitted && <p>Dikirim: {loanDateTime(submitted)}</p>}{reference && <p>Referensi: {reference}</p>}
        {duplicate && <p role="alert" className="text-amber-700 dark:text-amber-300">Kemungkinan duplikat. Periksa tanggal, nominal, referensi dan bukti sebelum melanjutkan.</p>}
        {proofsLoading && <p>Memuat bukti...</p>}{!proofsLoading && !proofs && <p role="alert">Bukti tidak dapat dimuat. Perbarui daftar dan coba lagi.</p>}
        {proofs?.map((proof, index) => <Button key={proof.id} variant="outline" onClick={() => void downloadPaymentProof(proof.storage_path)}>Unduh bukti {index + 1}</Button>)}
        {proofs && proofs.length === 0 && <p role="alert">Bukti tidak tersedia; klaim tidak dapat dikonfirmasi.</p>}
        {proofs && proofs.length > 0 && proofAccess.isFetching && <p>Memeriksa akses bukti...</p>}
        {proofs && proofs.length > 0 && !proofAccess.isFetching && (proofAccess.data === false || proofAccess.error) && <p role="alert">Berkas bukti tidak tersedia; klaim tidak dapat dikonfirmasi.</p>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <DialogFooter><Button variant="outline" disabled={review.isPending} onClick={() => { setReason(''); setError(''); setReject(true); }}>Tolak</Button><Button disabled={review.isPending || proofsLoading || !proofs?.length || proofAccess.isFetching || proofAccess.data !== true} onClick={() => setConfirm(true)}>Konfirmasi</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Konfirmasi pembayaran?</AlertDialogTitle><AlertDialogDescription>{summary(payment)}. Pastikan bukti telah diperiksa.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={review.isPending}>Kembali</AlertDialogCancel><AlertDialogAction disabled={review.isPending} onClick={event => { event.preventDefault(); review.mutate(true); }}>Konfirmasi pembayaran</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <Dialog open={reject} onOpenChange={value => { if (!review.isPending) setReject(value); }}><DialogContent><DialogHeader><DialogTitle>Tolak klaim pembayaran</DialogTitle><DialogDescription>{summary(payment)}</DialogDescription></DialogHeader><label>Alasan penolakan<Textarea value={reason} onChange={event => setReason(event.target.value)} /></label>{error && <p role="alert" className="text-destructive">{error}</p>}<DialogFooter><Button variant="outline" onClick={() => setReject(false)} disabled={review.isPending}>Kembali</Button><Button variant="destructive" disabled={review.isPending || !reason.trim()} onClick={() => review.mutate(false)}>{review.isPending?'Menyimpan...':'Tolak pembayaran'}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}

export function CancelPayment({ payment }: { payment: PaymentContext }) {
  const cache = useQueryClient(); const [open, setOpen] = useState(false); const [reason, setReason] = useState(''); const [error, setError] = useState('');
  const cancel = useMutation({ mutationFn: async () => {
    if (!reason.trim()) throw new Error('Alasan pembatalan wajib diisi.');
    const { error } = await client.rpc('loan_cancel_payment', { p_payment_id: payment.id, p_reason: reason.trim() }); if (error) throw error;
  }, onSuccess: () => { setOpen(false); setReason(''); setError(''); void refreshLoanProjections(cache); toast.success('Pembayaran dibatalkan.'); },
  onError: () => { setError('Pembatalan belum berhasil. Status mungkin telah berubah; daftar sedang diperbarui.'); void refreshLoanProjections(cache); } });
  return <Dialog open={open} onOpenChange={value => { if (!cancel.isPending) { setOpen(value); setError(''); } }}><DialogTrigger asChild><Button variant="outline">Batalkan pembayaran</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Batalkan pembayaran</DialogTitle><DialogDescription>{summary(payment)}. Pembatalan akan tercatat sebagai koreksi.</DialogDescription></DialogHeader><label>Alasan pembatalan<Textarea value={reason} onChange={event => setReason(event.target.value)} /></label>{error && <p role="alert" className="text-destructive">{error}</p>}<DialogFooter><Button variant="outline" disabled={cancel.isPending} onClick={() => setOpen(false)}>Kembali</Button><Button variant="destructive" disabled={cancel.isPending || !reason.trim()} onClick={() => cancel.mutate()}>{cancel.isPending?'Membatalkan...':'Konfirmasi pembatalan'}</Button></DialogFooter></DialogContent></Dialog>;
}
