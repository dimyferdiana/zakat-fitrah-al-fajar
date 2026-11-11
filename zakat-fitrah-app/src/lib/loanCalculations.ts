import type { Installment } from './loanSchedule';

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export interface LoanPayment {
  id: string;
  date: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'rejected' | 'cancelled';
}

export interface LoanPosition {
  remaining: number;
  overdue: number;
  dueToday: number;
  daysPastDue: number;
  paymentsCount: number;
  settledInstallments: number;
  installments: (Installment & { remaining: number })[];
}

/** Computes a position at a calendar date; initialRemaining is the verified migration snapshot when supplied. */
export function loanPosition(schedule: Installment[], payments: LoanPayment[], asOf: string, initialRemaining?: number[]): LoanPosition {
  if (!validDate(asOf)) throw new Error('Tanggal posisi tidak valid');
  if (initialRemaining && initialRemaining.length !== schedule.length) throw new Error('Saldo awal angsuran tidak sesuai');
  let previousDate = '';
  const installments = schedule.map((item, index) => {
    const remaining = initialRemaining?.[index] ?? item.amount;
    if (!validDate(item.dueDate) || item.dueDate <= previousDate) throw new Error('Tanggal angsuran tidak valid atau tidak berurutan');
    previousDate = item.dueDate;
    if (!Number.isSafeInteger(item.amount) || item.amount <= 0 || !Number.isSafeInteger(remaining) || remaining < 0 || remaining > item.amount) throw new Error('Nominal angsuran tidak valid');
    return { ...item, remaining };
  });
  if (payments.some(p => !validDate(p.date))) throw new Error('Tanggal pembayaran tidak valid');
  const confirmed = payments.filter(p => p.status === 'confirmed' && p.date <= asOf)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  for (const payment of confirmed) {
    if (!Number.isSafeInteger(payment.amount) || payment.amount <= 0) throw new Error('Nominal pembayaran tidak valid');
    let unallocated = payment.amount;
    for (const installment of installments) {
      const allocated = Math.min(installment.remaining, unallocated);
      installment.remaining -= allocated;
      unallocated -= allocated;
      if (unallocated === 0) break;
    }
    if (unallocated !== 0) throw new Error('Pembayaran melebihi sisa pokok');
  }
  const overdueItems = installments.filter(item => item.dueDate < asOf && item.remaining > 0);
  const oldest = overdueItems[0]?.dueDate;
  return {
    remaining: installments.reduce((sum, item) => sum + item.remaining, 0),
    overdue: overdueItems.reduce((sum, item) => sum + item.remaining, 0),
    dueToday: installments.filter(item => item.dueDate === asOf).reduce((sum, item) => sum + item.remaining, 0),
    daysPastDue: oldest ? Math.floor((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${oldest}T00:00:00Z`)) / 86400000) : 0,
    paymentsCount: confirmed.length,
    settledInstallments: installments.filter(item => item.remaining === 0).length,
    installments,
  };
}
