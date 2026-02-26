import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMuzakkiRecord, updateMuzakkiRecord } from './useMuzakki';

const { mockSingle, mockEq, mockInsert, mockUpdate, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockEq = vi.fn(() => ({ select: mockSelect }));
  const mockInsert = vi.fn(() => ({ select: mockSelect }));
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn((table: string) => {
    if (table !== 'muzakki') {
      throw new Error(`Unexpected table access: ${table}`);
    }

    return {
      insert: mockInsert,
      update: mockUpdate,
    };
  });

  return { mockSingle, mockEq, mockInsert, mockUpdate, mockFrom };
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

describe('muzakki master-only persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: {
        id: 'muzakki-1',
        nama_kk: 'Ahmad',
        alamat: 'Bandung',
        no_telp: '08123',
      },
      error: null,
    });
  });

  it('createMuzakkiRecord inserts only to muzakki table (no transaction table)', async () => {
    const result = await createMuzakkiRecord({
      nama_kk: 'Ahmad',
      alamat: 'Bandung',
      no_telp: '08123',
    });

    expect(result.id).toBe('muzakki-1');
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('muzakki');
    expect(mockInsert).toHaveBeenCalledWith({
      nama_kk: 'Ahmad',
      alamat: 'Bandung',
      no_telp: '08123',
    });
  });

  it('updateMuzakkiRecord updates only muzakki table by id', async () => {
    await updateMuzakkiRecord({
      id: 'muzakki-1',
      nama_kk: 'Ahmad Updated',
      alamat: 'Jakarta',
      no_telp: '08999',
    });

    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('muzakki');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        nama_kk: 'Ahmad Updated',
        alamat: 'Jakarta',
        no_telp: '08999',
      })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'muzakki-1');
  });
});
