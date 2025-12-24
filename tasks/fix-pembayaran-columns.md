# Fix: Pembayaran Zakat Column Names

## Issue
The application was throwing 400 Bad Request errors on the Distribusi Zakat page and Laporan pages because the code was querying non-existent columns from the `pembayaran_zakat` table.

## Root Cause
The code was using incorrect column names:
- `total_kg` (incorrect) → should be `jumlah_beras_kg` (correct)
- `total_rp` (incorrect) → should be `jumlah_uang_rp` (correct)

## Files Fixed

### 1. `src/hooks/useDistribusi.ts`
**Lines affected:** 145, 152, 197, 207
- Fixed `useStokCheck` query to select correct columns
- Fixed `createDistribusi` stock validation to use correct columns
- Changed all references from `total_kg` to `jumlah_beras_kg`
- Changed all references from `total_rp` to `jumlah_uang_rp`

### 2. `src/components/laporan/LaporanPemasukan.tsx`
**Lines affected:** 56, 60, 278-279
- Fixed summary calculation for total beras
- Fixed summary calculation for total uang
- Fixed table display to show correct column values

### 3. `src/components/laporan/PerbandinganTahun.tsx`
**Lines affected:** 50, 55, 59
- Fixed query to select correct columns
- Fixed calculation for pemasukan beras
- Fixed calculation for pemasukan uang

### 4. `src/utils/export.ts`
**Lines affected:** 100-101, 133-134
- Fixed PDF export function to use correct columns
- Fixed Excel export function to use correct columns

## Database Schema Reference
```sql
CREATE TABLE pembayaran_zakat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    muzakki_id UUID REFERENCES muzakki(id),
    tahun_zakat_id UUID REFERENCES tahun_zakat(id),
    jumlah_jiwa INTEGER NOT NULL,
    jenis_zakat jenis_zakat NOT NULL,
    jumlah_beras_kg NUMERIC(10,2),  -- Correct column name
    jumlah_uang_rp NUMERIC(12,2),   -- Correct column name
    tanggal_bayar DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Verification
✅ All TypeScript errors resolved
✅ No more references to `total_kg` or `total_rp` in the codebase
✅ Database types in `database.types.ts` already had correct column names

## Testing
To verify the fixes:
1. Navigate to Distribusi Zakat page - should load without console errors
2. Navigate to Laporan Pemasukan page - should display data correctly
3. Try filtering/exporting reports - should work without errors
4. Check browser console - should be clean with no 400 errors

## Date Fixed
January 2025
