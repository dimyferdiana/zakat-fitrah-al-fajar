# Migration Guide: Invitation Auth System

This guide explains how to apply invitation-auth migrations to Supabase for production.

## Current Production Baseline

For the invitation-auth feature set, ensure these migrations are present in remote history:

- `013_user_invitations_schema.sql`
- `015_rls_user_invitations_only.sql`
- `016_rls_invitation_auth.sql`
- `017_fix_users_rls_circular_reference.sql`
- `018_fix_users_rls_with_security_definer.sql`
- `019_fix_domain_table_rls_with_security_definer.sql`
- `020_remove_old_permissive_rls_policies.sql`
- `021_protect_last_active_admin.sql`

Recommended deployment method:

```bash
cd zakat-fitrah-app
supabase db push
```

Then verify:

```bash
supabase migration list
```

## Prerequisites

- Access to Supabase Dashboard
- Admin access to your Supabase project
- Backup of current database (recommended)

## Migration Files

Primary invitation-auth migrations are listed in **Current Production Baseline** above.
If you are on an older environment, apply all pending migrations in order via `supabase db push`.

## Step-by-Step Instructions

### Step 1: Backup Your Database (Recommended)

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Click **Backups** and create a new backup
3. Wait for backup to complete before proceeding

### Step 2: Apply Migration 013 (Schema Changes)

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/013_user_invitations_schema.sql`
4. Paste into the SQL Editor
5. Click **Run** or press `Ctrl+Enter` / `Cmd+Enter`
6. Verify success message appears

**Expected Results:**
- `user_invitations` table created
- `users` table now has `address` and `phone` columns
- Indexes created for invitation lookups
- Trigger for `updated_at` column created

**Verification Query:**
```sql
-- Check if user_invitations table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_invitations';

-- Check if new columns exist on users table
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name IN ('address', 'phone');
```

### Step 3: Apply RLS & Security Fix Migrations

1. In Supabase Dashboard → **SQL Editor**
2. Click **New Query** (or clear the previous query)
3. Apply all pending RLS/security migrations in order (`016` through `021`)
4. Paste into the SQL Editor
5. Click **Run** or press `Ctrl+Enter` / `Cmd+Enter`
6. Verify success message appears

**Expected Results:**
- Anonymous access blocked on protected domain tables
- Users table RLS no longer has circular-reference policy errors
- Domain-table RLS aligned to active-user checks
- Old permissive policies removed
- Last active admin cannot be deactivated/demoted/deleted

**Verification Query:**
```sql
-- Check if helper functions exist (security definer)
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_current_user_role', 'get_current_user_is_active', 'prevent_last_active_admin_change');

-- Check RLS is enabled on user_invitations
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_invitations';

-- List all policies on user_invitations (admin only)
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_invitations';
```

### Step 4: Verify Migration Success

Run this comprehensive verification query:

```sql
-- Comprehensive migration verification
WITH migration_check AS (
  SELECT 
    'user_invitations table exists' AS check_name,
    EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_invitations'
    ) AS passed
  
  UNION ALL
  
  SELECT 
    'users.address column exists',
    EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'address'
    )
  
  UNION ALL
  
  SELECT 
    'users.phone column exists',
    EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'phone'
    )
  
  UNION ALL
  
  SELECT 
    'get_current_user_role function exists',
    EXISTS (
      SELECT 1 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'get_current_user_role'
    )
  
  UNION ALL
  
  SELECT 
    'get_current_user_is_active function exists',
    EXISTS (
      SELECT 1 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'get_current_user_is_active'
    )

  UNION ALL

  SELECT 
    'prevent_last_active_admin_change function exists',
    EXISTS (
      SELECT 1 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'prevent_last_active_admin_change'
    )
  
  UNION ALL
  
  SELECT 
    'RLS enabled on user_invitations',
    (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_invitations')
)
SELECT 
  check_name,
  CASE WHEN passed THEN '✓ PASSED' ELSE '✗ FAILED' END AS status
FROM migration_check;
```

**All checks should show "✓ PASSED"**

### Step 5: Test RLS Policies

Test that anonymous access is properly blocked:

```sql
-- This should return 0 rows when executed as anon (not logged in)
-- In Supabase Dashboard, anonymous queries still run with service role
-- So to truly test, use the app's frontend after deploying

-- But you can check policies are correctly configured:
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN cmd = 'SELECT' THEN 'SELECT'
    WHEN cmd = 'INSERT' THEN 'INSERT'
    WHEN cmd = 'UPDATE' THEN 'UPDATE'
    WHEN cmd = 'DELETE' THEN 'DELETE'
    ELSE cmd
  END AS operation,
  qual AS using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('mustahik', 'muzakki', 'pembayaran_uang', 'pembayaran_beras', 'distribusi', 'user_invitations', 'users')
ORDER BY tablename, policyname;
```

## Troubleshooting

### Error: "Relation already exists"

Some objects may already exist from previous migration attempts. This is safe to ignore if:
- The error is about `users.address` or `users.phone` columns
- The error is about indexes or triggers

To fix, you can either:
1. Continue with the migration (other statements will still execute)
2. Manually drop the conflicting object first:

```sql
-- Example: Drop existing column (caution!)
ALTER TABLE public.users DROP COLUMN IF EXISTS address;
ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
```

### Error: "Policy already exists"

This means some policies from the migration already exist. To fix:

```sql
-- Drop all old policies (this is safe, the migration recreates them)
DROP POLICY IF EXISTS "mustahik_select_policy" ON public.mustahik;
-- Repeat for each policy mentioned in error
```

### Error: "Function does not exist"

Ensure all pending migrations are applied (`supabase db push`) and confirm function presence with the verification queries above.

### Testing Active User Check

To test that `is_active = false` users are blocked:

1. As admin, create a test user
2. Set `is_active = false` for that user
3. Try to log in as that user - should be rejected at login
4. Set `is_active = true` - user should be able to log in

```sql
-- Toggle user active status for testing
UPDATE public.users 
SET is_active = false 
WHERE email = 'test@example.com';

-- Re-enable
UPDATE public.users 
SET is_active = true 
WHERE email = 'test@example.com';
```

## Post-Migration Steps

After successfully applying migrations:

1. ✅ Deploy Edge Function (see [EDGE_FUNCTION_DEPLOYMENT.md](EDGE_FUNCTION_DEPLOYMENT.md))
2. ✅ Configure Email Templates (see [EMAIL_TEMPLATE_SETUP.md](EMAIL_TEMPLATE_SETUP.md))
3. ✅ Test invitation creation as admin
4. ✅ Test user registration with invitation
5. ✅ Test profile updates
6. ✅ Test deactivated user blocking

## Rollback Instructions

If you need to rollback these migrations:

```sql
-- Drop all new policies
DROP POLICY IF EXISTS "mustahik_select_policy" ON public.mustahik;
DROP POLICY IF EXISTS "mustahik_insert_policy" ON public.mustahik;
DROP POLICY IF EXISTS "mustahik_update_policy" ON public.mustahik;
DROP POLICY IF EXISTS "mustahik_delete_policy" ON public.mustahik;
-- Repeat for all tables: muzakki, pembayaran_uang, pembayaran_beras, distribusi, laporan_distribusi, user_invitations, users

-- Drop helper functions
DROP FUNCTION IF EXISTS public.is_active_user();
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Drop trigger and function
DROP TRIGGER IF EXISTS update_user_invitations_updated_at ON public.user_invitations;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop user_invitations table
DROP TABLE IF EXISTS public.user_invitations;

-- Remove columns from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS address;
ALTER TABLE public.users DROP COLUMN IF EXISTS phone;

-- Recreate your old anonymous policies if needed
-- (You'll need to reference your pre-migration policies)
```

## Notes

- The migrations are idempotent where possible (using `IF NOT EXISTS` and `IF EXISTS`)
- Existing data in `users` table is preserved
- The `address` and `phone` columns are nullable, so existing users won't be affected
- RLS policies are more restrictive now - ensure you have at least one admin user with `is_active = true` before applying!

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify you have admin access to Supabase Dashboard
3. Ensure no other migrations are running concurrently
4. Refer to Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
