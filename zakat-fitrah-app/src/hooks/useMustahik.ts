import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Interfaces
export interface KategoriMustahik {
  id: string;
  nama: string;
  deskripsi: string;
  created_at: string;
}

export interface Mustahik {
  id: string;
  nama: string;
  alamat: string;
  kategori_id: string;
  jumlah_anggota: number;
  no_telp: string | null;
  catatan: string | null;
  is_active: boolean;
  is_data_lama: boolean;
  created_at: string;
  updated_at: string;
  kategori_mustahik?: KategoriMustahik;
  has_received?: boolean;
}

export interface MustahikListParams {
  search?: string;
  kategori_id?: string;
  status?: 'aktif' | 'non-aktif' | 'semua';
  page?: number;
  limit?: number;
}

export interface CreateMustahikInput {
  nama: string;
  alamat: string;
  kategori_id: string;
  jumlah_anggota: number;
  no_telp?: string;
  catatan?: string;
  is_active?: boolean;
}

export interface UpdateMustahikInput extends CreateMustahikInput {
  id: string;
}

export interface DistribusiHistory {
  id: string;
  tahun_zakat_id: string;
  jenis_distribusi: string;
  jumlah: number;
  tanggal_distribusi: string;
  tahun_zakat?: {
    tahun_hijriah: string;
    tahun_masehi: number;
  };
}

// Query: Fetch list mustahik with filters
export function useMustahikList(params: MustahikListParams) {
  return useQuery({
    queryKey: ['mustahik-list', params],
    queryFn: async () => {
      let query = supabase
        .from('mustahik')
        .select('*, kategori_mustahik(id, nama, deskripsi)', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Search filter
      if (params.search) {
        query = query.or(`nama.ilike.%${params.search}%,alamat.ilike.%${params.search}%`);
      }

      // Kategori filter
      if (params.kategori_id) {
        query = query.eq('kategori_id', params.kategori_id);
      }

      // Status filter
      if (params.status === 'aktif') {
        query = query.eq('is_active', true);
      } else if (params.status === 'non-aktif') {
        query = query.eq('is_active', false);
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

// Query: Fetch single mustahik details
export function useMustahikDetail(id: string | null) {
  return useQuery({
    queryKey: ['mustahik-detail', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('mustahik')
        .select('*, kategori_mustahik(id, nama, deskripsi)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Query: Fetch kategori mustahik (8 asnaf)
export function useKategoriMustahik() {
  return useQuery({
    queryKey: ['kategori-mustahik'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kategori_mustahik')
        .select('*')
        .order('nama', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Query: Fetch distribusi history for a mustahik
export function useMustahikHistory(mustahikId: string | null) {
  return useQuery({
    queryKey: ['mustahik-history', mustahikId],
    queryFn: async () => {
      if (!mustahikId) return [];

      const { data, error } = await supabase
        .from('distribusi_zakat')
        .select('id, tahun_zakat_id, jenis_distribusi, jumlah, tanggal_distribusi, tahun_zakat(tahun_hijriah, tahun_masehi)')
        .eq('mustahik_id', mustahikId)
        .order('tanggal_distribusi', { ascending: false });

      if (error) throw error;
      return data as DistribusiHistory[];
    },
    enabled: !!mustahikId,
  });
}

// Query: Fetch previous year mustahik for import
export function usePreviousYearMustahik(tahunMasehi: number) {
  return useQuery({
    queryKey: ['previous-year-mustahik', tahunMasehi],
    queryFn: async () => {
      // Get tahun_zakat for previous year
      const { data: tahunZakat, error: tahunError } = await supabase
        .from('tahun_zakat')
        .select('id')
        .eq('tahun_masehi', tahunMasehi - 1)
        .single();

      if (tahunError || !tahunZakat) return [];

      // Get mustahik who received distribution last year
      const { data, error } = await supabase
        .from('distribusi_zakat')
        .select('mustahik_id, mustahik(*, kategori_mustahik(nama))')
        .eq('tahun_zakat_id', (tahunZakat as any).id);

      if (error) throw error;

      // Extract unique mustahik
      const uniqueMustahik = new Map();
      data?.forEach((item: any) => {
        if (item.mustahik && !uniqueMustahik.has(item.mustahik.id)) {
          uniqueMustahik.set(item.mustahik.id, item.mustahik);
        }
      });

      return Array.from(uniqueMustahik.values());
    },
  });
}

// Mutation: Create mustahik
export function useCreateMustahik() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMustahikInput) => {
      const { data, error } = await (supabase
        .from('mustahik')
        .insert as any)({
          nama: input.nama,
          alamat: input.alamat,
          kategori_id: input.kategori_id,
          jumlah_anggota: input.jumlah_anggota,
          no_telp: input.no_telp || null,
          catatan: input.catatan || null,
          is_active: input.is_active ?? true,
          is_data_lama: false,
        }).select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mustahik-list'] });
      toast.success('Mustahik berhasil ditambahkan');
    },
    onError: (error: any) => {
      toast.error(`Gagal menambahkan mustahik: ${error.message}`);
    },
  });
}

// Mutation: Update mustahik
export function useUpdateMustahik() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMustahikInput) => {
      const { data, error } = await (supabase
        .from('mustahik')
        .update as any)({
          nama: input.nama,
          alamat: input.alamat,
          kategori_id: input.kategori_id,
          jumlah_anggota: input.jumlah_anggota,
          no_telp: input.no_telp || null,
          catatan: input.catatan || null,
          is_active: input.is_active ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mustahik-list'] });
      queryClient.invalidateQueries({ queryKey: ['mustahik-detail'] });
      toast.success('Mustahik berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(`Gagal memperbarui mustahik: ${error.message}`);
    },
  });
}

// Mutation: Toggle active status
export function useToggleMustahikActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await (supabase
        .from('mustahik')
        .update as any)({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mustahik-list'] });
      toast.success(
        variables.is_active ? 'Mustahik berhasil diaktifkan' : 'Mustahik berhasil dinonaktifkan'
      );
    },
    onError: (error: any) => {
      toast.error(`Gagal mengubah status: ${error.message}`);
    },
  });
}

// Mutation: Bulk activate/deactivate
export function useBulkToggleMustahik() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      const { data, error } = await (supabase
        .from('mustahik')
        .update as any)({ is_active, updated_at: new Date().toISOString() })
        .in('id', ids)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mustahik-list'] });
      toast.success(
        `${variables.ids.length} mustahik berhasil ${variables.is_active ? 'diaktifkan' : 'dinonaktifkan'}`
      );
    },
    onError: (error: any) => {
      toast.error(`Gagal mengubah status: ${error.message}`);
    },
  });
}

// Mutation: Import mustahik from previous year
export function useImportMustahik() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mustahikIds: string[]) => {
      // Fetch selected mustahik
      const { data: mustahikData, error: fetchError } = await supabase
        .from('mustahik')
        .select('nama, alamat, kategori_id, jumlah_anggota, no_telp, catatan')
        .in('id', mustahikIds);

      if (fetchError) throw fetchError;

      // Create new records with is_data_lama = true
      const newMustahik = mustahikData.map((m: any) => ({
        nama: m.nama,
        alamat: m.alamat,
        kategori_id: m.kategori_id,
        jumlah_anggota: m.jumlah_anggota,
        no_telp: m.no_telp,
        catatan: m.catatan,
        is_data_lama: true,
        is_active: true,
      }));

      const { data, error } = await (supabase
        .from('mustahik')
        .insert as any)(newMustahik)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mustahik-list'] });
      toast.success(`${data.length} mustahik berhasil diimpor dari tahun lalu`);
    },
    onError: (error: any) => {
      toast.error(`Gagal mengimpor mustahik: ${error.message}`);
    },
  });
}

// Mutation: Delete mustahik
export function useDeleteMustahik() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('mustahik')
        .delete as any)()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mustahik-list'] });
      toast.success('Mustahik berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(`Gagal menghapus mustahik: ${error.message}`);
    },
  });
}
