import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useDashboardConfigs } from '@/hooks/useDashboardConfig';
import { DashboardList } from '@/components/dashboard/settings/DashboardList';
import { DashboardFormDialog } from '@/components/dashboard/settings/DashboardFormDialog';

export function DashboardSettings() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: dashboards = [], isLoading } = useDashboardConfigs();

  if (isLoading) {
    return <LoadingSpinner text="Memuat konfigurasi dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Konfigurasi Dashboard"
          description="Kelola tampilan dan widget pada setiap dashboard"
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Dashboard
        </Button>
      </div>

      <DashboardList dashboards={dashboards} onCreateNew={() => setCreateOpen(true)} />

      <DashboardFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        nextSortOrder={dashboards.length}
      />
    </div>
  );
}
