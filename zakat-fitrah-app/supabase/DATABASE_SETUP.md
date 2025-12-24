# Database Setup Guide

Follow these steps to set up your Supabase database for the Zakat Fitrah application.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zuykdhqdklsskgrtwejg
2. Click **SQL Editor** in the left sidebar

## Step 2: Run Initial Schema Migration

1. Open the file: `supabase/migrations/001_initial_schema.sql`
2. Copy ALL the contents
3. In Supabase SQL Editor, click **New Query**
4. Paste the SQL code
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for success message: "Success. No rows returned"

This creates:
- All database tables (users, tahun_zakat, kategori_mustahik, muzakki, pembayaran_zakat, mustahik, distribusi_zakat, audit_logs)
- Enums (user_role, jenis_zakat, status_distribusi)
- Indexes for performance
- Triggers for automatic updates

## Step 3: Apply Row Level Security Policies

1. Open the file: `supabase/migrations/002_rls_policies.sql`
2. Copy ALL the contents
3. In Supabase SQL Editor, create a **New Query**
4. Paste the SQL code
5. Click **Run**
6. Wait for success message

This enables:
- Role-based access control (admin, petugas, viewer)
- Data security policies
- User permissions

## Step 4: Insert Seed Data

1. Open the file: `supabase/seed.sql`
2. Copy ALL the contents
3. In Supabase SQL Editor, create a **New Query**
4. Paste the SQL code
5. Click **Run**

This inserts:
- 8 Kategori Mustahik (Asnaf)
- Current year tahun_zakat (1446 H / 2025)
- Sample muzakki data
- Sample mustahik data

## Step 5: Verify Database Setup

Run this query in SQL Editor to verify:

\`\`\`sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check kategori_mustahik (should return 8 rows)
SELECT * FROM public.kategori_mustahik ORDER BY nama;

-- Check active tahun_zakat (should return 1 row for 2025)
SELECT * FROM public.tahun_zakat WHERE is_active = true;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
\`\`\`

Expected results:
- 8 tables created
- 8 kategori_mustahik entries
- 1 active tahun_zakat (1446 H / 2025)
- All tables have rowsecurity = true

## Step 6: Create Test Users

### 6.1 Create Auth Users

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **Add User** → **Create New User**
3. Create these users:

| Email | Password | Auto Confirm |
|-------|----------|--------------|
| admin@example.com | password123 | ✓ Yes |
| petugas@example.com | password123 | ✓ Yes |
| viewer@example.com | password123 | ✓ Yes |

### 6.2 Add User Profiles

After creating the auth users, run this SQL:

\`\`\`sql
-- Add user profiles with roles
INSERT INTO public.users (id, nama_lengkap, email, role, is_active)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'admin@example.com'), 'Administrator', 'admin@example.com', 'admin', true),
  ((SELECT id FROM auth.users WHERE email = 'petugas@example.com'), 'Petugas Zakat', 'petugas@example.com', 'petugas', true),
  ((SELECT id FROM auth.users WHERE email = 'viewer@example.com'), 'Viewer Only', 'viewer@example.com', 'viewer', true)
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;
\`\`\`

## Step 7: Test Login

Now you can login to your application at http://localhost:5173/login

**Test Credentials:**

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| **Admin** | admin@example.com | password123 | Full access to all features |
| **Petugas** | petugas@example.com | password123 | Can create/edit data, limited delete |
| **Viewer** | viewer@example.com | password123 | Read-only access |

## Troubleshooting

### Issue: Tables not created
- Make sure you ran the entire 001_initial_schema.sql file
- Check for any error messages in SQL Editor
- Verify UUID extension is enabled: \`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\`

### Issue: RLS policies not working
- Verify RLS is enabled on all tables
- Make sure 002_rls_policies.sql was run successfully
- Check that user has a profile in public.users table

### Issue: Cannot login
- Verify user exists in auth.users (Authentication → Users)
- Verify user profile exists in public.users table
- Check that is_active = true for the user
- Verify .env file has correct Supabase credentials

### Issue: "User not found" error
- User was created in auth.users but profile not created in public.users
- Run the INSERT query in Step 6.2 again

## Verification Checklist

- [ ] All 8 tables created successfully
- [ ] 8 Kategori Mustahik entries exist
- [ ] 1 Active Tahun Zakat exists (2025)
- [ ] RLS enabled on all tables
- [ ] Test users created in auth.users
- [ ] User profiles created in public.users
- [ ] Can login with admin@example.com
- [ ] Can see Dashboard after login

## Next Steps

Once database setup is complete:
1. Test login with all three user roles
2. Verify role-based access control works
3. Continue with Task 4.0: Core UI Components & Layouts
