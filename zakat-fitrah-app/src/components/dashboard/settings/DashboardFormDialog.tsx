import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DashboardConfig } from '@/types/dashboard';
import { useCreateDashboard, useUpdateDashboard } from '@/hooks/useDashboardConfig';
import { DASHBOARD_TEMPLATE_OPTIONS } from '@/lib/dashboardTemplates';

const schema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']),
  stat_card_columns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  template_id: z.enum(['scratch', 'full', 'monitoring', 'hak_amil_focus']).optional(),
});

type FormValues = z.infer<typeof schema>;

interface DashboardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, dialog is in edit mode */
  dashboard?: DashboardConfig;
  /** Current max sort_order to append new dashboard at end */
  nextSortOrder?: number;
}

export function DashboardFormDialog({
  open,
  onOpenChange,
  dashboard,
  nextSortOrder = 0,
}: DashboardFormDialogProps) {
  const isEdit = !!dashboard;
  const create = useCreateDashboard();
  const update = useUpdateDashboard();

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      visibility: 'public',
      stat_card_columns: 3,
      template_id: 'scratch',
    },
  });

  // Populate form on edit mode
  useEffect(() => {
    if (dashboard) {
      form.reset({
        title: dashboard.title,
        description: dashboard.description ?? '',
        visibility: dashboard.visibility,
        stat_card_columns: dashboard.stat_card_columns,
        template_id: 'scratch',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        visibility: 'public',
        stat_card_columns: 3,
        template_id: 'scratch',
      });
    }
  }, [dashboard, form, open]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && dashboard) {
        await update.mutateAsync({ id: dashboard.id, ...values } as import('@/types/dashboard').UpdateDashboardInput);
      } else {
        await create.mutateAsync({ ...values, sort_order: nextSortOrder } as import('@/types/dashboard').CreateDashboardInput);
      }
      onOpenChange(false);
    } catch {
      // error shown via toast in hook
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Dashboard' : 'Buat Dashboard Baru'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atur judul, visibilitas, dan jumlah kolom stat card dashboard.'
              : 'Atur judul dashboard dan pilih template awal atau mulai dari kosong.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEdit && (
              <FormField
                control={form.control}
                name="template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Dashboard</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DASHBOARD_TEMPLATE_OPTIONS.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {DASHBOARD_TEMPLATE_OPTIONS.find((t) => t.id === field.value)?.description}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama dashboard" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (opsional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi singkat" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibilitas</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Publik (semua dapat melihat)</SelectItem>
                      <SelectItem value="private">Private (hanya admin)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stat_card_columns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kolom Stat Card</FormLabel>
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 Kolom</SelectItem>
                      <SelectItem value="2">2 Kolom</SelectItem>
                      <SelectItem value="3">3 Kolom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Buat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
