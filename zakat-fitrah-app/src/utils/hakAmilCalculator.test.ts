import { describe, it, expect } from 'vitest';
import {
  buildHakAmilBreakdown,
  calculateHakAmil,
  deterministicRound,
  type HakAmilCategory,
  type HakAmilBasisMode,
} from '@/utils/hakAmilCalculator';

const ALL_CATEGORIES: HakAmilCategory[] = ['zakat_fitrah', 'zakat_maal', 'infak', 'fidyah', 'beras'];
const ALL_BASIS_MODES: HakAmilBasisMode[] = ['net_after_reconciliation', 'gross_before_reconciliation'];

describe('hakAmilCalculator', () => {
  it('applies fixed percentage mapping correctly for each category', () => {
    const result = {
      zakat_fitrah: calculateHakAmil({
        category: 'zakat_fitrah',
        grossAmount: 1_000_000,
        reconciliationAmount: 0,
        basisMode: 'gross_before_reconciliation',
      }),
      zakat_maal: calculateHakAmil({
        category: 'zakat_maal',
        grossAmount: 1_000_000,
        reconciliationAmount: 0,
        basisMode: 'gross_before_reconciliation',
      }),
      infak: calculateHakAmil({
        category: 'infak',
        grossAmount: 1_000_000,
        reconciliationAmount: 0,
        basisMode: 'gross_before_reconciliation',
      }),
      fidyah: calculateHakAmil({
        category: 'fidyah',
        grossAmount: 1_000_000,
        reconciliationAmount: 0,
        basisMode: 'gross_before_reconciliation',
      }),
      beras: calculateHakAmil({
        category: 'beras',
        grossAmount: 1_000_000,
        reconciliationAmount: 0,
        basisMode: 'gross_before_reconciliation',
      }),
    };

    expect(result.zakat_fitrah).toBe(125_000);
    expect(result.zakat_maal).toBe(125_000);
    expect(result.infak).toBe(200_000);
    expect(result.fidyah).toBe(0);
    expect(result.beras).toBe(0);
  });

  it('supports both basis modes for all categories', () => {
    for (const category of ALL_CATEGORIES) {
      for (const basisMode of ALL_BASIS_MODES) {
        const breakdown = buildHakAmilBreakdown({
          category,
          grossAmount: 1_000_000,
          reconciliationAmount: 100_000,
          basisMode,
        });

        expect(breakdown.basisMode).toBe(basisMode);
        expect(breakdown.bruto).toBe(1_000_000);
        expect(breakdown.rekonsiliasi).toBe(100_000);
        expect(breakdown.neto).toBe(900_000);
        expect(breakdown.basisNominal).toBe(
          basisMode === 'gross_before_reconciliation' ? 1_000_000 : 900_000,
        );
      }
    }
  });

  it('handles zero nominal values consistently', () => {
    const breakdown = buildHakAmilBreakdown({
      category: 'infak',
      grossAmount: 0,
      reconciliationAmount: 0,
      basisMode: 'net_after_reconciliation',
    });

    expect(breakdown.nominal_hak_amil).toBe(0);
  });

  it('handles negative reconciliation adjustments deterministically', () => {
    const netBasisResult = buildHakAmilBreakdown({
      category: 'zakat_fitrah',
      grossAmount: 1_000_000,
      reconciliationAmount: -200_000,
      basisMode: 'net_after_reconciliation',
    });

    expect(netBasisResult.neto).toBe(1_200_000);
    expect(netBasisResult.nominal_hak_amil).toBe(150_000);
  });

  it('handles very large values without drifting rounding behavior', () => {
    const veryLarge = buildHakAmilBreakdown({
      category: 'infak',
      grossAmount: 9_999_999_999_999,
      reconciliationAmount: 123_456_789,
      basisMode: 'gross_before_reconciliation',
    });

    expect(veryLarge.nominal_hak_amil).toBe(2_000_000_000_000);
  });

  it('uses deterministic half-away-from-zero rounding', () => {
    expect(deterministicRound(10.5, 0)).toBe(11);
    expect(deterministicRound(10.49, 0)).toBe(10);
    expect(deterministicRound(-10.5, 0)).toBe(-11);
    expect(deterministicRound(-10.49, 0)).toBe(-10);
  });
});
