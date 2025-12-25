# Supabase Database Structure

This directory contains all database-related files for the Zakat Fitrah Al-Fajar application.

## Directory Structure

```
supabase/
├── migrations/          # Database schema migrations (version-controlled)
│   ├── 001_initial_schema.sql
│   ├── 001_initial_schema_safe.sql
│   └── 002_rls_policies.sql
│
├── seeds/              # Seed data for development and testing
│   ├── seed.sql                 # Main seed data (categories, sample data)
│   ├── create-test-users.sql    # Test user accounts
│   └── insert-tahun-zakat.sql   # Initial tahun zakat data
│
├── scripts/            # Utility and helper scripts
│   ├── check-database-status.sql      # Verify database status
│   ├── check-mustahik-structure.sql   # Check mustahik table structure
│   └── create-helper-functions.sql    # Helper functions (get_user_role, etc)
│
├── fixes/              # One-time fix scripts for data/schema issues
│   ├── diagnose-and-fix-mustahik.sql
│   ├── fix-mustahik-table.sql
│   └── quick-fix-mustahik.sql
│
└── docs/               # Documentation
    └── DATABASE_SETUP.md
```

## Usage Guide

### 1. Initial Setup (New Database)

Run these in order:

1. **Create Schema:**
   ```sql
   -- Run in Supabase SQL Editor
   migrations/001_initial_schema.sql
   ```

2. **Apply RLS Policies:**
   ```sql
   migrations/002_rls_policies.sql
   ```

3. **Create Helper Functions:**
   ```sql
   scripts/create-helper-functions.sql
   ```

4. **Seed Data:**
   ```sql
   seeds/seed.sql
   seeds/create-test-users.sql
   seeds/insert-tahun-zakat.sql
   ```

### 2. Development & Testing

#### Test Credentials
After running `create-test-users.sql`:
- **Admin:** admin@example.com (set your own password)
- **Petugas:** petugas@example.com (set your own password)
- **Viewer:** viewer@example.com (set your own password)

#### Seed Data
The `seed.sql` includes:
- 8 kategori mustahik (Fakir, Miskin, Amil, etc.)
- Sample muzakki (5 families)
- Sample mustahik (2 families)
- Current and previous year tahun_zakat

### 3. Troubleshooting

If you encounter issues:

1. **Check Database Status:**
   ```sql
   scripts/check-database-status.sql
   ```

2. **Check Mustahik Structure:**
   ```sql
   scripts/check-mustahik-structure.sql
   ```

3. **Apply Fixes (if needed):**
   ```sql
   -- Choose based on the issue
   fixes/quick-fix-mustahik.sql         # Quick mustahik table fixes
   fixes/fix-mustahik-table.sql         # Comprehensive mustahik fixes
   fixes/diagnose-and-fix-mustahik.sql  # Diagnostic + fix
   ```

### 4. Schema Updates

#### Adding Real Database Columns

The production database has additional columns not in migration files:

**pembayaran_zakat table:**
- `nilai_per_orang` DECIMAL - NOT NULL (nilai per jiwa)
- `total_zakat` DECIMAL - NOT NULL (total amount)
- `petugas_penerima` UUID - NOT NULL (user who received payment)

**distribusi_zakat table:**
- `petugas_distribusi` UUID - NOT NULL (user who distributed)

These are handled in the application code but should be added to future migrations.

## Key Tables

### Core Tables
- `users` - Application users (admin, petugas, viewer)
- `tahun_zakat` - Zakat year configuration (nilai per jiwa)
- `kategori_mustahik` - 8 categories of mustahik recipients

### Transaction Tables
- `muzakki` - Zakat payers (muzakki) master data
- `pembayaran_zakat` - Zakat payments (pemasukan)
- `mustahik` - Zakat recipients (mustahik) per year
- `distribusi_zakat` - Zakat distributions to mustahik

### Audit
- `audit_logs` - System audit trail

## Database Enums

- `user_role`: admin | petugas | viewer
- `jenis_zakat`: beras | uang
- `status_distribusi`: pending | selesai

## Security

All tables have Row Level Security (RLS) enabled with role-based policies:
- **Admin**: Full access to all operations
- **Petugas**: Can create and update, limited delete
- **Viewer**: Read-only access

## Helper Functions

- `get_user_role()` - Returns current user's role for RLS policies

## Notes

- Always backup database before running fix scripts
- Test migrations on staging before production
- Keep migrations numbered and sequential
- Document schema changes in migration files
- Use seeds for reproducible test data
