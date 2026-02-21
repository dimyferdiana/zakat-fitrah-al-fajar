# Migration Application Guide: Hak Amil (023 & 024)

**Date:** 2026-02-20  
**Agent:** Agent A (Backend/DB)  
**Status:** Ready for Application

## Migration Files

1. **023_hak_amil_config_and_snapshots.sql**  
   - Creates `hak_amil_basis_mode` and `hak_amil_kategori` enums
   - Creates `hak_amil_configs` table (per tahun zakat configuration)
   - Creates `hak_amil_snapshots` table (per transaction immutable history)
   - Adds indexes for reporting performance
   - Adds unique constraints to prevent duplicate snapshots

2. **024_hak_amil_rls_and_audit.sql**  
   - Enables RLS on both tables
   - Admin: full CRUD on configs, full CRUD on snapshots
   - Petugas: read-only on configs, read + insert on snapshots
   - Creates audit log trigger for config changes

## Prerequisites

- [ ] Supabase project access (remote database)
- [ ] Admin/Owner role in Supabase project
- [ ] Confirmation that no conflicting tables exist
- [ ] Backup of current database (recommended)

## Application Methods

### Method 1: Supabase Dashboard SQL Editor (Recommended)

1. **Login to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `zakat-fitrah-al-fajar`

2. **Open SQL Editor**
   - Left sidebar → SQL Editor → New Query

3. **Apply Migration 023**
   - Copy entire content of `zakat-fitrah-app/supabase/migrations/023_hak_amil_config_and_snapshots.sql`
   - Paste into SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Verify: "Success. No rows returned"

4. **Apply Migration 024**
   - Copy entire content of `zakat-fitrah-app/supabase/migrations/024_hak_amil_rls_and_audit.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Verify: "Success. No rows returned"

5. **Verify Schema**
   ```sql
   -- Check tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN ('hak_amil_configs', 'hak_amil_snapshots');
   
   -- Check enums exist
   SELECT typname 
   FROM pg_type 
   WHERE typname IN ('hak_amil_basis_mode', 'hak_amil_kategori');
   
   -- Check RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
     AND tablename IN ('hak_amil_configs', 'hak_amil_snapshots');
   ```

   Expected Results:
   - 2 tables found
   - 2 enums found
   - Both tables have `rowsecurity = true`

6. **Verify Policies**
   ```sql
   SELECT schemaname, tablename, policyname, cmd
   FROM pg_policies
   WHERE tablename IN ('hak_amil_configs', 'hak_amil_snapshots')
   ORDER BY tablename, policyname;
   ```

   Expected: 8 policies (4 per table: SELECT, INSERT, UPDATE, DELETE)

### Method 2: Supabase CLI (Alternative)

```bash
# From project root
cd zakat-fitrah-app

# Ensure logged in
supabase login

# Link to remote project (if not already linked)
supabase link --project-ref <your-project-ref>

# Apply pending migrations
supabase db push

# Verify
supabase db diff
```

**Note:** This method applies ALL pending migrations, not just 023 and 024.

### Method 3: psql Direct Connection (Advanced)

```bash
# Get connection string from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Apply migrations
\i zakat-fitrah-app/supabase/migrations/023_hak_amil_config_and_snapshots.sql
\i zakat-fitrah-app/supabase/migrations/024_hak_amil_rls_and_audit.sql

# Verify
\dt public.hak_amil*
\dT public.hak_amil*
```

## Post-Application Checklist

- [ ] Tables created: `hak_amil_configs`, `hak_amil_snapshots`
- [ ] Enums created: `hak_amil_basis_mode`, `hak_amil_kategori`
- [ ] RLS enabled on both tables
- [ ] Policies applied (8 total)
- [ ] Audit trigger active on `hak_amil_configs`
- [ ] Indexes created (verify with `\di` in psql or check in Dashboard → Database → Indexes)
- [ ] Foreign key constraints valid (no orphaned references)

## Testing After Application

### 1. Test Config Creation (as Admin)

```sql
-- Get a valid tahun_zakat_id first
SELECT id, tahun_hijriah FROM tahun_zakat LIMIT 1;

-- Insert test config (use actual tahun_zakat_id from above)
INSERT INTO hak_amil_configs (
  tahun_zakat_id,
  basis_mode,
  persen_zakat_fitrah,
  persen_zakat_maal,
  persen_infak,
  persen_fidyah,
  persen_beras,
  created_by
) VALUES (
  '<tahun_zakat_id>',
  'net_after_reconciliation',
  12.50,
  12.50,
  20.00,
  0.00,
  0.00,
  auth.uid()
) RETURNING *;
```

### 2. Test Snapshot Creation (Automatic via App)

- Create a new `pemasukan_uang` transaction via UI
- Query `hak_amil_snapshots` to verify snapshot was created:
  ```sql
  SELECT * FROM hak_amil_snapshots ORDER BY created_at DESC LIMIT 5;
  ```

### 3. Test RLS (as Petugas)

- Login as petugas user
- Try to read configs (should succeed)
- Try to update config (should fail with RLS error)

## Rollback Plan

If issues occur, rollback with:

```sql
-- Drop tables (cascades to foreign keys and indexes)
DROP TABLE IF EXISTS public.hak_amil_snapshots CASCADE;
DROP TABLE IF EXISTS public.hak_amil_configs CASCADE;

-- Drop enums
DROP TYPE IF EXISTS public.hak_amil_kategori CASCADE;
DROP TYPE IF EXISTS public.hak_amil_basis_mode CASCADE;

-- Drop trigger and function
DROP TRIGGER IF EXISTS trg_log_hak_amil_config_changes ON public.hak_amil_configs;
DROP FUNCTION IF EXISTS public.log_hak_amil_config_changes();
```

## Notes

- **No Data Loss Risk:** These migrations only create new tables, no existing data is modified
- **Idempotent:** Migrations use `IF NOT EXISTS` checks and can be re-run safely
- **Estimated Time:** < 1 minute for both migrations
- **Downtime:** None required (additive changes only)

## Contact

If issues arise during application:
- Check Supabase logs: Dashboard → Logs → Postgres Logs
- Check migration file syntax (ensure no hidden characters)
- Verify user has sufficient permissions (must be `postgres` role or owner)

---

**Status After Review:**
- [ ] Migrations applied successfully
- [ ] Verification queries passed
- [ ] Test config and snapshot creation passed
- [ ] RLS policies validated
- [ ] Task 2.10 marked as complete in `tasks-hak-amil-uang-beras.md`
