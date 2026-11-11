import type { LoanPosition } from '@/lib/loanCalculations';

const rupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
export function LoanPaymentSummary({ position, installmentCount, migrated }: { position: LoanPosition | null; installmentCount: number; migrated: boolean }) {
  if (!position) return <p>Saldo belum tersedia atau perlu rekonsiliasi.</p>;
  return <div className="grid gap-2 sm:grid-cols-3">
    <p>Sisa pokok: <strong>{rupiah(position.remaining)}</strong></p><p>Tunggakan: {rupiah(position.overdue)}</p>
    <p>Tagihan hari ini: {rupiah(position.dueToday)}</p><p>Hari keterlambatan: {position.daysPastDue}</p>
    <p>Transaksi terkonfirmasi: {position.paymentsCount}{migrated ? ' (yang diketahui)' : ''}</p>
    <p>Angsuran lunas: {position.settledInstallments}/{installmentCount}</p>
  </div>;
}
