-- =========================================
-- QURBAN TABLES: REGISTRATIONS + PARTICIPANTS
-- =========================================
-- To apply manually: supabase db push
-- Or: supabase migration up

BEGIN;

-- -------------------------
-- TABLE: qurban_registrations
-- -------------------------
CREATE TABLE IF NOT EXISTS public.qurban_registrations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  no_qurban        text NOT NULL UNIQUE,
  tanggal          date NOT NULL,
  nama             text NOT NULL,
  alamat           text NOT NULL,
  no_hp            text NOT NULL,
  jenis            text NOT NULL CHECK (jenis IN ('sapi', 'kambing')),
  sumber_hewan     text NOT NULL CHECK (sumber_hewan IN ('beli', 'titipan')),
  biaya_perawatan  numeric,
  nominal          numeric NOT NULL,
  status           text NOT NULL DEFAULT 'terdaftar' CHECK (status IN ('terdaftar', 'lunas')),
  catatan          text,
  photo_url        text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- -------------------------
-- TABLE: qurban_participants
-- -------------------------
CREATE TABLE IF NOT EXISTS public.qurban_participants (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qurban_registration_id  uuid NOT NULL REFERENCES public.qurban_registrations(id) ON DELETE CASCADE,
  nama                    text NOT NULL,
  urutan                  integer NOT NULL,
  UNIQUE(qurban_registration_id, urutan)
);

-- -------------------------
-- INDEXES
-- -------------------------
CREATE INDEX IF NOT EXISTS idx_qurban_registrations_jenis ON public.qurban_registrations(jenis);
CREATE INDEX IF NOT EXISTS idx_qurban_registrations_status ON public.qurban_registrations(status);
CREATE INDEX IF NOT EXISTS idx_qurban_registrations_tanggal ON public.qurban_registrations(tanggal);
CREATE INDEX IF NOT EXISTS idx_qurban_participants_registration_id ON public.qurban_participants(qurban_registration_id);

-- -------------------------
-- FUNCTION: auto-generate no_qurban
-- Format: SAP-YYYY-NNN (sapi) or KAM-YYYY-NNN (kambing)
-- Sequential per jenis per tahun
-- -------------------------
CREATE OR REPLACE FUNCTION public.generate_no_qurban()
RETURNS TRIGGER AS $$
DECLARE
  prefix text;
  year_str text;
  seq_num integer;
  new_no text;
BEGIN
  prefix := CASE WHEN NEW.jenis = 'sapi' THEN 'SAP' ELSE 'KAM' END;
  year_str := to_char(NEW.tanggal, 'YYYY');

  SELECT COUNT(*) + 1
  INTO seq_num
  FROM public.qurban_registrations
  WHERE jenis = NEW.jenis
    AND to_char(tanggal, 'YYYY') = year_str;

  new_no := prefix || '-' || year_str || '-' || lpad(seq_num::text, 3, '0');
  NEW.no_qurban := new_no;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_no_qurban
  BEFORE INSERT ON public.qurban_registrations
  FOR EACH ROW
  WHEN (NEW.no_qurban IS NULL OR NEW.no_qurban = '')
  EXECUTE FUNCTION public.generate_no_qurban();

-- -------------------------
-- FUNCTION + TRIGGER: updated_at
-- -------------------------
CREATE OR REPLACE FUNCTION public.update_qurban_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qurban_registrations_updated_at
  BEFORE UPDATE ON public.qurban_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_qurban_updated_at();

-- -------------------------
-- ENABLE RLS
-- -------------------------
ALTER TABLE public.qurban_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_participants ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- RLS POLICIES: qurban_registrations
-- -------------------------
DROP POLICY IF EXISTS "qurban_registrations_select_admin_petugas_viewer_active" ON public.qurban_registrations;
DROP POLICY IF EXISTS "qurban_registrations_insert_admin_petugas_active" ON public.qurban_registrations;
DROP POLICY IF EXISTS "qurban_registrations_update_admin_petugas_active" ON public.qurban_registrations;
DROP POLICY IF EXISTS "qurban_registrations_delete_admin_petugas_active" ON public.qurban_registrations;

CREATE POLICY "qurban_registrations_select_admin_petugas_viewer_active"
  ON public.qurban_registrations FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas', 'viewer')
  );

CREATE POLICY "qurban_registrations_insert_admin_petugas_active"
  ON public.qurban_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_registrations_update_admin_petugas_active"
  ON public.qurban_registrations FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_registrations_delete_admin_petugas_active"
  ON public.qurban_registrations FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

-- -------------------------
-- RLS POLICIES: qurban_participants
-- -------------------------
DROP POLICY IF EXISTS "qurban_participants_select_admin_petugas_viewer_active" ON public.qurban_participants;
DROP POLICY IF EXISTS "qurban_participants_insert_admin_petugas_active" ON public.qurban_participants;
DROP POLICY IF EXISTS "qurban_participants_update_admin_petugas_active" ON public.qurban_participants;
DROP POLICY IF EXISTS "qurban_participants_delete_admin_petugas_active" ON public.qurban_participants;

CREATE POLICY "qurban_participants_select_admin_petugas_viewer_active"
  ON public.qurban_participants FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas', 'viewer')
  );

CREATE POLICY "qurban_participants_insert_admin_petugas_active"
  ON public.qurban_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_participants_update_admin_petugas_active"
  ON public.qurban_participants FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_participants_delete_admin_petugas_active"
  ON public.qurban_participants FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

COMMIT;
