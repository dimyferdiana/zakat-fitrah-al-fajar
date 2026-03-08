import { describe, expect, it } from 'vitest';
import { validateBulkRow } from './bulkValidation';
import type { BulkRow } from '@/types/bulk';

function makeRow(overrides: Partial<BulkRow> = {}): BulkRow {
  return {
    muzakkiId: 'muzakki-1',
    muzakkiNama: 'Ahmad',
    transactionType: 'zakat_fitrah',
    paymentMedium: 'uang',
    amount: 50000,
    unit: 'rp',
    notes: '',
    ...overrides,
  };
}

describe('validateBulkRow', () => {
  it('accepts valid fitrah with uang', () => {
    const result = validateBulkRow(makeRow());
    expect(result.ok).toBe(true);
  });

  it('rejects maal/fidyah when using beras media', () => {
    const result = validateBulkRow(
      makeRow({ transactionType: 'fidyah', paymentMedium: 'beras_kg', amount: 2, unit: 'kg' })
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain('Maal/Fidyah');
  });

  it('rejects unit mismatch for selected medium', () => {
    const result = validateBulkRow(
      makeRow({ paymentMedium: 'beras_liter', amount: 3, unit: 'kg' })
    );

    expect(result.ok).toBe(false);
    expect(result.message).toContain('Satuan');
  });
});
