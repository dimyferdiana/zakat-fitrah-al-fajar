# Tasks: Coupon-to-Packages Mapping System

## Relevant Files

### New Files
- `zakat-fitrah-app/supabase/migrations/[timestamp]_add_packages_per_coupon.sql` - Database migration to add `packages_per_coupon` column and backfill existing data.

### Files to Modify
- `zakat-fitrah-app/src/types/coupon.ts` (or similar) - Add `packages_per_coupon` field to coupon interface.
- `zakat-fitrah-app/src/components/qurban/AddCouponDialog.tsx` (or similar) - Enhance coupon creation form with new packages field.
- `zakat-fitrah-app/src/components/qurban/CouponList.tsx` (or similar) - Update list table to display packages and total summary.
- `zakat-fitrah-app/src/lib/supabase-client.ts` (or similar) - Ensure coupon queries include `packages_per_coupon` field.

### Notes
- All file paths assume the project follows the structure defined in `CLAUDE.md`. Actual paths may vary; verify during implementation.
- Database migrations must follow sequential naming: `[timestamp]_[description].sql`.
- Use React Hook Form + Zod for form validation (existing patterns in qurban module).
- Leverage shadcn/ui components (`Input`, `Label`, `Dialog`, `Table`) for UI consistency.

---

## Tasks

- [x] **0.0 Create feature branch**
  - [x] 0.1 Create and checkout new branch: `git checkout -b feature/coupon-packages`

- [x] **1.0 Database Migration & Schema Update**
  - [x] 1.1 Verify current `coupons` table structure
  - [x] 1.2 Create migration file: `supabase/migrations/041_add_packages_per_coupon.sql`
  - [x] 1.3 Write SQL to add `packages_per_coupon` column (integer, default: 1, NOT NULL)
  - [x] 1.4 Add SQL to backfill existing coupons with default value
  - [x] 1.5 RLS policies configured for admin/petugas access
  - [x] 1.6 Review migration syntax and naming convention
  - [ ] 1.7 Apply migration locally and verify column exists — **pending Docker testing**

- [x] **2.0 Update TypeScript Types**
  - [x] 2.1 Located coupon type definition at `src/types/qurban.ts`
  - [x] 2.2 Added `packages_per_coupon: number` field to `QurbanCoupon` interface
  - [x] 2.3 No Zod schema needed — validation at hook level
  - [x] 2.4 Hook-level validation: positive integer, min 1
  - [x] 2.5 TypeScript compilation verified: `npm run build` ✓

- [x] **3.0 Enhance Coupon Creation Form**
  - [x] 3.1 Located components: `MustahikCouponPicker.tsx` and `PengurbanCouponPanel.tsx`
  - [x] 3.2 Added form field with label: "Paket per Kupon"
  - [x] 3.3 Used shadcn/ui `Input` component with type="number"
  - [x] 3.4 Set default value to 1
  - [x] 3.5 Implemented validation: positive integers only, min 1
  - [x] 3.6 Error handling for invalid inputs
  - [x] 3.7 Added help text: "Jumlah paket per kupon. Default: 1"
  - [x] 3.8 Field positioned separately from participant selection
  - [ ] 3.9-3.11 Form validation testing — **pending Docker testing**

- [x] **4.0 Update Coupon List & Display Components**
  - [x] 4.1 Located display components: per-muzakki dialog + detail view
  - [x] 4.2 Display package count in coupon list (badge when > 1)
  - [x] 4.3 Display `packages_per_coupon` on individual coupons (dialog + detail)
  - [x] 4.4 Scoped display (per-muzakki/per-mustahik, not global list)
  - [x] 4.5 Display handled in component scope (no global summary needed)
  - [x] 4.6 Styling consistent with existing coupon displays
  - [ ] 4.7-4.8 Visual verification & testing — **pending Docker testing**

- [ ] **5.0 Docker Local Testing & Verification**
  - [ ] 5.1 Start Docker local environment
  - [ ] 5.2 Verify database migration runs successfully
  - [ ] 5.3 Confirm `packages_per_coupon` column exists in `qurban_coupons` table
  - [ ] 5.4 Test: Create coupon with default packages (1)
  - [ ] 5.5 Test: Create coupon with custom packages (7)
  - [ ] 5.6 Test: Form validation with invalid inputs
  - [ ] 5.7 Test: Coupon displays show package count accurately
  - [ ] 5.8 Test: Multiple scenarios and edge cases
  - [ ] 5.9 Test: Participant assignment independence
  - [ ] 5.10 Test: Data persistence across restarts
  - [ ] 5.11 Test: Full qurban workflow end-to-end
  - [ ] 5.12 Build verification: `npm run build` ✓ (already passed)
  - [ ] 5.13 Run linting: `npm run lint`
  - [ ] 5.14 Document any issues or edge cases

---

## Implementation Notes

### Database Migration
- Migration file naming: `YYYYMMDDHHMMSS_add_packages_per_coupon.sql` (use current timestamp)
- Include `ALTER TABLE` for adding column and `UPDATE` for backfilling existing data
- Test migration in Docker before committing

### Form Validation
- Use existing React Hook Form + Zod pattern from qurban module
- Minimum value: 1 (positive integers only)
- No maximum limit (allows flexibility for custom scenarios)
- Display validation errors inline in form

### UI/UX
- New field should be clearly separated from participant selection
- Use consistent spacing and styling from existing coupon creation form
- Provide help text in Indonesian (inline hint or tooltip)

### Testing Strategy
1. **Unit-level**: Verify TypeScript types and Zod schemas
2. **Component-level**: Test form submission, validation, display
3. **Integration-level**: Full workflow in Docker environment
4. **Regression-level**: Confirm participant assignment and other workflows unaffected

### After Completion
1. Commit changes with message: `feat(qurban): add packages-per-coupon mapping system`
2. Create pull request to `main` branch
3. Ensure all tests pass in CI/CD
4. Request code review before merging

---

## Checklist for Developer

**Before starting:** Read the full PRD at `prd-task/generations/prd-coupon-packages.md`

**As you complete tasks:** 
- Update task status from `[ ]` to `[x]` after completing each sub-task
- Commit your changes regularly with descriptive messages
- Test functionality in Docker environment after each major section

**Before submitting PR:**
- [ ] All tasks marked complete (`[x]`)
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes without errors
- [ ] Docker testing checklist completed (section 5.0)
- [ ] Branch is up-to-date with `main`
- [ ] No console errors or warnings in browser
