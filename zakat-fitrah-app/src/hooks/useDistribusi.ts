import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
        data: data || [],
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

      const { data, error } = await supabase
        .from('distribusi_zakat')
        .select(
          '*, mustahik(id, nama, alamat, jumlah_anggota, kategori_mustahik(nama)), tahun_zakat(tahun_hijriah, tahun_masehi)'
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
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

      // Get pemasukan totals
      const { data: pemasukanData, error: pemasukanError } = await supabase
        .from('pembayaran_zakat')
        .select('jenis_zakat, jumlah_beras_kg, jumlah_uang_rp')
        .eq('tahun_zakat_id', tahunZakatId);

      if (pemasukanError) throw pemasukanError;

      const totalBerasPemasukan = (pemasukanData as any)
        ?.filter((p: any) => p.jenis_zakat === 'beras')
        .reduce((sum: number, p: any) => sum + (p.jumlah_beras_kg || 0), 0) || 0;

      const totalUangPemasukan = (pemasukanData as any)
        ?.filter((p: any) => p.jenis_zakat === 'uang')
        .reduce((sum: number, p: any) => sum + (p.jumlah_uang_rp || 0), 0) || 0;

      // Get distribusi totals
      const { data: distribusiData, error: distribusiError } = await supabase
        .from('distribusi_zakat')
        .select('jenis_distribusi, jumlah')
        .eq('tahun_zakat_id', tahunZakatId)
        .eq('status', 'selesai');

      if (distribusiError) throw distribusiError;

      const totalBerasDistribusi = (distribusiData as any)
        ?.filter((d: any) => d.jenis_distribusi === 'beras')
        .reduce((sum: number, d: any) => sum + (d.jumlah || 0), 0) || 0;

      const totalUangDistribusi = (distribusiData as any)
        ?.filter((d: any) => d.jenis_distribusi === 'uang')
        .reduce((sum: number, d: any) => sum + (d.jumlah || 0), 0) || 0;

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
      const { data: stokData } = await supabase
        .from('pembayaran_zakat')
        .select('jenis_zakat, jumlah_beras_kg, jumlah_uang_rp')
        .eq('tahun_zakat_id', input.tahun_zakat_id);

      const { data: distribusiData } = await supabase
        .from('distribusi_zakat')
        .select('jenis_distribusi, jumlah')
        .eq('tahun_zakat_id', input.tahun_zakat_id)
        .eq('status', 'selesai');

      const totalPemasukan = input.jenis_distribusi === 'beras'
        ? (stokData as any)?.filter((p: any) => p.jenis_zakat === 'beras').reduce((s: number, p: any) => s + (p.jumlah_beras_kg || 0), 0) || 0
        : (stokData as any)?.filter((p: any) => p.jenis_zakat === 'uang').reduce((s: number, p: any) => s + (p.jumlah_uang_rp || 0), 0) || 0;

      const totalDistribusi = input.jenis_distribusi === 'beras'
        ? (distribusiData as any)?.filter((d: any) => d.jenis_distribusi === 'beras').reduce((s: number, d: any) => s + (d.jumlah || 0), 0) || 0
        : (distribusiData as any)?.filter((d: any) => d.jenis_distribusi === 'uang').reduce((s: number, d: any) => s + (d.jumlah || 0), 0) || 0;

      const sisaStok = totalPemasukan - totalDistribusi;

      if (input.jumlah > sisaStok) {
        throw new Error(
          `Stok tidak mencukupi! Sisa stok: ${sisaStok.toFixed(2)} ${input.jenis_distribusi === 'beras' ? 'kg' : 'Rp'}`
        );
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await (supabase
        .from('distribusi_zakat')
        .insert as any)({
          mustahik_id: input.mustahik_id,
          tahun_zakat_id: input.tahun_zakat_id,
          jenis_distribusi: input.jenis_distribusi,
          jumlah: input.jumlah, // Legacy column (NOT NULL in prod)
          jumlah_beras_kg: input.jenis_distribusi === 'beras' ? input.jumlah : null,
          jumlah_uang_rp: input.jenis_distribusi === 'uang' ? input.jumlah : null,
          tanggal_distribusi: input.tanggal_distribusi,
          catatan: input.catatan || null,
          status: 'pending',
          petugas_distribusi: user.id,
          created_by: user.id,
        })
        .select();

      if (error) throw error;
      return data;
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
      const { data, error } = await (supabase
        .from('distribusi_zakat')
        .update as any)({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
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
