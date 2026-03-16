import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { offlineStore } from '@/lib/offlineStore';
import { isUuid } from '@/lib/utils';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';
// Interfaces
export interface Distribusi {
  id: string;
  mustahik_id: string;
  tahun_zakat_id: string;
  jenis_distribusi: 'beras' | 'uang';
  jumlah: number;
  tanggal_distribusi: string;
  status: 'pending' | 'selesai';
  catatan: string | null;
  created_at: string;
  updated_at: string;
  mustahik?: {
    id: string;
    nama: string;
    alamat: string;
    kategori_mustahik?: {
      nama: string;
    };
  };
  tahun_zakat?: {
    tahun_hijriah: string;
    tahun_masehi: number;
  };
}

type DistribusiRow = Distribusi & {
  jumlah?: number | null;
  jumlah_beras_kg?: number | null;
  jumlah_uang_rp?: number | null;
};

function resolveDistribusiJumlah(row: DistribusiRow): number {
  if (typeof row.jumlah === 'number') return row.jumlah;
  if (row.jenis_distribusi === 'beras') return Number(row.jumlah_beras_kg || 0);
  return Number(row.jumlah_uang_rp || 0);
}

function normalizeDistribusiRows(rows: DistribusiRow[]): Distribusi[] {
  return rows.map((row) => ({
    ...row,
    jumlah: resolveDistribusiJumlah(row),
  })) as Distribusi[];
}

export interface DistribusiListParams {
  tahun_zakat_id?: string;
  jenis_distribusi?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateDistribusiInput {
  mustahik_id: string;
  tahun_zakat_id: string;
  jenis_distribusi: 'beras' | 'uang';
  jumlah: number;
  tanggal_distribusi: string;
  catatan?: string;
}

export interface StokSummary {
  total_pemasukan_beras: number;
  total_pemasukan_uang: number;
  total_distribusi_beras: number;
  total_distribusi_uang: number;
  sisa_beras: number;
  sisa_uang: number;
}

// Query: Fetch list distribusi with filters
export function useDistribusiList(params: DistribusiListParams) {
  return useQuery({
    queryKey: ['distribusi-list', params],
    queryFn: async () => {
      if (OFFLINE_MODE) {
        const result = offlineStore.getDistribusiList(params);
        return { data: result.data, totalCount: result.count };
      }

      if (params.tahun_zakat_id && !isUuid(params.tahun_zakat_id)) {
        const result = offlineStore.getDistribusiList(params);
        return { data: result.data, totalCount: result.count };
      }

      let query = supabase
        .from('distribusi_zakat')
        .select(
          '*, mustahik(id, nama, alamat, kategori_mustahik(nama)), tahun_zakat(tahun_hijriah, tahun_masehi)',
          { count: 'exact' }
        )
        .order('tanggal_distribusi', { ascending: false });

      // Tahun filter
      if (params.tahun_zakat_id) {
        query = query.eq('tahun_zakat_id', params.tahun_zakat_id);
      }

      // Jenis distribusi filter
      if (params.jenis_distribusi && params.jenis_distribusi !== 'semua') {
        query = query.eq('jenis_distribusi', params.jenis_distribusi);
      }

      // Status filter
      if (params.status && params.status !== 'semua') {
        query = query.eq('status', params.status);
      }

      // Pagination
      const page = params.page || 1;
      const limit = params.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: normalizeDistribusiRows((data || []) as DistribusiRow[]),
        totalCount: count || 0,
      };
    },
  });
}

// Query: Fetch single distribusi details
export function useDistribusiDetail(id: string | null) {
  return useQuery({
    queryKey: ['distribusi-detail', id],
    queryFn: async () => {
      if (!id) return null;
      if (OFFLINE_MODE) return offlineStore.getDistribusiById(id) ?? null;

      const { data, error } = await supabase
        .from('distribusi_zakat')
        .select(
          '*, mustahik(id, nama, alamat, jumlah_anggota, kategori_mustahik(nama)), tahun_zakat(tahun_hijriah, tahun_masehi)'
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return normalizeDistribusiRows([data as DistribusiRow])[0];
    },
    enabled: !!id,
  });
}

// Query: Check stok availability for a tahun
export function useStokCheck(tahunZakatId: string | null) {
  return useQuery({
    queryKey: ['stok-check', tahunZakatId],
    queryFn: async (): Promise<StokSummary> => {
      if (!tahunZakatId) {
        return {
          total_pemasukan_beras: 0,
          total_pemasukan_uang: 0,
          total_distribusi_beras: 0,
          total_distribusi_uang: 0,
          sisa_beras: 0,
          sisa_uang: 0,
        };
      }
      if (OFFLINE_MODE) return offlineStore.getStokSummary(tahunZakatId);
      if (!isUuid(tahunZakatId)) return offlineStore.getStokSummary(tahunZakatId);

      const [
        { data: pembayaranData, error: pembayaranError },
        { data: pemasukanUangData, error: pemasukanUangError },
        { data: pemasukanBerasData, error: pemasukanBerasError },
      ] = await Promise.all([
        supabase
          .from('pembayaran_zakat')
          .select('jenis_zakat, jumlah_beras_kg, jumlah_uang_rp')
          .eq('tahun_zakat_id', tahunZakatId),
        supabase
          .from('pemasukan_uang')
          .select('jumlah_uang_rp')
          .eq('tahun_zakat_id', tahunZakatId),
        supabase
          .from('pemasukan_beras')
          .select('jumlah_beras_kg')
          .eq('tahun_zakat_id', tahunZakatId),
      ]);

      if (pembayaranError) throw pembayaranError;
      if (pemasukanUangError) {
        console.warn('Failed to read pemasukan_uang for stok summary, fallback to pembayaran_zakat only:', pemasukanUangError);
      }
      if (pemasukanBerasError) {
        console.warn('Failed to read pemasukan_beras for stok summary, fallback to pembayaran_zakat only:', pemasukanBerasError);
      }

      const totalBerasPembayaran = (pembayaranData as any)
        ?.filter((p: any) => p.jenis_zakat === 'beras')
        .reduce((sum: number, p: any) => sum + (p.jumlah_beras_kg || 0), 0) || 0;

      const totalUangPembayaran = (pembayaranData as any)
        ?.filter((p: any) => p.jenis_zakat === 'uang')
        .reduce((sum: number, p: any) => sum + (p.jumlah_uang_rp || 0), 0) || 0;

      const totalBerasPemasukanTambahan = (pemasukanBerasError ? [] : (pemasukanBerasData as any))
        ?.reduce((sum: number, p: any) => sum + (p.jumlah_beras_kg || 0), 0) || 0;

      const totalUangPemasukanTambahan = (pemasukanUangError ? [] : (pemasukanUangData as any))
        ?.reduce((sum: number, p: any) => sum + (p.jumlah_uang_rp || 0), 0) || 0;

      const totalBerasPemasukan = totalBerasPembayaran + totalBerasPemasukanTambahan;
      const totalUangPemasukan = totalUangPembayaran + totalUangPemasukanTambahan;

      // Get distribusi totals
      const { data: distribusiData, error: distribusiError } = await supabase
        .from('distribusi_zakat')
        .select('jenis_distribusi, jumlah_beras_kg, jumlah_uang_rp')
        .eq('tahun_zakat_id', tahunZakatId)
        .eq('status', 'selesai');

      if (distribusiError) throw distribusiError;

      const totalBerasDistribusi = (distribusiData as any)
        ?.filter((d: any) => d.jenis_distribusi === 'beras')
        .reduce((sum: number, d: any) => sum + Number(d.jumlah_beras_kg ?? d.jumlah ?? 0), 0) || 0;

      const totalUangDistribusi = (distribusiData as any)
        ?.filter((d: any) => d.jenis_distribusi === 'uang')
        .reduce((sum: number, d: any) => sum + Number(d.jumlah_uang_rp ?? d.jumlah ?? 0), 0) || 0;

      return {
        total_pemasukan_beras: totalBerasPemasukan,
        total_pemasukan_uang: totalUangPemasukan,
        total_distribusi_beras: totalBerasDistribusi,
        total_distribusi_uang: totalUangDistribusi,
        sisa_beras: totalBerasPemasukan - totalBerasDistribusi,
        sisa_uang: totalUangPemasukan - totalUangDistribusi,
      };
    },
    enabled: !!tahunZakatId,
  });
}

// Mutation: Create distribusi
export function useCreateDistribusi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDistribusiInput) => {
      if (OFFLINE_MODE || !isUuid(input.tahun_zakat_id)) {
        return offlineStore.addDistribusi({
          ...input,
          catatan: input.catatan ?? null,
          status: 'pending',
        }) as any;
      }
      // Prevent double distribution to the same mustahik in the same year
      const { data: existingDistribusi, error: existingError } = await supabase
        .from('distribusi_zakat')
        .select('id')
        .eq('mustahik_id', input.mustahik_id)
        .eq('tahun_zakat_id', input.tahun_zakat_id)
        .in('status', ['pending', 'selesai'])
        .limit(1);

      if (existingError) throw existingError;
      if (existingDistribusi && existingDistribusi.length > 0) {
        throw new Error('Mustahik ini sudah menerima zakat fitrah di tahun ini.');
      }

      // Check stock first
      const [
        { data: pembayaranData, error: pembayaranError },
        { data: pemasukanUangData, error: pemasukanUangError },
        { data: pemasukanBerasData, error: pemasukanBerasError },
        { data: distribusiData, error: distribusiError },
      ] = await Promise.all([
        supabase
          .from('pembayaran_zakat')
          .select('jenis_zakat, jumlah_beras_kg, jumlah_uang_rp')
          .eq('tahun_zakat_id', input.tahun_zakat_id),
        supabase
          .from('pemasukan_uang')
          .select('jumlah_uang_rp')
          .eq('tahun_zakat_id', input.tahun_zakat_id),
        supabase
          .from('pemasukan_beras')
          .select('jumlah_beras_kg')
          .eq('tahun_zakat_id', input.tahun_zakat_id),
        supabase
          .from('distribusi_zakat')
          .select('jenis_distribusi, jumlah_beras_kg, jumlah_uang_rp')
          .eq('tahun_zakat_id', input.tahun_zakat_id)
          .eq('status', 'selesai'),
      ]);

      if (pembayaranError) throw pembayaranError;
      if (pemasukanUangError) {
        console.warn('Failed to read pemasukan_uang for create distribusi stock check, fallback to pembayaran_zakat only:', pemasukanUangError);
      }
      if (pemasukanBerasError) {
        console.warn('Failed to read pemasukan_beras for create distribusi stock check, fallback to pembayaran_zakat only:', pemasukanBerasError);
      }
      if (distribusiError) throw distribusiError;

      const totalPemasukanBeras =
        ((pembayaranData as any)
          ?.filter((p: any) => p.jenis_zakat === 'beras')
          .reduce((s: number, p: any) => s + (p.jumlah_beras_kg || 0), 0) || 0) +
        ((pemasukanBerasError ? [] : (pemasukanBerasData as any))
          ?.reduce((s: number, p: any) => s + (p.jumlah_beras_kg || 0), 0) || 0);

      const totalPemasukanUang =
        ((pembayaranData as any)
          ?.filter((p: any) => p.jenis_zakat === 'uang')
          .reduce((s: number, p: any) => s + (p.jumlah_uang_rp || 0), 0) || 0) +
        ((pemasukanUangError ? [] : (pemasukanUangData as any))
          ?.reduce((s: number, p: any) => s + (p.jumlah_uang_rp || 0), 0) || 0);

      const totalPemasukan = input.jenis_distribusi === 'beras' ? totalPemasukanBeras : totalPemasukanUang;

      const totalDistribusi = input.jenis_distribusi === 'beras'
        ? (distribusiData as any)?.filter((d: any) => d.jenis_distribusi === 'beras').reduce((s: number, d: any) => s + Number(d.jumlah_beras_kg ?? d.jumlah ?? 0), 0) || 0
        : (distribusiData as any)?.filter((d: any) => d.jenis_distribusi === 'uang').reduce((s: number, d: any) => s + Number(d.jumlah_uang_rp ?? d.jumlah ?? 0), 0) || 0;

      const sisaStok = totalPemasukan - totalDistribusi;

      if (input.jumlah > sisaStok) {
        throw new Error(
          `Stok tidak mencukupi! Sisa stok: ${sisaStok.toFixed(2)} ${input.jenis_distribusi === 'beras' ? 'kg' : 'Rp'}`
        );
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const legacyPayload = {
        mustahik_id: input.mustahik_id,
        tahun_zakat_id: input.tahun_zakat_id,
        jenis_distribusi: input.jenis_distribusi,
        jumlah: input.jumlah,
        jumlah_beras_kg: input.jenis_distribusi === 'beras' ? input.jumlah : null,
        jumlah_uang_rp: input.jenis_distribusi === 'uang' ? input.jumlah : null,
        tanggal_distribusi: input.tanggal_distribusi,
        catatan: input.catatan || null,
        status: 'pending',
        petugas_distribusi: user.id,
        created_by: user.id,
      };

      const modernPayload = {
        mustahik_id: input.mustahik_id,
        tahun_zakat_id: input.tahun_zakat_id,
        jenis_distribusi: input.jenis_distribusi,
        jumlah_beras_kg: input.jenis_distribusi === 'beras' ? input.jumlah : null,
        jumlah_uang_rp: input.jenis_distribusi === 'uang' ? input.jumlah : null,
        tanggal_distribusi: input.tanggal_distribusi,
        catatan: input.catatan || null,
        status: 'pending',
        petugas_distribusi: user.id,
        created_by: user.id,
      };

      let data: unknown;
      let error: unknown;

      ({ data, error } = await (supabase.from('distribusi_zakat').insert as any)(legacyPayload).select());

      if (error && String((error as { message?: string }).message || '').toLowerCase().includes('jumlah')) {
        ({ data, error } = await (supabase.from('distribusi_zakat').insert as any)(modernPayload).select());
      }

      if (error) throw error;
      return normalizeDistribusiRows((data || []) as DistribusiRow[]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribusi-list'] });
      queryClient.invalidateQueries({ queryKey: ['stok-check'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Distribusi berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menambahkan distribusi');
    },
  });
}

// Mutation: Update distribusi status
export function useUpdateDistribusiStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'selesai' }) => {
      if (OFFLINE_MODE) return offlineStore.updateDistribusiStatus(id, status) as any;

      if (status === 'selesai') {
        const { data: targetRaw, error: targetError } = await supabase
          .from('distribusi_zakat')
          .select('id, tahun_zakat_id, jenis_distribusi, jumlah, jumlah_beras_kg, jumlah_uang_rp')
          .eq('id', id)
          .single();

        if (targetError) throw targetError;
        const target = targetRaw as {
          id: string;
          tahun_zakat_id: string;
          jenis_distribusi: 'beras' | 'uang';
          jumlah?: number | null;
          jumlah_beras_kg?: number | null;
          jumlah_uang_rp?: number | null;
        } | null;
        if (!target) {
          throw new Error('Data distribusi tidak ditemukan');
        }

        const targetAmount = resolveDistribusiJumlah(target as DistribusiRow);

        const [
          { data: pembayaranData, error: pembayaranError },
          { data: pemasukanUangData, error: pemasukanUangError },
          { data: pemasukanBerasData, error: pemasukanBerasError },
          { data: distribusiData, error: distribusiError },
        ] = await Promise.all([
          supabase
            .from('pembayaran_zakat')
            .select('jenis_zakat, jumlah_beras_kg, jumlah_uang_rp')
            .eq('tahun_zakat_id', target.tahun_zakat_id),
          supabase
            .from('pemasukan_uang')
            .select('jumlah_uang_rp')
            .eq('tahun_zakat_id', target.tahun_zakat_id),
          supabase
            .from('pemasukan_beras')
            .select('jumlah_beras_kg')
            .eq('tahun_zakat_id', target.tahun_zakat_id),
          supabase
            .from('distribusi_zakat')
            .select('id, jenis_distribusi, jumlah, jumlah_beras_kg, jumlah_uang_rp')
            .eq('tahun_zakat_id', target.tahun_zakat_id)
            .eq('status', 'selesai'),
        ]);

        if (pembayaranError) throw pembayaranError;
        if (pemasukanUangError) {
          console.warn('Failed to read pemasukan_uang for update distribusi stock check, fallback to pembayaran_zakat only:', pemasukanUangError);
        }
        if (pemasukanBerasError) {
          console.warn('Failed to read pemasukan_beras for update distribusi stock check, fallback to pembayaran_zakat only:', pemasukanBerasError);
        }
        if (distribusiError) throw distribusiError;

        const totalPemasukanBeras =
          ((pembayaranData as any)
            ?.filter((p: any) => p.jenis_zakat === 'beras')
            .reduce((s: number, p: any) => s + (p.jumlah_beras_kg || 0), 0) || 0) +
          ((pemasukanBerasError ? [] : (pemasukanBerasData as any))
            ?.reduce((s: number, p: any) => s + (p.jumlah_beras_kg || 0), 0) || 0);

        const totalPemasukanUang =
          ((pembayaranData as any)
            ?.filter((p: any) => p.jenis_zakat === 'uang')
            .reduce((s: number, p: any) => s + (p.jumlah_uang_rp || 0), 0) || 0) +
          ((pemasukanUangError ? [] : (pemasukanUangData as any))
            ?.reduce((s: number, p: any) => s + (p.jumlah_uang_rp || 0), 0) || 0);

        const totalDistribusiBeras = (distribusiData as any)
          ?.filter((d: any) => d.jenis_distribusi === 'beras' && d.id !== id)
          .reduce((s: number, d: any) => s + Number(d.jumlah_beras_kg ?? d.jumlah ?? 0), 0) || 0;

        const totalDistribusiUang = (distribusiData as any)
          ?.filter((d: any) => d.jenis_distribusi === 'uang' && d.id !== id)
          .reduce((s: number, d: any) => s + Number(d.jumlah_uang_rp ?? d.jumlah ?? 0), 0) || 0;

        const sisa = target.jenis_distribusi === 'beras'
          ? totalPemasukanBeras - totalDistribusiBeras
          : totalPemasukanUang - totalDistribusiUang;

        if (targetAmount > sisa) {
          throw new Error(
            `Stok tidak mencukupi untuk menandai selesai. Sisa stok saat ini: ${sisa.toFixed(2)} ${target.jenis_distribusi === 'beras' ? 'kg' : 'Rp'}`
          );
        }
      }

      const { data, error } = await (supabase
        .from('distribusi_zakat')
        .update as any)({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return normalizeDistribusiRows((data || []) as DistribusiRow[]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['distribusi-list'] });
      queryClient.invalidateQueries({ queryKey: ['stok-check'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(
        variables.status === 'selesai'
          ? 'Distribusi ditandai selesai'
          : 'Status distribusi diperbarui'
      );
    },
    onError: (error: any) => {
      toast.error(`Gagal memperbarui status: ${error.message}`);
    },
  });
}

// Mutation: Delete distribusi
export function useDeleteDistribusi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (OFFLINE_MODE) { offlineStore.deleteDistribusi(id); return; }
      const { error } = await supabase
        .from('distribusi_zakat')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribusi-list'] });
      queryClient.invalidateQueries({ queryKey: ['stok-check'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Distribusi berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus distribusi: ${error.message}`);
    },
  });
}
