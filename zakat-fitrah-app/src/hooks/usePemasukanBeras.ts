import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  createHakAmilSnapshot,
  fetchBasisModeForTahun,
  mapKategoriToHakAmil,
} from '@/lib/hakAmilSnapshot';

export type PemasukanBerasKategori =
  | 'fidyah_beras'
  | 'infak_sedekah_beras'
  | 'zakat_fitrah_beras';

export interface PemasukanBeras {
  id: string;
  tahun_zakat_id: string;
  muzakki_id: string | null;
  muzakki?: { id: string; nama_kk: string } | null;
  kategori: PemasukanBerasKategori;
  jumlah_beras_kg: number;
  tanggal: string;
  catatan: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface PemasukanBerasListParams {
  tahunZakatId?: string;
  kategori?: PemasukanBerasKategori | 'semua';
  page?: number;
  pageSize?: number;
}

interface CreatePemasukanInput {
  tahun_zakat_id: string;
  muzakki_id?: string;
  kategori: PemasukanBerasKategori;
  jumlah_beras_kg: number;
  tanggal: string;
  catatan?: string;
}

export function usePemasukanBerasList(params: PemasukanBerasListParams) {
  return useQuery({
    queryKey: ['pemasukan-beras', params],
    queryFn: async (): Promise<{ data: PemasukanBeras[]; count: number }> => {
      if (!params.tahunZakatId) {
        return { data: [], count: 0 };
      }

      let query = supabase
        .from('pemasukan_beras')
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

      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data || []) as unknown as PemasukanBeras[],
        count: count || 0,
      };
    },
  });
}

export function useCreatePemasukanBeras() {
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('pemasukan_beras').insert as any)(payload)
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
            grossAmount: input.jumlah_beras_kg,
            reconciliationAmount: 0,
            basisMode,
            sourceType: 'pemasukan_beras',
            sourceId: data.id,
            catatan: input.catatan,
            createdBy: userId,
          });
        } catch (snapshotError) {
          console.error('Failed to create hak amil snapshot:', snapshotError);
          // Don't fail the entire transaction if snapshot fails
        }
      }

      return data as PemasukanBeras;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pemasukan-beras'] });
      toast.success('Pemasukan beras berhasil disimpan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menyimpan pemasukan: ${error.message}`);
    },
  });
}
