import type { DashboardStats } from '@/hooks/useDashboard';
import type { DashboardWidget, StatCardConfig } from '@/types/dashboard';
import { AGGREGATION_RULE_MAP } from '@/lib/aggregationRules';
import { StatCard } from '@/components/dashboard/StatCard';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardWidgetProps {
  widget: DashboardWidget;
  stats: DashboardStats;
}

function formatValue(value: number, format: string): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  }
  if (format === 'weight') {
    return `${new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)} kg`;
  }
  return new Intl.NumberFormat('id-ID').format(value);
}

export function StatCardWidget({ widget, stats }: StatCardWidgetProps) {
  const config = widget.config as StatCardConfig;
  const rule = AGGREGATION_RULE_MAP[config.rule];

  if (!rule) {
    return null;
  }

  const rawValue = stats[rule.statsField] as number ?? 0;
  const formatted = formatValue(rawValue, config.format ?? rule.format);

  // Dynamically resolve lucide icon by name
  const iconName = config.icon as keyof typeof Icons;
  const IconComponent = (Icons[iconName] as LucideIcon | undefined) ?? Icons.BarChart2;

  return (
    <StatCard
      title={config.label}
      value={formatted}
      icon={IconComponent}
    />
  );
}
