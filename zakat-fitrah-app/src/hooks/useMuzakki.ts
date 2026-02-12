import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface MuzakkiRecord {
  id: string;
  nama_kk: string;
  alamat: string;
  no_telp: string | null;
}

interface TahunZakatRecord {
  id: string;
  nilai_beras_kg: number;
  nilai_uang_rp: number;
}

interface Muzakki {
  id: string;
  nama_kk: string;
  alamat: string;
  no_telp: string | null;
}

interface PembayaranZakat {
  id: string;
  muzakki_id: string;
  muzakki: Muzakki;
  tahun_zakat_id: string;
  tanggal_bayar: string;
  jumlah_jiwa: number;
  jenis_zakat: 'beras' | 'uang';
  jumlah_beras_kg: number | null;
  jumlah_uang_rp: number | null;
  akun_uang?: 'kas' | 'bank' | null;
  jumlah_uang_dibayar_rp?: number | null;
  created_at: string;
  updated_at: string;
  sedekah_uang?: number | null;
  sedekah_beras?: number | null;
}

interface PembayaranListParams {
  search?: string;
  jenisZakat?: string;
  tahunZakatId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreatePembayaranInput {
  nama_kk: string;
  alamat: string;
  no_telp?: string;
  jumlah_jiwa: number;
  jenis_zakat: 'beras' | 'uang';
  tanggal_bayar: string;
  tahun_zakat_id: string;
  akun_uang?: 'kas' | 'bank';
  jumlah_uang_dibayar_rp?: number;
  jumlah_beras_dibayar_kg?: number;
  has_overpayment?: boolean;
  zakat_amount?: number;
  sedekah_amount?: number;
}

interface UpdatePembayaranInput extends CreatePembayaranInput {
  id: string;
  muzakki_id: string;
}

// Helper function to check if payment should be split
function shouldSplitPayment(input: CreatePembayaranInput): boolean {
  return input.has_overpayment === true && 
         (input.zakat_amount !== undefined) && 
         (input.sedekah_amount !== undefined) &&
         input.sedekah_amount > 0;
}

// Helper function to calculate payment split
function calculatePaymentSplit(
  input: CreatePembayaranInput,
  nilaiPerJiwa: number
): { zakatAmount: number; sedekahAmount: number } {
  const requiredAmount = input.jumlah_jiwa * nilaiPerJiwa;
  const paidAmount = input.jenis_zakat === 'beras'
    ? (input.jumlah_beras_dibayar_kg || 0)
    : (input.jumlah_uang_dibayar_rp || 0);

  if (paidAmount > requiredAmount) {
    return {
      zakatAmount: requiredAmount,
      sedekahAmount: paidAmount - requiredAmount,
    };
  }

  return {
    zakatAmount: paidAmount,
    sedekahAmount: 0,
  };
}

// Fetch list pembayaran with filters, search, and pagination
export function usePembayaranList(params: PembayaranListParams) {
  return useQuery({
    queryKey: ['pembayaran-list', params],
    queryFn: async (): Promise<{ data: PembayaranZakat[]; count: number }> => {
      let query = supabase
        .from('pembayaran_zakat')
        .select(
          `
          *,
          muzakki:muzakki_id (
            id,
            nama_kk,
            alamat,
            no_telp
          )
        `,
          { count: 'exact' }
        );

      // Filter by tahun_zakat_id
      if (params.tahunZakatId) {
        query = query.eq('tahun_zakat_id', params.tahunZakatId);
      }

      // Filter by jenis_zakat
      if (params.jenisZakat && params.jenisZakat !== 'semua') {
        query = query.eq('jenis_zakat', params.jenisZakat);
      }

      // Search by nama or alamat
      if (params.search) {
        // First, get matching muzakki IDs
        const { data: matchingMuzakki } = await supabase
          .from('muzakki')
          .select('id')
          .or(`nama_kk.ilike.%${params.search}%,alamat.ilike.%${params.search}%`);

        if (matchingMuzakki && matchingMuzakki.length > 0) {
          const muzakkiIds = matchingMuzakki.map((m: any) => m.id);
          query = query.in('muzakki_id', muzakkiIds);
        } else {
          // No matching muzakki found, return empty result
          query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
        }
      }

      // Sorting
      const sortBy = params.sortBy || 'tanggal_bayar';
      const sortOrder = params.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch related sedekah records
      const pembayaranWithSedekah = await Promise.all(
        (data || []).map(async (pembayaran: any) => {
          const tanggalBayar = new Date(pembayaran.tanggal_bayar).toISOString().split('T')[0];
          const namaKk = pembayaran.muzakki?.nama_kk || '';

          // Query pemasukan_uang for sedekah (jenis_zakat = 'uang')
          let sedekahUang = null;
          if (namaKk) {
            const { data: pemasukanUang } = await supabase
              .from('pemasukan_uang')
              .select('jumlah_uang_rp')
              .eq('muzakki_id', pembayaran.muzakki_id)
              .eq('kategori', 'infak_sedekah_uang')
              .gte('tanggal', tanggalBayar)
              .lte('tanggal', tanggalBayar)
              .ilike('catatan', `%Kelebihan pembayaran dari ${namaKk}%`)
              .maybeSingle();
            
            sedekahUang = (pemasukanUang as any)?.jumlah_uang_rp || null;
          }

          // Query pemasukan_beras for sedekah (jenis_zakat = 'beras')
          let sedekahBeras = null;
          if (namaKk) {
            const { data: pemasukanBeras } = await supabase
              .from('pemasukan_beras')
              .select('jumlah_beras_kg')
              .eq('muzakki_id', pembayaran.muzakki_id)
              .eq('kategori', 'infak_sedekah_beras')
              .gte('tanggal', tanggalBayar)
              .lte('tanggal', tanggalBayar)
              .ilike('catatan', `%Kelebihan pembayaran dari ${namaKk}%`)
              .maybeSingle();
            
            sedekahBeras = (pemasukanBeras as any)?.jumlah_beras_kg || null;
          }

          return {
            ...pembayaran,
            sedekah_uang: sedekahUang,
            sedekah_beras: sedekahBeras,
          };
        })
      );

      return {
        data: pembayaranWithSedekah as unknown as PembayaranZakat[],
        count: count || 0,
      };
    },
  });
}

// Create new pembayaran (with muzakki)
export function useCreatePembayaran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePembayaranInput) => {
      // First, check if muzakki exists by nama_kk
      const { data: existingMuzakki } = await supabase
        .from('muzakki')
        .select('id')
        .eq('nama_kk', input.nama_kk)
        .maybeSingle();

      let muzakkiId: string;

      if (existingMuzakki) {
        // Use existing muzakki, but update alamat and no_telp
        muzakkiId = (existingMuzakki as MuzakkiRecord).id;
        await (supabase.from('muzakki').update as any)({
          alamat: input.alamat,
          no_telp: input.no_telp || null,
          updated_at: new Date().toISOString(),
        }).eq('id', muzakkiId);
      } else {
        // Create new muzakki
        const { data: newMuzakki, error: muzakkiError } = await (supabase.from('muzakki').insert as any)({
          nama_kk: input.nama_kk,
          alamat: input.alamat,
          no_telp: input.no_telp || null,
        }).select().single();

        if (muzakkiError) throw muzakkiError;
        muzakkiId = (newMuzakki as MuzakkiRecord).id;
      }

      // Get nilai per orang from active tahun_zakat
      const { data: tahunZakat, error: tahunError } = await supabase
        .from('tahun_zakat')
        .select('nilai_beras_kg, nilai_uang_rp')
        .eq('id', input.tahun_zakat_id)
        .single();

      if (tahunError) throw tahunError;

      const typedTahunZakat = tahunZakat as TahunZakatRecord;

      // Calculate total (for beras) or use actual amount received (for uang)
      const totalBerasKg =
        input.jenis_zakat === 'beras'
          ? input.jumlah_beras_dibayar_kg ?? (input.jumlah_jiwa * typedTahunZakat.nilai_beras_kg)
          : null;
      
      // For uang: store actual amount received, not calculated kewajiban
      // nilai_uang_rp is only used as reference/suggestion
      const totalUangRp =
        input.jenis_zakat === 'uang'
          ? input.jumlah_uang_dibayar_rp ?? (input.jumlah_jiwa * typedTahunZakat.nilai_uang_rp)
          : null;

      const akunUang = input.jenis_zakat === 'uang' ? input.akun_uang || null : null;
      const jumlahUangDibayar =
        input.jenis_zakat === 'uang'
          ? input.jumlah_uang_dibayar_rp ?? totalUangRp ?? 0
          : null;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if payment should be split
      const needsSplit = shouldSplitPayment(input);

      if (needsSplit) {
        // Handle split payment with transaction
        const split = calculatePaymentSplit(
          input,
          input.jenis_zakat === 'beras' ? typedTahunZakat.nilai_beras_kg : typedTahunZakat.nilai_uang_rp
        );

        try {
          if (input.jenis_zakat === 'uang') {
            // Create zakat payment record
            const { data: zakatData, error: zakatError } = await (supabase.from('pembayaran_zakat').insert as any)({
              muzakki_id: muzakkiId,
              tahun_zakat_id: input.tahun_zakat_id,
              tanggal_bayar: input.tanggal_bayar,
              jumlah_jiwa: input.jumlah_jiwa,
              jenis_zakat: 'uang',
              nilai_per_orang: typedTahunZakat.nilai_uang_rp,
              total_zakat: split.zakatAmount,
              jumlah_beras_kg: null,
              jumlah_uang_rp: split.zakatAmount,
              akun_uang: akunUang,
              jumlah_uang_dibayar_rp: split.zakatAmount,
              petugas_penerima: user.id,
              created_by: user.id,
            }).select().single();

            if (zakatError) throw zakatError;

            // Create sedekah/infak record in pemasukan_uang
            const { error: sedekahError } = await (supabase.from('pemasukan_uang').insert as any)({
              tahun_zakat_id: input.tahun_zakat_id,
              muzakki_id: muzakkiId,
              kategori: 'infak_sedekah_uang',
              akun: akunUang,
              jumlah_uang_rp: split.sedekahAmount,
              tanggal: input.tanggal_bayar,
              catatan: `Kelebihan pembayaran dari ${input.nama_kk}`,
              created_by: user.id,
            });

            if (sedekahError) throw sedekahError;

            return zakatData;
          } else {
            // Beras payment split
            // Create zakat payment record
            const { data: zakatData, error: zakatError } = await (supabase.from('pembayaran_zakat').insert as any)({
              muzakki_id: muzakkiId,
              tahun_zakat_id: input.tahun_zakat_id,
              tanggal_bayar: input.tanggal_bayar,
              jumlah_jiwa: input.jumlah_jiwa,
              jenis_zakat: 'beras',
              nilai_per_orang: typedTahunZakat.nilai_beras_kg,
              total_zakat: split.zakatAmount,
              jumlah_beras_kg: split.zakatAmount,
              jumlah_uang_rp: null,
              akun_uang: null,
              jumlah_uang_dibayar_rp: null,
              petugas_penerima: user.id,
              created_by: user.id,
            }).select().single();

            if (zakatError) throw zakatError;

            // Create sedekah beras record in pemasukan_beras
            const { error: sedekahError } = await (supabase.from('pemasukan_beras').insert as any)({
              tahun_zakat_id: input.tahun_zakat_id,
              muzakki_id: muzakkiId,
              kategori: 'infak_sedekah_beras',
              jumlah_beras_kg: split.sedekahAmount,
              tanggal: input.tanggal_bayar,
              catatan: `Kelebihan pembayaran dari ${input.nama_kk}`,
              created_by: user.id,
            });

            if (sedekahError) throw sedekahError;

            return zakatData;
          }
        } catch (error) {
          // Transaction failed, log and throw detailed error
          console.error('Split payment transaction error:', error);
          const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
          throw new Error(`Transaksi gagal: ${errorMessage}`);
        }
      } else {
        // Normal payment without split
        const { data, error } = await (supabase.from('pembayaran_zakat').insert as any)({
          muzakki_id: muzakkiId,
          tahun_zakat_id: input.tahun_zakat_id,
          tanggal_bayar: input.tanggal_bayar,
          jumlah_jiwa: input.jumlah_jiwa,
          jenis_zakat: input.jenis_zakat,
          jumlah_beras_kg: totalBerasKg,
          jumlah_uang_rp: totalUangRp,
          akun_uang: akunUang,
          jumlah_uang_dibayar_rp: jumlahUangDibayar,
          created_by: user.id,
        }).select().single();

        if (error) throw error;

        return data;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pembayaran-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      if (shouldSplitPayment(variables)) {
        toast.success('Pembayaran berhasil! Zakat dan Sedekah/Infak telah dicatat terpisah.');
      } else {
        toast.success('Pembayaran zakat berhasil ditambahkan');
      }
    },
    onError: (error: Error) => {
      console.error('Create pembayaran error:', error);
      toast.error(`Gagal menambahkan pembayaran: ${error.message}`);
    },
  });
}

// Update existing pembayaran
export function useUpdatePembayaran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePembayaranInput) => {
      // Update muzakki
      await (supabase.from('muzakki').update as any)({
        nama_kk: input.nama_kk,
        alamat: input.alamat,
        no_telp: input.no_telp || null,
        updated_at: new Date().toISOString(),
      }).eq('id', input.muzakki_id);

      // Get nilai per orang from tahun_zakat
      const { data: tahunZakat, error: tahunError } = await supabase
        .from('tahun_zakat')
        .select('nilai_beras_kg, nilai_uang_rp')
        .eq('id', input.tahun_zakat_id)
        .single();

      if (tahunError) throw tahunError;

      const typedTahunZakat = tahunZakat as TahunZakatRecord;

      // Recalculate total (for beras) or use actual amount received (for uang)
      const totalBerasKg =
        input.jenis_zakat === 'beras'
          ? input.jumlah_beras_dibayar_kg ?? (input.jumlah_jiwa * typedTahunZakat.nilai_beras_kg)
          : null;
      
      // For uang: store actual amount received, not calculated kewajiban
      // nilai_uang_rp is only used as reference/suggestion
      const totalUangRp =
        input.jenis_zakat === 'uang'
          ? input.jumlah_uang_dibayar_rp ?? (input.jumlah_jiwa * typedTahunZakat.nilai_uang_rp)
          : null;

      const akunUang = input.jenis_zakat === 'uang' ? input.akun_uang || null : null;
      const jumlahUangDibayar =
        input.jenis_zakat === 'uang'
          ? input.jumlah_uang_dibayar_rp ?? totalUangRp ?? 0
          : null;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update pembayaran
      const { data, error } = await (supabase.from('pembayaran_zakat').update as any)({
        tanggal_bayar: input.tanggal_bayar,
        jumlah_jiwa: input.jumlah_jiwa,
        jenis_zakat: input.jenis_zakat,
        nilai_per_orang: input.jenis_zakat === 'beras' 
          ? typedTahunZakat.nilai_beras_kg 
          : typedTahunZakat.nilai_uang_rp,
        total_zakat: totalBerasKg || totalUangRp,
        jumlah_beras_kg: totalBerasKg,
        jumlah_uang_rp: totalUangRp,
        akun_uang: akunUang,
        jumlah_uang_dibayar_rp: jumlahUangDibayar,
        petugas_penerima: user.id,
        updated_at: new Date().toISOString(),
      }).eq('id', input.id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembayaran-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Pembayaran zakat berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui pembayaran: ${error.message}`);
    },
  });
}

// Delete pembayaran
export function useDeletePembayaran() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pembayaran_zakat').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pembayaran-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Pembayaran zakat berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus pembayaran: ${error.message}`);
    },
  });
}

// Get single pembayaran for edit
export function usePembayaranDetail(id: string | null) {
  return useQuery({
    queryKey: ['pembayaran-detail', id],
    queryFn: async (): Promise<PembayaranZakat | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('pembayaran_zakat')
        .select(
          `
          *,
          muzakki:muzakki_id (
            id,
            nama_kk,
            alamat,
            no_telp
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as PembayaranZakat;
    },
    enabled: !!id,
  });
}
