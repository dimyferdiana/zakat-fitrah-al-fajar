import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalBerasKg: number;
  totalUangRp: number;
  totalMuzakki: number;
  totalMustahikAktif: number;
  totalMustahikNonAktif: number;
  totalDistribusiBerasKg: number;
  totalDistribusiUangRp: number;
  sisaBerasKg: number;
  sisaUangRp: number;
  // Phase 2: Pemasukan Uang breakdown
  fidyahUangRp: number;
  infakSedekahUangRp: number;
  maalPenghasilanUangRp: number;
  totalPemasukanUangRp: number; // Including fitrah + fidyah + infak + maal + rekonsiliasi
  hakAmilUangRp: number;
  sisaUangAfterAmilRp: number;
}

interface PembayaranData {
  jumlah_beras_kg: number | null;
  jumlah_uang_rp: number | null;
  tanggal_bayar: string;
  jenis_zakat: string;
}

interface DistribusiData {
  jumlah_beras_kg: number | null;
  jumlah_uang_rp: number | null;
}

export function useDashboardStats(tahunZakatId?: string) {
  return useQuery({
    queryKey: ['dashboard-stats', tahunZakatId],
    queryFn: async (): Promise<DashboardStats> => {
      // Get active tahun_zakat if not specified
      let activeTahunId = tahunZakatId;
      if (!activeTahunId) {
        const { data: activeTahun } = await supabase
          .from('tahun_zakat')
          .select('id')
          .eq('is_active', true)
          .single();
        activeTahunId = (activeTahun as { id: string } | null)?.id;
      }

      if (!activeTahunId) {
        return {
          totalBerasKg: 0,
          totalUangRp: 0,
          totalMuzakki: 0,
          totalMustahikAktif: 0,
          totalMustahikNonAktif: 0,
          totalDistribusiBerasKg: 0,
          totalDistribusiUangRp: 0,
          sisaBerasKg: 0,
          sisaUangRp: 0,
          fidyahUangRp: 0,
          infakSedekahUangRp: 0,
          maalPenghasilanUangRp: 0,
          totalPemasukanUangRp: 0,
          hakAmilUangRp: 0,
          sisaUangAfterAmilRp: 0,
        };
      }

      // Total pemasukan beras
      const { data: pemasukanBeras } = await supabase
        .from('pembayaran_zakat')
        .select('jumlah_beras_kg')
        .eq('tahun_zakat_id', activeTahunId)
        .eq('jenis_zakat', 'beras');

      const totalBerasKg = (pemasukanBeras as PembayaranData[] | null)?.reduce((sum, p) => sum + (Number(p.jumlah_beras_kg) || 0), 0) || 0;

      // Total pemasukan uang (zakat fitrah uang)
      const { data: pemasukanUang } = await supabase
        .from('pembayaran_zakat')
        .select('jumlah_uang_rp')
        .eq('tahun_zakat_id', activeTahunId)
        .eq('jenis_zakat', 'uang');

      const totalUangRp = (pemasukanUang as PembayaranData[] | null)?.reduce((sum, p) => sum + (Number(p.jumlah_uang_rp) || 0), 0) || 0;

      // Total muzakki (distinct)
      const { count: totalMuzakki } = await supabase
        .from('pembayaran_zakat')
        .select('muzakki_id', { count: 'exact', head: true })
        .eq('tahun_zakat_id', activeTahunId);

      // Total mustahik aktif
      const { count: totalMustahikAktif } = await supabase
        .from('mustahik')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Total mustahik non-aktif
      const { count: totalMustahikNonAktif } = await supabase
        .from('mustahik')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      // Total distribusi beras
      const { data: distribusiBeras } = await supabase
        .from('distribusi_zakat')
        .select('jumlah_beras_kg')
        .eq('tahun_zakat_id', activeTahunId)
        .eq('jenis_distribusi', 'beras')
        .eq('status', 'selesai');

      const totalDistribusiBerasKg = (distribusiBeras as DistribusiData[] | null)?.reduce((sum, d) => sum + (Number(d.jumlah_beras_kg) || 0), 0) || 0;

      // Total distribusi uang
      const { data: distribusiUang } = await supabase
        .from('distribusi_zakat')
        .select('jumlah_uang_rp')
        .eq('tahun_zakat_id', activeTahunId)
        .eq('jenis_distribusi', 'uang')
        .eq('status', 'selesai');

      const totalDistribusiUangRp = (distribusiUang as DistribusiData[] | null)?.reduce((sum, d) => sum + (Number(d.jumlah_uang_rp) || 0), 0) || 0;

      // Phase 2: Get pemasukan_uang breakdown (non-zakat categories)
      const { data: pemasukanUangData } = await supabase
        .from('pemasukan_uang')
        .select('kategori, jumlah_uang_rp')
        .eq('tahun_zakat_id', activeTahunId);

      const fidyahUangRp = (pemasukanUangData || [])
        .filter((p: any) => p.kategori === 'fidyah_uang')
        .reduce((sum: number, p: any) => sum + (Number(p.jumlah_uang_rp) || 0), 0);

      const infakSedekahUangRp = (pemasukanUangData || [])
        .filter((p: any) => p.kategori === 'infak_sedekah_uang')
        .reduce((sum: number, p: any) => sum + (Number(p.jumlah_uang_rp) || 0), 0);

      const maalPenghasilanUangRp = (pemasukanUangData || [])
        .filter((p: any) => p.kategori === 'maal_penghasilan_uang')
        .reduce((sum: number, p: any) => sum + (Number(p.jumlah_uang_rp) || 0), 0);

      // Phase 2: Get rekonsiliasi adjustments
      const { data: rekonsiliasiData } = await supabase
        .from('rekonsiliasi')
        .select('jumlah_uang_rp')
        .eq('tahun_zakat_id', activeTahunId)
        .eq('jenis', 'uang');

      const rekonsiliasiUangRp = (rekonsiliasiData || [])
        .reduce((sum: number, r: any) => sum + (Number(r.jumlah_uang_rp) || 0), 0);

      // Phase 2: Get Hak Amil manual
      const { data: hakAmilData } = await supabase
        .from('hak_amil')
        .select('jumlah_uang_rp')
        .eq('tahun_zakat_id', activeTahunId)
        .maybeSingle();

      const hakAmilUangRp = Number((hakAmilData as { jumlah_uang_rp?: number } | null)?.jumlah_uang_rp) || 0;

      // Total pemasukan uang (dashboard card) now includes zakat uang + other categories
      const totalPemasukanUangRp =
        totalUangRp + // zakat fitrah uang (actual received)
        fidyahUangRp +
        infakSedekahUangRp +
        maalPenghasilanUangRp +
        rekonsiliasiUangRp;

      // Sisa uang after amil = total pemasukan - hak amil - tersalurkan
      const sisaUangAfterAmilRp = totalPemasukanUangRp - hakAmilUangRp - totalDistribusiUangRp;

      // Calculate sisa
      const sisaBerasKg = totalBerasKg - totalDistribusiBerasKg;
      const sisaUangRp = totalUangRp - totalDistribusiUangRp;

      return {
        totalBerasKg,
        totalUangRp,
        totalMuzakki: totalMuzakki || 0,
        totalMustahikAktif: totalMustahikAktif || 0,
        totalMustahikNonAktif: totalMustahikNonAktif || 0,
        totalDistribusiBerasKg,
        totalDistribusiUangRp,
        sisaBerasKg,
        sisaUangRp,
        fidyahUangRp,
        infakSedekahUangRp,
        maalPenghasilanUangRp,
        totalPemasukanUangRp,
        hakAmilUangRp,
        sisaUangAfterAmilRp,
      };
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

interface TahunZakat {
  id: string;
  tahun_hijriah: string;
  tahun_masehi: number;
  is_active: boolean;
}

export function useTahunZakatList() {
  return useQuery({
    queryKey: ['tahun-zakat-list'],
    queryFn: async (): Promise<TahunZakat[]> => {
      const { data, error } = await supabase
        .from('tahun_zakat')
        .select('id, tahun_hijriah, tahun_masehi, is_active')
        .order('tahun_masehi', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

interface MonthlyPemasukan {
  month: string;
  beras: number;
  uang: number;
}

export function useMonthlyPemasukan(tahunZakatId?: string) {
  return useQuery({
    queryKey: ['monthly-pemasukan', tahunZakatId],
    queryFn: async (): Promise<MonthlyPemasukan[]> => {
      // Get active tahun_zakat if not specified
      let activeTahunId = tahunZakatId;
      if (!activeTahunId) {
        const { data: activeTahun } = await supabase
          .from('tahun_zakat')
          .select('id')
          .eq('is_active', true)
          .single();
        activeTahunId = (activeTahun as { id: string } | null)?.id;
      }

      if (!activeTahunId) {
        return [];
      }

      const { data, error } = await supabase
        .from('pembayaran_zakat')
        .select('tanggal_bayar, jenis_zakat, jumlah_beras_kg, jumlah_uang_rp')
        .eq('tahun_zakat_id', activeTahunId)
        .order('tanggal_bayar');

      if (error) throw error;

      // Group by month
      const monthlyData: { [key: string]: { beras: number; uang: number } } = {};

      (data as PembayaranData[] | null)?.forEach((item) => {
        const month = new Date(item.tanggal_bayar).toLocaleString('id-ID', { month: 'short' });
        
        if (!monthlyData[month]) {
          monthlyData[month] = { beras: 0, uang: 0 };
        }

        if (item.jenis_zakat === 'beras') {
          monthlyData[month].beras += Number(item.jumlah_beras_kg) || 0;
        } else {
          monthlyData[month].uang += Number(item.jumlah_uang_rp) || 0;
        }
      });

      return Object.entries(monthlyData).map(([month, values]) => ({
        month,
        ...values,
      }));
    },
  });
}
