import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type {
  DashboardConfig,
  DashboardWidget,
  CreateDashboardInput,
  UpdateDashboardInput,
  CreateWidgetInput,
  UpdateWidgetInput,
} from '@/types/dashboard';
import { DEFAULT_DASHBOARD_WIDGETS } from '@/lib/dashboardDefaults';

const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

const OFFLINE_DASHBOARD: DashboardConfig = {
  id: 'offline-dashboard-utama',
  title: 'Dashboard Utama (Offline)',
  description: 'Mode offline menggunakan data lokal',
  visibility: 'public',
  sort_order: 0,
  stat_card_columns: 3,
  created_by: 'mock-admin-001',
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

const OFFLINE_WIDGETS: DashboardWidget[] = DEFAULT_DASHBOARD_WIDGETS.map((w, index) => ({
  id: `offline-widget-${index}`,
  dashboard_id: OFFLINE_DASHBOARD.id,
  widget_type: w.widget_type,
  sort_order: w.sort_order,
  width: w.width,
  config: w.config,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
}));

let offlineDashboards: DashboardConfig[] = [OFFLINE_DASHBOARD];
let offlineWidgetsByDashboard: Record<string, DashboardWidget[]> = {
  [OFFLINE_DASHBOARD.id]: OFFLINE_WIDGETS,
};

function createOfflineId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// New tables not yet in generated types — cast to bypass type system until migration is applied
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch all dashboards accessible to the current user (RLS handles filtering). */
export function useDashboardConfigs() {
  return useQuery({
    queryKey: ['dashboard-configs'],
    queryFn: async (): Promise<DashboardConfig[]> => {
      if (OFFLINE_MODE) {
        return [...offlineDashboards].sort((a, b) => a.sort_order - b.sort_order);
      }

      const { data, error } = await db
        .from('dashboard_configs')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as DashboardConfig[];
    },
  });
}

/** Fetch all widgets for a given dashboard, ordered by sort_order. */
export function useDashboardWidgets(dashboardId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-widgets', dashboardId],
    queryFn: async (): Promise<DashboardWidget[]> => {
      if (!dashboardId) return [];

      if (OFFLINE_MODE) {
        return [...(offlineWidgetsByDashboard[dashboardId] || [])].sort((a, b) => a.sort_order - b.sort_order);
      }

      const { data, error } = await db
        .from('dashboard_widgets')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as DashboardWidget[];
    },
    enabled: !!dashboardId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDashboardInput): Promise<DashboardConfig> => {
      if (OFFLINE_MODE) {
        const now = new Date().toISOString();
        const created: DashboardConfig = {
          id: createOfflineId('offline-dashboard'),
          title: input.title,
          description: input.description ?? null,
          visibility: input.visibility,
          sort_order: input.sort_order ?? offlineDashboards.length,
          stat_card_columns: input.stat_card_columns,
          created_by: 'mock-admin-001',
          created_at: now,
          updated_at: now,
        };
        offlineDashboards = [...offlineDashboards, created];
        offlineWidgetsByDashboard[created.id] = [];
        return created;
      }

      const { data, error } = await db
        .from('dashboard_configs')
        .insert({
          title: input.title,
          description: input.description ?? null,
          visibility: input.visibility,
          stat_card_columns: input.stat_card_columns,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DashboardConfig;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-configs'] });
      toast.success('Dashboard berhasil dibuat');
    },
    onError: (err: Error) => {
      toast.error(`Gagal membuat dashboard: ${err.message}`);
    },
  });
}

export function useUpdateDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateDashboardInput): Promise<DashboardConfig> => {
      if (OFFLINE_MODE) {
        const index = offlineDashboards.findIndex((d) => d.id === input.id);
        if (index < 0) throw new Error('Dashboard tidak ditemukan');
        const updated: DashboardConfig = {
          ...offlineDashboards[index],
          ...input,
          updated_at: new Date().toISOString(),
        };
        offlineDashboards = offlineDashboards.map((d, i) => (i === index ? updated : d));
        return updated;
      }

      const { id, ...rest } = input;
      const { data, error } = await db
        .from('dashboard_configs')
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DashboardConfig;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-configs'] });
      toast.success('Dashboard berhasil diperbarui');
    },
    onError: (err: Error) => {
      toast.error(`Gagal memperbarui dashboard: ${err.message}`);
    },
  });
}

export function useDeleteDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (OFFLINE_MODE) {
        offlineDashboards = offlineDashboards.filter((d) => d.id !== id);
        delete offlineWidgetsByDashboard[id];
        return;
      }

      const { error } = await db
        .from('dashboard_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-configs'] });
      toast.success('Dashboard berhasil dihapus');
    },
    onError: (err: Error) => {
      toast.error(`Gagal menghapus dashboard: ${err.message}`);
    },
  });
}

export function useDuplicateDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dashboardId: string): Promise<string> => {
      if (OFFLINE_MODE) {
        const source = offlineDashboards.find((d) => d.id === dashboardId);
        if (!source) throw new Error('Dashboard tidak ditemukan');

        const newId = createOfflineId('offline-dashboard');
        const now = new Date().toISOString();
        const clonedDashboard: DashboardConfig = {
          ...source,
          id: newId,
          title: `${source.title} — Salinan`,
          created_at: now,
          updated_at: now,
        };

        offlineDashboards = [...offlineDashboards, clonedDashboard];

        const sourceWidgets = offlineWidgetsByDashboard[dashboardId] || [];
        offlineWidgetsByDashboard[newId] = sourceWidgets.map((w) => ({
          ...w,
          id: createOfflineId('offline-widget'),
          dashboard_id: newId,
          created_at: now,
          updated_at: now,
        }));

        return newId;
      }

      // 1. Fetch the source dashboard
      const { data: source, error: srcError } = await db
        .from('dashboard_configs')
        .select('*')
        .eq('id', dashboardId)
        .single();

      if (srcError || !source) throw new Error(`Dashboard tidak ditemukan: ${srcError?.message}`);

      const src = source as unknown as DashboardConfig;

      // 2. Fetch all widgets of the source dashboard
      const { data: widgets, error: wErr } = await db
        .from('dashboard_widgets')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('sort_order', { ascending: true });

      if (wErr) throw new Error(`Gagal mengambil widget: ${wErr.message}`);

      // 3. Insert new dashboard config
      const { data: newDash, error: newDashErr } = await db
        .from('dashboard_configs')
        .insert({
          title: `${src.title} — Salinan`,
          description: src.description,
          visibility: src.visibility,
          stat_card_columns: src.stat_card_columns,
          sort_order: src.sort_order + 1,
        })
        .select('id')
        .single();

      if (newDashErr || !newDash) throw new Error(`Gagal membuat salinan: ${newDashErr?.message}`);

      const newId = (newDash as { id: string }).id;

      // 4. Bulk-insert widgets under new dashboard
      if (widgets && widgets.length > 0) {
        const newWidgets = (widgets as unknown as DashboardWidget[]).map((w) => ({
          dashboard_id: newId,
          widget_type: w.widget_type,
          sort_order: w.sort_order,
          width: w.width,
          config: w.config,
        }));

        const { error: wInsertErr } = await db
          .from('dashboard_widgets')
          .insert(newWidgets);

        if (wInsertErr) throw new Error(`Gagal menyalin widget: ${wInsertErr.message}`);
      }

      return newId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-configs'] });
      toast.success('Dashboard berhasil diduplikasi');
    },
    onError: (err: Error) => {
      toast.error(`Gagal menduplikasi dashboard: ${err.message}`);
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWidgetInput): Promise<DashboardWidget> => {
      if (OFFLINE_MODE) {
        const now = new Date().toISOString();
        const created: DashboardWidget = {
          id: createOfflineId('offline-widget'),
          dashboard_id: input.dashboard_id,
          widget_type: input.widget_type,
          sort_order: input.sort_order ?? (offlineWidgetsByDashboard[input.dashboard_id]?.length || 0),
          width: input.width ?? 'full',
          config: input.config,
          created_at: now,
          updated_at: now,
        };
        const current = offlineWidgetsByDashboard[input.dashboard_id] || [];
        offlineWidgetsByDashboard[input.dashboard_id] = [...current, created];
        return created;
      }

      const { data, error } = await db
        .from('dashboard_widgets')
        .insert({
          dashboard_id: input.dashboard_id,
          widget_type: input.widget_type,
          sort_order: input.sort_order ?? 0,
          width: input.width ?? 'full',
          config: input.config,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DashboardWidget;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['dashboard-widgets', vars.dashboard_id] });
      toast.success('Widget berhasil ditambahkan');
    },
    onError: (err: Error) => {
      toast.error(`Gagal menambahkan widget: ${err.message}`);
    },
  });
}

export function useUpdateWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateWidgetInput): Promise<DashboardWidget> => {
      if (OFFLINE_MODE) {
        const widgets = offlineWidgetsByDashboard[input.dashboard_id] || [];
        const index = widgets.findIndex((w) => w.id === input.id);
        if (index < 0) throw new Error('Widget tidak ditemukan');

        const updated: DashboardWidget = {
          ...widgets[index],
          ...(input.widget_type ? { widget_type: input.widget_type } : {}),
          ...(input.width ? { width: input.width } : {}),
          ...(input.config ? { config: input.config } : {}),
          ...(input.sort_order !== undefined ? { sort_order: input.sort_order } : {}),
          updated_at: new Date().toISOString(),
        };

        offlineWidgetsByDashboard[input.dashboard_id] = widgets.map((w, i) => (i === index ? updated : w));
        return updated;
      }

      const payload: Partial<Record<string, unknown>> = {};
      if (input.widget_type !== undefined) payload.widget_type = input.widget_type;
      if (input.width !== undefined) payload.width = input.width;
      if (input.config !== undefined) payload.config = input.config;
      if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
      const { data, error } = await db
        .from('dashboard_widgets')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DashboardWidget;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['dashboard-widgets', vars.dashboard_id] });
      toast.success('Widget berhasil diperbarui');
    },
    onError: (err: Error) => {
      toast.error(`Gagal memperbarui widget: ${err.message}`);
    },
  });
}

export function useDeleteWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: {
      id: string;
      dashboard_id: string;
    }): Promise<void> => {
      if (OFFLINE_MODE) {
        for (const dashboardId of Object.keys(offlineWidgetsByDashboard)) {
          offlineWidgetsByDashboard[dashboardId] = offlineWidgetsByDashboard[dashboardId].filter((w) => w.id !== id);
        }
        return;
      }

      const { error } = await db
        .from('dashboard_widgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['dashboard-widgets', vars.dashboard_id] });
      toast.success('Widget berhasil dihapus');
    },
    onError: (err: Error) => {
      toast.error(`Gagal menghapus widget: ${err.message}`);
    },
  });
}

export function useReorderWidgets(dashboardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]): Promise<void> => {
      if (OFFLINE_MODE) {
        const widgets = offlineWidgetsByDashboard[dashboardId] || [];
        const byId = new Map(widgets.map((w) => [w.id, w]));
        offlineWidgetsByDashboard[dashboardId] = orderedIds
          .map((id, index) => {
            const widget = byId.get(id);
            if (!widget) return null;
            return { ...widget, sort_order: index, updated_at: new Date().toISOString() };
          })
          .filter((w): w is DashboardWidget => !!w);
        return;
      }

      await Promise.all(
        orderedIds.map((id, index) =>
          db
            .from('dashboard_widgets')
            .update({ sort_order: index })
            .eq('id', id)
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-widgets', dashboardId] });
    },
    onError: (err: Error) => {
      toast.error(`Gagal menyimpan urutan: ${err.message}`);
    },
  });
}
