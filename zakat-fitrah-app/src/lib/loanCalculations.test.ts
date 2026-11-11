import { describe, expect, it } from 'vitest';
import { loanPosition, type LoanPayment } from './loanCalculations';

const schedule = [
  { dueDate: '2026-11-10', amount: 400000 },
  { dueDate: '2026-12-10', amount: 400000 },
  { dueDate: '2027-01-10', amount: 400000 },
];
const payment = (id: string, date: string, amount: number, status: LoanPayment['status'] = 'confirmed'): LoanPayment => ({ id, date, amount, status });

describe('loan payment positions', () => {
  it('distinguishes pending reports, confirmed transactions and settled installments', () => {
    const first = payment('a', '2026-11-10', 250000);
    expect(loanPosition(schedule, [first, payment('b', '2026-11-11', 550000, 'pending')], '2026-11-11')).toMatchObject({ remaining: 950000, paymentsCount: 1, settledInstallments: 0, overdue: 150000, dueToday: 0, daysPastDue: 1 });
    expect(loanPosition(schedule, [first, payment('b', '2026-11-11', 550000)], '2026-11-11')).toMatchObject({ remaining: 400000, paymentsCount: 2, settledInstallments: 2, overdue: 0 });
    expect(loanPosition(schedule, [first, payment('b', '2026-11-11', 550000), payment('c', '2026-11-12', 400000)], '2026-11-12')).toMatchObject({ remaining: 0, paymentsCount: 3, settledInstallments: 3 });
  });
  it('recalculates backdated and cancelled transactions, with due today separate from overdue', () => {
    const rows = [payment('b', '2026-11-11', 550000), payment('a', '2026-11-10', 250000)];
    expect(loanPosition(schedule, rows, '2026-11-10')).toMatchObject({ remaining: 950000, overdue: 0, dueToday: 150000, daysPastDue: 0 });
    const reversed = [rows[0], { ...rows[1], status: 'cancelled' as const }];
    expect(loanPosition(schedule, reversed, '2026-11-11')).toMatchObject({ remaining: 650000, paymentsCount: 1, settledInstallments: 1, overdue: 0 });
  });
  it('keeps a verified migrated opening balance separate from known payments', () => {
    expect(loanPosition([{ dueDate: '2026-11-10', amount: 500000 }, { dueDate: '2026-12-10', amount: 500000 }],
      [payment('a', '2026-11-11', 100000)], '2026-11-11', [300000, 300000])).toMatchObject({ remaining: 500000, paymentsCount: 1, overdue: 200000 });
  });
});
