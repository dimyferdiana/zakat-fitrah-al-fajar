import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitBulk } from './useBulkPembayaran';
import type { BulkRow, BulkSubmissionMeta } from '@/types/bulk';

const { mockSingle, mockSelect, mockInsert, mockFrom, mockGetUser } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockSelect }));
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  const mockGetUser = vi.fn();
  return { mockSingle, mockSelect, mockInsert, mockFrom, mockGetUser };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
}));

vi.mock('@/lib/hakAmilSnapshot', () => ({
  fetchBasisModeForTahun: vi.fn().mockResolvedValue('net_after_reconciliation'),
  mapKategoriToHakAmil: vi.fn((k: string) => {
    const map: Record<string, string> = {
      zakat_fitrah_uang: 'zakat_fitrah',
      fidyah_uang: 'fidyah',
      maal_penghasilan_uang: 'zakat_maal',
      infak_sedekah_uang: 'infak',
      zakat_fitrah_beras: 'zakat_fitrah',
      infak_sedekah_beras: 'infak',
    };
    return map[k] ?? null;
  }),
  createHakAmilSnapshot: vi.fn().mockResolvedValue(undefined),
}));

const meta: BulkSubmissionMeta = {
  operatorId: 'user-123',
  tahunZakatId: 'tahun-001',
  receiptNo: 'BULK-2026-001',
  rowLimit: 10,
  moneyAccountId: 'acc-kas-001',
  moneyAccountName: 'Kas Utama',
  moneyAccountChannel: 'kas',
};

function makeRow(overrides: Partial<BulkRow> = {}): BulkRow {
  return {
    muzakkiId: 'muzakki-001',
    muzakkiNama: 'Ahmad',
    transactionType: 'zakat_fitrah',
    paymentMedium: 'uang',
    amount: 50000,
    unit: 'rp',
    notes: '',
    ...overrides,
  };
}

describe('submitBulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockSingle.mockResolvedValue({ data: { id: 'record-abc' }, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });
  });

  it('returns success:true when all rows are valid', async () => {
    const rows = [
      makeRow({ transactionType: 'zakat_fitrah', paymentMedium: 'uang', amount: 50000, unit: 'rp' }),
      makeRow({
        muzakkiId: 'muzakki-002',
        muzakkiNama: 'Budi',
        transactionType: 'infak',
        paymentMedium: 'beras_kg',
        amount: 2.5,
        unit: 'kg',
      }),
    ];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.rowOutcomes).toHaveLength(2);
    expect(result.rowOutcomes.every((x) => x.success)).toBe(true);
  });

  it('supports beras liter and keeps row success', async () => {
    const rows = [
      makeRow({
        transactionType: 'zakat_fitrah',
        paymentMedium: 'beras_liter',
        amount: 3,
        unit: 'liter',
      }),
    ];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    // 1 insert row + 1 log insert
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid type-media combo (fidyah with beras)', async () => {
    const rows = [
      makeRow({
        transactionType: 'fidyah',
        paymentMedium: 'beras_kg',
        amount: 2,
        unit: 'kg',
      }),
    ];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Maal/Fidyah');
    expect(result.rowOutcomes[0].success).toBe(false);
  });

  it('skips rows where muzakkiId is null', async () => {
    const rows = [makeRow({ muzakkiId: null, muzakkiNama: 'Tanpa ID' })];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Tanpa ID');
    expect(result.errors[0]).toContain('belum memiliki ID');
  });

  it('collects errors for failed inserts but continues', async () => {
    let callCount = 0;
    mockSingle.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: null, error: { message: 'DB connection error' } });
      }
      return Promise.resolve({ data: { id: 'record-ok' }, error: null });
    });

    const rows = [
      makeRow({ transactionType: 'zakat_fitrah', paymentMedium: 'uang', amount: 50000, unit: 'rp' }),
      makeRow({
        muzakkiId: 'muzakki-002',
        muzakkiNama: 'Cici',
        transactionType: 'infak',
        paymentMedium: 'uang',
        amount: 10000,
        unit: 'rp',
      }),
    ];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('DB connection error');
    expect(result.rowOutcomes.some((x) => !x.success)).toBe(true);
  });

  it('throws if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const rows = [makeRow()];
    await expect(submitBulk(rows, meta)).rejects.toThrow('tidak terautentikasi');
  });

  it('throws if money rows are submitted without account metadata', async () => {
    const rows = [makeRow({ paymentMedium: 'uang', amount: 10000, unit: 'rp' })];
    const invalidMeta: BulkSubmissionMeta = {
      operatorId: 'user-123',
      tahunZakatId: 'tahun-001',
      receiptNo: 'BULK-2026-002',
      rowLimit: 10,
    };

    await expect(submitBulk(rows, invalidMeta)).rejects.toThrow(
      'wajib memilih rekening kas/bank'
    );
  });
});
