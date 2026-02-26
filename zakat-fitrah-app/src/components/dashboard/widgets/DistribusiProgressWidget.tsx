import type { DashboardStats } from '@/hooks/useDashboard';
import type { DashboardWidget, DistribusiProgressConfig } from '@/types/dashboard';
import { DistribusiProgress } from '@/components/dashboard/DistribusiProgress';

interface DistribusiProgressWidgetProps {
  widget: DashboardWidget;
  stats: DashboardStats;
}

export function DistribusiProgressWidget({ widget, stats }: DistribusiProgressWidgetProps) {
  const config = widget.config as DistribusiProgressConfig;

  if (config.jenis === 'beras') {
    return (
      <DistribusiProgress
        totalPemasukan={stats.totalPemasukanBerasKg}
        totalDistribusi={stats.totalDistribusiBerasKg}
        sisa={stats.sisaBerasKg}
        jenis="beras"
      />
    );
  }

  return (
    <DistribusiProgress
      totalPemasukan={stats.totalPemasukanUangRp}
      totalDistribusi={stats.totalDistribusiUangRp}
      sisa={stats.sisaUangAfterAmilRp}
      jenis="uang"
      hakAmil={stats.hakAmilUangRp}
    />
  );
}
