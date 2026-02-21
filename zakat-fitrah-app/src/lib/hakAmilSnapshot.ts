import { supabase } from '@/lib/supabase';
import {
  buildHakAmilBreakdown,
  DEFAULT_HAK_AMIL_BASIS_MODE,
} from '@/utils/hakAmilCalculator';
import type {
  HakAmilCategory,
  HakAmilBasisMode,
} from '@/utils/hakAmilCalculator';
import type { Database } from '@/types/database.types';

type HakAmilSnapshotInsert = Database['public']['Tables']['hak_amil_snapshots']['Insert'];

/**
 * Mapping from transaction kategori to HakAmilCategory
 */
export function mapKategoriToHakAmil(kategori: string): HakAmilCategory | null {
  const mapping: Record<string, HakAmilCategory> = {
    zakat_fitrah_uang: 'zakat_fitrah',
    zakat_fitrah_beras: 'zakat_fitrah',
    maal_penghasilan_uang: 'zakat_maal',
    fidyah_uang: 'fidyah',
    fidyah_beras: 'fidyah',
    infak_sedekah_uang: 'infak',
    infak_sedekah_beras: 'infak',
    maal_beras: 'zakat_maal',
  };

  return mapping[kategori] || null;
}

export interface CreateSnapshotInput {
  tahunZakatId: string;
  kategori: HakAmilCategory;
  tanggal: string;
  grossAmount: number;
  reconciliationAmount?: number;
  basisMode?: HakAmilBasisMode;
  sourceType: 'pemasukan_uang' | 'pemasukan_beras' | 'rekonsiliasi';
  sourceId: string;
  catatan?: string;
  createdBy?: string;
}

/**
 * Create a hak_amil_snapshots record for a transaction.
 * This ensures immutable history even when config changes in future years.
 */
export async function createHakAmilSnapshot(input: CreateSnapshotInput): Promise<void> {
  const basisMode = input.basisMode ?? DEFAULT_HAK_AMIL_BASIS_MODE;

  const breakdown = buildHakAmilBreakdown({
    category: input.kategori,
    grossAmount: input.grossAmount,
    reconciliationAmount: input.reconciliationAmount || 0,
    basisMode,
  });

  const snapshotPayload: Partial<HakAmilSnapshotInsert> = {
    tahun_zakat_id: input.tahunZakatId,
    kategori: input.kategori,
    tanggal: input.tanggal,
    basis_mode: breakdown.basisMode,
    total_bruto: breakdown.bruto,
    total_rekonsiliasi: breakdown.rekonsiliasi,
    total_neto: breakdown.neto,
    nominal_basis: breakdown.basisNominal,
    persen_hak_amil: breakdown.persen,
    nominal_hak_amil: breakdown.nominal_hak_amil,
    catatan: input.catatan || null,
    created_by: input.createdBy || null,
  };

  // Set the appropriate source foreign key
  if (input.sourceType === 'pemasukan_uang') {
    snapshotPayload.pemasukan_uang_id = input.sourceId;
  } else if (input.sourceType === 'pemasukan_beras') {
    snapshotPayload.pemasukan_beras_id = input.sourceId;
  } else if (input.sourceType === 'rekonsiliasi') {
    snapshotPayload.rekonsiliasi_id = input.sourceId;
  }

  // Type assertion needed until database types are regenerated after migration
  const { error } = await supabase
    .from('hak_amil_snapshots')
    // @ts-expect-error - hak_amil_snapshots table exists but types not yet regenerated
    .insert(snapshotPayload);

  if (error) {
    console.error('Failed to create hak_amil_snapshot:', error);
    // Don't throw - snapshot failure should not block the transaction
    // but we log it for monitoring
  }
}

/**
 * Fetch the current basis_mode for a given tahun_zakat.
 * Returns default if no config exists for that year.
 */
export async function fetchBasisModeForTahun(
  tahunZakatId: string
): Promise<HakAmilBasisMode> {
  const { data, error } = await supabase
    .from('hak_amil_configs')
    .select('basis_mode')
    .eq('tahun_zakat_id', tahunZakatId)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_HAK_AMIL_BASIS_MODE;
  }

  return (data as { basis_mode: HakAmilBasisMode }).basis_mode;
}
