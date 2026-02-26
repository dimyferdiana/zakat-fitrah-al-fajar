import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import {
  useDashboardStats,
  useTahunZakatList,
  useMonthlyPemasukan,
} from '@/hooks/useDashboard';
import { useDashboardConfigs, useDashboardWidgets } from '@/hooks/useDashboardConfig';
import { DashboardTabSwitcher } from '@/components/dashboard/DashboardTabSwitcher';
import { DashboardRenderer } from '@/components/dashboard/DashboardRenderer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTahun, setSelectedTahun] = useState<string | undefined>();

  // Dashboard configs (tab list)
  const { data: dashboards = [], isLoading: dashboardsLoading } = useDashboardConfigs();

  // Active dashboard — from URL ?d= param, or first in list
  const urlDashboardId = searchParams.get('d') ?? undefined;
  const activeDashboardId = urlDashboardId ?? dashboards[0]?.id;
  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId) ?? dashboards[0];

  // Widgets for active dashboard
  const { data: widgets = [] } = useDashboardWidgets(activeDashboardId);

  // Stats & chart data
  const { data: tahunList } = useTahunZakatList();
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useDashboardStats(selectedTahun);
  const { data: monthlyData = [], isLoading: chartLoading } = useMonthlyPemasukan(selectedTahun);

  const activeTahun = tahunList?.find((t) => t.is_active);
  const resolvedTahunId = selectedTahun || activeTahun?.id;

  const handleSelectDashboard = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('d', id);
      return next;
    });
  };

  if (statsLoading || dashboardsLoading) {
    return <LoadingSpinner text="Memuat data dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
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
          <Button variant="outline" size="icon" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dashboard tab switcher — only shown when >1 dashboard */}
      <DashboardTabSwitcher
        dashboards={dashboards}
        activeDashboardId={activeDashboardId}
        onSelect={handleSelectDashboard}
      />

      {/* Render active dashboard via configurable renderer */}
      {activeDashboard && stats ? (
        <DashboardRenderer
          config={activeDashboard}
          widgets={widgets}
          stats={stats}
          monthlyData={chartLoading ? [] : monthlyData}
          tahunZakatId={resolvedTahunId}
        />
      ) : (
        !statsLoading && (
          <p className="text-muted-foreground text-sm">
            Belum ada dashboard. Buat dashboard baru di{' '}
            <a href="/dashboard-settings" className="underline">Konfigurasi Dashboard</a>.
          </p>
        )
      )}
    </div>
  );
}
