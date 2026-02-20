import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type {
  HakAmilConfig,
  HakAmilSnapshot,
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
}

// =========================================
// QUERY: Get Hak Amil Config by Tahun Zakat
// =========================================

export function useHakAmilConfig(tahunZakatId?: string) {
  return useQuery({
    queryKey: ['hak-amil-config', tahunZakatId],
    queryFn: async (): Promise<HakAmilConfig | null> => {
      if (!tahunZakatId) {
        return null;
      }

      const { data, error } = await supabase
        .from('hak_amil_configs')
        .select('*')
        .eq('tahun_zakat_id', tahunZakatId)
        .maybeSingle();

      if (error) throw error;
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

      // Format dates for SQL query
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

      const { data: snapshots, error } = await supabase
        .from('hak_amil_snapshots')
        .select('*')
        .eq('tahun_zakat_id', tahunZakatId)
        .gte('tanggal', startDate)
        .lte('tanggal', endDate);

      if (error) throw error;

      return aggregateSnapshots(snapshots || []);
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

      const { data: snapshots, error } = await supabase
        .from('hak_amil_snapshots')
        .select('*')
        .eq('tahun_zakat_id', tahunZakatId);

      if (error) throw error;

      return aggregateSnapshots(snapshots || []);
    },
    enabled: !!tahunZakatId,
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

/**
 * Aggregate snapshots by kategori and calculate totals.
 * Ensures fidyah and beras categories always appear with 0% and 0 nominal.
 */
function aggregateSnapshots(snapshots: HakAmilSnapshot[]): HakAmilSummary {
  // Define all categories to ensure all are present
  const allCategories: HakAmilKategori[] = [
    'zakat_fitrah',
    'zakat_maal',
    'infak',
    'fidyah',
    'beras',
  ];

  // Group snapshots by kategori
  const categoryMap = new Map<HakAmilKategori, HakAmilSnapshot[]>();
  allCategories.forEach((kat) => categoryMap.set(kat, []));

  snapshots.forEach((snapshot) => {
    const existing = categoryMap.get(snapshot.kategori) || [];
    categoryMap.set(snapshot.kategori, [...existing, snapshot]);
  });

  // Aggregate each category
  const categories: HakAmilKategoriSummary[] = allCategories.map((kategori) => {
    const categorySnapshots = categoryMap.get(kategori) || [];

    if (categorySnapshots.length === 0) {
      // For categories with no data, return zeros
      return {
        kategori,
        total_bruto: 0,
        total_rekonsiliasi: 0,
        total_neto: 0,
        persen_hak_amil: 0,
        nominal_hak_amil: 0,
      };
    }

    // Sum all values for this category
    const summary = categorySnapshots.reduce(
      (acc, snap) => ({
        total_bruto: acc.total_bruto + Number(snap.total_bruto),
        total_rekonsiliasi: acc.total_rekonsiliasi + Number(snap.total_rekonsiliasi),
        total_neto: acc.total_neto + Number(snap.total_neto),
        nominal_hak_amil: acc.nominal_hak_amil + Number(snap.nominal_hak_amil),
      }),
      {
        total_bruto: 0,
        total_rekonsiliasi: 0,
        total_neto: 0,
        nominal_hak_amil: 0,
      }
    );

    // Get average percentage (should be consistent within category)
    const avgPersen =
      categorySnapshots.reduce((sum, snap) => sum + Number(snap.persen_hak_amil), 0) /
      categorySnapshots.length;

    return {
      kategori,
      total_bruto: summary.total_bruto,
      total_rekonsiliasi: summary.total_rekonsiliasi,
      total_neto: summary.total_neto,
      persen_hak_amil: avgPersen,
      nominal_hak_amil: summary.nominal_hak_amil,
    };
  });

  // Calculate grand totals
  const grandTotals = categories.reduce(
    (acc, cat) => ({
      grand_total_bruto: acc.grand_total_bruto + cat.total_bruto,
      grand_total_rekonsiliasi: acc.grand_total_rekonsiliasi + cat.total_rekonsiliasi,
      grand_total_neto: acc.grand_total_neto + cat.total_neto,
      grand_total_hak_amil: acc.grand_total_hak_amil + cat.nominal_hak_amil,
    }),
    {
      grand_total_bruto: 0,
      grand_total_rekonsiliasi: 0,
      grand_total_neto: 0,
      grand_total_hak_amil: 0,
    }
  );

  return {
    categories,
    ...grandTotals,
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
  };
}
