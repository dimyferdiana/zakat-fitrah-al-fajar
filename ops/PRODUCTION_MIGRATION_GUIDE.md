# Production Migration Guide - Hak Amil Feature

## Issue: Console Errors on Production

If you're seeing these errors in production:
```
Failed to load resource: the server responded with a status of 400
zuykdhqdklsskgrtwejg.supabase.co/rest/v1/hak_amil_configs?select=*
```

**Cause:** The Hak Amil feature tables (`hak_amil_configs` and `hak_amil_snapshots`) don't exist in your production database yet.

---

## Solution: Apply Migrations to Production

### Option 1: Supabase Dashboard (Recommended)

1. **Go to production Supabase project:**
   - Visit https://supabase.com/dashboard
   - Select your production project: `zuykdhqdklsskgrtwejg`

2. **Open SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Migration 023:**
   - Copy contents of `zakat-fitrah-app/supabase/migrations/023_hak_amil_config_and_snapshots.sql`
   - Paste into SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - Verify success message

4. **Run Migration 024:**
   - Copy contents of `zakat-fitrah-app/supabase/migrations/024_hak_amil_rls_and_audit.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Verify success message

5. **Verify Tables Created:**
   - Go to "Table Editor" in sidebar
   - Check for new tables:
     - ✅ `hak_amil_configs`
     - ✅ `hak_amil_snapshots`

---

### Option 2: Supabase CLI

```bash
cd zakat-fitrah-app

# Link to production project
supabase link --project-ref zuykdhqdklsskgrtwejg

# Apply pending migrations
supabase db push
```

---

## Post-Migration Verification

1. **Clear browser cache** and reload production site
2. **Check console** - errors should be gone
3. **Test Hak Amil tab** in Settings page:
   - Should load without errors
   - Admin can create config
   - Petugas see read-only view

---

## Error Handling (Already Implemented)

The app now has defensive error handling that:
- ✅ Returns empty data if tables don't exist (no crash)
- ✅ Logs helpful warnings to console
- ✅ Shows user-friendly error messages when trying to save configs

So the app will work even without migrations, but the Hak Amil feature won't be functional until migrations are run.

---

## Need Help?

If migrations fail or you see other errors:
1. Check Supabase logs in Dashboard → Database → Logs
2. Verify your user has admin privileges on production database
3. Check for conflicts with existing tables (unlikely)

---

## Rollback (If Needed)

If you need to undo these migrations:

```sql
-- Drop tables (WARNING: This deletes all hak amil data)
DROP TABLE IF EXISTS public.hak_amil_snapshots CASCADE;
DROP TABLE IF EXISTS public.hak_amil_configs CASCADE;

-- Drop enums
DROP TYPE IF EXISTS public.hak_amil_basis_mode CASCADE;
DROP TYPE IF EXISTS public.hak_amil_kategori CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.log_hak_amil_config_changes() CASCADE;
```

Only run rollback if absolutely necessary! This will delete all hak amil configuration and historical data.
