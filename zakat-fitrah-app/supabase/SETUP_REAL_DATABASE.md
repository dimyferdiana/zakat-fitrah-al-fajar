# 🗄️ Setup Real Database - Step by Step Guide

This guide will help you set up your Supabase database with real users and data.

## ✅ Prerequisites

- Supabase Project URL: `https://zuykdhqdklsskgrtwejg.supabase.co`
- Access to Supabase Dashboard

---

## 📋 Step 1: Access Supabase Dashboard

1. Open your browser and go to: **https://app.supabase.com**
2. Login to your account
3. Navigate to your project: **zakat-fitrah-al-fajar**

---

## 🏗️ Step 2: Create Database Schema

### 2.1 Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New Query**

### 2.2 Run Initial Schema
1. Open file: `supabase/migrations/001_initial_schema.sql`
2. Copy **ALL** the contents
3. Paste into the SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. Wait for: ✅ "Success. No rows returned"

**What this creates:**
- All database tables (users, muzakki, mustahik, pembayaran_zakat, etc.)
- Enums for user roles and zakat types
- Indexes for performance
- Triggers for automatic timestamps

---

## 🔒 Step 3: Apply Security Policies

### 3.1 Run RLS Policies
1. Create a **New Query** in SQL Editor
2. Open file: `supabase/migrations/002_rls_policies.sql`
3. Copy **ALL** the contents
4. Paste into the SQL Editor
5. Click **Run**
6. Wait for: ✅ Success message

**What this does:**
- Enables Row Level Security (RLS)
- Sets up role-based access control
- Admin can do everything
- Petugas can manage data
- Viewer can only read

---

## 🌱 Step 4: Insert Initial Data

### 4.1 Run Seed Data
1. Create a **New Query** in SQL Editor
2. Open file: `supabase/seed.sql`
3. Copy **ALL** the contents
4. Paste into the SQL Editor
5. Click **Run**

**What this inserts:**
- 8 Kategori Mustahik (8 Asnaf)
- Current year data (1446 H / 2025)
- Sample muzakki and mustahik data
- Initial nilai zakat settings

---

## 👥 Step 5: Create User Accounts

### 5.1 Create Admin User

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **Add User** → **Create New User**
3. Fill in:
   - **Email:** `admin@masjid.com`
   - **Password:** (use a strong password)
   - **Auto Confirm User:** ✅ **Check this box**
4. Click **Create User**
5. **Copy the User ID** (you'll need it in next step)

### 5.2 Create Admin Profile

1. Go back to **SQL Editor**
2. Create a **New Query**
3. Run this SQL (replace `USER_ID` with the ID you copied):

```sql
-- Add admin profile
INSERT INTO public.users (id, nama_lengkap, email, role, is_active)
VALUES 
  ('USER_ID', 'Administrator Masjid', 'admin@masjid.com', 'admin', true);
```

### 5.3 Create Additional Users (Optional)

Repeat the process for:

**Bendahara Account:**
- Email: `bendahara@masjid.com`
- Password: (use a strong password)
- Role: `admin` or `petugas`

**Panitia Account:**
- Email: `panitia@masjid.com`
- Password: (use a strong password)
- Role: `petugas`

After creating each auth user, add their profile:
```sql
INSERT INTO public.users (id, nama_lengkap, email, role, is_active)
VALUES 
  ('THEIR_USER_ID', 'Bendahara Masjid', 'bendahara@masjid.com', 'petugas', true);
```

---

## ✅ Step 6: Verify Setup

Run this verification query in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check users created
SELECT email, nama_lengkap, role, is_active 
FROM public.users;

-- Check kategori_mustahik (should return 8 rows)
SELECT nama, deskripsi 
FROM public.kategori_mustahik 
ORDER BY nama;

-- Check active tahun_zakat
SELECT tahun_hijriah, tahun_masehi, nilai_beras_kg, nilai_uang_rp, is_active
FROM public.tahun_zakat 
WHERE is_active = true;

-- Check RLS is enabled (all should be TRUE)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Results:**
- ✅ 8+ tables created
- ✅ Users with correct roles
- ✅ 8 kategori_mustahik entries
- ✅ 1 active tahun_zakat (1446 H / 2025)
- ✅ All tables have rowsecurity = true

---

## 🚀 Step 7: Update Local Environment

Your `.env` file should have:

```env
VITE_SUPABASE_URL=https://zuykdhqdklsskgrtwejg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_OFFLINE_MODE=false
```

**I've already set `VITE_OFFLINE_MODE=false` for you!**

---

## 🎉 Step 8: Test Login

1. **Restart your development server:**
   ```powershell
   npm run dev
   ```

2. **Open the application** in your browser

3. **Login with your admin credentials:**
   - Email: `admin@masjid.com`
   - Password: (the password you set earlier)

4. You should now be logged in and see the dashboard!

---

## 🔧 Troubleshooting

### "Invalid login credentials"
- Double-check email and password
- Verify user exists in Authentication → Users
- Verify user profile exists in `public.users` table
- Make sure "Auto Confirm User" was checked

### "Email not confirmed"
- Go to Authentication → Users
- Find the user
- Click the menu (⋮) → Send confirmation email
- Or edit user and check "Email confirmed"

### Can't see any data
- Check RLS policies were applied
- Verify your user has the correct role in `public.users`
- Admin role should have full access

### Database errors
- Re-run the migration files in order
- Check Supabase Dashboard → Database → Logs for errors

---

## 📝 Quick Reference

### Admin Credentials Template
```
Email: admin@masjid.com
Password: (your secure password)
Role: admin
```

### SQL to Add User Profile
```sql
INSERT INTO public.users (id, nama_lengkap, email, role, is_active)
VALUES 
  ('USER_ID_FROM_AUTH', 'Full Name', 'email@masjid.com', 'admin', true);
```

### Check User Exists
```sql
SELECT * FROM public.users WHERE email = 'admin@masjid.com';
```

### Reset Password (in SQL Editor)
```sql
-- This only works if you run it as Supabase admin
-- Better to use Dashboard: Authentication → Users → Reset Password
```

---

## 🎯 Next Steps

Once logged in, you can:
1. ✅ Add real muzakki (people who pay zakat)
2. ✅ Record pembayaran (zakat payments)
3. ✅ Manage mustahik (zakat recipients)
4. ✅ Distribute zakat
5. ✅ Generate reports

---

## 📞 Need Help?

If you encounter any issues:
1. Check the Supabase Dashboard → Logs
2. Check browser console for errors
3. Verify all migration files ran successfully
4. Ensure RLS policies are enabled

Good luck! 🎉
