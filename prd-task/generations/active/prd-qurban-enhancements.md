# PRD: Qurban App Enhancements

## 1. Introduction / Overview

This document covers a set of targeted enhancements to the existing Qurban management module. The changes address usability limitations discovered after the initial release, including restrictive coupon eligibility rules, poor mobile UX (especially action buttons that require horizontal scrolling), an incomplete Peserta add-form, and confusing dashboard statistics that mix Sapi and Domba data.

**Goal:** Improve the Qurban module so that all database members can receive coupons, the UI works comfortably on mobile, data entry flows match business rules for each contribution type, and the dashboard clearly separates Sapi vs. Domba metrics.

---

## 2. Goals

1. Remove the mustahik-only restriction on coupon distribution — any person in the database can receive one or more coupons.
2. Allow a single person to receive more than one coupon with no hard limit.
3. Eliminate horizontal scrolling for action buttons on mobile by stacking them vertically.
4. Add a "New Peserta" form directly on the `/qurban/peserta` page that includes a slot (hewan) selector.
5. Simplify the Titipan form to only ask for *Biaya Perawatan* (no animal-count field).
6. Simplify the Al Fajar contribution form to only ask for *Jumlah Hewan* (no Biaya Perawatan field).
7. Display Sapi and Domba statistics as separate side-by-side cards on the dashboard.
8. Remove the add / edit / delete event actions from the Data Hewan page.

---

## 3. User Stories

| # | As a… | I want to… | So that… |
|---|--------|-----------|----------|
| 1 | Panitia | Assign a coupon to any registered person (not just mustahik) | All eligible participants can receive a coupon regardless of their category |
| 2 | Panitia | Assign multiple coupons to one person | Families or bulk contributions can be handled correctly |
| 3 | Panitia (mobile) | See action buttons without horizontal scrolling | I can quickly tap the right action while standing at a distribution point |
| 4 | Panitia | Add a new Peserta directly from the Peserta list page with a slot picker | I don't have to navigate away to a separate form page |
| 5 | Admin | Enter a Titipan contribution without being asked for animal count | The form matches the actual business rule for Titipan |
| 6 | Admin | Enter an Al Fajar contribution without being asked for Biaya Perawatan | The form matches the actual business rule for Al Fajar |
| 7 | Admin | See Sapi and Domba statistics in clearly separated dashboard cards | I can instantly read progress for each animal type independently |
| 8 | Admin | Not see add/edit/delete event buttons on the Data Hewan page | The page is cleaner and event management stays in its own dedicated area |

---

## 4. Functional Requirements

### 4.1 Coupon Eligibility

1. The system must allow coupons to be generated/assigned for **any person** present in the `warga` (or equivalent) table, not restricted to those flagged as mustahik.
2. The system must allow one person to hold **more than one coupon** with no maximum enforced by the application.
3. The existing bulk-generate coupon flow must reflect the expanded eligibility (all persons selectable, not pre-filtered).
4. When assigning a coupon to a person who already holds one or more coupons, the system must display a **warning confirmation dialog** (e.g., "Orang ini sudah memiliki X kupon. Lanjutkan?") before proceeding. The Panitia must explicitly confirm to continue.

### 4.2 Mobile UI — Action Buttons

4. On screens narrower than `768px`, action buttons within list/table rows must be displayed **stacked vertically** (each on its own line) instead of horizontally.
5. This applies to all action button groups in the Qurban module: Peserta list, Data Hewan list, and any other list pages with row-level actions.
6. Buttons must remain fully labeled (no icon-only) to stay accessible.

### 4.3 Add Peserta Form on `/qurban/peserta`

7. The Peserta list page (`/qurban/peserta`) must include an **"Tambah Peserta"** button that opens an inline form or modal.
8. The form must contain a **slot dropdown** populated with available hewan (animals) by name. Only animals that still have open slots must appear.
9. If no slots are available, the **"Tambah Peserta" button must be disabled** and display an inline message: *"Tidak ada slot tersedia"*.
10. On form submission, the system must create the new Peserta record linked to the selected hewan slot.
11. After successful submission, the Peserta list must refresh automatically.

### 4.4 Titipan Form Simplification

11. When contribution type is **Titipan**, the form must show **only the `Biaya Perawatan`** (maintenance cost) field.
12. The animal-count (`Jumlah Hewan`) field must **not** appear for Titipan entries.

### 4.5 Al Fajar Contribution Form Simplification

13. When contribution type is **Al Fajar**, the form must show **only the `Jumlah Hewan`** (number of animals) field.
14. The `Biaya Perawatan` field must **not** appear for Al Fajar entries.

### 4.6 Dashboard — Separate Sapi & Domba Cards

15. The dashboard must display **two separate stat cards** — one for **Sapi** and one for **Domba** — positioned side by side.
16. Each card must show at minimum:
    - Total slots for that animal type
    - Slots filled / remaining
    - Total nominal terkumpul (Rp) for that animal type
17. The combined/merged "Total Nominal" card that currently mixes both types must be **replaced** by these two separate cards.

### 4.7 Data Hewan Page — Remove Event Actions

18. The **add event**, **edit event**, and **delete event** action buttons/controls must be removed from the Data Hewan page.
19. The underlying event-management feature is not deleted — only its entry point from this page is removed.

---

## 5. Non-Goals (Out of Scope)

- Adding a new dedicated event-management page (this PRD only removes the controls from Data Hewan).
- Changing the coupon design or print layout.
- Adding pagination or search to the slot dropdown (assume the number of available slots is manageable).
- Any changes to authentication, role management, or RLS policies beyond what is strictly required by the eligibility change.
- Changes to the Zakat module or any non-Qurban pages.

---

## 6. Design Considerations

- **Mobile-first for action buttons:** Use a flex column layout (`flex-col gap-2`) inside the action cell on small screens; revert to `flex-row` on `md:` and above using Tailwind responsive prefixes.
- **Slot dropdown:** Use the existing `<Select>` component from `@/components/ui/select`. Display each option as: `{nama_hewan} — {tipe} ({sisa_slot} slot tersisa)`.
- **Dashboard cards:** Use the existing card component pattern. Place the two new cards in a `grid grid-cols-2 gap-4` layout. **Sapi is always on the left, Domba always on the right.** Match the existing card styling.
- **Titipan / Al Fajar forms:** Use conditional rendering (`{type === 'titipan' && <BiayaPerawatanField />}`) to show/hide fields. Keep layout consistent with existing form structure.

---

## 7. Technical Considerations

- **Coupon eligibility change:** Review and update any Supabase RLS policies or query filters on the `coupons` / `mustahik` join that currently restrict coupon assignment to mustahik. The change may be as simple as removing a `WHERE is_mustahik = true` clause.
- **Multiple coupons per person:** Verify that the `coupons` table schema does not have a `UNIQUE` constraint on `(person_id)`. If it does, a migration to drop that constraint is required.
- **Slot dropdown data:** Query the `hewan` (animals) table for records where remaining slot count > 0. This may need a computed column or a join with the `peserta` table.
- **Dashboard aggregation:** The existing dashboard query likely returns a single aggregate. It will need to be split into two queries (or one query grouped by `tipe_hewan`) to feed the two cards.
- **Form type branching:** The contribution type (`Titipan` vs `Al Fajar` vs others) should already exist in form state. Add conditional rendering using that value.

---

## 8. Success Metrics

1. Any warga (non-mustahik) can successfully receive a coupon — zero rejection errors for non-mustahik users.
2. A single person can hold 2+ coupons in the system without errors.
3. On a 375px-wide mobile screen, all action buttons in Qurban lists are visible without horizontal scroll.
4. The "Tambah Peserta" button on `/qurban/peserta` successfully creates a new record when a slot is selected.
5. Titipan form submissions contain no animal-count field; Al Fajar form submissions contain no Biaya Perawatan field.
6. Dashboard shows two clearly labeled cards (Sapi / Domba) each with correct independent totals.
7. Data Hewan page has no add/edit/delete event buttons visible to any role.

---

## 9. Open Questions

All questions resolved. No outstanding items.
