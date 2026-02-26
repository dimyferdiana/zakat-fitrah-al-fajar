import type { DashboardWidget, SectionTitleConfig } from '@/types/dashboard';

interface SectionTitleWidgetProps {
  widget: DashboardWidget;
}

export function SectionTitleWidget({ widget }: SectionTitleWidgetProps) {
  const config = widget.config as SectionTitleConfig;
  const title = config.title?.trim() || 'Judul Bagian';

  return (
    <div className="py-1">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-2 h-px w-full bg-border" />
    </div>
  );
}