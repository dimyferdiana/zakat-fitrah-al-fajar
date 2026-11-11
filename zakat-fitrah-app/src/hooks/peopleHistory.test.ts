import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMuzakkiHistory } from './useMuzakki';

const mocks = vi.hoisted(() => {
  type Row = Record<string, unknown>;
  const rows: Record<string, Row[]> = {
    pembayaran_zakat: [{ id: 'zakat-a', muzakki_id: 'a', tanggal_bayar: '2026-01-01', jenis_zakat: 'beras', jumlah_jiwa: 1, jumlah_beras_kg: 2.5 }, { id: 'zakat-b', muzakki_id: 'b' }],
    qurban_shares: [{ id: 'qurban-a', muzakki_id: 'a', nominal: 100, status_pembayaran: 'lunas', qurban_animals: { nomor: '1', jenis: 'kambing', qurban_events: { nama: 'Qurban' } } }],
    bukti_sedekah: [{ id: 'sedekah-a', donor_id: 'a' }, { id: 'sedekah-b', donor_id: 'b' }],
    mustahik: [{ id: 'mustahik-a', orang_id: 'a', distribusi_zakat: [{ id: 'distribusi-a' }] }, { id: 'unmapped', orang_id: null, distribusi_zakat: [{ id: 'not-linked' }] }],
    loan_customers: [{ person_id: 'a', loans: [{ id: 'loan-a', status: 'active' }] }, { person_id: 'b', loans: [{ id: 'loan-b' }] }],
    pemasukan_uang: [{ id: 'uang-a', muzakki_id: 'a' }],
    pemasukan_beras: [{ id: 'beras-a', muzakki_id: 'a' }],
  };
  const calls: { table: string; field: string; value: string }[] = [];
  const accessed: string[] = [];
  let failTable = '';
  const from = (table: string) => {
    accessed.push(table);
    let field = '', value = '';
    const result = () => ({ data: (rows[table] ?? []).filter(row => row[field] === value), error: failTable === table ? new Error('Riwayat tidak dapat dimuat') : null });
    const builder = {
      select: () => builder,
      eq: (key: string, item: string) => { field = key; value = item; calls.push({ table, field, value }); return builder; },
      order: () => builder,
      maybeSingle: async () => { const res = result(); return { data: res.data[0] ?? null, error: res.error }; },
      then: (resolve: (payload: ReturnType<typeof result>) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject),
    };
    return builder;
  };
  return { from, calls, accessed, fail: (table: string) => { failTable = table; } };
});

vi.mock('@/lib/supabase', () => ({ supabase: { from: mocks.from } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('person program history', () => {
  beforeEach(() => { mocks.calls.length = 0; mocks.accessed.length = 0; mocks.fail(''); });

  it('combines only programs explicitly linked to the same person ID', async () => {
    const result = await fetchMuzakkiHistory('a', true);
    expect(result.zakat.map(item => item.id)).toEqual(['zakat-a']);
    expect(result.qurban.map(item => item.id)).toEqual(['qurban-a']);
    expect(result.sedekah.map(item => item.id)).toEqual(['sedekah-a']);
    expect(result.distribusi.map(item => item.id)).toEqual(['distribusi-a']);
    expect(result.pinjaman.map(item => item.id)).toEqual(['loan-a']);
    expect(result.pemasukanUang.map(item => item.id)).toEqual(['uang-a']);
    expect(mocks.calls.every(call => call.value === 'a')).toBe(true);
    expect(mocks.calls.map(call => call.field)).not.toContain('nama_kk');
  });

  it('does not request loan history for roles without loan access', async () => {
    const result = await fetchMuzakkiHistory('a', false);
    expect(result.pinjaman).toEqual([]);
    expect(mocks.accessed).not.toContain('loan_customers');
  });

  it('reports a program query failure instead of presenting an empty history', async () => {
    mocks.fail('qurban_shares');
    await expect(fetchMuzakkiHistory('a', true)).rejects.toThrow('Riwayat tidak dapat dimuat');
  });
});
