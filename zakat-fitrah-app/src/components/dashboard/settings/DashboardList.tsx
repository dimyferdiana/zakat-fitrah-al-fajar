import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { DashboardConfig } from '@/types/dashboard';
import {
  useDeleteDashboard,
  useDuplicateDashboard,
  useDashboardWidgets,
} from '@/hooks/useDashboardConfig';
import { DashboardFormDialog } from './DashboardFormDialog';
import { WidgetList } from './WidgetList';

interface DashboardCardProps {
  dashboard: DashboardConfig;
}

function DashboardCard({ dashboard }: DashboardCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteDashboard = useDeleteDashboard();
  const duplicate = useDuplicateDashboard();
  const { data: widgets = [] } = useDashboardWidgets(expanded ? dashboard.id : undefined);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CardTitle className="text-base truncate">{dashboard.title}</CardTitle>
              <Badge variant={dashboard.visibility === 'public' ? 'default' : 'secondary'}>
                {dashboard.visibility === 'public' ? 'Publik' : 'Private'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setExpanded((p) => !p)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => duplicate.mutate(dashboard.id)}
                    disabled={duplicate.isPending}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplikasi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {dashboard.description && (
            <p className="text-sm text-muted-foreground">{dashboard.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {dashboard.stat_card_columns} kolom stat card
          </p>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0">
            <WidgetList dashboardId={dashboard.id} widgets={widgets} />
          </CardContent>
        )}
      </Card>

      <DashboardFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        dashboard={dashboard}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dashboard "{dashboard.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua widget dalam dashboard ini juga akan dihapus. Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDashboard.mutate(dashboard.id)}
              disabled={deleteDashboard.isPending}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface DashboardListProps {
  dashboards: DashboardConfig[];
  onCreateNew: () => void;
}

export function DashboardList({ dashboards, onCreateNew }: DashboardListProps) {
  if (dashboards.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center space-y-3">
        <p className="text-muted-foreground">Belum ada dashboard yang dibuat.</p>
        <Button onClick={onCreateNew}>Buat Dashboard Pertama</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dashboards.map((d) => (
        <DashboardCard key={d.id} dashboard={d} />
      ))}
    </div>
  );
}
