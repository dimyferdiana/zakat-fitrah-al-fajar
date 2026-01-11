import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { StatCard } from '@/components/dashboard/StatCard';
import { PemasukanChart } from '@/components/dashboard/PemasukanChart';
import { DistribusiProgress } from '@/components/dashboard/DistribusiProgress';
import {
  useDashboardStats,
  useTahunZakatList,
  useMonthlyPemasukan,
} from '@/hooks/useDashboard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Users, Heart, Send, TrendingUp, Package, Coins, RefreshCw, HandHeart, Gift, Banknote } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [selectedTahun, setSelectedTahun] = useState<string | undefined>();

  const { data: tahunList } = useTahunZakatList();
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useDashboardStats(selectedTahun);
  const { data: monthlyData, isLoading: chartLoading } = useMonthlyPemasukan(selectedTahun);

  const activeTahun = tahunList?.find((t) => t.is_active);

  const handleRefresh = () => {
    refetchStats();
  };

  if (statsLoading) {
    return <LoadingSpinner text="Memuat data dashboard..." />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title="Dashboard"
          description={`Selamat datang, ${user?.nama_lengkap}`}
        />

        <div className="flex gap-2">
          <Select
            value={selectedTahun || activeTahun?.id}
            onValueChange={setSelectedTahun}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {tahunList?.map((tahun) => (
                <SelectItem key={tahun.id} value={tahun.id}>
                  {tahun.tahun_hijriah} ({tahun.tahun_masehi})
                  {tahun.is_active && ' - Aktif'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Muzakki"
          value={stats?.totalMuzakki || 0}
          description="Pembayar zakat tahun ini"
          icon={Users}
        />
        <StatCard
          title="Mustahik Aktif"
          value={stats?.totalMustahikAktif || 0}
          description={`${stats?.totalMustahikNonAktif || 0} non-aktif`}
          icon={Heart}
        />
        <StatCard
          title="Zakat Beras Terkumpul"
          value={`${formatNumber(stats?.totalBerasKg || 0)} kg`}
          description="Total pemasukan beras"
          icon={Package}
        />
        <StatCard
          title="Zakat Uang Terkumpul"
          value={formatCurrency(stats?.totalUangRp || 0)}
          description="Total pemasukan uang"
          icon={Coins}
        />
        <StatCard
          title="Beras Tersalurkan"
          value={`${formatNumber(stats?.totalDistribusiBerasKg || 0)} kg`}
          description="Total distribusi beras"
          icon={Send}
        />
        <StatCard
          title="Uang Tersalurkan"
          value={formatCurrency(stats?.totalDistribusiUangRp || 0)}
          description="Total distribusi uang"
          icon={TrendingUp}
        />
        <StatCard
          title="Fidyah Uang"
          value={formatCurrency(stats?.fidyahUangRp || 0)}
          description="Pemasukan fidyah"
          icon={HandHeart}
        />
        <StatCard
          title="Infak/Sedekah Uang"
          value={formatCurrency(stats?.infakSedekahUangRp || 0)}
          description="Termasuk overpayment"
          icon={Gift}
        />
        <StatCard
          title="Total Pemasukan Uang"
          value={formatCurrency(stats?.totalPemasukanUangRp || 0)}
          description="Fitrah + Fidyah + Infak + Maal"
          icon={Banknote}
        />
      </div>

      {/* Charts and Progress */}
      <div className="grid gap-4 md:grid-cols-2">
        <DistribusiProgress
          totalPemasukan={stats?.totalBerasKg || 0}
          totalDistribusi={stats?.totalDistribusiBerasKg || 0}
          sisa={stats?.sisaBerasKg || 0}
          jenis="beras"
        />
        <DistribusiProgress
          totalPemasukan={stats?.totalPemasukanUangRp || 0}
          totalDistribusi={stats?.totalDistribusiUangRp || 0}
          sisa={stats?.sisaUangAfterAmilRp || 0}
          jenis="uang"
          hakAmil={stats?.hakAmilUangRp || 0}
        />
      </div>

      {/* Monthly Chart */}
      {chartLoading ? (
        <LoadingSpinner text="Memuat grafik..." />
      ) : (
        monthlyData && monthlyData.length > 0 && (
          <PemasukanChart data={monthlyData} />
        )
      )}
    </div>
  );
}
