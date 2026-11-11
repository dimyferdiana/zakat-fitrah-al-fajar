import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveDonorRecord } from './useDonor';

const mocks = vi.hoisted(() => {
  const rows: Record<string, { id: string; nama_kk: string; nama_lengkap: string | null; alamat: string; no_telp: string | null; created_at: string; updated_at: string }> = {
    existing: { id: 'existing', nama_kk: 'Nama Sama', nama_lengkap: null, alamat: 'Alamat Lama', no_telp: '0800', created_at: '2026-01-01', updated_at: '2026-01-01' },
    fresh: { id: 'fresh', nama_kk: 'Nama Sama', nama_lengkap: null, alamat: 'Alamat Baru', no_telp: '0800', created_at: '2026-01-01', updated_at: '2026-01-01' },
  };
  const eq = vi.fn((_column: string, id: string) => ({ maybeSingle: async () => ({ data: rows[id] ?? null, error: null }) }));
  const select = vi.fn(() => ({ eq }));
  const insert = vi.fn(() => ({ select: () => ({ single: async () => ({ data: { id: 'fresh' }, error: null }) }) }));
  const update = vi.fn();
  const from = vi.fn(() => ({ select, insert, update }));
  return { from, select, insert, update, eq };
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('donor identity selection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the selected person ID without modifying master data', async () => {
    const donor = await resolveDonorRecord({ personId: 'existing', nama: 'Nama Sama', alamat: 'Snapshot Baru', no_telp: '0800' });
    expect(donor.id).toBe('existing');
    expect(mocks.eq).toHaveBeenCalledWith('id', 'existing');
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('creates a separate person when none was selected, even if a name and phone match', async () => {
    const donor = await resolveDonorRecord({ nama: 'Nama Sama', alamat: 'Alamat Baru', no_telp: '0800' });
    expect(donor.id).toBe('fresh');
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.eq).toHaveBeenCalledWith('id', 'fresh');
    expect(mocks.eq).not.toHaveBeenCalledWith('nama_kk', 'Nama Sama');
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
