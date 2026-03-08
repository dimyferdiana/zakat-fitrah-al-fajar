import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildPemasukanBerasPayload,
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

describe('buildPemasukanBerasPayload', () => {
  it('normalizes empty catatan to null and preserves optional bukti URL as null', () => {
    const payload = buildPemasukanBerasPayload(
      {
        tahun_zakat_id: 'tahun-1',
        kategori: 'zakat_fitrah_beras',
        jumlah_beras_kg: 2.5,
        tanggal: '2026-03-08',
        catatan: '',
      },
      'user-1',
      'acc-kas',
      null
    );

    expect(payload.catatan).toBeNull();
    expect(payload.bukti_bayar_url).toBeNull();
    expect(payload.muzakki_id).toBeNull();
  });

  it('keeps provided catatan and existing bukti URL', () => {
    const payload = buildPemasukanBerasPayload(
      {
        tahun_zakat_id: 'tahun-1',
        muzakki_id: 'muzakki-1',
        kategori: 'infak_sedekah_beras',
        jumlah_beras_kg: 1.25,
        tanggal: '2026-03-08',
        catatan: 'Catatan beras',
      },
      'user-1',
      'acc-kas',
      'https://cdn.example.com/bukti-beras.jpg'
    );

    expect(payload.catatan).toBe('Catatan beras');
    expect(payload.bukti_bayar_url).toBe('https://cdn.example.com/bukti-beras.jpg');
    expect(payload.muzakki_id).toBe('muzakki-1');
  });
});
