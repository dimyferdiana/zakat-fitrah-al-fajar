# Database Fixes Applied

This document tracks all one-time fixes applied to the database schema and data.

## 2025-01-24: Mustahik Table Structure Fixes

### Issue
The mustahik table had column naming mismatches between code and database schema.

### Problems Fixed
1. **Column Name Mismatch**: `kategori_mustahik_id` renamed to `kategori_id`
2. **Unnecessary Column**: Removed `tahun_zakat_id` column (not needed)
3. **Missing Function**: Created `get_user_role()` helper function for RLS policies
4. **Sample Data**: Inserted 5 sample mustahik families across different categories

### Scripts Used
- `quick-fix-mustahik.sql` - Comprehensive fix with backup and restoration

### Files Modified
- `src/hooks/useMustahik.ts` - Updated interface and queries

---

## 2025-01-24: Pembayaran Zakat Column Name Fixes

### Issue
Column references in code didn't match actual database schema.

### Problems Fixed
1. Changed `total_kg` → `jumlah_beras_kg` throughout codebase
2. Changed `total_rp` → `jumlah_uang_rp` throughout codebase
3. Added missing fields: `nilai_per_orang`, `total_zakat`, `petugas_penerima`

### Files Modified
- `src/hooks/useDistribusi.ts`
- `src/hooks/useMuzakki.ts`
- `src/components/laporan/LaporanPemasukan.tsx`
- `src/components/laporan/PerbandinganTahun.tsx`
- `src/components/muzakki/MuzakkiTable.tsx`
- `src/components/muzakki/BuktiPembayaran.tsx`
- `src/utils/export.ts`

---

## 2025-01-24: Distribusi Zakat Additional Fields

### Issue
Missing required field: `petugas_distribusi`

### Problems Fixed
Added `petugas_distribusi` field to store user who distributed the zakat.

### Files Modified
- `src/hooks/useDistribusi.ts`

---

## 2025-01-24: Pengaturan Page Error Fix

### Issue
NilaiZakatTable component crashed when `nilai_beras_kg` or `nilai_uang_rp` were undefined.

### Problems Fixed
Made `formatNumber` and `formatCurrency` functions null-safe.

### Files Modified
- `src/components/settings/NilaiZakatTable.tsx`

---

## Schema Discrepancies

### Production vs Migration Files

The production database has additional columns not present in migration files:

#### pembayaran_zakat
- `nilai_per_orang` DECIMAL NOT NULL
- `total_zakat` DECIMAL NOT NULL  
- `petugas_penerima` UUID NOT NULL

#### distribusi_zakat
- `petugas_distribusi` UUID NOT NULL

**Recommendation**: Create a new migration to add these columns officially.

---

## Lessons Learned

1. **Always validate database schema matches TypeScript interfaces**
2. **Check actual production schema vs migration files**
3. **Use defensive programming (null checks) for display functions**
4. **Document schema changes immediately**
5. **Keep migration files in sync with actual database**

---

## Future Actions

1. Create migration `003_add_missing_columns.sql` to officially add:
   - pembayaran_zakat: nilai_per_orang, total_zakat, petugas_penerima
   - distribusi_zakat: petugas_distribusi

2. Update `database.types.ts` to reflect actual schema

3. Consider using Supabase CLI to generate types from database schema
