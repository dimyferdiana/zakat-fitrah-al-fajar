import { describe, expect, it } from 'vitest';
import { makeSchedule, scheduleDurationDays, validateSchedule } from './loanSchedule';
import { loanPosition } from './loanCalculations';

describe('loan schedules', () => {
  it('keeps the original day when a month has fewer days and distributes rounding', () => {
    expect(makeSchedule(1000000, 3, '2027-01-31', 'monthly')).toEqual([
      { dueDate: '2027-01-31', amount: 333333 },
      { dueDate: '2027-02-28', amount: 333333 },
      { dueDate: '2027-03-31', amount: 333334 },
    ]);
  });
  it('rejects repeated dates and incorrect totals', () => {
    expect(() => validateSchedule([{ dueDate: '2026-11-06', amount: 100 }, { dueDate: '2026-11-06', amount: 100 }], 200, '2026-11-01')).toThrow();
    expect(() => validateSchedule([{ dueDate: '2026-11-06', amount: 99 }], 100, '2026-11-01')).toThrow();
  });
  it('shows the calendar duration from disbursement through the last installment', () => {
    const schedule = makeSchedule(1000000, 3, '2027-01-31', 'monthly');
    expect(scheduleDurationDays('2027-01-01', schedule)).toBe(89);
    expect(scheduleDurationDays('2027-03-31', [schedule[2]])).toBe(0);
    expect(() => scheduleDurationDays('2027-04-01', schedule)).toThrow();
    expect(() => scheduleDurationDays('2027-01-01', [])).toThrow();
  });
  it('allocates partial payments, excluding claims and cancelled payments', () => {
    const schedule = [{ dueDate: '2026-11-10', amount: 400000 }, { dueDate: '2026-12-10', amount: 400000 }, { dueDate: '2027-01-10', amount: 400000 }];
    const payments = [{ id: '1', date: '2026-11-10', amount: 250000, status: 'confirmed' as const }, { id: '2', date: '2026-11-10', amount: 100000, status: 'pending' as const }];
    expect(loanPosition(schedule, payments, '2026-11-11')).toMatchObject({ remaining: 950000, overdue: 150000, daysPastDue: 1, paymentsCount: 1, settledInstallments: 0 });
    expect(loanPosition(schedule, [...payments, { id: '3', date: '2026-11-11', amount: 550000, status: 'confirmed' }], '2026-11-11')).toMatchObject({ remaining: 400000, paymentsCount: 2, settledInstallments: 2 });
  });
  it('starts migrated loans from verified installment balances and rejects overpayment', () => {
    const schedule = [{ dueDate: '2026-11-10', amount: 500000 }, { dueDate: '2026-12-10', amount: 500000 }];
    expect(loanPosition(schedule, [{ id: '1', date: '2026-11-11', amount: 100000, status: 'confirmed' }], '2026-11-11', [300000, 300000]).remaining).toBe(500000);
    expect(() => loanPosition(schedule, [{ id: '1', date: '2026-11-11', amount: 600001, status: 'confirmed' }], '2026-11-11', [300000, 300000])).toThrow();
  });
  it('rejects invalid or unordered dates instead of allocating payments to the wrong installment', () => {
    const schedule = [{ dueDate: '2026-12-10', amount: 500 }, { dueDate: '2026-11-10', amount: 500 }];
    expect(() => loanPosition(schedule, [], '2026-11-11')).toThrow();
    expect(() => loanPosition([], [], '2026-02-30')).toThrow();
  });
});
