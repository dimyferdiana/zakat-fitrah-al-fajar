import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { offlineStore } from '@/lib/offlineStore';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';
import type {
  HakAmilConfig,
  HakAmilKategori,
  HakAmilBasisMode,
} from '@/types/database.types';

// =========================================
// INTERFACES
// =========================================

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
  kategori: HakAmilKategori;
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

interface HakAmilPersenReference {
  zakat_fitrah: number;
  zakat_maal: number;
  infak: number;
  fidyah: number;
  beras: number;
}

interface HakAmilPemasukanUangRow {
  kategori: string;
  jumlah_uang_rp: number;
  tanggal?: string;
}

interface HakAmilPemasukanBerasRow {
  kategori: string;
  jumlah_beras_kg: number;
  tanggal?: string;
}

interface HakAmilPembayaranRow {
  jenis_zakat: string;
  jumlah_uang_rp: number | null;
  jumlah_beras_kg: number | null;
  tanggal_bayar?: string;
}

// =========================================
// QUERY: Get Hak Amil Config by Tahun Zakat
// =========================================

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

      // Graceful handling if table doesn't exist yet (migrations not run)
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

// =========================================
// QUERY: Monthly Summary
// =========================================

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

      if (OFFLINE_MODE) {
        const cfg = offlineStore.hakAmilConfigs.find(
          (c) => c.tahun_zakat_id === tahunZakatId
        ) ?? null;
        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
        const pemasukanUang = offlineStore.pemasukanUang.filter(
          (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal.startsWith(monthStr)
        );
        const pemasukanBeras = offlineStore.pemasukanBeras.filter(
          (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal.startsWith(monthStr)
        );
        const pembayaranZakat = offlineStore.pembayaran.filter(
          (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal_bayar.startsWith(monthStr)
        );
        return computeOfflineHakAmilSummary(tahunZakatId, cfg, pemasukanUang, pemasukanBeras, pembayaranZakat);
      }

      // Format dates for SQL query
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

      return fetchOnlineHakAmilSummary(tahunZakatId, startDate, endDate);
    },
    enabled: !!tahunZakatId && !!month && !!year,
  });
}

// =========================================
// QUERY: Yearly Summary
// =========================================

export function useHakAmilYearlySummary(tahunZakatId?: string) {
  return useQuery({
    queryKey: ['hak-amil-yearly-summary', tahunZakatId],
    queryFn: async (): Promise<HakAmilSummary> => {
      if (!tahunZakatId) {
        return createEmptySummary();
      }

      if (OFFLINE_MODE) {
        const cfg = offlineStore.hakAmilConfigs.find(
          (c) => c.tahun_zakat_id === tahunZakatId
        ) ?? null;
        const pemasukanUang = offlineStore.pemasukanUang.filter(
          (p) => p.tahun_zakat_id === tahunZakatId
        );
        const pemasukanBeras = offlineStore.pemasukanBeras.filter(
          (p) => p.tahun_zakat_id === tahunZakatId
        );
        const pembayaranZakat = offlineStore.pembayaran.filter(
          (p) => p.tahun_zakat_id === tahunZakatId
        );
        return computeOfflineHakAmilSummary(tahunZakatId, cfg, pemasukanUang, pemasukanBeras, pembayaranZakat);
      }

      return fetchOnlineHakAmilSummary(tahunZakatId);
    },
    enabled: !!tahunZakatId,
  });
}

// =========================================
// QUERY: Date-Range Summary (powers period selector)
// =========================================

export type HakAmilPeriod =
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_semester'
  | 'this_year';

export interface HakAmilPeriodRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

export function getDateRangeForPeriod(period: HakAmilPeriod): HakAmilPeriodRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
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
    const qLabel = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Okt–Des)'][q];
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
  // this_year
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
        const cfg = offlineStore.hakAmilConfigs.find(
          (c) => c.tahun_zakat_id === tahunZakatId
        ) ?? null;
        const pemasukanUang = offlineStore.pemasukanUang.filter(
          (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal >= startDate && p.tanggal <= endDate
        );
        const pemasukanBeras = offlineStore.pemasukanBeras.filter(
          (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal >= startDate && p.tanggal <= endDate
        );
        const pembayaranZakat = offlineStore.pembayaran.filter(
          (p) =>
            p.tahun_zakat_id === tahunZakatId &&
            p.tanggal_bayar >= startDate &&
            p.tanggal_bayar <= endDate
        );
        return computeOfflineHakAmilSummary(tahunZakatId, cfg, pemasukanUang, pemasukanBeras, pembayaranZakat);
      }

      return fetchOnlineHakAmilSummary(tahunZakatId, startDate, endDate);
    },
    enabled: !!tahunZakatId && !!startDate && !!endDate,
  });
}

// =========================================
// QUERY: Monthly Trend (for bar chart widget)
// =========================================

export interface HakAmilMonthlyPoint {
  month: string;     // short month label e.g. "Feb"
  monthKey: string;  // "2026-02"
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
          const m = i + 1;
          const monthStr = `${year}-${m.toString().padStart(2, '0')}`;
          const pemasukanUang = offlineStore.pemasukanUang.filter(
            (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal.startsWith(monthStr)
          );
          const pemasukanBeras = offlineStore.pemasukanBeras.filter(
            (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal.startsWith(monthStr)
          );
          const pembayaranZakat = offlineStore.pembayaran.filter(
            (p) => p.tahun_zakat_id === tahunZakatId && p.tanggal_bayar.startsWith(monthStr)
          );
          const summary = computeOfflineHakAmilSummary(
            tahunZakatId, cfg, pemasukanUang, pemasukanBeras, pembayaranZakat
          );
          const catMap = Object.fromEntries(
            summary.categories.map((c) => [c.kategori, c.nominal_hak_amil])
          );
          return {
            month: new Date(year, i, 1).toLocaleDateString('id-ID', { month: 'short' }),
            monthKey: monthStr,
            zakat_fitrah: catMap['zakat_fitrah'] ?? 0,
            zakat_maal: catMap['zakat_maal'] ?? 0,
            infak: catMap['infak'] ?? 0,
            fidyah: catMap['fidyah'] ?? 0,
            beras: catMap['beras'] ?? 0,
            beras_kg: summary.beras_metrics?.nominal_hak_amil_kg ?? 0,
            total: summary.grand_total_hak_amil,
          };
        });
      }

      const { persenReference, berasToRp, pembayaranZakat, pemasukanUang, pemasukanBeras } =
        await fetchOnlineHakAmilSourceData(tahunZakatId, `${year}-01-01`, `${year}-12-31`);

      return Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const key = `${year}-${m.toString().padStart(2, '0')}`;
        const monthlySummary = buildHakAmilSummaryFromTransactions({
          persenReference,
          berasToRp,
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
          zakat_fitrah: catMap['zakat_fitrah'] ?? 0,
          zakat_maal: catMap['zakat_maal'] ?? 0,
          infak: catMap['infak'] ?? 0,
          fidyah: catMap['fidyah'] ?? 0,
          beras: catMap['beras'] ?? 0,
          beras_kg: monthlySummary.beras_metrics?.nominal_hak_amil_kg ?? 0,
          total: monthlySummary.grand_total_hak_amil,
        };
      });
    },
    enabled: !!tahunZakatId && !!year,
  });
}

// =========================================
// MUTATION: Create Hak Amil Config
// =========================================

export function useCreateHakAmilConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HakAmilConfigInput) => {
      // Get current user
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

// =========================================
// MUTATION: Update Hak Amil Config
// =========================================

export function useUpdateHakAmilConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: HakAmilConfigInput & { id: string }) => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const updateData: Record<string, unknown> = {
        updated_by: user.id,
      };

      // Only update fields that are provided
      if (input.basis_mode !== undefined) updateData.basis_mode = input.basis_mode;
      if (input.persen_zakat_fitrah !== undefined)
        updateData.persen_zakat_fitrah = input.persen_zakat_fitrah;
      if (input.persen_zakat_maal !== undefined)
        updateData.persen_zakat_maal = input.persen_zakat_maal;
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

// =========================================
// HELPER FUNCTIONS
// =========================================

async function fetchOnlineHakAmilSourceData(
  tahunZakatId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  persenReference: HakAmilPersenReference;
  berasToRp: number;
  pembayaranZakat: HakAmilPembayaranRow[];
  pemasukanUang: HakAmilPemasukanUangRow[];
  pemasukanBeras: HakAmilPemasukanBerasRow[];
}> {
  const [configRes, tahunRes] = await Promise.all([
    supabase
      .from('hak_amil_configs')
      .select('persen_zakat_fitrah, persen_zakat_maal, persen_infak, persen_fidyah, persen_beras')
      .eq('tahun_zakat_id', tahunZakatId)
      .maybeSingle(),
    supabase
      .from('tahun_zakat')
      .select('nilai_beras_kg, nilai_uang_rp')
      .eq('id', tahunZakatId)
      .maybeSingle(),
  ]);

  if (configRes.error) throw configRes.error;
  if (tahunRes.error) throw tahunRes.error;

  const persenReference: HakAmilPersenReference = {
    zakat_fitrah: Number((configRes.data as { persen_zakat_fitrah?: number } | null)?.persen_zakat_fitrah ?? 12.5),
    zakat_maal: Number((configRes.data as { persen_zakat_maal?: number } | null)?.persen_zakat_maal ?? 12.5),
    infak: Number((configRes.data as { persen_infak?: number } | null)?.persen_infak ?? 20),
    fidyah: Number((configRes.data as { persen_fidyah?: number } | null)?.persen_fidyah ?? 0),
    beras: Number((configRes.data as { persen_beras?: number } | null)?.persen_beras ?? 0),
  };

  const nilaiBerasKg = Number((tahunRes.data as { nilai_beras_kg?: number } | null)?.nilai_beras_kg ?? 0);
  const nilaiUangRp = Number((tahunRes.data as { nilai_uang_rp?: number } | null)?.nilai_uang_rp ?? 0);
  const berasToRp = nilaiBerasKg > 0 ? nilaiUangRp / nilaiBerasKg : 0;

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
    .select('kategori, jumlah_beras_kg, tanggal')
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
    berasToRp,
    pembayaranZakat: (pembayaranRes.data || []) as HakAmilPembayaranRow[],
    pemasukanUang: (pemasukanUangRes.data || []) as HakAmilPemasukanUangRow[],
    pemasukanBeras: (pemasukanBerasRes.data || []) as HakAmilPemasukanBerasRow[],
  };
}

function buildHakAmilSummaryFromTransactions({
  persenReference,
  berasToRp,
  pembayaranZakat,
  pemasukanUang,
  pemasukanBeras,
}: {
  persenReference: HakAmilPersenReference;
  berasToRp: number;
  pembayaranZakat: HakAmilPembayaranRow[];
  pemasukanUang: HakAmilPemasukanUangRow[];
  pemasukanBeras: HakAmilPemasukanBerasRow[];
}): HakAmilSummary {
  const allCategories: HakAmilKategori[] = ['zakat_fitrah', 'zakat_maal', 'infak', 'fidyah', 'beras'];

  const uangMapping: Record<string, HakAmilKategori> = {
    zakat_fitrah_uang: 'zakat_fitrah',
    maal_penghasilan_uang: 'zakat_maal',
    fidyah_uang: 'fidyah',
    infak_sedekah_uang: 'infak',
  };

  const berasMapping: Record<string, HakAmilKategori> = {
    zakat_fitrah_beras: 'zakat_fitrah',
    maal_beras: 'zakat_maal',
    fidyah_beras: 'fidyah',
    infak_sedekah_beras: 'infak',
  };

  const brutoMap: Record<string, number> = {};
  let berasBrutoKg = 0;

  pemasukanUang.forEach((p) => {
    const cat = uangMapping[p.kategori];
    if (cat) brutoMap[cat] = (brutoMap[cat] ?? 0) + Number(p.jumlah_uang_rp || 0);
  });

  pemasukanBeras.forEach((p) => {
    const cat = berasMapping[p.kategori];
    if (cat) brutoMap[cat] = (brutoMap[cat] ?? 0) + Number(p.jumlah_beras_kg || 0) * berasToRp;
    berasBrutoKg += Number(p.jumlah_beras_kg || 0);
  });

  pembayaranZakat.forEach((p) => {
    if (p.jenis_zakat === 'uang') {
      brutoMap.zakat_fitrah = (brutoMap.zakat_fitrah ?? 0) + Number(p.jumlah_uang_rp || 0);
    }
    if (p.jenis_zakat === 'beras') {
      brutoMap.zakat_fitrah = (brutoMap.zakat_fitrah ?? 0) + Number(p.jumlah_beras_kg || 0) * berasToRp;
      berasBrutoKg += Number(p.jumlah_beras_kg || 0);
    }
  });

  brutoMap.beras = berasBrutoKg * berasToRp;

  const categories: HakAmilKategoriSummary[] = allCategories.map((kategori) => {
    const total_bruto = brutoMap[kategori] ?? 0;
    const total_rekonsiliasi = 0;
    const total_neto = total_bruto;
    const persen_hak_amil = persenReference[kategori] ?? 0;
    const nominal_hak_amil = Math.round((total_neto * persen_hak_amil) / 100);
    return { kategori, total_bruto, total_rekonsiliasi, total_neto, persen_hak_amil, nominal_hak_amil };
  });

  return {
    categories,
    grand_total_bruto: categories.reduce((sum, c) => sum + c.total_bruto, 0),
    grand_total_rekonsiliasi: 0,
    grand_total_neto: categories.reduce((sum, c) => sum + c.total_neto, 0),
    grand_total_hak_amil: categories.reduce((sum, c) => sum + c.nominal_hak_amil, 0),
    beras_metrics: {
      total_bruto_kg: berasBrutoKg,
      total_rekonsiliasi_kg: 0,
      total_neto_kg: berasBrutoKg,
      nominal_hak_amil_kg: berasBrutoKg * ((persenReference.beras ?? 0) / 100),
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
  const { persenReference, berasToRp, pembayaranZakat, pemasukanUang, pemasukanBeras } =
    await fetchOnlineHakAmilSourceData(tahunZakatId, startDate, endDate);

  return buildHakAmilSummaryFromTransactions({
    persenReference,
    berasToRp,
    pembayaranZakat,
    pemasukanUang,
    pemasukanBeras,
  });
}

/**
 * Compute HakAmilSummary from offline pemasukan data + config percentages.
 */
function computeOfflineHakAmilSummary(
  tahunZakatId: string,
  cfg: { zakat_fitrah_pct: number; zakat_maal_pct: number; infak_pct: number; fidyah_pct: number; beras_pct: number; basis_mode: string } | null,
  pemasukanUang: Array<{ kategori: string; jumlah_uang_rp: number }>,
  pemasukanBeras: Array<{ kategori: string; jumlah_beras_kg: number }>,
  pembayaranZakat: Array<{ jenis_zakat: string; jumlah_uang_rp: number | null; jumlah_beras_kg: number | null }> = []
): HakAmilSummary {
  const allCategories: HakAmilKategori[] = ['zakat_fitrah', 'zakat_maal', 'infak', 'fidyah', 'beras'];

  const uangMapping: Record<string, HakAmilKategori> = {
    zakat_fitrah_uang: 'zakat_fitrah',
    maal_penghasilan_uang: 'zakat_maal',
    fidyah_uang: 'fidyah',
    infak_sedekah_uang: 'infak',
  };

  const berasMapping: Record<string, HakAmilKategori> = {
    zakat_fitrah_beras: 'zakat_fitrah',
    maal_beras: 'zakat_maal',
    fidyah_beras: 'fidyah',
    infak_sedekah_beras: 'infak',
  };

  // Convert beras to RP using active tahun rate
  const tahun = offlineStore.tahunZakat.find((t) => t.id === tahunZakatId);
  const berasToRp = tahun && tahun.nilai_beras_kg > 0
    ? tahun.nilai_uang_rp / tahun.nilai_beras_kg
    : 0;

  const brutoMap: Record<string, number> = {};
  let berasBrutoKg = 0;

  pemasukanUang.forEach((p) => {
    const cat = uangMapping[p.kategori];
    if (cat) brutoMap[cat] = (brutoMap[cat] ?? 0) + p.jumlah_uang_rp;
  });

  pemasukanBeras.forEach((p) => {
    const cat = berasMapping[p.kategori];
    if (cat) brutoMap[cat] = (brutoMap[cat] ?? 0) + p.jumlah_beras_kg * berasToRp;
    berasBrutoKg += Number(p.jumlah_beras_kg || 0);
  });

  // pembayaran_zakat: zakat fitrah uang/beras → zakat_fitrah category
  pembayaranZakat.forEach((p) => {
    if (p.jenis_zakat === 'uang' && p.jumlah_uang_rp) {
      brutoMap['zakat_fitrah'] = (brutoMap['zakat_fitrah'] ?? 0) + p.jumlah_uang_rp;
    }
    if (p.jenis_zakat === 'beras' && p.jumlah_beras_kg) {
      brutoMap['zakat_fitrah'] = (brutoMap['zakat_fitrah'] ?? 0) + p.jumlah_beras_kg * berasToRp;
      berasBrutoKg += Number(p.jumlah_beras_kg || 0);
    }
  });

  brutoMap.beras = berasBrutoKg * berasToRp;

  const persenMap: Record<string, number> = {
    zakat_fitrah: cfg?.zakat_fitrah_pct ?? 12.5,
    zakat_maal: cfg?.zakat_maal_pct ?? 12.5,
    infak: cfg?.infak_pct ?? 20,
    fidyah: cfg?.fidyah_pct ?? 0,
    beras: cfg?.beras_pct ?? 0,
  };

  const categories: HakAmilKategoriSummary[] = allCategories.map((kategori) => {
    const total_bruto = brutoMap[kategori] ?? 0;
    const total_rekonsiliasi = 0;
    const total_neto = total_bruto;
    const persen_hak_amil = persenMap[kategori];
    const nominal_hak_amil = Math.round((total_neto * persen_hak_amil) / 100);
    return { kategori, total_bruto, total_rekonsiliasi, total_neto, persen_hak_amil, nominal_hak_amil };
  });

  return {
    categories,
    grand_total_bruto: categories.reduce((s, c) => s + c.total_bruto, 0),
    grand_total_rekonsiliasi: 0,
    grand_total_neto: categories.reduce((s, c) => s + c.total_neto, 0),
    grand_total_hak_amil: categories.reduce((s, c) => s + c.nominal_hak_amil, 0),
    beras_metrics: {
      total_bruto_kg: berasBrutoKg,
      total_rekonsiliasi_kg: 0,
      total_neto_kg: berasBrutoKg,
      nominal_hak_amil_kg: berasBrutoKg * ((cfg?.beras_pct ?? 0) / 100),
    },
    coverage_debug: {
      pembayaran_zakat_count: pembayaranZakat.length,
      pemasukan_uang_count: pemasukanUang.length,
      pemasukan_beras_count: pemasukanBeras.length,
    },
  };
}

/**
 * Create an empty summary with all categories at 0.
 */
function createEmptySummary(): HakAmilSummary {
  const allCategories: HakAmilKategori[] = [
    'zakat_fitrah',
    'zakat_maal',
    'infak',
    'fidyah',
    'beras',
  ];

  return {
    categories: allCategories.map((kategori) => ({
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
