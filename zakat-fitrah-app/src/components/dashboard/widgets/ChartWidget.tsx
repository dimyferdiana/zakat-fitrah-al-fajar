import type { DashboardWidget } from '@/types/dashboard';
import { PemasukanChart } from '@/components/dashboard/PemasukanChart';

interface MonthlyDataItem {
  month: string;
  zakatBerasKg: number;
  fidyahBerasKg: number;
  sedekahBerasKg: number;
  zakatUangRp: number;
  fidyahUangRp: number;
  sedekahUangRp: number;
  maalUangRp: number;
}

interface ChartWidgetProps {
  // widget is accepted for future per-widget config (e.g. filtering by category)
  widget: DashboardWidget;
  monthlyData: MonthlyDataItem[];
}

export function ChartWidget({ monthlyData }: ChartWidgetProps) {
  if (!monthlyData || monthlyData.length === 0) {
    return null;
  }

  return <PemasukanChart data={monthlyData} />;
}

