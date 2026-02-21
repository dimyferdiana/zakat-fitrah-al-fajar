import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitBulk } from './useBulkPembayaran';
import type { BulkRow, BulkSubmissionMeta } from '@/types/bulk';

// ─── Hoisted mock function references (needed before vi.mock factory runs) ────

const { mockSingle, mockSelect, mockInsert, mockFrom, mockGetUser } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockSelect }));
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  const mockGetUser = vi.fn();
  return { mockSingle, mockSelect, mockInsert, mockFrom, mockGetUser };
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

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
      maal_penghasilan_uang: 'zakat_maal',
      infak_sedekah_uang: 'infak',
      zakat_fitrah_beras: 'zakat_fitrah',
      maal_beras: 'zakat_maal',
      infak_sedekah_beras: 'infak',
    };
    return map[k] ?? null;
  }),
  createHakAmilSnapshot: vi.fn().mockResolvedValue(undefined),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const meta: BulkSubmissionMeta = {
  operatorId: 'user-123',
  tahunZakatId: 'tahun-001',
  receiptNo: 'BULK-2026-001',
  rowLimit: 10,
};

function makeRow(overrides: Partial<BulkRow> = {}): BulkRow {
  return {
    muzakkiId: 'muzakki-001',
    muzakkiNama: 'Ahmad',
    zakatFitrahBeras: null,
    zakatFitrahUang: null,
    zakatMaalBeras: null,
    zakatMaalUang: null,
    infakBeras: null,
    infakUang: null,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('submitBulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default happy path: authenticated user, successful insert
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockSingle.mockResolvedValue({ data: { id: 'record-abc' }, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });
  });

  it('returns success:true when all rows have valid transactions', async () => {
    const rows = [
      makeRow({ zakatFitrahUang: 50000 }),
      makeRow({ muzakkiId: 'muzakki-002', muzakkiNama: 'Budi', infakUang: 20000 }),
    ];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.receiptNo).toBe('BULK-2026-001');
    expect(result.rows).toHaveLength(2);
  });

  it('skips rows where all transaction values are null/zero', async () => {
    const rows = [
      makeRow({ zakatFitrahUang: 50000 }),
      makeRow({ muzakkiId: 'muzakki-002', muzakkiNama: 'Kosong' }), // no transactions
    ];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Kosong');
    expect(result.errors[0]).toContain('tidak memiliki transaksi');
  });

  it('skips rows where muzakkiId is null', async () => {
    const rows = [makeRow({ muzakkiId: null, muzakkiNama: 'Tanpa ID', zakatFitrahUang: 10000 })];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Tanpa ID');
    expect(result.errors[0]).toContain('belum memiliki ID');
  });

  it('processes beras and uang entries independently for each row', async () => {
    const rows = [
      makeRow({ zakatFitrahUang: 50000, zakatFitrahBeras: 2.5, infakUang: 10000 }),
    ];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(true);
    // 3 inserts for entries + 1 for the bulk_submission_log
    expect(mockInsert).toHaveBeenCalledTimes(4);
  });

  it('collects errors for failed inserts but continues with other rows', async () => {
    let callCount = 0;
    mockSingle.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return Promise.resolve({ data: null, error: { message: 'DB connection error' } });
      return Promise.resolve({ data: { id: 'record-ok' }, error: null });
    });

    const rows = [
      makeRow({ zakatFitrahUang: 50000 }),
      makeRow({ muzakkiId: 'muzakki-002', muzakkiNama: 'Cici', infakUang: 5000 }),
    ];

    const result = await submitBulk(rows, meta);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('DB connection error');
  });

  it('returns receipt number matching meta', async () => {
    const rows = [makeRow({ zakatFitrahUang: 25000 })];
    const result = await submitBulk(rows, { ...meta, receiptNo: 'BULK-TEST-999' });
    expect(result.receiptNo).toBe('BULK-TEST-999');
  });

  it('throws if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const rows = [makeRow({ zakatFitrahUang: 25000 })];
    await expect(submitBulk(rows, meta)).rejects.toThrow('tidak terautentikasi');
  });
});
