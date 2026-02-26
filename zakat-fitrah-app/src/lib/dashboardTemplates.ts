import type { WidgetConfig, WidgetType, WidgetWidth } from '@/types/dashboard';
import { DEFAULT_DASHBOARD_WIDGETS } from '@/lib/dashboardDefaults';

export type DashboardTemplateId =
  | 'scratch'
  | 'full'
  | 'monitoring'
  | 'hak_amil_focus';

export interface DashboardTemplateOption {
  id: DashboardTemplateId;
  label: string;
  description: string;
}

export interface TemplateWidget {
  widget_type: WidgetType;
  sort_order: number;
  width: WidgetWidth;
  config: WidgetConfig;
}

export const DASHBOARD_TEMPLATE_OPTIONS: DashboardTemplateOption[] = [
  {
    id: 'scratch',
    label: 'Mulai dari Kosong',
    description: 'Buat dashboard kosong lalu susun widget sendiri.',
  },
  {
    id: 'full',
    label: 'Template Lengkap',
    description: 'Semua stat card, hak amil, progress distribusi, dan grafik.',
  },
  {
    id: 'monitoring',
    label: 'Template Monitoring Harian',
    description: 'Fokus ke ringkasan operasional harian dan progres distribusi.',
  },
  {
    id: 'hak_amil_focus',
    label: 'Template Fokus Hak Amil',
    description: 'Prioritas untuk pemantauan hak amil dan tren per kategori.',
  },
];

const MONITORING_TEMPLATE: Omit<TemplateWidget, 'sort_order'>[] = [
  { widget_type: 'section_title', width: 'full', config: { title: 'Ringkasan Harian' } },
  { widget_type: 'stat_card', width: 'full', config: { label: 'Total Pemasukan Uang', icon: 'Banknote', rule: 'total_pemasukan_uang', format: 'currency' } },
  { widget_type: 'stat_card', width: 'full', config: { label: 'Total Pemasukan Beras', icon: 'Wheat', rule: 'total_pemasukan_beras', format: 'weight' } },
  { widget_type: 'stat_card', width: 'full', config: { label: 'Hak Amil Uang', icon: 'Coins', rule: 'hak_amil_uang', format: 'currency' } },
  { widget_type: 'stat_card', width: 'full', config: { label: 'Hak Amil Beras', icon: 'Wheat', rule: 'hak_amil_beras', format: 'weight' } },
  { widget_type: 'section_title', width: 'full', config: { title: 'Distribusi' } },
  { widget_type: 'distribusi_progress', width: 'half', config: { jenis: 'beras' } },
  { widget_type: 'distribusi_progress', width: 'half', config: { jenis: 'uang' } },
  { widget_type: 'chart', width: 'full', config: { data_type: 'uang', categories: [] } },
  { widget_type: 'chart', width: 'full', config: { data_type: 'beras', categories: [] } },
];

const HAK_AMIL_FOCUS_TEMPLATE: Omit<TemplateWidget, 'sort_order'>[] = [
  { widget_type: 'section_title', width: 'full', config: { title: 'Ringkasan Hak Amil' } },
  { widget_type: 'hak_amil', width: 'full', config: {} },
  { widget_type: 'hak_amil_trend', width: 'full', config: {} },
  { widget_type: 'stat_card', width: 'full', config: { label: 'Hak Amil Uang', icon: 'Coins', rule: 'hak_amil_uang', format: 'currency' } },
  { widget_type: 'stat_card', width: 'full', config: { label: 'Hak Amil Beras', icon: 'Wheat', rule: 'hak_amil_beras', format: 'weight' } },
  { widget_type: 'stat_card', width: 'full', config: { label: 'Zakat Uang Terkumpul', icon: 'Coins', rule: 'zakat_uang_terkumpul', format: 'currency' } },
  { widget_type: 'stat_card', width: 'full', config: { label: 'Infak/Sedekah Uang', icon: 'Gift', rule: 'infak_sedekah_uang', format: 'currency' } },
  { widget_type: 'section_title', width: 'full', config: { title: 'Catatan' } },
  { widget_type: 'text_note', width: 'full', config: { content: 'Gunakan section ini untuk analisis dan tindak lanjut hak amil.' } },
];

function withSortOrder(items: Omit<TemplateWidget, 'sort_order'>[]): TemplateWidget[] {
  return items.map((item, index) => ({ ...item, sort_order: index }));
}

export function getTemplateWidgets(templateId: DashboardTemplateId): TemplateWidget[] {
  if (templateId === 'scratch') return [];
  if (templateId === 'monitoring') return withSortOrder(MONITORING_TEMPLATE);
  if (templateId === 'hak_amil_focus') return withSortOrder(HAK_AMIL_FOCUS_TEMPLATE);
  return DEFAULT_DASHBOARD_WIDGETS.map((w) => ({ ...w }));
}
