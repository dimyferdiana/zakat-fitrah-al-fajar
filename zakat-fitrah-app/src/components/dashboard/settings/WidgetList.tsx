import { useState } from 'react';
import { GripVertical, Pencil, Trash2, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { DashboardWidget, StatCardConfig } from '@/types/dashboard';
import { useDeleteWidget, useReorderWidgets } from '@/hooks/useDashboardConfig';
import { WidgetEditorSheet } from './WidgetEditorSheet';

const WIDGET_TYPE_LABELS: Record<string, string> = {
  stat_card: 'Stat Card',
  chart: 'Grafik',
  distribusi_progress: 'Progress Distribusi',
  hak_amil: 'Hak Amil',
  text_note: 'Catatan',
};

interface SortableItemProps {
  widget: DashboardWidget;
  onEdit: (widget: DashboardWidget) => void;
  onDelete: (widget: DashboardWidget) => void;
}

function SortableItem({ widget, onEdit, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayLabel =
    widget.widget_type === 'stat_card'
      ? (widget.config as StatCardConfig)?.label || WIDGET_TYPE_LABELS.stat_card
      : WIDGET_TYPE_LABELS[widget.widget_type] ?? widget.widget_type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
    >
      <button
        {...listeners}
        {...attributes}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        type="button"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayLabel}</p>
        <div className="flex gap-1 mt-0.5">
          <Badge variant="secondary" className="text-xs">
            {WIDGET_TYPE_LABELS[widget.widget_type] ?? widget.widget_type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {widget.width === 'full' ? 'Penuh' : 'Setengah'}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(widget)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(widget)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface WidgetListProps {
  dashboardId: string;
  widgets: DashboardWidget[];
}

export function WidgetList({ dashboardId, widgets }: WidgetListProps) {
  const [localWidgets, setLocalWidgets] = useState<DashboardWidget[]>(widgets);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DashboardWidget | null>(null);

  const deleteWidget = useDeleteWidget();
  const reorder = useReorderWidgets(dashboardId);

  // Keep local state in sync when parent data changes
  if (widgets.length !== localWidgets.length || widgets.some((w, i) => w.id !== localWidgets[i]?.id)) {
    setLocalWidgets(widgets);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localWidgets.findIndex((w) => w.id === active.id);
    const newIndex = localWidgets.findIndex((w) => w.id === over.id);
    const reordered = arrayMove(localWidgets, oldIndex, newIndex);
    setLocalWidgets(reordered);
    reorder.mutate(reordered.map((w) => w.id));
  };

  const handleEdit = (widget: DashboardWidget) => {
    setEditingWidget(widget);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingWidget(null);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteWidget.mutateAsync({ id: deleteTarget.id, dashboard_id: dashboardId });
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Widget ({localWidgets.length})</p>
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Tambah Widget
          </Button>
        </div>

        {localWidgets.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada widget. Klik "Tambah Widget" untuk mulai.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localWidgets.map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {localWidgets.map((widget) => (
                  <SortableItem
                    key={widget.id}
                    widget={widget}
                    onEdit={handleEdit}
                    onDelete={(w) => setDeleteTarget(w)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <WidgetEditorSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditingWidget(null);
        }}
        dashboardId={dashboardId}
        widget={editingWidget}
        nextSortOrder={localWidgets.length}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Widget?</AlertDialogTitle>
            <AlertDialogDescription>
              Widget ini akan dihapus permanen dari dashboard. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
