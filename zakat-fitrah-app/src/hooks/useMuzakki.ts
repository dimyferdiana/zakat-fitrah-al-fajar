import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { offlineStore } from '@/lib/offlineStore';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

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

export interface MuzakkiMaster {
  id: string;
  nama_kk: string;
  alamat: string;
  no_telp: string | null;
}

interface MuzakkiListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: keyof MuzakkiMaster;
  sortOrder?: 'asc' | 'desc';
}

interface CreateMuzakkiInput {
  nama_kk: string;
  alamat: string;
  no_telp?: string;
}

interface UpdateMuzakkiInput extends CreateMuzakkiInput {
  id: string;
}

export async function createMuzakkiRecord(input: CreateMuzakkiInput): Promise<MuzakkiMaster> {
  const { data, error } = await (supabase.from('muzakki').insert as any)({
    nama_kk: input.nama_kk,
    alamat: input.alamat,
    no_telp: input.no_telp || null,
  }).select().single();

  if (error) throw error;
  return data as MuzakkiMaster;
}

export async function updateMuzakkiRecord(input: UpdateMuzakkiInput): Promise<MuzakkiMaster> {
  const { data, error } = await (supabase.from('muzakki').update as any)({
    nama_kk: input.nama_kk,
    alamat: input.alamat,
    no_telp: input.no_telp || null,
    updated_at: new Date().toISOString(),
  }).eq('id', input.id).select().single();

  if (error) throw error;
  return data as MuzakkiMaster;
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

export function useMuzakkiList(params: MuzakkiListParams) {
  return useQuery({
    queryKey: ['muzakki-list', params],
    queryFn: async (): Promise<{ data: MuzakkiMaster[]; count: number }> => {
      if (OFFLINE_MODE) {
        let items = offlineStore.getMuzakkiAll();

        if (params.search) {
          const query = params.search.toLowerCase();
          items = items.filter(
            (item) =>
              item.nama_kk.toLowerCase().includes(query) ||
              item.alamat.toLowerCase().includes(query) ||
              (item.no_telp ?? '').toLowerCase().includes(query)
          );
        }

        const sortBy = params.sortBy || 'nama_kk';
        const sortOrder = params.sortOrder || 'asc';
        items = [...items].sort((a, b) => {
          const left = String(a[sortBy] ?? '');
          const right = String(b[sortBy] ?? '');
          return sortOrder === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
        });

        const count = items.length;
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize;

        return {
          data: items.slice(from, to),
          count,
        };
      }

      let query = supabase.from('muzakki').select('id, nama_kk, alamat, no_telp', { count: 'exact' });

      if (params.search) {
        query = query.or(
          `nama_kk.ilike.%${params.search}%,alamat.ilike.%${params.search}%,no_telp.ilike.%${params.search}%`
        );
      }

      const sortBy = params.sortBy || 'nama_kk';
      const sortOrder = params.sortOrder || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data || []) as MuzakkiMaster[],
        count: count || 0,
      };
    },
  });
}

export function useCreateMuzakki() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMuzakkiInput) => {
      if (OFFLINE_MODE) {
        return offlineStore.addMuzakki({
          nama_kk: input.nama_kk,
          alamat: input.alamat,
          no_telp: input.no_telp || null,
        });
      }

      return createMuzakkiRecord(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muzakki-list'] });
      toast.success('Data muzakki berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menambahkan muzakki: ${error.message}`);
    },
  });
}

export function useUpdateMuzakki() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMuzakkiInput) => {
      if (OFFLINE_MODE) {
        offlineStore.muzakki = offlineStore.muzakki.map((item) =>
          item.id === input.id
            ? {
                ...item,
                nama_kk: input.nama_kk,
                alamat: input.alamat,
                no_telp: input.no_telp || null,
              }
            : item
        );

        offlineStore.pembayaran = offlineStore.pembayaran.map((item) =>
          item.muzakki_id === input.id
            ? {
                ...item,
                muzakki: {
                  ...item.muzakki,
                  nama_kk: input.nama_kk,
                  alamat: input.alamat,
                  no_telp: input.no_telp || null,
                },
              }
            : item
        );

        return offlineStore.getMuzakkiById(input.id);
      }

      return updateMuzakkiRecord(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muzakki-list'] });
      queryClient.invalidateQueries({ queryKey: ['pembayaran-list'] });
      toast.success('Data muzakki berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui muzakki: ${error.message}`);
    },
  });
}

export function useDeleteMuzakki() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (OFFLINE_MODE) {
        const hasHistory = offlineStore.pembayaran.some((item) => item.muzakki_id === id);
        if (hasHistory) {
          throw new Error('Muzakki memiliki riwayat transaksi dan tidak dapat dihapus.');
        }

        offlineStore.muzakki = offlineStore.muzakki.filter((item) => item.id !== id);
        return;
      }

      const { count, error: historyError } = await supabase
        .from('pembayaran_zakat')
        .select('id', { count: 'exact', head: true })
        .eq('muzakki_id', id);

      if (historyError) throw historyError;

      if ((count || 0) > 0) {
        throw new Error('Muzakki memiliki riwayat transaksi dan tidak dapat dihapus.');
      }

      const { error } = await supabase.from('muzakki').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muzakki-list'] });
      toast.success('Data muzakki berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus muzakki: ${error.message}`);
    },
  });
}

// ──────────────────────────────────────────────────────────
// Unified transaction item for Riwayat Transaksi modal
// ──────────────────────────────────────────────────────────
export interface MuzakkiTransactionItem {
  id: string;
  source: 'pembayaran_zakat' | 'pemasukan_uang' | 'pemasukan_beras';
  tanggal: string;
  kategori_label: string;
  jumlah_jiwa?: number | null;
  jumlah_beras_kg?: number | null;
  jumlah_uang_rp?: number | null;
  akun?: string | null;
  catatan?: string | null;
  raw_pembayaran?: PembayaranZakat;
}

const KATEGORI_LABEL_UANG: Record<string, string> = {
  zakat_fitrah_uang: 'Zakat Fitrah Uang',
  fidyah_uang: 'Fidyah Uang',
  maal_penghasilan_uang: 'Maal/Penghasilan',
  infak_sedekah_uang: 'Infak/Sedekah Uang',
};

const KATEGORI_LABEL_BERAS: Record<string, string> = {
  zakat_fitrah_beras: 'Zakat Fitrah Beras',
  fidyah_beras: 'Fidyah Beras',
  infak_sedekah_beras: 'Infak/Sedekah Beras',
  maal_beras: 'Maal Beras',
};

interface MuzakkiTransactionHistoryParams {
  muzakkiId: string | null;
  tahunZakatId?: string;
}

export function useMuzakkiTransactionHistory(params: MuzakkiTransactionHistoryParams) {
  return useQuery({
    queryKey: ['muzakki-transaction-history', params],
    queryFn: async (): Promise<MuzakkiTransactionItem[]> => {
      if (!params.muzakkiId) return [];

      if (OFFLINE_MODE) {
        let pz = offlineStore.pembayaran.filter((item) => item.muzakki_id === params.muzakkiId);
        if (params.tahunZakatId) {
          pz = pz.filter((item) => item.tahun_zakat_id === params.tahunZakatId);
        }
        const pzItems: MuzakkiTransactionItem[] = pz.map((item) => ({
          id: item.id,
          source: 'pembayaran_zakat',
          tanggal: item.tanggal_bayar,
          kategori_label: item.jenis_zakat === 'beras' ? 'Zakat Fitrah Beras' : 'Zakat Fitrah Uang',
          jumlah_jiwa: item.jumlah_jiwa,
          jumlah_beras_kg: item.jumlah_beras_kg,
          jumlah_uang_rp: item.jumlah_uang_rp,
          raw_pembayaran: item as unknown as PembayaranZakat,
        }));

        let pu = offlineStore.pemasukanUang.filter((item) => item.muzakki_id === params.muzakkiId);
        if (params.tahunZakatId) pu = pu.filter((item) => item.tahun_zakat_id === params.tahunZakatId);
        const puItems: MuzakkiTransactionItem[] = pu.map((item) => ({
          id: item.id,
          source: 'pemasukan_uang',
          tanggal: item.tanggal,
          kategori_label: KATEGORI_LABEL_UANG[item.kategori] ?? item.kategori,
          jumlah_uang_rp: item.jumlah_uang_rp,
          akun: item.akun,
          catatan: item.catatan,
        }));

        let pb = offlineStore.pemasukanBeras.filter((item) => item.muzakki_id === params.muzakkiId);
        if (params.tahunZakatId) pb = pb.filter((item) => item.tahun_zakat_id === params.tahunZakatId);
        const pbItems: MuzakkiTransactionItem[] = pb.map((item) => ({
          id: item.id,
          source: 'pemasukan_beras',
          tanggal: item.tanggal,
          kategori_label: KATEGORI_LABEL_BERAS[item.kategori] ?? item.kategori,
          jumlah_beras_kg: item.jumlah_beras_kg,
          catatan: item.catatan,
        }));

        return [...pzItems, ...puItems, ...pbItems].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      }

      // ── Online: query all 3 tables in parallel ──
      let pzQuery = supabase
        .from('pembayaran_zakat')
        .select('*')
        .eq('muzakki_id', params.muzakkiId)
        .order('tanggal_bayar', { ascending: false });
      if (params.tahunZakatId) pzQuery = pzQuery.eq('tahun_zakat_id', params.tahunZakatId);

      let puQuery = supabase
        .from('pemasukan_uang')
        .select('*')
        .eq('muzakki_id', params.muzakkiId)
        .order('tanggal', { ascending: false });
      if (params.tahunZakatId) puQuery = puQuery.eq('tahun_zakat_id', params.tahunZakatId);

      let pbQuery = supabase
        .from('pemasukan_beras')
        .select('*')
        .eq('muzakki_id', params.muzakkiId)
        .order('tanggal', { ascending: false });
      if (params.tahunZakatId) pbQuery = pbQuery.eq('tahun_zakat_id', params.tahunZakatId);

      const [pzRes, puRes, pbRes] = await Promise.all([pzQuery, puQuery, pbQuery]);

      if (pzRes.error) throw pzRes.error;
      if (puRes.error) throw puRes.error;
      if (pbRes.error) throw pbRes.error;

      const pzItems: MuzakkiTransactionItem[] = (pzRes.data || []).map((item: any) => ({
        id: item.id,
        source: 'pembayaran_zakat' as const,
        tanggal: item.tanggal_bayar,
        kategori_label: item.jenis_zakat === 'beras' ? 'Zakat Fitrah Beras' : 'Zakat Fitrah Uang',
        jumlah_jiwa: item.jumlah_jiwa,
        jumlah_beras_kg: item.jumlah_beras_kg,
        jumlah_uang_rp: item.jumlah_uang_rp,
        akun: item.akun_uang,
        raw_pembayaran: item as PembayaranZakat,
      }));

      const puItems: MuzakkiTransactionItem[] = (puRes.data || []).map((item: any) => ({
        id: item.id,
        source: 'pemasukan_uang' as const,
        tanggal: item.tanggal,
        kategori_label: KATEGORI_LABEL_UANG[item.kategori] ?? item.kategori,
        jumlah_uang_rp: item.jumlah_uang_rp,
        akun: item.akun,
        catatan: item.catatan,
      }));

      const pbItems: MuzakkiTransactionItem[] = (pbRes.data || []).map((item: any) => ({
        id: item.id,
        source: 'pemasukan_beras' as const,
        tanggal: item.tanggal,
        kategori_label: KATEGORI_LABEL_BERAS[item.kategori] ?? item.kategori,
        jumlah_beras_kg: item.jumlah_beras_kg,
        catatan: item.catatan,
      }));

      return [...pzItems, ...puItems, ...pbItems].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    },
    enabled: !!params.muzakkiId,
  });
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
      if (OFFLINE_MODE) {
        return offlineStore.getPembayaranList({
          tahunZakatId: params.tahunZakatId,
          search: params.search,
          jenisZakat: params.jenisZakat,
          page: params.page,
          pageSize: params.pageSize,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        });
      }
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
      if (OFFLINE_MODE) {
        const tahunZakat = offlineStore.getTahunZakatList().find((t) => t.id === input.tahun_zakat_id);
        const nilaiPerJiwa = input.jenis_zakat === 'beras' ? (tahunZakat?.nilai_beras_kg ?? 2.5) : (tahunZakat?.nilai_uang_rp ?? 45000);
        let mzk = offlineStore.getMuzakkiAll().find((m) => m.nama_kk === input.nama_kk);
        if (!mzk) mzk = offlineStore.addMuzakki({ nama_kk: input.nama_kk, alamat: input.alamat, no_telp: input.no_telp || null });
        return offlineStore.addPembayaran({
          muzakki_id: mzk.id,
          tahun_zakat_id: input.tahun_zakat_id,
          tanggal_bayar: input.tanggal_bayar,
          jumlah_jiwa: input.jumlah_jiwa,
          jenis_zakat: input.jenis_zakat,
          jumlah_beras_kg: input.jenis_zakat === 'beras' ? (input.jumlah_beras_dibayar_kg ?? input.jumlah_jiwa * nilaiPerJiwa) : null,
          jumlah_uang_rp: input.jenis_zakat === 'uang' ? (input.jumlah_uang_dibayar_rp ?? input.jumlah_jiwa * nilaiPerJiwa) : null,
          akun_uang: input.jenis_zakat === 'uang' ? (input.akun_uang ?? null) : null,
          jumlah_uang_dibayar_rp: input.jenis_zakat === 'uang' ? (input.jumlah_uang_dibayar_rp ?? null) : null,
          sedekah_uang: null,
          sedekah_beras: null,
        });
      }
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
      if (OFFLINE_MODE) {
        return offlineStore.updatePembayaran(input.id, {
          tanggal_bayar: input.tanggal_bayar,
          jumlah_jiwa: input.jumlah_jiwa,
          jenis_zakat: input.jenis_zakat,
          jumlah_beras_kg: input.jenis_zakat === 'beras' ? (input.jumlah_beras_dibayar_kg ?? null) : null,
          jumlah_uang_rp: input.jenis_zakat === 'uang' ? (input.jumlah_uang_dibayar_rp ?? null) : null,
          akun_uang: input.jenis_zakat === 'uang' ? (input.akun_uang ?? null) : null,
          jumlah_uang_dibayar_rp: input.jenis_zakat === 'uang' ? (input.jumlah_uang_dibayar_rp ?? null) : null,
        });
      }
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
      if (OFFLINE_MODE) { offlineStore.deletePembayaran(id); return; }
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
      if (OFFLINE_MODE) return offlineStore.getPembayaranList({}).data.find((p) => p.id === id) ?? null;

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
