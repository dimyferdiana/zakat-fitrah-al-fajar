export type HakAmilCategory = 'zakat_fitrah' | 'zakat_maal' | 'infak' | 'fidyah' | 'beras';

export type HakAmilBasisMode = 'net_after_reconciliation' | 'gross_before_reconciliation';

export interface HakAmilCalculationInput {
  category: HakAmilCategory;
  grossAmount: number;
  reconciliationAmount?: number;
  basisMode?: HakAmilBasisMode;
}

export interface HakAmilBreakdown {
  category: HakAmilCategory;
  basisMode: HakAmilBasisMode;
  bruto: number;
  rekonsiliasi: number;
  neto: number;
  basisNominal: number;
  persen: number;
  nominal_hak_amil: number;
}

export const HAK_AMIL_PERCENTAGES: Record<HakAmilCategory, number> = {
  zakat_fitrah: 12.5,
  zakat_maal: 12.5,
  infak: 20,
  fidyah: 0,
  beras: 0,
};

export const DEFAULT_HAK_AMIL_BASIS_MODE: HakAmilBasisMode = 'net_after_reconciliation';

export function deterministicRound(value: number, precision = 0): number {
  const factor = 10 ** precision;
  const scaled = (value + Number.EPSILON) * factor;

  if (scaled >= 0) {
    return Math.floor(scaled + 0.5) / factor;
  }

  return Math.ceil(scaled - 0.5) / factor;
}

export function buildHakAmilBreakdown(input: HakAmilCalculationInput): HakAmilBreakdown {
  const basisMode = input.basisMode ?? DEFAULT_HAK_AMIL_BASIS_MODE;
  const bruto = input.grossAmount;
  const rekonsiliasi = input.reconciliationAmount ?? 0;
  const neto = bruto - rekonsiliasi;
  const basisNominal = basisMode === 'gross_before_reconciliation' ? bruto : neto;
  const persen = HAK_AMIL_PERCENTAGES[input.category];
  const nominal_hak_amil = deterministicRound((basisNominal * persen) / 100, 0);

  return {
    category: input.category,
    basisMode,
    bruto,
    rekonsiliasi,
    neto,
    basisNominal,
    persen,
    nominal_hak_amil,
  };
}

export function calculateHakAmil(input: HakAmilCalculationInput): number {
  return buildHakAmilBreakdown(input).nominal_hak_amil;
}
