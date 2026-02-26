import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPemasukanBerasLedgerEntry,
  updatePemasukanBerasLedgerEntry,
  deletePemasukanBerasLedgerEntry,
} from './usePemasukanBeras';

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

describe('pemasukan beras ledger lifecycle regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    mockMaybeSingle.mockResolvedValue({ data: { id: 'ledger-beras-1' }, error: null });
  });

  it('creates ledger IN entry with expected source linkage', async () => {
    await createPemasukanBerasLedgerEntry({
      pemasukanBerasId: 'beras-1',
      accountId: 'acc-kas',
      amountRp: 50000,
      tanggal: '2026-02-26',
      catatan: 'create beras',
      createdBy: 'user-1',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        entry_type: 'IN',
        amount_rp: 50000,
        source_pemasukan_beras_id: 'beras-1',
        running_balance_before_rp: 0,
        running_balance_after_rp: 50000,
      })
    );
  });

  it('updates linked ledger entry for existing pemasukan beras', async () => {
    await updatePemasukanBerasLedgerEntry({
      pemasukanBerasId: 'beras-1',
      accountId: 'acc-kas',
      amountRp: 65000,
      tanggal: '2026-02-26',
      catatan: 'update beras',
      createdBy: 'user-1',
    });

    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockSelectEq).toHaveBeenCalledWith('source_pemasukan_beras_id', 'beras-1');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount_rp: 65000,
        running_balance_after_rp: 65000,
      })
    );
    expect(mockUpdateEq).toHaveBeenCalledWith('source_pemasukan_beras_id', 'beras-1');
  });

  it('deletes linked ledger entry when pemasukan beras canceled', async () => {
    await deletePemasukanBerasLedgerEntry('beras-1');

    expect(mockSelectEq).toHaveBeenCalledWith('source_pemasukan_beras_id', 'beras-1');
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'ledger-beras-1');
  });
});
