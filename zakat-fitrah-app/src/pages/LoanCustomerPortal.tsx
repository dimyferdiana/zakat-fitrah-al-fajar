import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { loanPosition } from '@/lib/loanCalculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { downloadLoanReceipt } from '@/lib/loanReceipt';
import { downloadLoanDocument } from '@/lib/loanDocuments';
import { toast } from 'sonner';
import { LoanPaymentClaim } from '@/components/loans/LoanPaymentClaim';

interface PortalLoan {
  id: string;
  loan_number: string;
  status: 'active' | 'paid' | 'needs_reconciliation';
  principal: number;
  migration_cutoff: string | null;
  loan_installments: { due_date: string; amount: number; opening_remaining: number | null; installment_number: number }[];
  loan_payments: { id: string; payment_date: string; amount: number; status: 'confirmed' | 'pending' | 'rejected' | 'cancelled'; rejection_reason: string | null; customer_note: string | null }[];
}

const formatMoney = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

function CustomerDocuments({ loanId }: { loanId: string }) {
  const documents = useQuery({ queryKey: ['customer-documents', loanId], queryFn: async () => {
    const client = supabase as unknown as SupabaseClient;
    const { data, error } = await client.rpc('loan_customer_documents');
    if (error) throw error;
    return ((data ?? []) as { id: string; loan_id: string; kind: string; storage_path: string }[]).filter(item => item.loan_id === loanId);
  } });
  const historicalContract = useQuery({ queryKey: ['historical-contract-status', loanId], queryFn: async () => {
    const { data, error } = await (supabase as unknown as SupabaseClient).rpc('loan_historical_contract_missing', { p_loan_id: loanId });
    if (error) throw error;
    return data === true;
  } });
  async function download(path: string, kind: string) {
    const { data, error } = await supabase.storage.from('pinjaman-jamaah-private').download(path);
    if (error || !data) { toast.error('Dokumen tidak dapat diunduh. Silakan masuk kembali atau hubungi pengurus.'); return; }
    const url = URL.createObjectURL(data); const link = document.createElement('a'); link.href = url;
    link.download = `${kind}.${path.split('.').pop() || 'pdf'}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-2 pt-3"><h2 className="font-semibold">Dokumen saya</h2>
    {documents.isError && <p role="alert">Dokumen belum dapat dimuat.</p>}
    {historicalContract.data && <p>Kontrak historis belum tersedia.</p>}
    {documents.data?.map(item => <Button key={item.id} variant="outline" className="mr-2" onClick={() => void download(item.storage_path,item.kind)}>{item.kind === 'contract_signed' ? 'Unduh kontrak final' : item.kind === 'receipt' ? 'Unduh tanda terima' : 'Unduh bukti transfer'}</Button>)}
  </div>;
}

export function LoanCustomerPortal() {
  const { customer, logout, canSwitchStaff, switchMode } = useAuth();
  const profile = useQuery({ queryKey:['customer-portal-profile',customer?.id], enabled:!!customer, queryFn:async () => {
    const {data,error}=await (supabase as unknown as SupabaseClient).rpc('loan_customer_portal_profile');
    if(error) throw error;
    return data as {name:string;disbursed_known:number;paid_known:number;incomplete_history:boolean;unverified_loan_ids:string[];contact:{name:string;phone:string|null;email:string|null}|null};
  } });
  const { data: loans, isLoading, error } = useQuery({
    queryKey: ['customer-loans', customer?.id],
    enabled: !!customer,
    queryFn: async () => {
      const client = supabase as unknown as SupabaseClient;
      const { data, error: queryError } = await client.rpc('loan_customer_loans');
      if (queryError) throw queryError;
      const { data: payments, error: paymentsError } = await client.rpc('loan_customer_payment_history');
      if (paymentsError) throw paymentsError;
      return ((data ?? []) as Omit<PortalLoan, 'loan_payments'>[]).map(loan => ({ ...loan, loan_payments: (payments ?? []).filter((payment: { loan_id: string }) => payment.loan_id === loan.id) })) as PortalLoan[];
    },
  });

  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">Pinjaman Saya</h1><p className="text-sm text-muted-foreground">Ringkasan pinjaman jamaah</p></div>
        <div className="flex gap-2">{canSwitchStaff && <Button variant="outline" onClick={() => void switchMode('staff').catch(() => toast.error('Mode tidak dapat diganti. Silakan masuk kembali.'))}>Mode pengurus</Button>}<Button variant="outline" onClick={() => void logout()}>Keluar</Button></div>
      </header>
      {isLoading && <p>Memuat data pinjaman...</p>}
      {error && <p role="alert" className="text-destructive">Data pinjaman belum dapat dimuat. Silakan hubungi pengurus.</p>}
      {!isLoading && !error && loans?.length === 0 && <p>Belum ada pinjaman yang dapat ditampilkan.</p>}
      {profile.data && <section className="rounded border p-4 text-sm"><h2 className="font-semibold">Profil nasabah</h2><p>Nama: {profile.data.name}</p><p>Total pencairan tercatat: {formatMoney(Number(profile.data.disbursed_known))}</p><p>Total pembayaran terkonfirmasi yang diketahui: {formatMoney(Number(profile.data.paid_known))}</p>{profile.data.incomplete_history && <p>Riwayat lama belum lengkap; total hanya mencakup transaksi yang diketahui.</p>}<p>Kontak pengurus: {profile.data.contact?.name || 'Pengurus masjid'}{profile.data.contact?.phone ? ` · ${profile.data.contact.phone}` : ''}{profile.data.contact?.email ? ` · ${profile.data.contact.email}` : ''}</p></section>}
      {profile.error && <p role="alert">Profil dan kontak pengurus belum dapat dimuat.</p>}
      {loans?.map(loan => {
        const installments = [...loan.loan_installments].sort((a, b) => a.installment_number - b.installment_number);
        const migrationComplete = !loan.migration_cutoff || (!!profile.data && !profile.data.unverified_loan_ids.includes(loan.id) && installments.every(item => item.opening_remaining !== null));
        let position: ReturnType<typeof loanPosition> | null = null;
        try {
          if (migrationComplete && installments.length > 0) {
            position = loanPosition(
              installments.map(item => ({ dueDate: item.due_date, amount: Number(item.amount) })),
              loan.loan_payments.filter(item => !loan.migration_cutoff || item.payment_date > loan.migration_cutoff)
                .map(item => ({ id: item.id, date: item.payment_date, amount: Number(item.amount), status: item.status })),
              today,
              loan.migration_cutoff ? installments.map(item => Number(item.opening_remaining)) : undefined,
            );
          }
        } catch {
          position = null;
        }
        return (
          <Card key={loan.id}>
            <CardHeader><CardTitle>{loan.loan_number}</CardTitle><p className="text-sm text-muted-foreground">{loan.status === 'paid' ? 'Lunas' : loan.status === 'needs_reconciliation' ? 'Aktif — pemulihan akibat koreksi' : 'Aktif'}</p></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Pokok: {formatMoney(Number(loan.principal))}</p>
              {position ? <><p>Sisa pokok: <strong>{formatMoney(position.remaining)}</strong></p><p>Tunggakan: {formatMoney(position.overdue)}</p><p>Tagihan hari ini: {formatMoney(position.dueToday)}</p><p>Hari keterlambatan: {position.daysPastDue}</p><p>Transaksi terkonfirmasi: {position.paymentsCount}{loan.migration_cutoff ? ' (yang diketahui)' : ''}</p><p>Angsuran lunas: {position.settledInstallments} dari {installments.length}</p></> : <p>Rincian saldo belum tersedia. Hubungi pengurus.</p>}
              {loan.migration_cutoff && <p>Data sebelum {loan.migration_cutoff} mungkin belum lengkap.</p>}
              {position && position.remaining > 0 && (() => { const next=position.installments.find(item=>item.remaining>0); return next ? <p className="rounded border p-2">Pengingat tagihan: {next.dueDate} · sisa {formatMoney(next.remaining)}{next.dueDate < today ? ' (sudah jatuh tempo)' : ''}.</p> : null; })()}
              {(loan.status === 'active' || loan.status === 'needs_reconciliation') && position && <LoanPaymentClaim loanId={loan.id} />}
              <CustomerDocuments loanId={loan.id} />
              <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void downloadLoanDocument(loan.id,'disbursement').catch(() => toast.error('Ringkasan belum tersedia.'))}>Unduh ringkasan pencairan</Button><Button variant="outline" onClick={() => void downloadLoanDocument(loan.id,'card').catch(() => toast.error('Kartu pinjaman belum tersedia.'))}>Unduh kartu pinjaman</Button></div>
              {position && <div className="overflow-x-auto pt-3"><h2 className="font-semibold">Jadwal angsuran</h2><table className="w-full"><thead><tr className="border-b text-left"><th className="p-2">Jatuh tempo</th><th>Nominal</th><th>Sisa</th></tr></thead><tbody>{installments.map((item, index) => <tr key={item.installment_number} className="border-b"><td className="p-2">{item.due_date}</td><td>{formatMoney(Number(item.amount))}</td><td>{formatMoney(position!.installments[index].remaining)}</td></tr>)}</tbody></table></div>}
              <div className="pt-3"><h2 className="font-semibold">Riwayat pembayaran</h2>{loan.loan_payments.length === 0 ? <p>Belum ada pembayaran yang tercatat.</p> : <ul className="divide-y">{[...loan.loan_payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date)).map(payment => <li className="space-y-2 py-2" key={payment.id}><p>{payment.payment_date} · {formatMoney(Number(payment.amount))} · {({ confirmed: 'Terkonfirmasi', pending: 'Menunggu pemeriksaan', rejected: 'Ditolak', cancelled: 'Dibatalkan' })[payment.status]}</p>{payment.customer_note && <p>Catatan Anda: {payment.customer_note}</p>}{payment.status === 'rejected' && payment.rejection_reason && <p>Alasan: {payment.rejection_reason}</p>}{(payment.status === 'confirmed' || payment.status === 'cancelled') && <Button variant="outline" onClick={() => void downloadLoanReceipt(payment.id, false).catch(() => toast.error('Tanda terima belum tersedia. Hubungi pengurus.'))}>Unduh tanda terima</Button>}</li>)}</ul>}</div>
            </CardContent>
          </Card>
        );
      })}
    </main>
  );
}
