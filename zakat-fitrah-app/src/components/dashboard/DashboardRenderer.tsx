import type { DashboardStats } from '@/hooks/useDashboard';
import type { DashboardConfig, DashboardWidget } from '@/types/dashboard';
import { StatCardWidget } from '@/components/dashboard/widgets/StatCardWidget';
import { ChartWidget } from '@/components/dashboard/widgets/ChartWidget';
import { DistribusiProgressWidget } from '@/components/dashboard/widgets/DistribusiProgressWidget';
import { HakAmilWidget } from '@/components/dashboard/widgets/HakAmilWidget';
import { HakAmilTrendWidget } from '@/components/dashboard/widgets/HakAmilTrendWidget';
import { SectionTitleWidget } from '@/components/dashboard/widgets/SectionTitleWidget';
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

type RenderBlock =
  | { type: 'stat_group'; widgets: DashboardWidget[] }
  | { type: 'single_widget'; widget: DashboardWidget };

export function DashboardRenderer({
  config,
  widgets,
  stats,
  monthlyData,
  tahunZakatId,
}: DashboardRendererProps) {
  const sorted = [...widgets].sort((a, b) => a.sort_order - b.sort_order);

  const renderBlocks: RenderBlock[] = [];
  for (const widget of sorted) {
    if (widget.widget_type === 'stat_card') {
      const lastBlock = renderBlocks[renderBlocks.length - 1];
      if (lastBlock?.type === 'stat_group') {
        lastBlock.widgets.push(widget);
      } else {
        renderBlocks.push({ type: 'stat_group', widgets: [widget] });
      }
    } else {
      renderBlocks.push({ type: 'single_widget', widget });
    }
  }

  const cols = config.stat_card_columns ?? 3;
  const gridClass =
    cols === 1
      ? 'grid gap-4 grid-cols-1'
      : cols === 2
      ? 'grid gap-4 md:grid-cols-2'
      : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3';

  const renderWidget = (widget: DashboardWidget) => {
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
    if (widget.widget_type === 'hak_amil_trend') {
      return (
        <HakAmilTrendWidget key={widget.id} tahunZakatId={tahunZakatId} />
      );
    }
    if (widget.widget_type === 'section_title') {
      return <SectionTitleWidget key={widget.id} widget={widget} />;
    }
    if (widget.widget_type === 'text_note') {
      return <TextNoteWidget key={widget.id} widget={widget} />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {renderBlocks.map((block, index) => {
        if (block.type === 'stat_group') {
          return (
            <div key={`stat-group-${index}`} className={gridClass}>
              {block.widgets.map((widget) => (
                <div
                  key={widget.id}
                  className={widget.width === 'half' ? '' : 'md:col-span-full lg:col-span-full'}
                >
                  <StatCardWidget widget={widget} stats={stats} />
                </div>
              ))}
            </div>
          );
        }
        return renderWidget(block.widget);
      })}
    </div>
  );
}
