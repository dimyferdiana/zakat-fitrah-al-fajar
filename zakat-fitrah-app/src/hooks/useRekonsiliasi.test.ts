import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createRekonsiliasiLedgerEntry,
  deleteRekonsiliasiLedgerEntry,
} from './useRekonsiliasi';

const {
  mockInsert,
  mockSelectEq,
  mockDeleteEq,
  mockMaybeSingle,
  mockSelect,
  mockFrom,
} = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockSelectEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));
  const mockInsert = vi.fn();
  const mockDeleteEq = vi.fn();
  const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));

  const mockFrom = vi.fn((table: string) => {
    if (table !== 'account_ledger_entries') {
      throw new Error(`Unexpected table access: ${table}`);
    }

    return {
      insert: mockInsert,
      delete: mockDelete,
      select: mockSelect,
    };
  });

  return {
    mockInsert,
    mockSelectEq,
    mockDeleteEq,
    mockMaybeSingle,
    mockSelect,
    mockFrom,
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('rekonsiliasi ledger regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    mockMaybeSingle.mockResolvedValue({ data: { id: 'ledger-rekonsiliasi-1' }, error: null });
  });

  it('creates REKONSILIASI ledger entry with manual reference', async () => {
    await createRekonsiliasiLedgerEntry({
      rekonsiliasiId: 'rek-1',
      accountId: 'acc-kas',
      amountRp: 100000,
      tanggal: '2026-02-26',
      catatan: 'rekonsiliasi uang',
      createdBy: 'user-1',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        entry_type: 'REKONSILIASI',
        amount_rp: 100000,
        source_rekonsiliasi_id: 'rek-1',
        manual_reconciliation_ref: 'MANUAL-REKONSILIASI-rek-1',
      })
    );
  });

  it('deletes linked rekonsiliasi ledger entry by source id', async () => {
    await deleteRekonsiliasiLedgerEntry('rek-1');

    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockSelectEq).toHaveBeenCalledWith('source_rekonsiliasi_id', 'rek-1');
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'ledger-rekonsiliasi-1');
  });
});
