# PRD: Qurban Animal Management

## 1. Introduction / Overview

The Al-Fajar mosque team manages Qurban (Islamic sacrifice) by sourcing cows and goats, dividing shares among community members, collecting payments, and overseeing slaughter. The current system treats each Qurban entry as an individual registration, which does not reflect the real workflow.

This redesign introduces an **animal-centric model**: the team creates a profile for each animal first, then assigns participants to share slots on that animal. A cow can be shared by up to 7 people; a goat is for 1 person only. All participants are linked to the same people database used for Zakat Fitrah, ensuring a unified community profile.

**Goal:** Give the Al-Fajar team a structured, clear workflow to manage Qurban animals, participant slots, and payment collection — while sharing one people database with Zakat Fitrah.

---

## 2. Goals

1. Allow the team to organize Qurban animals by event/year (e.g., "Idul Adha 1446 H").
2. Enable the team to create detailed animal profiles (type, code, weight, price, photo) before accepting participants.
3. Enforce Islamic share rules strictly: cow = max 7 slots, goat = max 1 slot.
4. Allow petugas to assign participants (from existing muzakki or added on-the-fly) to each slot.
5. Track payment status (paid/unpaid) per participant slot.
6. Link all Qurban participants to the shared `muzakki` database so mosque members have one unified identity across Zakat and Qurban.

---

## 3. User Stories

- **As a team admin**, I want to create a Qurban event (e.g., "Idul Adha 1446 H / 2025") so all animals are organized by year and easy to find.
- **As a team admin**, I want to add an animal profile with code, type, weight, estimated price, and a photo so participants know the details before signing up.
- **As a petugas**, I want to assign a participant to a slot by searching existing mosque members, or add a new person inline if they're not in the system yet.
- **As a petugas**, I want to mark a slot as paid so I can track who has settled their payment at a glance.
- **As a petugas**, I want the system to prevent me from adding more than 7 participants to a cow so I don't accidentally oversell slots.
- **As a viewer**, I want to see each animal's slot fill status and payment summary without opening individual records.

---

## 4. Functional Requirements

### 4.1 Qurban Event Management

1. The system must allow admins to create a Qurban event with: name (text, e.g., "Idul Adha 1446 H"), date, and optional notes.
2. The system must display a list or dropdown of events so users can switch between years.
3. The system must prevent deleting an event that has animals linked to it; show a clear error message.
4. The system must allow editing event name, date, and notes.

### 4.2 Animal Profile Management

5. The system must allow the team to create an animal profile with:
   - **Jenis hewan** (sapi / kambing)
   - **Sumber hewan** (beli / titipan) — "beli" = mosque purchases the animal; "titipan" = animal is brought in by a community member for the mosque to slaughter
   - **Nomor hewan** — auto-generated code based on type and sequence per event (e.g., SAP-001, KAM-001)
   - **Berat estimasi** (kg) — estimated weight
   - **Harga** (Rp) — total price of the animal (purchase price for "beli"; 0 or symbolic for "titipan")
   - **Biaya perawatan** (Rp, optional) — maintenance/handling fee charged by the mosque, applicable for "titipan" animals
   - **Foto** — one photo uploaded to Supabase Storage
   - **Catatan** — optional notes
6. The system must display each animal as a card showing: photo thumbnail, code, type, weight, price, slot fill count (e.g., "5/7"), and payment summary badge (e.g., "3 of 5 lunas").
7. The system must allow editing all animal fields after creation.
8. The system must prevent deleting an animal that has participant slots assigned; show a clear error message instead.
9. The system must automatically calculate the **nominal per slot** as `harga / max_slots` (7 for sapi, 1 for kambing) and pre-fill it when a petugas registers/assigns a participant to a slot. Petugas can still override the amount per slot if needed.

### 4.3 Participant Slot Management

10. For **sapi (cow)**, the system must enforce a maximum of 7 participant slots. The "Add Participant" button must be disabled once all 7 slots are filled, and any API attempt to add an 8th must be rejected.
11. For **kambing (goat)**, the system must enforce a maximum of 1 slot. Same enforcement as above.
12. The system must display each slot with: slot number, participant name (linked to muzakki), nominal to pay (Rp), and payment status badge (Belum Bayar / Lunas).
13. The system must allow assigning a participant by searching and selecting from existing muzakki records (search by name or phone number).
14. The system must allow adding a new person inline when they don't exist yet: a small form (nama_kk, alamat, no_hp) appears without leaving the page. On save, the person is inserted into the `muzakki` table and immediately linked to the slot.
15. The system must allow setting the nominal (amount to pay) per slot individually, defaulting to the suggested amount from Requirement 9.
16. The system must allow removing a participant from a slot. The slot becomes empty and available again.

### 4.4 Receipt / Bukti Pembayaran

17. The system must allow petugas to generate a printable receipt (bukti) per participant slot, showing: event name, animal code, animal type, participant name, nominal, payment status, and date.
18. The receipt format must follow the existing `BuktiQurban` component style (adapted for the new data model).

### 4.5 Payment Tracking

19. The system must allow toggling each slot's payment status between "Belum Bayar" and "Lunas" with a single action (button or toggle).
20. The system must display a payment summary per animal: "X of Y slots paid" and "Rp X collected of Rp Y expected".
21. The system must show a visual indicator (color/badge) on the animal card when all slots are filled AND all payments are received (fully complete).

### 4.6 People Data Integration

22. The system must use the existing `muzakki` table as the unified people database — no separate people table for Qurban.
23. When a new person is added via Qurban, they must be saved to the `muzakki` table with the same required fields (nama_kk, alamat, no_telp).
24. A muzakki record added via Qurban immediately appears in the Muzakki master data page (Zakat Fitrah module) — no duplication, no sync needed.

### 4.7 Role-Based Data Visibility

25. **Viewers** may see only aggregate slot counts per animal (e.g., "5/7 terisi", "3 of 5 lunas") — participant names and nominal amounts must not be visible to viewer role.
26. **Admin and petugas** see full details: participant names, muzakki links, nominal per slot, and payment status.

---

## 5. Non-Goals (Out of Scope)

- Post-slaughter distribution tracking (who receives meat portions)
- Animal procurement workflow (vendor orders, delivery tracking)
- SMS/WhatsApp notifications to participants
- Installment / partial payment tracking
- Public-facing online registration form for community members
- External payment gateway integration (GoPay, QRIS, etc.)
- Multi-masjid / multi-branch support

---

## 6. Design Considerations

- Follow the existing Qurban page layout: sidebar nav, AppSwitcher toggle between Zakat and Qurban modes.
- Animal list: use a **card grid** layout (not table) to accommodate the photo thumbnail prominently.
- Slot fill progress: use a visual indicator like "5/7 peserta" with a colored progress bar or filled dots on each animal card.
- Use existing shadcn/ui components: `Card`, `Dialog`, `Badge`, `Combobox` (for muzakki search), `Progress`.
- Empty slots should appear as dashed placeholder rows inside the animal detail view.
- Payment status: green Badge for "Lunas", amber/red for "Belum Bayar".
- An animal card with all slots filled and all payments received should display a distinct "Selesai" / completed state.
- This is a **redesign** of the existing Qurban module — the new animal-centric UI replaces the current registration form/table layout.

---

## 7. Technical Considerations

### New Database Tables (new migration, 035+)

```sql
-- Qurban events (year/event grouping)
qurban_events
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
  nama          text NOT NULL           -- e.g., "Idul Adha 1446 H"
  tanggal       date NOT NULL
  catatan       text
  created_by    uuid REFERENCES auth.users
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()

-- Animal profiles
qurban_animals
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  event_id          uuid NOT NULL REFERENCES qurban_events(id)
  jenis             text NOT NULL CHECK (jenis IN ('sapi', 'kambing'))
  sumber_hewan      text NOT NULL DEFAULT 'beli' CHECK (sumber_hewan IN ('beli', 'titipan'))
  nomor             text NOT NULL           -- e.g., SAP-001, KAM-001
  berat_kg          numeric
  harga             numeric NOT NULL        -- total price of the animal
  biaya_perawatan   numeric                 -- maintenance fee (mainly for titipan)
  foto_url          text
  catatan           text
  created_by        uuid REFERENCES auth.users
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

-- Participant slots
qurban_shares
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
  animal_id           uuid NOT NULL REFERENCES qurban_animals(id)
  muzakki_id          uuid NOT NULL REFERENCES muzakki(id)
  urutan              integer NOT NULL   -- 1–7 for sapi, 1 for kambing
  nominal             numeric NOT NULL   -- pre-filled as harga / max_slots, editable
  status_pembayaran   text NOT NULL DEFAULT 'belum_bayar'
                        CHECK (status_pembayaran IN ('belum_bayar', 'lunas'))
  catatan             text
  created_by          uuid REFERENCES auth.users
  created_at          timestamptz DEFAULT now()
  updated_at          timestamptz DEFAULT now()
```

- **Share enforcement**: application-level guard (check current slot count before insert) + DB-level constraint via trigger or CHECK.
- **Photo storage**: continue using existing `qurban-photos` Supabase Storage bucket.
- **Existing data migration**: migrate existing `qurban_registrations` and `qurban_participants` into the new schema. Each old registration maps to one `qurban_animals` row; each participant maps to one `qurban_shares` row. A default `qurban_events` row must be created to group legacy data (e.g., "Qurban (Lama)"). Developer should assess data volume and write a migration script.
- **RLS policies**: follow existing patterns — admin/petugas can read & write, viewer read-only (aggregate counts only enforced at application layer).

### Code Changes

| Area | Action |
|---|---|
| `useQurban.ts` | Replace with `useQurbanEvents`, `useQurbanAnimals`, `useQurbanShares` |
| `QurbanForm.tsx` | Replace with `AnimalForm` (create/edit animal, includes sumber_hewan, biaya_perawatan) |
| `QurbanTable.tsx` | Replace with `AnimalGrid` (card grid layout) |
| `BuktiQurban.tsx` | Adapt for new data model — generate per-slot receipt |
| `PhotoUpload.tsx` | Reuse as-is |
| `Qurban.tsx` (page) | Refactor: event selector, animal card grid, detail dialog |
| New: `QurbanEventDialog` | Create/edit Qurban event |
| New: `AnimalDetailDialog` | View all slots, assign/remove participants |
| New: `SlotAssignDialog` | Search muzakki or add new person inline; pre-fills nominal |

- Reuse the muzakki search/combobox pattern from `MuzakkiForm.tsx`.
- Reuse the `PhotoUpload` component and `qurban-photos` bucket.

---

## 8. Success Metrics

- Team can set up a complete animal profile (including photo) in under 2 minutes.
- All 7 slots of a cow are assignable without UI bugs or data errors.
- Payment status for all animals is visible at a glance on the animal list page (no drilling into individual records).
- Zero data duplication: each mosque member has exactly one `muzakki` record shared between Zakat Fitrah and Qurban.
- A new person added via Qurban is immediately searchable in the Muzakki master data page.

---

## 9. Resolved Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Is `harga` total price or per-slot price? | **Total price.** Per-slot nominal is auto-calculated (`harga / max_slots`) and pre-filled when petugas registers a participant. Petugas may override per slot. |
| 2 | Migrate existing `qurban_registrations` data? | **Yes, migrate.** Developer writes a migration script mapping old registrations → `qurban_animals` and old participants → `qurban_shares`, grouped under a legacy `qurban_events` entry (e.g., "Qurban (Lama)"). |
| 3 | Is "titipan hewan" still needed? | **Yes.** `sumber_hewan: 'beli' / 'titipan'` is included in the animal profile. Titipan animals also have an optional `biaya_perawatan` field. |
| 4 | Printable receipt per participant? | **Yes.** Adapt the existing `BuktiQurban` component to generate a per-slot receipt showing event name, animal code, type, participant name, nominal, and payment status. |
| 5 | What can viewers see? | **Slot counts only.** Viewers see aggregates (e.g., "5/7 terisi", "3 lunas") — participant names and nominal amounts are hidden from viewer role. |
