import { describe, expect, it } from 'vitest';
import {
  buildHakAmilSummaryFromTransactions,
  buildHakAmilBerasSummaryFromTransactions,
  type HakAmilPersenReference,
} from './useHakAmil';

const persenReference: HakAmilPersenReference = {
  zakat_fitrah: 12.5,
  zakat_maal: 12.5,
  infak: 20,
  fidyah: 10,
  beras: 10,
};

describe('useHakAmil builders', () => {
  it('does not convert beras into money summary totals', () => {
    const summary = buildHakAmilSummaryFromTransactions({
      persenReference,
      pembayaranZakat: [],
      pemasukanUang: [
        { kategori: 'fidyah_uang', jumlah_uang_rp: 100_000, tanggal: '2026-03-08' },
      ],
      pemasukanBeras: [
        { kategori: 'fidyah_beras', jumlah_beras_kg: 5.4, catatan: 'uji', tanggal: '2026-03-08' },
      ],
    });

    const fidyahMoney = summary.categories.find((c) => c.kategori === 'fidyah');

    expect(fidyahMoney?.total_bruto).toBe(100_000);
    expect(summary.grand_total_bruto).toBe(100_000);
    expect(summary.grand_total_hak_amil).toBe(10_000);
    expect(summary.beras_metrics?.total_bruto_kg).toBe(5.4);
  });

  it('keeps rice summary in physical units and tracks liter sources', () => {
    const berasSummary = buildHakAmilBerasSummaryFromTransactions({
      persenReference,
      pemasukanBeras: [
        {
          kategori: 'fidyah_beras',
          jumlah_beras_kg: 4,
          catatan: 'bulk|media:beras_liter',
          tanggal: '2026-03-08',
        },
        {
          kategori: 'infak_sedekah_beras',
          jumlah_beras_kg: 2.5,
          catatan: 'manual',
          tanggal: '2026-03-08',
        },
      ],
      pembayaranZakat: [
        {
          jenis_zakat: 'beras',
          jumlah_uang_rp: null,
          jumlah_beras_kg: 1.6,
          tanggal_bayar: '2026-03-08',
        },
      ],
    });

    expect(berasSummary.grand_total_bruto_kg).toBe(8.1);
    expect(berasSummary.unit_breakdown?.source_liter_liter).toBe(5);
    expect(berasSummary.unit_breakdown?.source_liter_to_kg).toBe(4);
    expect(berasSummary.unit_breakdown?.source_kg_kg).toBe(4.1);
  });
});
