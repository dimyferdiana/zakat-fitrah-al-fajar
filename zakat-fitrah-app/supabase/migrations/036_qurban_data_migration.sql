-- =========================================
-- QURBAN DATA MIGRATION: old schema → new schema
-- =========================================
-- Migrates qurban_registrations + qurban_participants to the new
-- qurban_events / qurban_animals / qurban_shares model.

BEGIN;

DO $$
DECLARE
  legacy_event_id uuid;
  reg             RECORD;
  participant     RECORD;
  new_animal_id   uuid;
  holder_muzakki_id uuid;
  participant_muzakki_id uuid;
  max_slots       integer;
  share_nominal   numeric;
  share_status    text;
BEGIN

  -- 1. Insert one legacy event
  INSERT INTO public.qurban_events (nama, tanggal, catatan)
  VALUES ('Qurban (Arsip Lama)', CURRENT_DATE, 'Data dipindahkan dari sistem lama')
  RETURNING id INTO legacy_event_id;

  -- 2. Loop through each registration
  FOR reg IN
    SELECT * FROM public.qurban_registrations ORDER BY created_at
  LOOP

    -- a. Find or create muzakki for the registration holder
    SELECT id INTO holder_muzakki_id
    FROM public.muzakki
    WHERE nama_kk = reg.nama
    LIMIT 1;

    IF holder_muzakki_id IS NULL THEN
      INSERT INTO public.muzakki (nama_kk, alamat, no_telp)
      VALUES (reg.nama, reg.alamat, NULLIF(reg.no_hp, ''))
      RETURNING id INTO holder_muzakki_id;
    END IF;

    -- b. Insert into qurban_animals
    INSERT INTO public.qurban_animals (
      event_id,
      jenis,
      sumber_hewan,
      nomor,
      berat_kg,
      harga,
      biaya_perawatan,
      foto_url,
      catatan,
      created_by
    )
    VALUES (
      legacy_event_id,
      reg.jenis,
      reg.sumber_hewan,
      reg.no_qurban,
      NULL,
      reg.nominal,
      reg.biaya_perawatan,
      reg.photo_url,
      reg.catatan,
      reg.created_by
    )
    RETURNING id INTO new_animal_id;

    -- Compute max slots and nominal per share
    IF reg.jenis = 'sapi' THEN
      max_slots := 7;
    ELSE
      max_slots := 1;
    END IF;

    IF reg.nominal IS NOT NULL AND max_slots > 0 THEN
      share_nominal := reg.nominal / max_slots;
    ELSE
      share_nominal := 0;
    END IF;

    -- Map status
    IF reg.status = 'lunas' THEN
      share_status := 'lunas';
    ELSE
      share_status := 'belum_bayar';
    END IF;

    -- c. Loop through participants linked to this registration
    FOR participant IN
      SELECT * FROM public.qurban_participants
      WHERE qurban_registration_id = reg.id
      ORDER BY urutan
    LOOP
      -- Skip if urutan exceeds max_slots
      IF participant.urutan > max_slots THEN
        CONTINUE;
      END IF;

      -- Create a new muzakki record for the participant
      INSERT INTO public.muzakki (nama_kk, alamat, no_telp)
      VALUES (participant.nama, 'Data Arsip Qurban', NULL)
      RETURNING id INTO participant_muzakki_id;

      -- Insert share
      INSERT INTO public.qurban_shares (
        animal_id,
        muzakki_id,
        urutan,
        nominal,
        status_pembayaran
      )
      VALUES (
        new_animal_id,
        participant_muzakki_id,
        participant.urutan,
        share_nominal,
        share_status
      );
    END LOOP;

  END LOOP;

END $$;

COMMIT;
