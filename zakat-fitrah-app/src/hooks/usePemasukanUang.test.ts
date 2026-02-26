import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPemasukanUangLedgerEntry,
  deletePemasukanUangLedgerEntry,
  updatePemasukanUangLedgerEntry,
} from './usePemasukanUang';

const {
  mockInsert,
  mockUpdate,
  mockDelete,
  mockSelectEq,
  mockUpdateEq,
  mockDeleteEq,
  mockMaybeSingle,
  mockSelect,
  mockFrom,
} = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockSelectEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));
  const mockInsert = vi.fn();
  const mockUpdateEq = vi.fn();
  const mockDeleteEq = vi.fn();
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
  const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
  const mockFrom = vi.fn((table: string) => {
    if (table !== 'account_ledger_entries') {
      throw new Error(`Unexpected table access: ${table}`);
    }

    return {
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      select: mockSelect,
    };
  });

  return {
    mockInsert,
    mockUpdate,
    mockDelete,
    mockSelectEq,
    mockUpdateEq,
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

describe('pemasukan uang ledger lifecycle balance consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    mockMaybeSingle.mockResolvedValue({ data: { id: 'ledger-1' }, error: null });
  });

  it('creates ledger with consistent running balance for IN transaction', async () => {
    await createPemasukanUangLedgerEntry({
      pemasukanUangId: 'trx-1',
      accountId: 'acc-1',
      amountRp: 150000,
      tanggal: '2026-02-26',
      catatan: 'create',
      createdBy: 'user-1',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        entry_type: 'IN',
        amount_rp: 150000,
        running_balance_before_rp: 0,
        running_balance_after_rp: 150000,
        source_pemasukan_uang_id: 'trx-1',
      })
    );
  });

  it('updates existing ledger and keeps running balance aligned to latest amount', async () => {
    await updatePemasukanUangLedgerEntry({
      pemasukanUangId: 'trx-1',
      accountId: 'acc-1',
      amountRp: 90000,
      tanggal: '2026-02-26',
      catatan: 'update',
      createdBy: 'user-1',
    });

    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        entry_type: 'IN',
        amount_rp: 90000,
        running_balance_before_rp: 0,
        running_balance_after_rp: 90000,
      })
    );
    expect(mockSelectEq).toHaveBeenCalledWith('source_pemasukan_uang_id', 'trx-1');
    expect(mockUpdateEq).toHaveBeenCalledWith('source_pemasukan_uang_id', 'trx-1');
  });

  it('cancels transaction by deleting linked ledger row by source id', async () => {
    await deletePemasukanUangLedgerEntry('trx-1');

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockSelectEq).toHaveBeenCalledWith('source_pemasukan_uang_id', 'trx-1');
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'ledger-1');
  });
});
