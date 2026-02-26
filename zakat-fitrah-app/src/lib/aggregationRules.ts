import type { AggregationRuleId, StatFormat } from '@/types/dashboard';
import type { DashboardStats } from '@/hooks/useDashboard';

export interface AggregationRule {
  id: AggregationRuleId;
  label: string;
  format: StatFormat;
  /** The key in DashboardStats this rule maps to */
  statsField: keyof DashboardStats;
}

export const AGGREGATION_RULES: AggregationRule[] = [
  {
    id: 'zakat_beras_terkumpul',
    label: 'Zakat Beras Terkumpul',
    format: 'weight',
    statsField: 'totalBerasKg',
  },
  {
    id: 'zakat_uang_terkumpul',
    label: 'Zakat Uang Terkumpul',
    format: 'currency',
    statsField: 'totalUangRp',
  },
  {
    id: 'fidyah_uang',
    label: 'Fidyah Uang',
    format: 'currency',
    statsField: 'fidyahUangRp',
  },
  {
    id: 'fidyah_beras',
    label: 'Fidyah Beras',
    format: 'weight',
    statsField: 'fidyahBerasKg',
  },
  {
    id: 'infak_sedekah_uang',
    label: 'Infak/Sedekah Uang',
    format: 'currency',
    statsField: 'infakSedekahUangRp',
  },
  {
    id: 'infak_sedekah_beras',
    label: 'Infak/Sedekah Beras',
    format: 'weight',
    statsField: 'infakSedekahBerasKg',
  },
  {
    id: 'maal_penghasilan_uang',
    label: 'Maal/Penghasilan Uang',
    format: 'currency',
    statsField: 'maalPenghasilanUangRp',
  },
  {
    id: 'total_pemasukan_uang',
    label: 'Total Pemasukan Uang',
    format: 'currency',
    statsField: 'totalPemasukanUangRp',
  },
  {
    id: 'total_pemasukan_beras',
    label: 'Total Pemasukan Beras',
    format: 'weight',
    statsField: 'totalPemasukanBerasKg',
  },
  {
    id: 'distribusi_beras',
    label: 'Beras Tersalurkan',
    format: 'weight',
    statsField: 'totalDistribusiBerasKg',
  },
  {
    id: 'distribusi_uang',
    label: 'Uang Tersalurkan',
    format: 'currency',
    statsField: 'totalDistribusiUangRp',
  },
  {
    id: 'sisa_beras',
    label: 'Sisa Beras',
    format: 'weight',
    statsField: 'sisaBerasKg',
  },
  {
    id: 'sisa_uang',
    label: 'Sisa Uang',
    format: 'currency',
    statsField: 'sisaUangRp',
  },
  {
    id: 'total_muzakki',
    label: 'Total Muzakki',
    format: 'number',
    statsField: 'totalMuzakki',
  },
  {
    id: 'total_mustahik_aktif',
    label: 'Mustahik Aktif',
    format: 'number',
    statsField: 'totalMustahikAktif',
  },
  {
    id: 'total_mustahik_nonaktif',
    label: 'Mustahik Non-Aktif',
    format: 'number',
    statsField: 'totalMustahikNonAktif',
  },
  {
    id: 'hak_amil_beras',
    label: 'Hak Amil Beras',
    format: 'weight',
    statsField: 'hakAmilBerasKg',
  },
  {
    id: 'hak_amil_uang',
    label: 'Hak Amil Uang',
    format: 'currency',
    statsField: 'hakAmilUangRp',
  },
];

/** Lookup map: ruleId → AggregationRule */
export const AGGREGATION_RULE_MAP: Record<AggregationRuleId, AggregationRule> =
  Object.fromEntries(AGGREGATION_RULES.map((r) => [r.id, r])) as Record<
    AggregationRuleId,
    AggregationRule
  >;
