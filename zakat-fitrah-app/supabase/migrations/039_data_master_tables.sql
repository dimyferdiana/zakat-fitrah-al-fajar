BEGIN;

-- Organization settings (single-row table, id = 'org')
CREATE TABLE IF NOT EXISTS public.org_settings (
  id           TEXT PRIMARY KEY DEFAULT 'org',
  nama_lembaga TEXT NOT NULL DEFAULT '',
  alamat       TEXT NOT NULL DEFAULT '',
  no_telp      TEXT,
  email        TEXT,
  logo_url     TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed with current hardcoded values
INSERT INTO public.org_settings (id, nama_lembaga, alamat)
VALUES ('org', 'YAYASAN AL-FAJAR PERMATA PAMULANG', 'Jl. Bukit Permata VII Blok E20/16 Bakti Jaya Setu Tangerang Selatan')
ON CONFLICT (id) DO NOTHING;

-- RLS for org_settings
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_settings_select_active" ON public.org_settings
  FOR SELECT TO authenticated USING (public.get_current_user_is_active());
CREATE POLICY "org_settings_upsert_admin" ON public.org_settings
  FOR ALL TO authenticated
  USING (public.get_current_user_is_active() AND public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_is_active() AND public.get_current_user_role() = 'admin');

-- UPZ collection units
CREATE TABLE IF NOT EXISTS public.upz_units (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_unit    TEXT NOT NULL,
  petugas_amil TEXT,
  lokasi       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER update_upz_units_updated_at
  BEFORE UPDATE ON public.upz_units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for upz_units
ALTER TABLE public.upz_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upz_units_select_active" ON public.upz_units
  FOR SELECT TO authenticated USING (public.get_current_user_is_active());
CREATE POLICY "upz_units_write_admin_petugas" ON public.upz_units
  FOR ALL TO authenticated
  USING (public.get_current_user_is_active() AND public.get_current_user_role() IN ('admin', 'petugas'))
  WITH CHECK (public.get_current_user_is_active() AND public.get_current_user_role() IN ('admin', 'petugas'));

COMMIT;
