import { cn } from '@/lib/utils';
import type { DashboardConfig } from '@/types/dashboard';

interface DashboardTabSwitcherProps {
  dashboards: DashboardConfig[];
  activeDashboardId: string | undefined;
  onSelect: (id: string) => void;
}

export function DashboardTabSwitcher({
  dashboards,
  activeDashboardId,
  onSelect,
}: DashboardTabSwitcherProps) {
  if (!dashboards || dashboards.length <= 1) {
    return null;
  }

  return (
    <div className="flex gap-1 overflow-x-auto border-b pb-0">
      {dashboards.map((d) => (
        <button
          key={d.id}
          onClick={() => onSelect(d.id)}
          className={cn(
            'shrink-0 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeDashboardId === d.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
          )}
        >
          {d.title}
        </button>
      ))}
    </div>
  );
}
