# Hak Amil Feature Guide

## Overview

The Hak Amil feature automatically calculates and tracks the mosque's administrative fee (hak amil) for various income categories according to Islamic principles. This guide covers the formula, configuration, and usage.

---

## Formula Table

The system applies the following percentages to calculate hak amil:

| Category | Percentage | Notes |
|----------|------------|-------|
| Zakat Fitrah | 12.5% | Applied to zakat fitrah income (uang & beras) |
| Zakat Maal | 12.5% | Applied to zakat maal income |
| Infak | 20% | Applied to infak/sedekah income |
| Fidyah | 0% | No hak amil taken from fidyah |
| Beras | 0% | No hak amil taken from beras transactions |

**Important:** Categories with 0% (fidyah, beras) still appear in all reports showing `0 Rp` for transparency.

---

## Basis Mode Calculation

The system supports two calculation basis modes:

### 1. Net After Reconciliation (Default)
**Basis Mode:** `net_after_reconciliation`

Formula: `Hak Amil = (Gross Amount - Reconciliation) × Percentage`

**Example:**
- Zakat Fitrah gross: Rp 10,000,000
- Reconciliation adjustment: -Rp 500,000
- Net: Rp 9,500,000
- Hak Amil (12.5%): Rp 1,187,500

**Use case:** When you want hak amil calculated after accounting for adjustments/corrections.

### 2. Gross Before Reconciliation
**Basis Mode:** `gross_before_reconciliation`

Formula: `Hak Amil = Gross Amount × Percentage`

**Example:**
- Zakat Fitrah gross: Rp 10,000,000
- Reconciliation adjustment: -Rp 500,000 (ignored for hak amil calculation)
- Hak Amil (12.5%): Rp 1,250,000

**Use case:** When you want hak amil based on original transaction amounts only.

---

## Configuration Workflow (Admin Only)

### Initial Setup

1. **Navigate to Settings**
   - Go to Settings page → "Hak Amil" tab
   - Only admins can edit; petugas see read-only view with lock badge

2. **Create Configuration for a Year**
   - Select Tahun Zakat (e.g., "1446 H (2025 M)")
   - Choose Basis Mode (default: Net After Reconciliation)
   - Set percentages (defaults match PRD formula)
   - Click "Simpan Konfigurasi"

3. **System Behavior**
   - One config per tahun zakat (unique constraint)
   - All new transactions automatically use active year's config
   - Config changes are audit-logged with actor + timestamp

### Updating Configuration

- Edit existing config via table actions
- Changes apply to NEW transactions only
- Historical snapshots remain immutable

---

## Snapshot Immutability Concept

### What is a Snapshot?

Every income transaction (uang/beras) automatically creates a **hak_amil_snapshot** record storing:
- Basis mode used at transaction time
- Percentage applied
- Calculation breakdown (bruto, rekonsiliasi, neto, nominal hak amil)

### Why Immutable?

**Problem:** If you change next year's config (e.g., infak 20% → 25%), old reports shouldn't recalculate.

**Solution:** Snapshots store the calculation at transaction time. When config changes:
- ✅ New transactions use new config
- ✅ Old snapshots preserve historical values
- ✅ Reports remain consistent across time

### Technical Details

- Snapshot creation integrated in `usePemasukanUang` and `usePemasukanBeras` hooks
- Failure to create snapshot logs error but doesn't block transaction
- Unique index per source transaction prevents duplicates
- Rekonsiliasi does NOT create snapshots (it's an adjustment, not income)

---

## Report Aggregation

### Dashboard View

**Location:** Dashboard → "Hak Amil" section

**Shows:**
- Current period summary (today/week/month)
- Per-category nominal hak amil
- Grand total hak amil
- All 5 categories displayed (including 0% ones)

### Laporan Page

**Location:** Laporan → "Hak Amil" tab

**Filters:**
- Month selector
- Tahun Zakat selector
- Category filter

**Columns:**
| Column | Description |
|--------|-------------|
| Bruto | Gross amount before reconciliation |
| Rekonsiliasi | Adjustment amount (+ or -) |
| Neto | Net amount after reconciliation |
| Persen (%) | Hak amil percentage for category |
| Nominal Hak Amil | Calculated hak amil amount |

**Aggregation Logic:**
- Queries `hak_amil_snapshots` table
- Sums by kategori for selected period
- Groups all 5 categories (fidyah/beras show zeros)
- Grand total row at bottom

---

## Export Usage

### PDF Export

**Features:**
- Header with mosque info
- Filter metadata (periode, tahun, basis mode)
- Category breakdown table
- Grand total row
- Auto-pagination for large reports

**Usage:**
```tsx
import { exportHakAmilPDF } from '@/utils/export';

exportHakAmilPDF(summary, {
  periode: 'Jan 2025',
  tahunZakatNama: '1446 H (2025 M)',
  basisMode: 'net_after_reconciliation',
});
```

### Excel Export

**Features:**
- Same data as PDF
- Configurable column widths
- Formatted currency and percentages
- Easy to edit/analyze in spreadsheet software

**Usage:**
```tsx
import { exportHakAmilExcel } from '@/utils/export';

exportHakAmilExcel(summary, {
  periode: 'Jan 2025',
  tahunZakatNama: '1446 H (2025 M)',
  basisMode: 'net_after_reconciliation',
});
```

**File naming:** `Laporan-Hak-Amil-{timestamp}.{pdf|xlsx}`

---

## Role-Based Access

### Admin Role
- ✅ View all hak amil reports
- ✅ Create/edit/delete hak amil configs
- ✅ Export PDF/Excel
- ✅ View audit log of config changes

### Petugas Role
- ✅ View all hak amil reports
- ✅ Read-only view of configs (with lock badge)
- ✅ Export PDF/Excel
- ❌ Cannot modify configs

### RLS Policies

**hak_amil_configs:**
- SELECT: admin + petugas (both active)
- INSERT/UPDATE/DELETE: admin only (active)

**hak_amil_snapshots:**
- SELECT: admin + petugas (both active)
- INSERT: admin + petugas (auto-created by transaction)
- UPDATE/DELETE: admin only

---

## Edge Cases & Validation

### Zero/Negative Values
- Zero amounts: valid, snapshot created with 0 nominal hak amil
- Negative reconciliation: valid (increases neto), deterministic rounding applied
- Formula: always `floor(value + 0.5)` with epsilon handling

### Large Values
- Tested up to Rp 9,999,999,999,999 without rounding drift
- Uses PostgreSQL `NUMERIC(15,2)` for precision

### Missing Config
- If no config exists for tahun_zakat, system uses hardcoded defaults
- Default basis: `net_after_reconciliation`
- Default percentages: as per PRD formula table

### Snapshot Idempotency
- Unique index prevents duplicate snapshots per source transaction
- Retry-safe: duplicate insert silently fails
- Failure logged but doesn't block transaction

---

## Database Schema Reference

### hak_amil_configs

```sql
CREATE TABLE hak_amil_configs (
    id UUID PRIMARY KEY,
    tahun_zakat_id UUID UNIQUE NOT NULL,
    basis_mode hak_amil_basis_mode DEFAULT 'net_after_reconciliation',
    persen_zakat_fitrah NUMERIC(5,2) DEFAULT 12.50,
    persen_zakat_maal NUMERIC(5,2) DEFAULT 12.50,
    persen_infak NUMERIC(5,2) DEFAULT 20.00,
    persen_fidyah NUMERIC(5,2) DEFAULT 0.00,
    persen_beras NUMERIC(5,2) DEFAULT 0.00,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### hak_amil_snapshots

```sql
CREATE TABLE hak_amil_snapshots (
    id UUID PRIMARY KEY,
    tahun_zakat_id UUID NOT NULL,
    kategori hak_amil_kategori NOT NULL,
    tanggal DATE NOT NULL,
    basis_mode hak_amil_basis_mode NOT NULL,
    
    -- Source transaction references (exactly one required)
    pemasukan_uang_id UUID,
    pemasukan_beras_id UUID,
    rekonsiliasi_id UUID,
    
    total_bruto NUMERIC(15,2),
    total_rekonsiliasi NUMERIC(15,2),
    total_neto NUMERIC(15,2),
    nominal_basis NUMERIC(15,2),
    persen_hak_amil NUMERIC(5,2),
    nominal_hak_amil NUMERIC(15,2),
    
    catatan TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ
);
```

**Indexes:**
- `tahun_zakat_id, kategori, tanggal` (composite for fast queries)
- Unique per source transaction (idempotency)

---

## Testing

### Unit Tests

**File:** `src/utils/hakAmilCalculator.test.ts`

**Coverage:**
- ✅ Fixed percentage mapping per category
- ✅ Both basis modes for all categories
- ✅ Zero nominal values
- ✅ Negative reconciliation adjustments
- ✅ Very large values (up to trillions)
- ✅ Deterministic rounding (half-away-from-zero)

**Run tests:**
```bash
npx vitest run src/utils/hakAmilCalculator.test.ts
```

### Manual Testing Checklist

1. **Config Creation:** Admin creates config for active year
2. **Transaction Flow:** Create pemasukan_uang → verify snapshot created
3. **Report Accuracy:** Check dashboard/laporan totals match manual calculation
4. **Immutability:** Change config → verify old reports unchanged
5. **Export Integrity:** Export PDF/Excel → verify data matches screen
6. **Role Access:** Login as petugas → verify read-only mode

---

## Troubleshooting

### Snapshot Not Created
**Symptom:** Transaction succeeds but no snapshot in database

**Causes:**
- Missing tahun_zakat_id in transaction
- Kategori not mappable to HakAmilCategory
- Database permissions issue

**Debug:**
1. Check console logs for snapshot errors
2. Verify transaction has valid tahun_zakat_id
3. Check kategori mapping in `hakAmilSnapshot.ts`

### Reports Show Incorrect Totals
**Symptom:** Dashboard/laporan totals don't match expected values

**Causes:**
- Date filter issue
- Tahun zakat filter mismatch
- Missing snapshots for some transactions

**Debug:**
1. Query snapshots directly: `SELECT * FROM hak_amil_snapshots WHERE tahun_zakat_id = '...'`
2. Verify date ranges in query
3. Check aggregation logic in `useHakAmil.ts`

### Config Cannot Be Created
**Symptom:** Error when saving config

**Causes:**
- Duplicate tahun_zakat_id (unique constraint)
- Percentage out of range (0-100)
- User not admin

**Debug:**
1. Check existing configs: `SELECT * FROM hak_amil_configs`
2. Verify user role: `SELECT role FROM users WHERE id = auth.uid()`
3. Check RLS policies enabled

---

## API Reference

### Hooks

#### `useHakAmilConfig(tahunZakatId)`
Fetch config for a specific year.

#### `useHakAmilMonthlySummary(tahunZakatId, month, year)`
Get monthly aggregated report.

#### `useHakAmilYearlySummary(tahunZakatId)`
Get yearly aggregated report.

#### `useCreateHakAmilConfig()`
Mutation to create new config.

#### `useUpdateHakAmilConfig()`
Mutation to update existing config.

### Utilities

#### `calculateHakAmil(input)`
Returns nominal hak amil (number).

#### `buildHakAmilBreakdown(input)`
Returns full breakdown object with all components.

#### `createHakAmilSnapshot(input)`
Creates snapshot record (called automatically by transaction hooks).

---

## Migration Guide

**Applied migrations:**
- `023_hak_amil_config_and_snapshots.sql` - Tables and structure
- `024_hak_amil_rls_and_audit.sql` - Security and audit logging

**Manual application:** Already applied to remote database (Feb 20, 2026).

**Backfill consideration:** See `hak-amil-backfill-consideration.md` for decision on historical transactions.

---

## Support & Maintenance

**Primary files:**
- Core logic: `src/utils/hakAmilCalculator.ts`
- Snapshot creation: `src/lib/hakAmilSnapshot.ts`
- Hooks: `src/hooks/useHakAmil.ts`
- UI components: `src/components/settings/HakAmilConfig*.tsx`
- Export: `src/utils/export.ts` (exportHakAmilPDF/Excel functions)

**Monitoring:**
- Audit logs: `SELECT * FROM audit_logs WHERE action LIKE '%HAK_AMIL%'`
- Snapshot errors: Check application logs for "Failed to create hak_amil_snapshot"
- Performance: Monitor snapshot creation time during peak transaction periods

---

**Last Updated:** February 20, 2026  
**Feature Version:** 1.0.0  
**PRD Reference:** `prd-hak-amil-uang-beras.md`
