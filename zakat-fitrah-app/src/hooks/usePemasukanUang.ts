import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  createHakAmilSnapshot,
  fetchBasisModeForTahun,
  mapKategoriToHakAmil,
} from '@/lib/hakAmilSnapshot';

export type PemasukanUangKategori =
  | 'zakat_fitrah_uang'
  | 'fidyah_uang'
  | 'maal_penghasilan_uang'
  | 'infak_sedekah_uang';

export type AkunUang = 'kas' | 'bank';

export interface PemasukanUang {
  id: string;
  tahun_zakat_id: string;
  muzakki_id: string | null;
  muzakki?: { id: string; nama_kk: string } | null;
  kategori: PemasukanUangKategori;
  akun: AkunUang;
  jumlah_uang_rp: number;
  tanggal: string;
  catatan: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface PemasukanUangListParams {
  tahunZakatId?: string;
  kategori?: PemasukanUangKategori | 'semua';
  akun?: AkunUang | 'semua';
  page?: number;
  pageSize?: number;
}

interface CreatePemasukanInput {
  tahun_zakat_id: string;
  muzakki_id?: string;
  kategori: PemasukanUangKategori;
  akun: AkunUang;
  jumlah_uang_rp: number;
  tanggal: string;
  catatan?: string;
}

export function usePemasukanUangList(params: PemasukanUangListParams) {
  return useQuery({
    queryKey: ['pemasukan-uang', params],
    queryFn: async (): Promise<{ data: PemasukanUang[]; count: number }> => {
      if (!params.tahunZakatId) {
        return { data: [], count: 0 };
      }

      let query = supabase
        .from('pemasukan_uang')
        .select(
          `*, muzakki:muzakki_id(id, nama_kk)`,
          { count: 'exact' }
        )
        .eq('tahun_zakat_id', params.tahunZakatId)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      if (params.kategori && params.kategori !== 'semua') {
        query = query.eq('kategori', params.kategori);
      }

      if (params.akun && params.akun !== 'semua') {
        query = query.eq('akun', params.akun);
      }

      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data || []) as unknown as PemasukanUang[],
        count: count || 0,
      };
    },
  });
}

interface UpdatePemasukanInput extends CreatePemasukanInput {
  id: string;
}

export function useCreatePemasukanUang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePemasukanInput) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      if (!userId) {
        throw new Error('User tidak terautentikasi');
      }

      const payload = {
        ...input,
        muzakki_id: input.muzakki_id || null,
        catatan: input.catatan || null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase.from('pemasukan_uang').insert as any)(payload)
        .select('*')
        .single();

      if (error) throw error;

      // Create hak amil snapshot for this transaction
      const hakAmilKategori = mapKategoriToHakAmil(input.kategori);
      if (hakAmilKategori && data?.id) {
        try {
          const basisMode = await fetchBasisModeForTahun(input.tahun_zakat_id);
          await createHakAmilSnapshot({
            tahunZakatId: input.tahun_zakat_id,
            kategori: hakAmilKategori,
            tanggal: input.tanggal,
            grossAmount: input.jumlah_uang_rp,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_uang',
            sourceId: data.id,
            catatan: input.catatan,
            createdBy: userId,
          });
        } catch (snapshotError) {
          console.error('Failed to create hak amil snapshot:', snapshotError);
          // Don't fail the entire transaction if snapshot fails
        }
      }

      return data as PemasukanUang;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-uang'] });
      toast.success('Pemasukan uang berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menyimpan pemasukan: ${error.message}`);
    },
  });
}

export function useUpdatePemasukanUang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePemasukanInput) => {
      const { id, ...updateData } = input;
      const payload = {
        ...updateData,
        muzakki_id: updateData.muzakki_id || null,
        catatan: updateData.catatan || null,
        updated_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase
        .from('pemasukan_uang')
        .update as any)(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data as PemasukanUang;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-uang'] });
      toast.success('Pemasukan uang berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui pemasukan: ${error.message}`);
    },
  });
}

export function useDeletePemasukanUang() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pemasukan_uang')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-uang'] });
      toast.success('Pemasukan uang berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus pemasukan: ${error.message}`);
    },
  });
}
