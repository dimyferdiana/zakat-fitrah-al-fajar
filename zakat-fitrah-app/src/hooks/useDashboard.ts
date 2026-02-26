import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
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
  // Phase 2.2: Pemasukan Beras (Sedekah)
  infakSedekahBerasKg: number;
  fidyahBerasKg: number;
  zakatFitrahBerasKg: number;
  totalPemasukanBerasKg: number; // Including zakat fitrah + fidyah + infak/sedekah
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
          infakSedekahBerasKg: 0,
          fidyahBerasKg: 0,
          zakatFitrahBerasKg: 0,
          totalPemasukanBerasKg: 0,
        };
      }

      // Total pemasukan beras (from old pembayaran_zakat table)
      const { data: pemasukanBeras } = await supabase
        .from('pembayaran_zakat')
        .select('jumlah_beras_kg')
        .eq('tahun_zakat_id', activeTahunId)
        .eq('jenis_zakat', 'beras');

      const zakatFitrahBerasFromPembayaran = (pemasukanBeras as PembayaranData[] | null)?.reduce((sum, p) => sum + (Number(p.jumlah_beras_kg) || 0), 0) || 0;

      // Total pemasukan uang (from old pembayaran_zakat table)
      const { data: pemasukanUang } = await supabase
        .from('pembayaran_zakat')
        .select('jumlah_uang_rp')
        .eq('tahun_zakat_id', activeTahunId)
        .eq('jenis_zakat', 'uang');

      const zakatFitrahUangFromPembayaran = (pemasukanUang as PembayaranData[] | null)?.reduce((sum, p) => sum + (Number(p.jumlah_uang_rp) || 0), 0) || 0;

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

      // Zakat fitrah uang entered via pemasukan_uang table (new entry path)
      const zakatFitrahUangFromPemasukan = (pemasukanUangData || [])
        .filter((p: any) => p.kategori === 'zakat_fitrah_uang')
        .reduce((sum: number, p: any) => sum + (Number(p.jumlah_uang_rp) || 0), 0);

      // Phase 2.2: Get pemasukan_beras (infak/sedekah beras)
      const { data: pemasukanBerasData } = await supabase
        .from('pemasukan_beras')
        .select('kategori, jumlah_beras_kg')
        .eq('tahun_zakat_id', activeTahunId);

      const infakSedekahBerasKg = (pemasukanBerasData || [])
        .filter((p: any) => p.kategori === 'infak_sedekah_beras')
        .reduce((sum: number, p: any) => sum + (Number(p.jumlah_beras_kg) || 0), 0);

      const fidyahBerasKg = (pemasukanBerasData || [])
        .filter((p: any) => p.kategori === 'fidyah_beras')
        .reduce((sum: number, p: any) => sum + (Number(p.jumlah_beras_kg) || 0), 0);

      const zakatFitrahBerasKg = (pemasukanBerasData || [])
        .filter((p: any) => p.kategori === 'zakat_fitrah_beras')
        .reduce((sum: number, p: any) => sum + (Number(p.jumlah_beras_kg) || 0), 0);

      // Combined totals: entries from both pembayaran_zakat (legacy) and pemasukan_uang/beras (new)
      const totalBerasKg = zakatFitrahBerasFromPembayaran + zakatFitrahBerasKg;
      const totalUangRp = zakatFitrahUangFromPembayaran + zakatFitrahUangFromPemasukan;

      // Total pemasukan beras (dashboard card) — zakatFitrahBerasKg already included in totalBerasKg
      const totalPemasukanBerasKg =
        totalBerasKg + // zakat fitrah beras (pembayaran_zakat + pemasukan_beras)
        fidyahBerasKg +
        infakSedekahBerasKg;

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

      // Total pemasukan uang (dashboard card) — zakatFitrahUangFromPemasukan already included in totalUangRp
      const totalPemasukanUangRp =
        totalUangRp + // zakat fitrah uang (pembayaran_zakat + pemasukan_uang)
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
        infakSedekahBerasKg,
        fidyahBerasKg,
        zakatFitrahBerasKg,
        totalPemasukanBerasKg,
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
  zakatBerasKg: number;
  fidyahBerasKg: number;
  sedekahBerasKg: number;
  zakatUangRp: number;
  fidyahUangRp: number;
  sedekahUangRp: number;
  maalUangRp: number;
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

      // Get zakat fitrah from pembayaran_zakat
      const { data: zakatData, error: zakatError } = await supabase
        .from('pembayaran_zakat')
        .select('tanggal_bayar, jenis_zakat, jumlah_beras_kg, jumlah_uang_rp')
        .eq('tahun_zakat_id', activeTahunId)
        .order('tanggal_bayar');

      if (zakatError) throw zakatError;

      // Get pemasukan_uang (fidyah, sedekah, maal)
      const { data: uangData, error: uangError } = await supabase
        .from('pemasukan_uang')
        .select('tanggal, kategori, jumlah_uang_rp')
        .eq('tahun_zakat_id', activeTahunId)
        .order('tanggal');

      if (uangError) throw uangError;

      // Get pemasukan_beras (fidyah, sedekah)
      const { data: berasData, error: berasError } = await supabase
        .from('pemasukan_beras')
        .select('tanggal, kategori, jumlah_beras_kg')
        .eq('tahun_zakat_id', activeTahunId)
        .order('tanggal');

      if (berasError) throw berasError;

      // Group by month
      const monthlyData: { [key: string]: {
        zakatBerasKg: number;
        fidyahBerasKg: number;
        sedekahBerasKg: number;
        zakatUangRp: number;
        fidyahUangRp: number;
        sedekahUangRp: number;
        maalUangRp: number;
      } } = {};

      // Process zakat fitrah
      (zakatData as PembayaranData[] | null)?.forEach((item) => {
        const month = new Date(item.tanggal_bayar).toLocaleString('id-ID', { month: 'short' });
        
        if (!monthlyData[month]) {
          monthlyData[month] = {
            zakatBerasKg: 0,
            fidyahBerasKg: 0,
            sedekahBerasKg: 0,
            zakatUangRp: 0,
            fidyahUangRp: 0,
            sedekahUangRp: 0,
            maalUangRp: 0,
          };
        }

        if (item.jenis_zakat === 'beras') {
          monthlyData[month].zakatBerasKg += Number(item.jumlah_beras_kg) || 0;
        } else {
          monthlyData[month].zakatUangRp += Number(item.jumlah_uang_rp) || 0;
        }
      });

      // Process pemasukan_uang
      (uangData || []).forEach((item: any) => {
        const month = new Date(item.tanggal).toLocaleString('id-ID', { month: 'short' });
        
        if (!monthlyData[month]) {
          monthlyData[month] = {
            zakatBerasKg: 0,
            fidyahBerasKg: 0,
            sedekahBerasKg: 0,
            zakatUangRp: 0,
            fidyahUangRp: 0,
            sedekahUangRp: 0,
            maalUangRp: 0,
          };
        }

        const amount = Number(item.jumlah_uang_rp) || 0;
        if (item.kategori === 'fidyah_uang') {
          monthlyData[month].fidyahUangRp += amount;
        } else if (item.kategori === 'infak_sedekah_uang') {
          monthlyData[month].sedekahUangRp += amount;
        } else if (item.kategori === 'maal_penghasilan_uang') {
          monthlyData[month].maalUangRp += amount;
        }
      });

      // Process pemasukan_beras
      (berasData || []).forEach((item: any) => {
        const month = new Date(item.tanggal).toLocaleString('id-ID', { month: 'short' });
        
        if (!monthlyData[month]) {
          monthlyData[month] = {
            zakatBerasKg: 0,
            fidyahBerasKg: 0,
            sedekahBerasKg: 0,
            zakatUangRp: 0,
            fidyahUangRp: 0,
            sedekahUangRp: 0,
            maalUangRp: 0,
          };
        }

        const amount = Number(item.jumlah_beras_kg) || 0;
        if (item.kategori === 'fidyah_beras') {
          monthlyData[month].fidyahBerasKg += amount;
        } else if (item.kategori === 'infak_sedekah_beras') {
          monthlyData[month].sedekahBerasKg += amount;
        }
      });

      return Object.entries(monthlyData).map(([month, values]) => ({
        month,
        ...values,
      }));
    },
  });
}
