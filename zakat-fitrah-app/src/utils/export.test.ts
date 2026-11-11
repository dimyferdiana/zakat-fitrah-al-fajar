import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  aoaToSheet: vi.fn((rows: unknown[][]) => ({ rows })),
  bookNew: vi.fn(() => ({})),
  appendSheet: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('xlsx', () => ({
  utils: { aoa_to_sheet: mocks.aoaToSheet, book_new: mocks.bookNew, book_append_sheet: mocks.appendSheet },
  writeFile: mocks.writeFile,
}));

import { exportPemasukanExcel } from './export';

beforeEach(() => vi.clearAllMocks());

it('exports payer names for both plain names and linked person records', () => {
  exportPemasukanExcel([
    { tanggal: '2026-01-05', muzakki: 'Nama langsung', jenis: 'Uang', nominalDisplay: 'Rp 100' },
    { tanggal: '2026-01-06', muzakki: { nama_kk: 'Nama terhubung', alamat: 'Alamat sintetis' }, jenis: 'Beras', nominalDisplay: '2 kg' },
  ], { totalBeras: 2, totalUang: 100, totalMuzakki: 2 });

  const rows = mocks.aoaToSheet.mock.calls[0][0];
  expect(rows[8]).toEqual(['05/01/2026', 'Nama langsung', '', '-', 'Uang', '-', 'Rp 100']);
  expect(rows[9]).toEqual(['06/01/2026', 'Nama terhubung', 'Alamat sintetis', '-', 'Beras', '-', '2 kg']);
  expect(mocks.writeFile).toHaveBeenCalledOnce();
});
