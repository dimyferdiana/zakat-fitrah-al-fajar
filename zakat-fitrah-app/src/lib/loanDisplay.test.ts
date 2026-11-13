import { describe, expect, it } from 'vitest';
import { loanDate, loanDateTime, loanStatus } from './loanDisplay';

describe('loan display', () => {
  it('formats the business date without shifting at month or year boundaries', () => {
    expect(loanDate('2027-01-01')).toBe('1 Jan 2027');
    expect(loanDate('2027-02-28')).toBe('28 Feb 2027');
    expect(loanDate('2027-02-30')).toBe('Belum tersedia');
    expect(loanDate(null)).toBe('Belum tersedia');
  });
  it('uses Jakarta time for timestamps and translates statuses', () => {
    expect(loanDateTime('2026-12-31T18:00:00Z')).toContain('1 Jan 2027');
    expect(loanDateTime('2026-12-31T18:00:00Z')).toMatch(/WIB$/);
    expect(loanStatus('pending')).toBe('Menunggu Verifikasi');
    expect(loanStatus('needs_reconciliation')).toBe('Perlu Rekonsiliasi');
  });
});
