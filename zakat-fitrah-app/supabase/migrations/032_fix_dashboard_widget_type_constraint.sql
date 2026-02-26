-- =========================================
-- FIX: dashboard_widgets widget_type constraint
-- Adds missing types: section_title, hak_amil_trend
-- Root cause: migration 027 constraint only listed 5 types, but frontend
-- templates use 7 types (section_title and hak_amil_trend were missing).
-- =========================================

BEGIN;

ALTER TABLE public.dashboard_widgets
  DROP CONSTRAINT IF EXISTS dashboard_widgets_widget_type_check;

ALTER TABLE public.dashboard_widgets
  ADD CONSTRAINT dashboard_widgets_widget_type_check
  CHECK (widget_type IN (
    'stat_card',
    'chart',
    'distribusi_progress',
    'hak_amil',
    'hak_amil_trend',
    'text_note',
    'section_title'
  ));

COMMIT;
