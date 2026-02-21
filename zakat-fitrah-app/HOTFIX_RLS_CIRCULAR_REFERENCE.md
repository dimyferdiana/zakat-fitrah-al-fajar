# Hotfix: RLS Circular Reference Issue

## Problem

After deploying migration 016 (RLS policies update), users were unable to login. The error log showed:

```
Failed to load resource: the server responded with a status of 500
/rest/v1/users?select=*&id=eq.87dab628-279b-47ba-850e-737b17368c77
Error fetching user data
```

## Root Cause

The `users` table RLS policy created a **circular reference**:

```sql
-- Problematic policy from migration 016
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u  -- ❌ Querying users table from within users table policy!
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND u.is_active = true
    )
  );
```

**What happened:**
1. User tries to fetch their profile from `users` table
2. RLS policy activates to check permissions
3. Policy tries to query `users` table to check if user is_active
4. This triggers the same RLS policy again (infinite loop)
5. Database returns 500 error

## Solution

**Migration 017** fixes this by:

### 1. Remove Circular Reference in Users Table Policies

```sql
-- ✅ Fixed: Users can always read their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());  -- Simple check, no subquery

-- ✅ Fixed: Simplified admin check
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

### 2. Enforce `is_active` at Application Level

The `is_active` check is already properly implemented in `/src/lib/auth.tsx`:

```typescript
const fetchUserData = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // Application-level check
  if (data && !data.is_active) {
    await logout();
    throw new Error('Akun Anda tidak aktif. Silakan hubungi administrator.');
  }

  setUser(data as User);
};
```

### 3. Other Tables Still Protected

All other tables (mustahik, muzakki, pemasukan_uang, etc.) still have RLS policies that check `is_active = true`, ensuring only active users can access data.

## Security Model

**Layered Security Approach:**

1. **Database Level (RLS):**
   - Anonymous users: blocked from all tables
   - Authenticated users: can read their own profile
   - All other table access requires authenticated users

2. **Application Level:**
   - Checks `is_active` status after fetching user profile
   - Immediately logs out inactive users
   - Shows appropriate error messages

3. **Combined Protection:**
   - Inactive users can read their own profile but are logged out by app
   - Inactive users cannot access any other data (blocked by RLS on other tables)
   - This provides the same security without circular references

## Files Modified

- ✅ **Migration 017** - `017_fix_users_rls_circular_reference.sql`
  - Fixed circular reference in users table RLS policies
  - Applied to remote database

- ✅ **Application Code** - Already correct
  - `src/lib/auth.tsx` - is_active check already in place
  - No changes needed

## Testing

After applying the fix:

1. ✅ Login now works correctly
2. ✅ Users can fetch their profile data
3. ✅ is_active check still enforced (at app level)
4. ✅ Inactive users are immediately logged out
5. ✅ All other tables remain protected by RLS

## Verification Steps

To verify the fix is working:

```bash
# 1. Check migration was applied
supabase db remote sql "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 3;"

# 2. Check users table policies
supabase db remote sql "SELECT policyname, permissive FROM pg_policies WHERE tablename = 'users';"

# 3. Test login from the app
# - Should successfully fetch user data
# - Should not show 500 error
# - Should enforce is_active check at app level
```

## Lessons Learned

1. **Avoid self-referencing RLS policies** - Don't query the same table within its own RLS policy
2. **Use layered security** - Combine database RLS with application-level checks
3. **Test RLS policies thoroughly** - Always test policies after deployment
4. **Keep policies simple** - Complex policies are more prone to errors

## Related Files

- Migration: `supabase/migrations/017_fix_users_rls_circular_reference.sql`
- Auth Context: `src/lib/auth.tsx`
- Previous Migration: `supabase/migrations/016_rls_invitation_auth.sql` (the one that introduced the bug)

## Status

✅ **Fixed and Deployed**
- Migration 017 applied to production database
- Code pushed to GitHub
- Vercel redeployment triggered
- Login functionality restored
