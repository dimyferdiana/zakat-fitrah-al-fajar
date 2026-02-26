import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import type {
  DashboardWidget,
  WidgetType,
  WidgetConfig,
  StatCardConfig,
  DistribusiProgressConfig,
  TextNoteConfig,
  HakAmilConfig,
  SectionTitleConfig,
  AggregationRuleId,
  StatFormat,
} from '@/types/dashboard';
import { AGGREGATION_RULES } from '@/lib/aggregationRules';
import { useCreateWidget, useUpdateWidget } from '@/hooks/useDashboardConfig';

const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: 'stat_card', label: 'Stat Card — Angka Ringkasan' },
  { value: 'chart', label: 'Grafik Bulanan' },
  { value: 'distribusi_progress', label: 'Progress Distribusi' },
  { value: 'hak_amil', label: 'Hak Amil' },
  { value: 'hak_amil_trend', label: 'Tren Hak Amil' },
  { value: 'section_title', label: 'Judul Bagian' },
  { value: 'text_note', label: 'Catatan Teks' },
];

const STAT_CARD_FORMATS = [
  { value: 'number', label: 'Angka (1.234)' },
  { value: 'currency', label: 'Mata Uang (Rp 1.234)' },
  { value: 'weight', label: 'Berat (1,23 kg)' },
];

const schema = z.object({
  widget_type: z.enum(['stat_card', 'chart', 'distribusi_progress', 'hak_amil', 'hak_amil_trend', 'section_title', 'text_note']),
  width: z.enum(['full', 'half']),
  // stat_card specific
  rule: z.string().optional(),
  label: z.string().optional(),
  format: z.string().optional(),
  icon: z.string().optional(),
  // distribusi_progress specific
  jenis: z.string().optional(),
  // text_note specific
  content: z.string().optional(),
  // section_title specific
  title: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface WidgetEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId: string;
  widget?: DashboardWidget | null;
  nextSortOrder?: number;
}

export function WidgetEditorSheet({
  open,
  onOpenChange,
  dashboardId,
  widget,
  nextSortOrder = 0,
}: WidgetEditorSheetProps) {
  const isEdit = !!widget;
  const create = useCreateWidget();
  const update = useUpdateWidget();

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      widget_type: 'stat_card',
      width: 'full',
      rule: AGGREGATION_RULES[0]?.id,
      label: '',
      format: 'number',
      icon: 'BarChart2',
      jenis: 'beras',
      content: '',
      title: '',
    },
  });

  const widgetType = useWatch({ control: form.control, name: 'widget_type' });
  const watchedRule = useWatch({ control: form.control, name: 'rule' });

  useEffect(() => {
    if (widget) {
      const cfg = widget.config as Record<string, string>;
      form.reset({
        widget_type: widget.widget_type,
        width: widget.width,
        rule: cfg.rule ?? AGGREGATION_RULES[0]?.id,
        label: cfg.label ?? '',
        format: cfg.format ?? 'number',
        icon: cfg.icon ?? 'BarChart2',
        jenis: cfg.jenis ?? 'beras',
        content: cfg.content ?? '',
        title: cfg.title ?? '',
      });
    } else {
      form.reset({
        widget_type: 'stat_card',
        width: 'full',
        rule: AGGREGATION_RULES[0]?.id,
        label: '',
        format: 'number',
        icon: 'BarChart2',
        jenis: 'beras',
        content: '',
        title: '',
      });
    }
  }, [widget, form, open]);

  // Auto-fill label from selected rule when adding new widget
  const selectedRule = AGGREGATION_RULES.find((r) => r.id === watchedRule);
  useEffect(() => {
    if (!isEdit && selectedRule && !form.getValues('label')) {
      form.setValue('label', selectedRule.label);
      form.setValue('format', selectedRule.format);
    }
  }, [selectedRule, isEdit, form]);

  const buildConfig = (values: FormValues): WidgetConfig => {
    if (values.widget_type === 'stat_card') {
      return {
        rule: (values.rule ?? '') as AggregationRuleId,
        label: values.label ?? '',
        format: (values.format ?? 'number') as StatFormat,
        icon: values.icon,
      } as StatCardConfig;
    }
    if (values.widget_type === 'distribusi_progress') {
      return { jenis: (values.jenis ?? 'beras') as 'beras' | 'uang' } as DistribusiProgressConfig;
    }
    if (values.widget_type === 'text_note') {
      return { content: values.content ?? '' } as TextNoteConfig;
    }
    if (values.widget_type === 'section_title') {
      return { title: values.title ?? '' } as SectionTitleConfig;
    }
    return {} as HakAmilConfig;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const config = buildConfig(values);
      if (isEdit && widget) {
        await update.mutateAsync({
          id: widget.id,
          dashboard_id: dashboardId,
          widget_type: values.widget_type,
          width: values.width,
          config,
        });
      } else {
        await create.mutateAsync({
          dashboard_id: dashboardId,
          widget_type: values.widget_type,
          width: values.width,
          config,
          sort_order: nextSortOrder,
        });
      }
      onOpenChange(false);
    } catch {
      // error shown via toast in hook
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{isEdit ? 'Edit Widget' : 'Tambah Widget Baru'}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="widget_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Widget</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WIDGET_TYPES.map((wt) => (
                        <SelectItem key={wt.value} value={wt.value}>
                          {wt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lebar</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full">Penuh (Full Width)</SelectItem>
                      <SelectItem value="half">Setengah (Half Width)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stat Card specific fields */}
            {widgetType === 'stat_card' && (
              <>
                <FormField
                  control={form.control}
                  name="rule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data yang Ditampilkan</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AGGREGATION_RULES.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label (judul kartu)</FormLabel>
                      <FormControl>
                        <Input placeholder="Judul kartu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Format Nilai</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STAT_CARD_FORMATS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Ikon (Lucide)</FormLabel>
                      <FormControl>
                        <Input placeholder="BarChart2, Users, Coins, ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Distribusi Progress specific */}
            {widgetType === 'distribusi_progress' && (
              <FormField
                control={form.control}
                name="jenis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beras">Beras</SelectItem>
                        <SelectItem value="uang">Uang</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Text Note specific */}
            {widgetType === 'text_note' && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konten (Markdown sederhana)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="# Judul&#10;**tebal** atau *miring*&#10;- item 1"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Section Title specific */}
            {widgetType === 'section_title' && (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Bagian</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Ringkasan Keuangan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
