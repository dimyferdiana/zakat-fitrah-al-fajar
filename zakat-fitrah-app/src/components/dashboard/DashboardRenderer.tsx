import type { DashboardStats } from '@/hooks/useDashboard';
import type { DashboardConfig, DashboardWidget } from '@/types/dashboard';
import { StatCardWidget } from '@/components/dashboard/widgets/StatCardWidget';
import { ChartWidget } from '@/components/dashboard/widgets/ChartWidget';
import { DistribusiProgressWidget } from '@/components/dashboard/widgets/DistribusiProgressWidget';
import { HakAmilWidget } from '@/components/dashboard/widgets/HakAmilWidget';
import { TextNoteWidget } from '@/components/dashboard/widgets/TextNoteWidget';

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

interface DashboardRendererProps {
  config: DashboardConfig;
  widgets: DashboardWidget[];
  stats: DashboardStats;
  monthlyData: MonthlyDataItem[];
  tahunZakatId?: string;
}

/** Separates stat_card widgets from other widgets (which render full-width). */
function groupWidgets(widgets: DashboardWidget[]) {
  const statCards: DashboardWidget[] = [];
  const others: DashboardWidget[] = [];
  for (const w of widgets) {
    if (w.widget_type === 'stat_card') {
      statCards.push(w);
    } else {
      others.push(w);
    }
  }
  return { statCards, others };
}

export function DashboardRenderer({
  config,
  widgets,
  stats,
  monthlyData,
  tahunZakatId,
}: DashboardRendererProps) {
  const sorted = [...widgets].sort((a, b) => a.sort_order - b.sort_order);
  const { statCards, others } = groupWidgets(sorted);

  const cols = config.stat_card_columns ?? 3;
  const gridClass =
    cols === 1
      ? 'grid gap-4 grid-cols-1'
      : cols === 2
      ? 'grid gap-4 md:grid-cols-2'
      : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="space-y-6">
      {/* Stat Cards Grid */}
      {statCards.length > 0 && (
        <div className={gridClass}>
          {statCards.map((widget) => (
            <div
              key={widget.id}
              className={widget.width === 'half' ? '' : 'md:col-span-full lg:col-span-full'}
            >
              <StatCardWidget widget={widget} stats={stats} />
            </div>
          ))}
        </div>
      )}

      {/* Non-stat-card widgets rendered in order */}
      {others.map((widget) => {
        if (widget.widget_type === 'chart') {
          return (
            <ChartWidget key={widget.id} widget={widget} monthlyData={monthlyData} />
          );
        }
        if (widget.widget_type === 'distribusi_progress') {
          return (
            <DistribusiProgressWidget key={widget.id} widget={widget} stats={stats} />
          );
        }
        if (widget.widget_type === 'hak_amil') {
          return (
            <HakAmilWidget key={widget.id} tahunZakatId={tahunZakatId} />
          );
        }
        if (widget.widget_type === 'text_note') {
          return <TextNoteWidget key={widget.id} widget={widget} />;
        }
        return null;
      })}
    </div>
  );
}
