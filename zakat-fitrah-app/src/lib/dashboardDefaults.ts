import { supabase } from '@/lib/supabase';
import type {
  CreateDashboardInput,
  WidgetType,
  WidgetWidth,
  WidgetConfig,
} from '@/types/dashboard';

// New tables not yet in generated types — cast to bypass type system until migration is applied
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─────────────────────────────────────────────────────────────────────────────
// Default Dashboard configuration (PRD §4.6)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_DASHBOARD_CONFIG: CreateDashboardInput = {
  title: 'Dashboard Utama',
  description: 'Dashboard lengkap dengan semua statistik zakat',
  visibility: 'public',
  stat_card_columns: 3,
  sort_order: 0,
};

interface DefaultWidget {
  widget_type: WidgetType;
  sort_order: number;
  width: WidgetWidth;
  config: WidgetConfig;
}

export const DEFAULT_DASHBOARD_WIDGETS: DefaultWidget[] = [
  // StatCards
  { widget_type: 'stat_card', sort_order: 0, width: 'full', config: { label: 'Total Muzakki', icon: 'Users', rule: 'total_muzakki', format: 'number' } },
  { widget_type: 'stat_card', sort_order: 1, width: 'full', config: { label: 'Mustahik Aktif', icon: 'Heart', rule: 'total_mustahik_aktif', format: 'number' } },
  { widget_type: 'stat_card', sort_order: 2, width: 'full', config: { label: 'Mustahik Non-Aktif', icon: 'Heart', rule: 'total_mustahik_nonaktif', format: 'number' } },
  { widget_type: 'stat_card', sort_order: 3, width: 'full', config: { label: 'Zakat Beras Terkumpul', icon: 'Package', rule: 'zakat_beras_terkumpul', format: 'weight' } },
  { widget_type: 'stat_card', sort_order: 4, width: 'full', config: { label: 'Zakat Uang Terkumpul', icon: 'Coins', rule: 'zakat_uang_terkumpul', format: 'currency' } },
  { widget_type: 'stat_card', sort_order: 5, width: 'full', config: { label: 'Beras Tersalurkan', icon: 'Send', rule: 'distribusi_beras', format: 'weight' } },
  { widget_type: 'stat_card', sort_order: 6, width: 'full', config: { label: 'Uang Tersalurkan', icon: 'TrendingUp', rule: 'distribusi_uang', format: 'currency' } },
  { widget_type: 'stat_card', sort_order: 7, width: 'full', config: { label: 'Fidyah Uang', icon: 'HandHeart', rule: 'fidyah_uang', format: 'currency' } },
  { widget_type: 'stat_card', sort_order: 8, width: 'full', config: { label: 'Fidyah Beras', icon: 'HandHeart', rule: 'fidyah_beras', format: 'weight' } },
  { widget_type: 'stat_card', sort_order: 9, width: 'full', config: { label: 'Infak/Sedekah Uang', icon: 'Gift', rule: 'infak_sedekah_uang', format: 'currency' } },
  { widget_type: 'stat_card', sort_order: 10, width: 'full', config: { label: 'Infak/Sedekah Beras', icon: 'Gift', rule: 'infak_sedekah_beras', format: 'weight' } },
  { widget_type: 'stat_card', sort_order: 11, width: 'full', config: { label: 'Maal/Penghasilan Uang', icon: 'Coins', rule: 'maal_penghasilan_uang', format: 'currency' } },
  { widget_type: 'stat_card', sort_order: 12, width: 'full', config: { label: 'Total Pemasukan Uang', icon: 'Banknote', rule: 'total_pemasukan_uang', format: 'currency' } },
  { widget_type: 'stat_card', sort_order: 13, width: 'full', config: { label: 'Total Pemasukan Beras', icon: 'Wheat', rule: 'total_pemasukan_beras', format: 'weight' } },
  { widget_type: 'stat_card', sort_order: 14, width: 'full', config: { label: 'Hak Amil Uang', icon: 'Coins', rule: 'hak_amil_uang', format: 'currency' } },
  // HakAmil summary card
  { widget_type: 'hak_amil', sort_order: 15, width: 'full', config: {} },
  // Distribusi Progress
  { widget_type: 'distribusi_progress', sort_order: 16, width: 'half', config: { jenis: 'beras' } },
  { widget_type: 'distribusi_progress', sort_order: 17, width: 'half', config: { jenis: 'uang' } },
  // Charts
  { widget_type: 'chart', sort_order: 18, width: 'full', config: { data_type: 'uang', categories: [] } },
  { widget_type: 'chart', sort_order: 19, width: 'full', config: { data_type: 'beras', categories: [] } },
];

// ─────────────────────────────────────────────────────────────────────────────
// createDefaultDashboard — utility (not a hook, safe to call outside React)
// ─────────────────────────────────────────────────────────────────────────────

export async function createDefaultDashboard(): Promise<string> {
  // Insert the dashboard config
  const { data: newDashboard, error: dashboardError } = await db
    .from('dashboard_configs')
    .insert({
      title: DEFAULT_DASHBOARD_CONFIG.title,
      description: DEFAULT_DASHBOARD_CONFIG.description,
      visibility: DEFAULT_DASHBOARD_CONFIG.visibility,
      stat_card_columns: DEFAULT_DASHBOARD_CONFIG.stat_card_columns,
      sort_order: DEFAULT_DASHBOARD_CONFIG.sort_order ?? 0,
    })
    .select('id')
    .single();

  if (dashboardError || !newDashboard) {
    throw new Error(`Failed to create default dashboard: ${dashboardError?.message}`);
  }

  const dashboardId = (newDashboard as { id: string }).id;

  // Bulk-insert all default widgets
  const widgetsToInsert = DEFAULT_DASHBOARD_WIDGETS.map((w) => ({
    dashboard_id: dashboardId,
    widget_type: w.widget_type,
    sort_order: w.sort_order,
    width: w.width,
    config: w.config,
  }));

  const { error: widgetsError } = await db
    .from('dashboard_widgets')
    .insert(widgetsToInsert);

  if (widgetsError) {
    throw new Error(`Failed to insert default widgets: ${widgetsError.message}`);
  }

  return dashboardId;
}
