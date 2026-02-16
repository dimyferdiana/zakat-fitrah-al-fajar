# Fix: Pengaturan Page Error - Tahun Zakat Table

## Issue
The Pengaturan (Settings) page was crashing with the error:
```
TypeError: Cannot read properties of undefined (reading 'toFixed')
at formatNumber (NilaiZakatTable.tsx:48:18)
```

## Root Cause
The `formatNumber` and `formatCurrency` functions in `NilaiZakatTable.tsx` were not handling cases where:
1. The data might be `undefined` or `null`
2. The `tahun_zakat` table is empty (no records exist)

## Solution Applied

### 1. Added Null-Safe Formatting Functions
Modified `formatNumber` and `formatCurrency` to handle null/undefined values:

```typescript
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number | null) => {
  if (value === null || value === undefined) return '0.00';
  return value.toFixed(2);
};
```

### 2. Created SQL Script to Insert Initial Data
Created `supabase/insert-tahun-zakat.sql` to populate the tahun_zakat table:

```sql
-- Insert current year (1446 H / 2025 M)
INSERT INTO public.tahun_zakat (tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active) 
VALUES ('1446 H', 2025, 2.5, 45000, true);

-- Insert previous year (1445 H / 2024 M)
INSERT INTO public.tahun_zakat (tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active) 
VALUES ('1445 H', 2024, 2.5, 40000, false);
```

## How to Populate Initial Data

### Option 1: Via Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `supabase/insert-tahun-zakat.sql`
4. Run the query

### Option 2: Via the Application UI
1. Navigate to Pengaturan page
2. Click "Tambah Tahun Zakat" button
3. Fill in the form:
   - Tahun Hijriah: 1446 H
   - Tahun Masehi: 2025
   - Nilai Beras: 2.5
   - Nilai Uang: 45000
   - Status: Aktif (checked)
4. Click Save

## Files Modified
- `src/components/settings/NilaiZakatTable.tsx` - Added null-safe formatting
- `src/hooks/useNilaiZakat.ts` - Interface already correct
- `supabase/insert-tahun-zakat.sql` - New file for initial data

## Verification
✅ Formatting functions handle null/undefined safely
✅ Empty table state displays "Belum ada data tahun zakat."
✅ After inserting data, the table displays correctly

## Database Schema Reference
```sql
CREATE TABLE tahun_zakat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tahun_hijriah VARCHAR(20) NOT NULL,
    tahun_masehi INTEGER NOT NULL UNIQUE,
    nilai_beras_kg DECIMAL(10,2) NOT NULL,
    nilai_uang_rp DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Note: The columns `nilai_beras_kg` and `nilai_uang_rp` are NOT NULL in the database.

## Date Fixed
December 24, 2025
