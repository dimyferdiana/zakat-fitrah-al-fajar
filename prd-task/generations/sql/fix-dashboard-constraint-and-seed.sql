-- =====================================================================
-- APPLY THIS TO: Supabase SQL Editor (production project)
-- Fixes: dashboard creation fails with 400 (section_title / hak_amil_trend
--        widget types not allowed by check constraint)
-- Also:  seeds the default "Dashboard Utama" if none exists yet
-- STEP 1 of 2: fixes the constraint (same as migration 032)
-- STEP 2 of 2: seeds the default dashboard + all default widgets
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Fix widget_type constraint (add section_title + hak_amil_trend)
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Seed default "Dashboard Utama" (skips if one already exists)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_dashboard_id UUID;
BEGIN
  -- Only seed if no dashboards exist at all
  IF (SELECT COUNT(*) FROM public.dashboard_configs) > 0 THEN
    RAISE NOTICE 'Dashboard already exists — skipping seed.';
    RETURN;
  END IF;

  INSERT INTO public.dashboard_configs (title, description, visibility, stat_card_columns, sort_order)
  VALUES ('Dashboard Utama', 'Dashboard lengkap dengan semua statistik zakat', 'public', 3, 0)
  RETURNING id INTO v_dashboard_id;

  INSERT INTO public.dashboard_widgets (dashboard_id, widget_type, sort_order, width, config) VALUES
    -- Ringkasan utama
    (v_dashboard_id, 'section_title',         0,  'full', '{"title":"Ringkasan Utama"}'),
    (v_dashboard_id, 'stat_card',              1,  'half', '{"label":"Total Muzakki","icon":"Users","rule":"total_muzakki","format":"number"}'),
    (v_dashboard_id, 'stat_card',              2,  'half', '{"label":"Mustahik Aktif","icon":"Heart","rule":"total_mustahik_aktif","format":"number"}'),
    (v_dashboard_id, 'stat_card',              3,  'half', '{"label":"Mustahik Non-Aktif","icon":"Heart","rule":"total_mustahik_nonaktif","format":"number"}'),

    -- Pemasukan
    (v_dashboard_id, 'section_title',          4,  'full', '{"title":"Pemasukan Zakat & Dana"}'),
    (v_dashboard_id, 'stat_card',              5,  'half', '{"label":"Zakat Uang Terkumpul","icon":"Coins","rule":"zakat_uang_terkumpul","format":"currency"}'),
    (v_dashboard_id, 'stat_card',              6,  'half', '{"label":"Zakat Beras Terkumpul","icon":"Package","rule":"zakat_beras_terkumpul","format":"weight"}'),
    (v_dashboard_id, 'stat_card',              7,  'half', '{"label":"Fidyah Uang","icon":"HandHeart","rule":"fidyah_uang","format":"currency"}'),
    (v_dashboard_id, 'stat_card',              8,  'half', '{"label":"Fidyah Beras","icon":"HandHeart","rule":"fidyah_beras","format":"weight"}'),
    (v_dashboard_id, 'stat_card',              9,  'half', '{"label":"Infak/Sedekah Uang","icon":"Gift","rule":"infak_sedekah_uang","format":"currency"}'),
    (v_dashboard_id, 'stat_card',             10,  'half', '{"label":"Infak/Sedekah Beras","icon":"Gift","rule":"infak_sedekah_beras","format":"weight"}'),
    (v_dashboard_id, 'stat_card',             11,  'half', '{"label":"Maal/Penghasilan Uang","icon":"Coins","rule":"maal_penghasilan_uang","format":"currency"}'),
    (v_dashboard_id, 'stat_card',             12,  'half', '{"label":"Total Pemasukan Uang","icon":"Banknote","rule":"total_pemasukan_uang","format":"currency"}'),
    (v_dashboard_id, 'stat_card',             13,  'half', '{"label":"Total Pemasukan Beras","icon":"Wheat","rule":"total_pemasukan_beras","format":"weight"}'),

    -- Distribusi
    (v_dashboard_id, 'section_title',         14,  'full', '{"title":"Distribusi"}'),
    (v_dashboard_id, 'stat_card',             15,  'half', '{"label":"Beras Tersalurkan","icon":"Send","rule":"distribusi_beras","format":"weight"}'),
    (v_dashboard_id, 'stat_card',             16,  'half', '{"label":"Uang Tersalurkan","icon":"TrendingUp","rule":"distribusi_uang","format":"currency"}'),
    (v_dashboard_id, 'distribusi_progress',   17,  'half', '{"jenis":"beras"}'),
    (v_dashboard_id, 'distribusi_progress',   18,  'half', '{"jenis":"uang"}'),

    -- Hak amil
    (v_dashboard_id, 'section_title',         19,  'full', '{"title":"Hak Amil"}'),
    (v_dashboard_id, 'stat_card',             20,  'half', '{"label":"Hak Amil Uang","icon":"Coins","rule":"hak_amil_uang","format":"currency"}'),
    (v_dashboard_id, 'stat_card',             21,  'half', '{"label":"Hak Amil Beras","icon":"Wheat","rule":"hak_amil_beras","format":"weight"}'),
    (v_dashboard_id, 'hak_amil',              22,  'full', '{}'),
    (v_dashboard_id, 'hak_amil_trend',        23,  'full', '{}'),

    -- Tren pemasukan
    (v_dashboard_id, 'section_title',         24,  'full', '{"title":"Tren Pemasukan"}'),
    (v_dashboard_id, 'chart',                 25,  'full', '{"data_type":"uang","categories":[]}'),
    (v_dashboard_id, 'chart',                 26,  'full', '{"data_type":"beras","categories":[]}');

  RAISE NOTICE 'Default dashboard seeded with id: %', v_dashboard_id;
END;
$$;
