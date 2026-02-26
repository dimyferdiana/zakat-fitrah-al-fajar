// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Configuration Types
// ─────────────────────────────────────────────────────────────────────────────

export type DashboardVisibility = 'public' | 'private';

export interface DashboardConfig {
  id: string;
  title: string;
  description: string | null;
  visibility: DashboardVisibility;
  sort_order: number;
  stat_card_columns: 1 | 2 | 3;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget Types
// ─────────────────────────────────────────────────────────────────────────────

export type WidgetType =
  | 'stat_card'
  | 'chart'
  | 'distribusi_progress'
  | 'hak_amil'
  | 'hak_amil_trend'
  | 'section_title'
  | 'text_note';

export type WidgetWidth = 'full' | 'half';

// ─────────────────────────────────────────────────────────────────────────────
// Aggregation Rule IDs (one per dashboard stat)
// ─────────────────────────────────────────────────────────────────────────────

export type AggregationRuleId =
  | 'zakat_beras_terkumpul'
  | 'zakat_uang_terkumpul'
  | 'fidyah_uang'
  | 'fidyah_beras'
  | 'infak_sedekah_uang'
  | 'infak_sedekah_beras'
  | 'maal_penghasilan_uang'
  | 'total_pemasukan_uang'
  | 'total_pemasukan_beras'
  | 'distribusi_beras'
  | 'distribusi_uang'
  | 'sisa_beras'
  | 'sisa_uang'
  | 'total_muzakki'
  | 'total_mustahik_aktif'
  | 'total_mustahik_nonaktif'
  | 'hak_amil_beras'
  | 'hak_amil_uang';

export type StatFormat = 'currency' | 'weight' | 'number';

// ─────────────────────────────────────────────────────────────────────────────
// Per-widget config shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface StatCardConfig {
  label: string;
  icon: string; // lucide icon name string
  rule: AggregationRuleId;
  format: StatFormat;
}

export interface ChartConfig {
  data_type: 'uang' | 'beras';
  categories?: string[]; // empty = all
}

export interface DistribusiProgressConfig {
  jenis: 'beras' | 'uang';
}

// HakAmil widget has no config options — widget type is self-contained
export type HakAmilConfig = Record<string, never>;

export interface TextNoteConfig {
  content: string;
}

export interface SectionTitleConfig {
  title: string;
}

export type WidgetConfig =
  | StatCardConfig
  | ChartConfig
  | DistribusiProgressConfig
  | HakAmilConfig
  | SectionTitleConfig
  | TextNoteConfig;

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Widget
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: WidgetType;
  sort_order: number;
  width: WidgetWidth;
  config: WidgetConfig;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form / mutation inputs
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateDashboardInput {
  title: string;
  description?: string;
  visibility: DashboardVisibility;
  stat_card_columns: 1 | 2 | 3;
  sort_order?: number;
  template_id?: 'scratch' | 'full' | 'monitoring' | 'hak_amil_focus';
}

export interface UpdateDashboardInput {
  id: string;
  title?: string;
  description?: string;
  visibility?: DashboardVisibility;
  stat_card_columns?: 1 | 2 | 3;
  sort_order?: number;
}

export interface CreateWidgetInput {
  dashboard_id: string;
  widget_type: WidgetType;
  sort_order?: number;
  width?: WidgetWidth;
  config: WidgetConfig;
}

export interface UpdateWidgetInput {
  id: string;
  dashboard_id: string;
  widget_type?: WidgetType;
  sort_order?: number;
  width?: WidgetWidth;
  config?: WidgetConfig;
}
