# PRD: Coupon-to-Packages Mapping System

## Introduction/Overview

Currently, the qurban (animal sacrifice) distribution system uses a model where one person can receive multiple coupons. This PRD introduces a new coupon-to-packages mapping system where **each coupon represents a fixed number of distribution packages**, decoupling the coupon issuance from participant selection.

Instead of managing participant-to-coupon relationships, administrators will define how many packages each coupon includes at creation time. This allows for flexible distribution scenarios, such as:

- Standard qurban distribution: 1 coupon = 1 package
- Collective qurban: 1 coupon = 7 packages (one per participant family)
- Custom distributions based on organizational needs

This approach simplifies coupon management and provides clearer visibility into package allocation.

---

## Goals

1. **Decouple coupon issuance from participant selection** — Enable administrators to define the package quantity per coupon independently during coupon creation.
2. **Support flexible distribution scenarios** — Allow 1 coupon to represent multiple packages (default: 1), accommodating various qurban distribution models.
3. **Simplify coupon management workflow** — Remove the complexity of assigning multiple coupons to individual participants; instead, manage package quantities per coupon.
4. **Maintain auditability** — Ensure all coupon-to-package mappings are clearly documented and traceable for administrative and financial records.

---

## User Stories

### Story 1: Admin Creates Standard Qurban Coupons

**As an** administrator managing qurban distribution,
**I want to** create coupons where each coupon represents 1 package by default,
**So that** the standard 1:1 distribution is the simplest and most common path.

**Acceptance Criteria:**

- When creating a new coupon, the system defaults to 1 package per coupon.
- Admin can see the package count in the coupon creation form.
- Coupons are created and ready for participant assignment.

### Story 2: Admin Creates Collective Qurban Coupons

**As an** administrator managing collective qurban (where one animal is shared by multiple families),
**I want to** create a coupon that represents 7 packages (one per family),
**So that** I can manage collective distributions efficiently without creating 7 separate coupons.

**Acceptance Criteria:**

- Admin can set the package count to 7 (or any number) during coupon creation.
- The system allows editing the package count before finalizing the coupon.
- Once created, the coupon displays the total package count clearly.

### Story 3: Admin Reviews Coupon Package Allocation

**As an** administrator,
**I want to** see the package count for each coupon in the coupon management panel,
**So that** I can verify allocations and manage distribution logistics.

**Acceptance Criteria:**

- Coupon list displays package count per coupon.
- Admin can quickly see the total packages across all coupons.

---

## Functional Requirements

1. **Coupon Creation Form Enhancement**

   - The coupon creation form must include a new field: "Number of Packages per Coupon" (required).
   - Default value: 1 package.
   - Input must accept positive integers (no decimal values).
   - No upper limit validation (allow flexibility for custom scenarios).
2. **Editable Package Count During Creation**

   - The package count field must be editable before the coupon is saved.
   - Admin can modify the number before finalizing coupon creation.
   - Once saved, the package count is immutable (no editing after creation — changes require creating a new coupon).
3. **Data Storage & Schema**

   - Update the `coupons` table to include a new column: `packages_per_coupon` (integer, default: 1).
   - This field is independent of participant count and participant assignment.
4. **Coupon List & Display**

   - The coupon management/list view must display the `packages_per_coupon` value for each coupon.
   - Include a "Total Packages" summary that sums all `packages_per_coupon` values across visible coupons.
5. **Participant Selection (Unchanged Behavior)**

   - Participant selection remains independent of the package count.
   - Multiple participants can be assigned to the same coupon (or a coupon may have no participants initially).
   - The package count per coupon does NOT limit or validate the number of participants assigned.
6. **Validation & Constraints**

   - Package count must be a positive integer (≥ 1).
   - No negative or zero values allowed.
   - No arbitrary upper limit (business logic may define limits elsewhere if needed).

---

## Non-Goals (Out of Scope)

- **Participant-to-package mapping** — This PRD does not define how packages are distributed to individual participants. That logic remains in the participant assignment feature.
- **Editing package count after creation** — Once a coupon is created, the package count is locked. Changes require creating a new coupon.
- **Package fulfillment tracking** — Tracking which specific packages have been distributed or claimed is out of scope.
- **Automatic participant limit enforcement** — The system will not automatically limit participants based on package count; admins manage this manually.
- **Multi-language UI updates** — Localization of new form labels is assumed to be handled separately.

---

## Design Considerations

### UI/UX Requirements

- **Coupon Creation Dialog/Form**: Add a new field labeled "Number of Packages" (or "Paket per Kupon" in Indonesian) with:

  - A numeric input box (spinbox or text input).
  - Default value pre-filled: 1.
  - Inline help text: "Each coupon represents this many packages. Default: 1."
  - Clear visual distinction from participant selection fields.
- **Coupon List/Table**: Add a new column "Packages" displaying the `packages_per_coupon` value.

  - Include a summary row showing total packages across all coupons.
- **Form Validation**: Show real-time validation feedback if user enters invalid values (negative, zero, non-integer).

### Component Reuse

- Leverage existing shadcn/ui components: `Input`, `Label`, `Dialog`, `Table`.
- Follow existing design patterns in the qurban module (ref: `src/components/qurban/`).

---

## Technical Considerations

### Database Changes

- **Migration required**: Add `packages_per_coupon` column to the `coupons` table.
  - Type: `integer`
  - Default: `1`
  - Not nullable
  - Migration file: `supabase/migrations/[timestamp]_add_packages_per_coupon.sql`

### Backend/API

- Supabase RLS policies must allow admins to read/write the `packages_per_coupon` field.
- No new API endpoints required; existing coupon creation/update endpoints will handle the field.
- Ensure `packages_per_coupon` is included in the coupon object returned by Supabase queries.

### Frontend Changes

- Update the `AddCouponDialog` or coupon creation component to include the new field.
- Update coupon list/table component to display `packages_per_coupon`.
- Update TypeScript types (`src/types/`) to include `packages_per_coupon` in the coupon interface.
- Use React Hook Form + Zod for form validation.

### Integration Points

- No changes to participant assignment logic (remains independent).
- No changes to coupon distribution/fulfillment workflows.

---

## Success Metrics

1. **Feature Adoption**: Admins are able to create and manage coupons with custom package counts without documentation or support.
2. **Data Integrity**: All coupons have a valid `packages_per_coupon` value; no coupons have null or invalid values.
3. **User Satisfaction**: Admin feedback indicates the coupon creation workflow is simpler and more intuitive than the previous participant-based approach.
4. **Auditability**: Coupon reports and exports include `packages_per_coupon` for accurate record-keeping.

---

## Docker Local Testing Checklist

Before marking this feature as complete, the following tests must be run in a local Docker environment:

- [ ] **Database Migration**: Migration runs successfully; `packages_per_coupon` column exists and defaults to 1.
- [ ] **Coupon Creation**: Admin can create a coupon with default packages (1) and with custom packages (e.g., 7).
- [ ] **Form Validation**: Form rejects invalid inputs (negative, zero, non-integer); displays helpful error messages.
- [ ] **Coupon List Display**: Package count is displayed correctly in the coupon list table.
- [ ] **Total Packages Summary**: Sum of all packages is calculated and displayed correctly.
- [ ] **Participant Assignment**: Participants can still be assigned to coupons independently of package count; no errors or conflicts.
- [ ] **Data Persistence**: Coupon data (including `packages_per_coupon`) is persisted correctly across app restarts.
- [ ] **Qurban Workflow**: Full qurban distribution workflow works end-to-end with the new coupon system.
- [ ] **Build & Lint**: `npm run build` passes without errors; TypeScript and linting checks pass.

---

## Open Questions

1. **Package count upper limit** — Should there be a business rule maximum (e.g., max 20 packages per coupon)? Or is there no limit? No Limit
2. **Coupon immutability** — Is locking the package count after creation the desired behavior, or should admins be able to edit it later? able to edit later
3. **Reporting & exports** — Should generated reports (Excel, PDF) include a breakdown of package counts per coupon? Excel
4. **Qurban vs. other distribution types** — Does this coupon-to-packages system apply to all distribution types (fidyah, zakat, etc.), or only qurban? only apply for Qurban.
5. **Historical data** — For existing coupons (if any), should they automatically be assigned `packages_per_coupon = 1`? YES
