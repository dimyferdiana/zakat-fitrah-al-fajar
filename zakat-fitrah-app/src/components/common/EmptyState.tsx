import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center">
      {Icon && <Icon className="mb-4 h-12 w-12 text-muted-foreground" />}
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </Card>
  );
}
