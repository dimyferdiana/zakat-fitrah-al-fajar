-- Migration: 027_dashboard_configs
-- Creates dashboard_configs and dashboard_widgets tables for the Dashboard Configuration feature.

-- ─────────────────────────────────────────
-- TABLE: dashboard_configs
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dashboard_configs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text NOT NULL,
  description        text,
  visibility         text NOT NULL DEFAULT 'public',
  sort_order         integer NOT NULL DEFAULT 0,
  stat_card_columns  integer NOT NULL DEFAULT 3,
  created_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT dashboard_configs_visibility_check
    CHECK (visibility IN ('public', 'private')),
  CONSTRAINT dashboard_configs_stat_card_columns_check
    CHECK (stat_card_columns IN (1, 2, 3))
);

-- ─────────────────────────────────────────
-- TABLE: dashboard_widgets
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id  uuid NOT NULL REFERENCES public.dashboard_configs(id) ON DELETE CASCADE,
  widget_type   text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0,
  width         text NOT NULL DEFAULT 'full',
  config        jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT dashboard_widgets_widget_type_check
    CHECK (widget_type IN ('stat_card', 'chart', 'distribusi_progress', 'hak_amil', 'hak_amil_trend', 'text_note', 'section_title')),
  CONSTRAINT dashboard_widgets_width_check
    CHECK (width IN ('full', 'half'))
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_visibility ON public.dashboard_configs(visibility);
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_sort_order ON public.dashboard_configs(sort_order);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id ON public.dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_sort_order ON public.dashboard_widgets(dashboard_id, sort_order);

-- ─────────────────────────────────────────
-- updated_at auto-trigger
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_dashboard_configs_updated_at
  BEFORE UPDATE ON public.dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_dashboard_widgets_updated_at
  BEFORE UPDATE ON public.dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Helper: is current user admin?
-- Reuses the existing pattern: role is stored in public.users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- dashboard_configs: SELECT
CREATE POLICY "dashboard_configs_select" ON public.dashboard_configs
  FOR SELECT TO authenticated
  USING (visibility = 'public' OR public.is_admin());

-- dashboard_configs: INSERT (admin only)
CREATE POLICY "dashboard_configs_insert" ON public.dashboard_configs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- dashboard_configs: UPDATE (admin only)
CREATE POLICY "dashboard_configs_update" ON public.dashboard_configs
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- dashboard_configs: DELETE (admin only)
CREATE POLICY "dashboard_configs_delete" ON public.dashboard_configs
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- dashboard_widgets: SELECT (can see widget if can see its dashboard)
CREATE POLICY "dashboard_widgets_select" ON public.dashboard_widgets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboard_configs dc
      WHERE dc.id = dashboard_id
        AND (dc.visibility = 'public' OR public.is_admin())
    )
  );

-- dashboard_widgets: INSERT (admin only)
CREATE POLICY "dashboard_widgets_insert" ON public.dashboard_widgets
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- dashboard_widgets: UPDATE (admin only)
CREATE POLICY "dashboard_widgets_update" ON public.dashboard_widgets
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- dashboard_widgets: DELETE (admin only)
CREATE POLICY "dashboard_widgets_delete" ON public.dashboard_widgets
  FOR DELETE TO authenticated
  USING (public.is_admin());
