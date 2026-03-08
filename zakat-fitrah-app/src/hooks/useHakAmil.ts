import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { offlineStore } from '@/lib/offlineStore';
import { BULK_BERAS_KG_PER_LITER } from '@/types/bulk';
import type {
  HakAmilConfig,
  HakAmilKategori,
  HakAmilBasisMode,
} from '@/types/database.types';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

type HakAmilMoneyKategori = Exclude<HakAmilKategori, 'beras'>;

const MONEY_CATEGORIES: HakAmilMoneyKategori[] = ['zakat_fitrah', 'zakat_maal', 'infak', 'fidyah'];
const RICE_CATEGORIES: HakAmilMoneyKategori[] = ['zakat_fitrah', 'zakat_maal', 'infak', 'fidyah'];

const UANG_MAPPING: Record<string, HakAmilMoneyKategori> = {
  zakat_fitrah_uang: 'zakat_fitrah',
  maal_penghasilan_uang: 'zakat_maal',
  fidyah_uang: 'fidyah',
  infak_sedekah_uang: 'infak',
};

const BERAS_MAPPING: Record<string, HakAmilMoneyKategori> = {
  zakat_fitrah_beras: 'zakat_fitrah',
  maal_beras: 'zakat_maal',
  fidyah_beras: 'fidyah',
  infak_sedekah_beras: 'infak',
};

export interface HakAmilConfigInput {
  tahun_zakat_id: string;
  basis_mode?: HakAmilBasisMode;
  persen_zakat_fitrah?: number;
  persen_zakat_maal?: number;
  persen_infak?: number;
  persen_fidyah?: number;
  persen_beras?: number;
}

export interface HakAmilKategoriSummary {
  kategori: HakAmilMoneyKategori;
  total_bruto: number;
  total_rekonsiliasi: number;
  total_neto: number;
  persen_hak_amil: number;
  nominal_hak_amil: number;
}

export interface HakAmilSummary {
  categories: HakAmilKategoriSummary[];
  grand_total_bruto: number;
  grand_total_rekonsiliasi: number;
  grand_total_neto: number;
  grand_total_hak_amil: number;
  beras_metrics?: {
    total_bruto_kg: number;
    total_rekonsiliasi_kg: number;
    total_neto_kg: number;
    nominal_hak_amil_kg: number;
  };
  coverage_debug?: {
    pembayaran_zakat_count: number;
    pemasukan_uang_count: number;
    pemasukan_beras_count: number;
  };
}

export interface HakAmilBerasKategoriSummary {
  kategori: HakAmilMoneyKategori;
  total_bruto_kg: number;
  total_rekonsiliasi_kg: number;
  total_neto_kg: number;
  persen_hak_amil: number;
  nominal_hak_amil_kg: number;
}

export interface HakAmilBerasSummary {
  categories: HakAmilBerasKategoriSummary[];
  grand_total_bruto_kg: number;
  grand_total_rekonsiliasi_kg: number;
  grand_total_neto_kg: number;
  grand_total_hak_amil_kg: number;
  unit_breakdown?: {
    source_kg_kg: number;
    source_liter_liter: number;
    source_liter_to_kg: number;
  };
  coverage_debug?: {
    pembayaran_zakat_count: number;
    pemasukan_beras_count: number;
  };
}

export interface HakAmilPersenReference {
  zakat_fitrah: number;
  zakat_maal: number;
  infak: number;
  fidyah: number;
  beras: number;
}

export interface HakAmilPemasukanUangRow {
  kategori: string;
  jumlah_uang_rp: number;
  tanggal?: string;
}

export interface HakAmilPemasukanBerasRow {
  kategori: string;
  jumlah_beras_kg: number;
  catatan?: string | null;
  tanggal?: string;
}

export interface HakAmilPembayaranRow {
  jenis_zakat: string;
  jumlah_uang_rp: number | null;
  jumlah_beras_kg: number | null;
  tanggal_bayar?: string;
}

export function useHakAmilConfig(tahunZakatId?: string) {
  return useQuery({
    queryKey: ['hak-amil-config', tahunZakatId],
    queryFn: async (): Promise<HakAmilConfig | null> => {
      if (!tahunZakatId) return null;

      if (OFFLINE_MODE) {
        const cfg = offlineStore.hakAmilConfigs.find(
          (c) => c.tahun_zakat_id === tahunZakatId
        );
        if (!cfg) return null;
        return {
          id: cfg.id,
          tahun_zakat_id: cfg.tahun_zakat_id,
          basis_mode: cfg.basis_mode,
          persen_zakat_fitrah: cfg.zakat_fitrah_pct,
          persen_zakat_maal: cfg.zakat_maal_pct,
          persen_infak: cfg.infak_pct,
          persen_fidyah: cfg.fidyah_pct,
          persen_beras: cfg.beras_pct,
          created_by: null,
          updated_by: null,
          created_at: cfg.updated_at,
          updated_at: cfg.updated_at,
        } as HakAmilConfig;
      }

      const { data, error } = await supabase
        .from('hak_amil_configs')
        .select('*')
        .eq('tahun_zakat_id', tahunZakatId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('hak_amil_configs table not found - migrations 023/024 may not be applied yet');
          return null;
        }
        throw error;
      }
      return data;
    },
    enabled: !!tahunZakatId,
  });
}

export function useHakAmilMonthlySummary(
  tahunZakatId?: string,
  month?: number,
  year?: number
) {
  return useQuery({
    queryKey: ['hak-amil-monthly-summary', tahunZakatId, month, year],
    queryFn: async (): Promise<HakAmilSummary> => {
      if (!tahunZakatId || !month || !year) {
        return createEmptySummary();
      }

      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      if (OFFLINE_MODE) {
        return fetchOfflineHakAmilSummary(tahunZakatId, startDate, endDate);
      }

      return fetchOnlineHakAmilSummary(tahunZakatId, startDate, endDate);
    },
    enabled: !!tahunZakatId && !!month && !!year,
  });
}

export function useHakAmilYearlySummary(tahunZakatId?: string) {
  return useQuery({
    queryKey: ['hak-amil-yearly-summary', tahunZakatId],
    queryFn: async (): Promise<HakAmilSummary> => {
      if (!tahunZakatId) {
        return createEmptySummary();
      }

      if (OFFLINE_MODE) {
        return fetchOfflineHakAmilSummary(tahunZakatId);
      }

      return fetchOnlineHakAmilSummary(tahunZakatId);
    },
    enabled: !!tahunZakatId,
  });
}

export type HakAmilPeriod =
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_semester'
  | 'this_year';

export interface HakAmilPeriodRange {
  startDate: string;
  endDate: string;
  label: string;
}

export function getDateRangeForPeriod(period: HakAmilPeriod): HakAmilPeriodRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  if (period === 'this_month') {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: fmt(start),
      endDate: fmt(end),
      label: start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    };
  }
  if (period === 'last_month') {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
      startDate: fmt(start),
      endDate: fmt(end),
      label: start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    };
  }
  if (period === 'this_quarter') {
    const q = Math.floor(month / 3);
    const start = new Date(year, q * 3, 1);
    const end = new Date(year, q * 3 + 3, 0);
    const qLabel = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Okt-Des)'][q];
    return { startDate: fmt(start), endDate: fmt(end), label: `${qLabel} ${year}` };
  }
  if (period === 'this_semester') {
    const s = month < 6 ? 0 : 1;
    const start = new Date(year, s * 6, 1);
    const end = new Date(year, s * 6 + 6, 0);
    return {
      startDate: fmt(start),
      endDate: fmt(end),
      label: `Semester ${s + 1} ${year}`,
    };
  }

  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    label: `Tahun ${year}`,
  };
}

export function useHakAmilDateRangeSummary(
  tahunZakatId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['hak-amil-range-summary', tahunZakatId, startDate, endDate],
    queryFn: async (): Promise<HakAmilSummary> => {
      if (!tahunZakatId || !startDate || !endDate) return createEmptySummary();

      if (OFFLINE_MODE) {
        return fetchOfflineHakAmilSummary(tahunZakatId, startDate, endDate);
      }

      return fetchOnlineHakAmilSummary(tahunZakatId, startDate, endDate);
    },
    enabled: !!tahunZakatId && !!startDate && !!endDate,
  });
}

export function useHakAmilBerasDateRangeSummary(
  tahunZakatId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['hak-amil-beras-range-summary', tahunZakatId, startDate, endDate],
    queryFn: async (): Promise<HakAmilBerasSummary> => {
      if (!tahunZakatId || !startDate || !endDate) return createEmptyBerasSummary();

      if (OFFLINE_MODE) {
        return fetchOfflineHakAmilBerasSummary(tahunZakatId, startDate, endDate);
      }

      const { persenReference, pembayaranZakat, pemasukanBeras } =
        await fetchOnlineHakAmilSourceData(tahunZakatId, startDate, endDate);

      return buildHakAmilBerasSummaryFromTransactions({
        persenReference,
        pemasukanBeras,
        pembayaranZakat,
      });
    },
    enabled: !!tahunZakatId && !!startDate && !!endDate,
  });
}

export interface HakAmilMonthlyPoint {
  month: string;
  monthKey: string;
  zakat_fitrah: number;
  zakat_maal: number;
  infak: number;
  fidyah: number;
  beras: number;
  beras_kg: number;
  total: number;
}

export function useHakAmilMonthlyTrend(tahunZakatId?: string, year?: number) {
  return useQuery({
    queryKey: ['hak-amil-monthly-trend', tahunZakatId, year],
    queryFn: async (): Promise<HakAmilMonthlyPoint[]> => {
      if (!tahunZakatId || !year) return [];

      if (OFFLINE_MODE) {
        const cfg = offlineStore.hakAmilConfigs.find(
          (c) => c.tahun_zakat_id === tahunZakatId
        ) ?? null;

        return Array.from({ length: 12 }, (_, i) => {
          const key = `${year}-${(i + 1).toString().padStart(2, '0')}`;
          const pemasukanUang = offlineStore.pemasukanUang.filter(
            (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal.startsWith(key)
          );
          const pemasukanBeras = offlineStore.pemasukanBeras.filter(
            (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal.startsWith(key)
          );
          const pembayaranZakat = offlineStore.pembayaran.filter(
            (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal_bayar.startsWith(key)
          );

          const summary = computeOfflineHakAmilSummary(
            cfg,
            pemasukanUang,
            pemasukanBeras,
            pembayaranZakat
          );
          const catMap = Object.fromEntries(summary.categories.map((c) => [c.kategori, c.nominal_hak_amil]));

          return {
            month: new Date(year, i, 1).toLocaleDateString('id-ID', { month: 'short' }),
            monthKey: key,
            zakat_fitrah: catMap.zakat_fitrah ?? 0,
            zakat_maal: catMap.zakat_maal ?? 0,
            infak: catMap.infak ?? 0,
            fidyah: catMap.fidyah ?? 0,
            beras: 0,
            beras_kg: summary.beras_metrics?.nominal_hak_amil_kg ?? 0,
            total: summary.grand_total_hak_amil,
          };
        });
      }

      const { persenReference, pembayaranZakat, pemasukanUang, pemasukanBeras } =
        await fetchOnlineHakAmilSourceData(tahunZakatId, `${year}-01-01`, `${year}-12-31`);

      return Array.from({ length: 12 }, (_, i) => {
        const key = `${year}-${(i + 1).toString().padStart(2, '0')}`;
        const monthlySummary = buildHakAmilSummaryFromTransactions({
          persenReference,
          pembayaranZakat: pembayaranZakat.filter((p) => p.tanggal_bayar?.startsWith(key)),
          pemasukanUang: pemasukanUang.filter((p) => p.tanggal?.startsWith(key)),
          pemasukanBeras: pemasukanBeras.filter((p) => p.tanggal?.startsWith(key)),
        });
        const catMap = Object.fromEntries(
          monthlySummary.categories.map((c) => [c.kategori, c.nominal_hak_amil])
        );

        return {
          month: new Date(year, i, 1).toLocaleDateString('id-ID', { month: 'short' }),
          monthKey: key,
          zakat_fitrah: catMap.zakat_fitrah ?? 0,
          zakat_maal: catMap.zakat_maal ?? 0,
          infak: catMap.infak ?? 0,
          fidyah: catMap.fidyah ?? 0,
          beras: 0,
          beras_kg: monthlySummary.beras_metrics?.nominal_hak_amil_kg ?? 0,
          total: monthlySummary.grand_total_hak_amil,
        };
      });
    },
    enabled: !!tahunZakatId && !!year,
  });
}

export function useCreateHakAmilConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HakAmilConfigInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('hak_amil_configs')
        .insert({
          tahun_zakat_id: input.tahun_zakat_id,
          basis_mode: input.basis_mode || 'net_after_reconciliation',
          persen_zakat_fitrah: input.persen_zakat_fitrah ?? 12.5,
          persen_zakat_maal: input.persen_zakat_maal ?? 12.5,
          persen_infak: input.persen_infak ?? 20.0,
          persen_fidyah: input.persen_fidyah ?? 0.0,
          persen_beras: input.persen_beras ?? 0.0,
          created_by: user.id,
          updated_by: user.id,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hak-amil-config'] });
      toast.success('Konfigurasi hak amil berhasil dibuat');
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat konfigurasi: ${error.message}`);
    },
  });
}

export function useUpdateHakAmilConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: HakAmilConfigInput & { id: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData: Record<string, unknown> = {
        updated_by: user.id,
      };

      if (input.basis_mode !== undefined) updateData.basis_mode = input.basis_mode;
      if (input.persen_zakat_fitrah !== undefined) updateData.persen_zakat_fitrah = input.persen_zakat_fitrah;
      if (input.persen_zakat_maal !== undefined) updateData.persen_zakat_maal = input.persen_zakat_maal;
      if (input.persen_infak !== undefined) updateData.persen_infak = input.persen_infak;
      if (input.persen_fidyah !== undefined) updateData.persen_fidyah = input.persen_fidyah;
      if (input.persen_beras !== undefined) updateData.persen_beras = input.persen_beras;

      const { data, error } = await supabase
        .from('hak_amil_configs')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hak-amil-config'] });
      toast.success('Konfigurasi hak amil berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui konfigurasi: ${error.message}`);
    },
  });
}

async function fetchOnlineHakAmilSourceData(
  tahunZakatId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  persenReference: HakAmilPersenReference;
  pembayaranZakat: HakAmilPembayaranRow[];
  pemasukanUang: HakAmilPemasukanUangRow[];
  pemasukanBeras: HakAmilPemasukanBerasRow[];
}> {
  const configRes = await supabase
    .from('hak_amil_configs')
    .select('persen_zakat_fitrah, persen_zakat_maal, persen_infak, persen_fidyah, persen_beras')
    .eq('tahun_zakat_id', tahunZakatId)
    .maybeSingle();

  if (configRes.error) throw configRes.error;

  const persenReference: HakAmilPersenReference = {
    zakat_fitrah: Number((configRes.data as { persen_zakat_fitrah?: number } | null)?.persen_zakat_fitrah ?? 12.5),
    zakat_maal: Number((configRes.data as { persen_zakat_maal?: number } | null)?.persen_zakat_maal ?? 12.5),
    infak: Number((configRes.data as { persen_infak?: number } | null)?.persen_infak ?? 20),
    fidyah: Number((configRes.data as { persen_fidyah?: number } | null)?.persen_fidyah ?? 0),
    beras: Number((configRes.data as { persen_beras?: number } | null)?.persen_beras ?? 0),
  };

  let pembayaranQuery = supabase
    .from('pembayaran_zakat')
    .select('jenis_zakat, jumlah_uang_rp, jumlah_beras_kg, tanggal_bayar')
    .eq('tahun_zakat_id', tahunZakatId);
  let pemasukanUangQuery = supabase
    .from('pemasukan_uang')
    .select('kategori, jumlah_uang_rp, tanggal')
    .eq('tahun_zakat_id', tahunZakatId);
  let pemasukanBerasQuery = supabase
    .from('pemasukan_beras')
    .select('kategori, jumlah_beras_kg, catatan, tanggal')
    .eq('tahun_zakat_id', tahunZakatId);

  if (startDate) {
    pembayaranQuery = pembayaranQuery.gte('tanggal_bayar', startDate);
    pemasukanUangQuery = pemasukanUangQuery.gte('tanggal', startDate);
    pemasukanBerasQuery = pemasukanBerasQuery.gte('tanggal', startDate);
  }
  if (endDate) {
    pembayaranQuery = pembayaranQuery.lte('tanggal_bayar', endDate);
    pemasukanUangQuery = pemasukanUangQuery.lte('tanggal', endDate);
    pemasukanBerasQuery = pemasukanBerasQuery.lte('tanggal', endDate);
  }

  const [pembayaranRes, pemasukanUangRes, pemasukanBerasRes] = await Promise.all([
    pembayaranQuery,
    pemasukanUangQuery,
    pemasukanBerasQuery,
  ]);

  if (pembayaranRes.error) throw pembayaranRes.error;
  if (pemasukanUangRes.error) throw pemasukanUangRes.error;
  if (pemasukanBerasRes.error) throw pemasukanBerasRes.error;

  return {
    persenReference,
    pembayaranZakat: (pembayaranRes.data || []) as HakAmilPembayaranRow[],
    pemasukanUang: (pemasukanUangRes.data || []) as HakAmilPemasukanUangRow[],
    pemasukanBeras: (pemasukanBerasRes.data || []) as HakAmilPemasukanBerasRow[],
  };
}

function parseBerasUnitFromNotes(catatan?: string | null): 'kg' | 'liter' {
  return catatan?.includes('media:beras_liter') ? 'liter' : 'kg';
}

export function buildHakAmilBerasSummaryFromTransactions({
  persenReference,
  pembayaranZakat,
  pemasukanBeras,
}: {
  persenReference: HakAmilPersenReference;
  pembayaranZakat: HakAmilPembayaranRow[];
  pemasukanBeras: HakAmilPemasukanBerasRow[];
}): HakAmilBerasSummary {
  const brutoByCategoryKg: Record<HakAmilMoneyKategori, number> = {
    zakat_fitrah: 0,
    zakat_maal: 0,
    infak: 0,
    fidyah: 0,
  };

  let sourceKgKg = 0;
  let sourceLiterLiter = 0;

  pemasukanBeras.forEach((p) => {
    const mappedKategori = BERAS_MAPPING[p.kategori];
    const amountKg = Number(p.jumlah_beras_kg || 0);

    if (mappedKategori) {
      brutoByCategoryKg[mappedKategori] += amountKg;
    }

    if (parseBerasUnitFromNotes(p.catatan) === 'liter') {
      sourceLiterLiter += amountKg / BULK_BERAS_KG_PER_LITER;
    } else {
      sourceKgKg += amountKg;
    }
  });

  pembayaranZakat.forEach((p) => {
    if (p.jenis_zakat !== 'beras') return;
    const amountKg = Number(p.jumlah_beras_kg || 0);
    brutoByCategoryKg.zakat_fitrah += amountKg;
    sourceKgKg += amountKg;
  });

  const categories: HakAmilBerasKategoriSummary[] = RICE_CATEGORIES.map((kategori) => {
    const total_bruto_kg = Number((brutoByCategoryKg[kategori] || 0).toFixed(2));
    const total_rekonsiliasi_kg = 0;
    const total_neto_kg = total_bruto_kg;
    const persen_hak_amil = persenReference[kategori] ?? 0;
    const nominal_hak_amil_kg = Number(((total_neto_kg * persen_hak_amil) / 100).toFixed(2));

    return {
      kategori,
      total_bruto_kg,
      total_rekonsiliasi_kg,
      total_neto_kg,
      persen_hak_amil,
      nominal_hak_amil_kg,
    };
  });

  return {
    categories,
    grand_total_bruto_kg: Number(categories.reduce((sum, c) => sum + c.total_bruto_kg, 0).toFixed(2)),
    grand_total_rekonsiliasi_kg: 0,
    grand_total_neto_kg: Number(categories.reduce((sum, c) => sum + c.total_neto_kg, 0).toFixed(2)),
    grand_total_hak_amil_kg: Number(categories.reduce((sum, c) => sum + c.nominal_hak_amil_kg, 0).toFixed(2)),
    unit_breakdown: {
      source_kg_kg: Number(sourceKgKg.toFixed(2)),
      source_liter_liter: Number(sourceLiterLiter.toFixed(2)),
      source_liter_to_kg: Number((sourceLiterLiter * BULK_BERAS_KG_PER_LITER).toFixed(2)),
    },
    coverage_debug: {
      pembayaran_zakat_count: pembayaranZakat.length,
      pemasukan_beras_count: pemasukanBeras.length,
    },
  };
}

export function buildHakAmilSummaryFromTransactions({
  persenReference,
  pembayaranZakat,
  pemasukanUang,
  pemasukanBeras,
}: {
  persenReference: HakAmilPersenReference;
  pembayaranZakat: HakAmilPembayaranRow[];
  pemasukanUang: HakAmilPemasukanUangRow[];
  pemasukanBeras: HakAmilPemasukanBerasRow[];
}): HakAmilSummary {
  const brutoMap: Record<HakAmilMoneyKategori, number> = {
    zakat_fitrah: 0,
    zakat_maal: 0,
    infak: 0,
    fidyah: 0,
  };

  pemasukanUang.forEach((p) => {
    const cat = UANG_MAPPING[p.kategori];
    if (!cat) return;
    brutoMap[cat] += Number(p.jumlah_uang_rp || 0);
  });

  pembayaranZakat.forEach((p) => {
    if (p.jenis_zakat === 'uang') {
      brutoMap.zakat_fitrah += Number(p.jumlah_uang_rp || 0);
    }
  });

  const categories: HakAmilKategoriSummary[] = MONEY_CATEGORIES.map((kategori) => {
    const total_bruto = brutoMap[kategori] ?? 0;
    const total_rekonsiliasi = 0;
    const total_neto = total_bruto;
    const persen_hak_amil = persenReference[kategori] ?? 0;
    const nominal_hak_amil = Math.round((total_neto * persen_hak_amil) / 100);

    return { kategori, total_bruto, total_rekonsiliasi, total_neto, persen_hak_amil, nominal_hak_amil };
  });

  const berasSummary = buildHakAmilBerasSummaryFromTransactions({
    persenReference,
    pembayaranZakat,
    pemasukanBeras,
  });

  return {
    categories,
    grand_total_bruto: categories.reduce((sum, c) => sum + c.total_bruto, 0),
    grand_total_rekonsiliasi: 0,
    grand_total_neto: categories.reduce((sum, c) => sum + c.total_neto, 0),
    grand_total_hak_amil: categories.reduce((sum, c) => sum + c.nominal_hak_amil, 0),
    beras_metrics: {
      total_bruto_kg: berasSummary.grand_total_bruto_kg,
      total_rekonsiliasi_kg: 0,
      total_neto_kg: berasSummary.grand_total_neto_kg,
      nominal_hak_amil_kg: berasSummary.grand_total_hak_amil_kg,
    },
    coverage_debug: {
      pembayaran_zakat_count: pembayaranZakat.length,
      pemasukan_uang_count: pemasukanUang.length,
      pemasukan_beras_count: pemasukanBeras.length,
    },
  };
}

async function fetchOnlineHakAmilSummary(
  tahunZakatId: string,
  startDate?: string,
  endDate?: string
): Promise<HakAmilSummary> {
  const { persenReference, pembayaranZakat, pemasukanUang, pemasukanBeras } =
    await fetchOnlineHakAmilSourceData(tahunZakatId, startDate, endDate);

  return buildHakAmilSummaryFromTransactions({
    persenReference,
    pembayaranZakat,
    pemasukanUang,
    pemasukanBeras,
  });
}

function buildPersenReferenceFromOfflineConfig(
  cfg: { zakat_fitrah_pct: number; zakat_maal_pct: number; infak_pct: number; fidyah_pct: number; beras_pct: number } | null
): HakAmilPersenReference {
  return {
    zakat_fitrah: cfg?.zakat_fitrah_pct ?? 12.5,
    zakat_maal: cfg?.zakat_maal_pct ?? 12.5,
    infak: cfg?.infak_pct ?? 20,
    fidyah: cfg?.fidyah_pct ?? 0,
    beras: cfg?.beras_pct ?? 0,
  };
}

function computeOfflineHakAmilSummary(
  cfg: { zakat_fitrah_pct: number; zakat_maal_pct: number; infak_pct: number; fidyah_pct: number; beras_pct: number; basis_mode: string } | null,
  pemasukanUang: Array<{ kategori: string; jumlah_uang_rp: number }>,
  pemasukanBeras: Array<{ kategori: string; jumlah_beras_kg: number; catatan?: string | null }>,
  pembayaranZakat: Array<{ jenis_zakat: string; jumlah_uang_rp: number | null; jumlah_beras_kg: number | null }> = []
): HakAmilSummary {
  return buildHakAmilSummaryFromTransactions({
    persenReference: buildPersenReferenceFromOfflineConfig(cfg),
    pembayaranZakat,
    pemasukanUang,
    pemasukanBeras,
  });
}

function fetchOfflineHakAmilSummary(
  tahunZakatId: string,
  startDate?: string,
  endDate?: string
): HakAmilSummary {
  const cfg = offlineStore.hakAmilConfigs.find((c) => c.tahun_zakat_id === tahunZakatId) ?? null;

  const pemasukanUang = offlineStore.pemasukanUang.filter((p) => {
    if (p.tahun_zakat_id !== tahunZakatId) return false;
    if (startDate && p.tanggal < startDate) return false;
    if (endDate && p.tanggal > endDate) return false;
    return true;
  });

  const pemasukanBeras = offlineStore.pemasukanBeras.filter((p) => {
    if (p.tahun_zakat_id !== tahunZakatId) return false;
    if (startDate && p.tanggal < startDate) return false;
    if (endDate && p.tanggal > endDate) return false;
    return true;
  });

  const pembayaranZakat = offlineStore.pembayaran.filter((p) => {
    if (p.tahun_zakat_id !== tahunZakatId) return false;
    if (startDate && p.tanggal_bayar < startDate) return false;
    if (endDate && p.tanggal_bayar > endDate) return false;
    return true;
  });

  return computeOfflineHakAmilSummary(cfg, pemasukanUang, pemasukanBeras, pembayaranZakat);
}

function fetchOfflineHakAmilBerasSummary(
  tahunZakatId: string,
  startDate?: string,
  endDate?: string
): HakAmilBerasSummary {
  const cfg = offlineStore.hakAmilConfigs.find((c) => c.tahun_zakat_id === tahunZakatId) ?? null;

  const pemasukanBeras = offlineStore.pemasukanBeras.filter((p) => {
    if (p.tahun_zakat_id !== tahunZakatId) return false;
    if (startDate && p.tanggal < startDate) return false;
    if (endDate && p.tanggal > endDate) return false;
    return true;
  });

  const pembayaranZakat = offlineStore.pembayaran.filter((p) => {
    if (p.tahun_zakat_id !== tahunZakatId) return false;
    if (startDate && p.tanggal_bayar < startDate) return false;
    if (endDate && p.tanggal_bayar > endDate) return false;
    return true;
  });

  return buildHakAmilBerasSummaryFromTransactions({
    persenReference: buildPersenReferenceFromOfflineConfig(cfg),
    pemasukanBeras,
    pembayaranZakat,
  });
}

function createEmptySummary(): HakAmilSummary {
  return {
    categories: MONEY_CATEGORIES.map((kategori) => ({
      kategori,
      total_bruto: 0,
      total_rekonsiliasi: 0,
      total_neto: 0,
      persen_hak_amil: 0,
      nominal_hak_amil: 0,
    })),
    grand_total_bruto: 0,
    grand_total_rekonsiliasi: 0,
    grand_total_neto: 0,
    grand_total_hak_amil: 0,
    beras_metrics: {
      total_bruto_kg: 0,
      total_rekonsiliasi_kg: 0,
      total_neto_kg: 0,
      nominal_hak_amil_kg: 0,
    },
    coverage_debug: {
      pembayaran_zakat_count: 0,
      pemasukan_uang_count: 0,
      pemasukan_beras_count: 0,
    },
  };
}

function createEmptyBerasSummary(): HakAmilBerasSummary {
  return {
    categories: RICE_CATEGORIES.map((kategori) => ({
      kategori,
      total_bruto_kg: 0,
      total_rekonsiliasi_kg: 0,
      total_neto_kg: 0,
      persen_hak_amil: 0,
      nominal_hak_amil_kg: 0,
    })),
    grand_total_bruto_kg: 0,
    grand_total_rekonsiliasi_kg: 0,
    grand_total_neto_kg: 0,
    grand_total_hak_amil_kg: 0,
    unit_breakdown: {
      source_kg_kg: 0,
      source_liter_liter: 0,
      source_liter_to_kg: 0,
    },
    coverage_debug: {
      pembayaran_zakat_count: 0,
      pemasukan_beras_count: 0,
    },
  };
}
