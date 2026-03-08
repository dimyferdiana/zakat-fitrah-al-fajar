-- =========================================
-- Add new dashboard widget type: hak_amil_beras
-- Required for separate rice-only Hak Amil widget.
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
    'hak_amil_beras',
    'hak_amil_trend',
    'text_note',
    'section_title'
  ));

COMMIT;
