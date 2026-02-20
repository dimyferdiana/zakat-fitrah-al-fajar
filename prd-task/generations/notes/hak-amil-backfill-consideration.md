# Hak Amil Snapshot Backfill Consideration

**Date:** 2026-02-20  
**Author:** Agent A (Backend/DB)  
**Status:** Implementation Note - Not Executed

## Overview

The hak amil snapshot persistence system has been implemented in Wave 2 to automatically create immutable calculation snapshots for all new pemasukan_uang and pemasukan_beras transactions.

## Current State

**Snapshot Creation Triggers:**
- ✅ `pemasukan_uang` transactions (all kategori)
- ✅ `pemasukan_beras` transactions (all kategori)  
- ⚠️ `rekonsiliasi` transactions (intentionally NOT creating snapshots - design decision)

**Design Decision on Rekonsiliasi:**  
Rekonsiliasi entries are treated as adjustments (corrections/reconciliation of amounts), not as income transactions themselves. They affect the net calculation for other categories but do NOT generate their own hak amil snapshots. This aligns with the PRD requirement that hak amil is calculated on actual income, not adjustments.

If this decision needs to be revisited in the future, the integration point is in `/zakat-fitrah-app/src/hooks/useRekonsiliasi.ts` at the `useCreateRekonsiliasi` mutation.

## Backfill Requirement

### Question
Do existing transactions (created before snapshot system was implemented) need retroactive snapshots?

### Scenarios

1. **New Installation / Fresh Database**  
   - No backfill needed
   - All future transactions will have snapshots automatically

2. **Existing Production Data**  
   - Historical `pemasukan_uang` and `pemasukan_beras` records exist without snapshots
   - Historical reporting for hak amil requires snapshots for those periods
   - Backfill is REQUIRED for complete historical reports

### Backfill Strategy (If Needed)

**Option A: SQL Backfill Script**  
Create a migration or one-time script to:
1. Query all existing `pemasukan_uang` and `pemasukan_beras` records without snapshots
2. Fetch the applicable `hak_amil_configs` for each tahun_zakat
3. Calculate snapshots using the same logic as `hakAmilCalculator`
4. Insert into `hak_amil_snapshots` with appropriate foreign keys

**Option B: Manual Review + Selective Backfill**  
If historical data is limited or policy decision is to only track forward:
1. Document cutoff date (e.g., "snapshots start from Feb 2026")
2. Create config-only for old years if summary needed
3. Accept that old periods don't have granular snapshots

### Recommended Action

**DO NOT execute backfill automatically.** Coordinate with:
- **Product Owner / PM:** Policy decision on historical data requirements
- **Admin Users:** Confirm if old reports are needed or if forward-only tracking is acceptable

### Implementation Location

If backfill is approved, implementation would be:
- **File:** `zakat-fitrah-app/supabase/scripts/backfill_hak_amil_snapshots.sql` (new file)
- **Execution:** One-time manual run via Supabase SQL Editor or CLI
- **Validation:** Query snapshot counts per tahun_zakat before/after

---

## Technical Notes

### Idempotency
The snapshot creation includes unique indexes per source transaction:
- `idx_hak_amil_snapshots_unique_pemasukan_uang`
- `idx_hak_amil_snapshots_unique_pemasukan_beras`
- `idx_hak_amil_snapshots_unique_rekonsiliasi`

This prevents duplicate snapshots even if creation is called multiple times.

### Immutability
Once created, snapshots preserve the calculation basis and percentages at the time of transaction. Future config changes do NOT mutate old snapshots. This is enforced by:
1. Snapshot stores `basis_mode` and `persen_hak_amil` explicitly
2. No UPDATE policies on snapshots (admin can delete but not update)
3. Reporting aggregates from snapshots, not recalculated on-the-fly

### Failure Handling
Snapshot creation failures are logged but do NOT block the main transaction. This ensures:
- Transaction UX is not degraded if snapshot write fails
- Monitoring can detect missing snapshots via query: 
  ```sql
  SELECT p.id 
  FROM pemasukan_uang p
  LEFT JOIN hak_amil_snapshots h ON h.pemasukan_uang_id = p.id
  WHERE h.id IS NULL;
  ```

---

**Next Steps:**
1. Apply migrations 023 and 024 to remote Supabase
2. Document decision on backfill (coordinate with PM/Admin)
3. If backfill approved, create and test backfill script
4. Monitor snapshot creation in production for first week
