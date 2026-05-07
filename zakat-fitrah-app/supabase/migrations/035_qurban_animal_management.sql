-- =========================================
-- QURBAN ANIMAL MANAGEMENT: EVENTS + ANIMALS + SHARES
-- =========================================
-- To apply manually: supabase db push
-- Or: supabase migration up

BEGIN;

-- -------------------------
-- TABLE: qurban_events
-- -------------------------
CREATE TABLE IF NOT EXISTS public.qurban_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        text NOT NULL,
  tanggal     date NOT NULL,
  catatan     text,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- -------------------------
-- TABLE: qurban_animals
-- -------------------------
CREATE TABLE IF NOT EXISTS public.qurban_animals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES public.qurban_events(id) ON DELETE RESTRICT,
  jenis             text NOT NULL CHECK (jenis IN ('sapi','kambing')),
  sumber_hewan      text NOT NULL DEFAULT 'beli' CHECK (sumber_hewan IN ('beli','titipan')),
  nomor             text NOT NULL,
  berat_kg          numeric,
  harga             numeric NOT NULL,
  biaya_perawatan   numeric,
  foto_url          text,
  catatan           text,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- -------------------------
-- TABLE: qurban_shares
-- -------------------------
CREATE TABLE IF NOT EXISTS public.qurban_shares (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id           uuid NOT NULL REFERENCES public.qurban_animals(id) ON DELETE RESTRICT,
  muzakki_id          uuid NOT NULL REFERENCES public.muzakki(id) ON DELETE RESTRICT,
  urutan              integer NOT NULL,
  nominal             numeric NOT NULL,
  status_pembayaran   text NOT NULL DEFAULT 'belum_bayar' CHECK (status_pembayaran IN ('belum_bayar','lunas')),
  catatan             text,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(animal_id, urutan)
);

-- -------------------------
-- INDEXES
-- -------------------------
CREATE INDEX IF NOT EXISTS idx_qurban_animals_event_id ON public.qurban_animals(event_id);
CREATE INDEX IF NOT EXISTS idx_qurban_animals_jenis ON public.qurban_animals(jenis);
CREATE INDEX IF NOT EXISTS idx_qurban_shares_animal_id ON public.qurban_shares(animal_id);
CREATE INDEX IF NOT EXISTS idx_qurban_shares_muzakki_id ON public.qurban_shares(muzakki_id);
CREATE INDEX IF NOT EXISTS idx_qurban_shares_status_pembayaran ON public.qurban_shares(status_pembayaran);

-- -------------------------
-- FUNCTION + TRIGGER: enforce share slot limit
-- -------------------------
CREATE OR REPLACE FUNCTION public.enforce_qurban_share_limit()
RETURNS TRIGGER AS $$
DECLARE
  animal_jenis text;
  max_slots integer;
  current_count integer;
BEGIN
  SELECT jenis INTO animal_jenis
  FROM public.qurban_animals
  WHERE id = NEW.animal_id;

  IF animal_jenis = 'sapi' THEN
    max_slots := 7;
  ELSE
    max_slots := 1;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.qurban_shares
  WHERE animal_id = NEW.animal_id;

  IF current_count >= max_slots THEN
    RAISE EXCEPTION 'Slot qurban penuh';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_qurban_share_limit_trigger
  BEFORE INSERT ON public.qurban_shares
  FOR EACH ROW EXECUTE FUNCTION public.enforce_qurban_share_limit();

-- -------------------------
-- FUNCTION + TRIGGER: updated_at for qurban_events
-- -------------------------
CREATE OR REPLACE FUNCTION public.update_qurban_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qurban_events_updated_at
  BEFORE UPDATE ON public.qurban_events
  FOR EACH ROW EXECUTE FUNCTION public.update_qurban_events_updated_at();

-- -------------------------
-- FUNCTION + TRIGGER: updated_at for qurban_animals
-- -------------------------
CREATE OR REPLACE FUNCTION public.update_qurban_animals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qurban_animals_updated_at
  BEFORE UPDATE ON public.qurban_animals
  FOR EACH ROW EXECUTE FUNCTION public.update_qurban_animals_updated_at();

-- -------------------------
-- FUNCTION + TRIGGER: updated_at for qurban_shares
-- -------------------------
CREATE OR REPLACE FUNCTION public.update_qurban_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qurban_shares_updated_at
  BEFORE UPDATE ON public.qurban_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_qurban_shares_updated_at();

-- -------------------------
-- ENABLE RLS
-- -------------------------
ALTER TABLE public.qurban_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qurban_shares ENABLE ROW LEVEL SECURITY;

-- -------------------------
-- RLS POLICIES: qurban_events (admin only for write)
-- -------------------------
DROP POLICY IF EXISTS "qurban_events_select_admin_petugas_viewer_active" ON public.qurban_events;
DROP POLICY IF EXISTS "qurban_events_insert_admin_active" ON public.qurban_events;
DROP POLICY IF EXISTS "qurban_events_update_admin_active" ON public.qurban_events;
DROP POLICY IF EXISTS "qurban_events_delete_admin_active" ON public.qurban_events;

CREATE POLICY "qurban_events_select_admin_petugas_viewer_active"
  ON public.qurban_events FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas', 'viewer')
  );

CREATE POLICY "qurban_events_insert_admin_active"
  ON public.qurban_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin')
  );

CREATE POLICY "qurban_events_update_admin_active"
  ON public.qurban_events FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin')
  );

CREATE POLICY "qurban_events_delete_admin_active"
  ON public.qurban_events FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin')
  );

-- -------------------------
-- RLS POLICIES: qurban_animals (admin + petugas for write)
-- -------------------------
DROP POLICY IF EXISTS "qurban_animals_select_admin_petugas_viewer_active" ON public.qurban_animals;
DROP POLICY IF EXISTS "qurban_animals_insert_admin_petugas_active" ON public.qurban_animals;
DROP POLICY IF EXISTS "qurban_animals_update_admin_petugas_active" ON public.qurban_animals;
DROP POLICY IF EXISTS "qurban_animals_delete_admin_petugas_active" ON public.qurban_animals;

CREATE POLICY "qurban_animals_select_admin_petugas_viewer_active"
  ON public.qurban_animals FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas', 'viewer')
  );

CREATE POLICY "qurban_animals_insert_admin_petugas_active"
  ON public.qurban_animals FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_animals_update_admin_petugas_active"
  ON public.qurban_animals FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_animals_delete_admin_petugas_active"
  ON public.qurban_animals FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

-- -------------------------
-- RLS POLICIES: qurban_shares (admin + petugas for write)
-- -------------------------
DROP POLICY IF EXISTS "qurban_shares_select_admin_petugas_viewer_active" ON public.qurban_shares;
DROP POLICY IF EXISTS "qurban_shares_insert_admin_petugas_active" ON public.qurban_shares;
DROP POLICY IF EXISTS "qurban_shares_update_admin_petugas_active" ON public.qurban_shares;
DROP POLICY IF EXISTS "qurban_shares_delete_admin_petugas_active" ON public.qurban_shares;

CREATE POLICY "qurban_shares_select_admin_petugas_viewer_active"
  ON public.qurban_shares FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas', 'viewer')
  );

CREATE POLICY "qurban_shares_insert_admin_petugas_active"
  ON public.qurban_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_shares_update_admin_petugas_active"
  ON public.qurban_shares FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  )
  WITH CHECK (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

CREATE POLICY "qurban_shares_delete_admin_petugas_active"
  ON public.qurban_shares FOR DELETE
  TO authenticated
  USING (
    public.get_current_user_is_active()
    AND public.get_current_user_role() IN ('admin', 'petugas')
  );

COMMIT;
