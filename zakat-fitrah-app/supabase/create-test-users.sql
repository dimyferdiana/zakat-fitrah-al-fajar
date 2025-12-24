-- ============================================================================
-- Create Test User Accounts
-- ============================================================================

-- INSTRUCTIONS:
-- 1. First, create auth users in Supabase Dashboard:
--    - Go to Authentication → Users → Add User
--    - Create users with emails below (password: password123)
--    - Check "Auto Confirm Email"
-- 2. Then run this SQL to add their profiles

-- ============================================================================
-- INSERT USER PROFILES
-- ============================================================================

-- Admin user
INSERT INTO public.users (id, nama_lengkap, email, role, is_active)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'admin@example.com'), 
   'Administrator', 'admin@example.com', 'admin', true)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_active = true, nama_lengkap = 'Administrator';

-- Petugas user
INSERT INTO public.users (id, nama_lengkap, email, role, is_active)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'petugas@example.com'), 
   'Petugas Zakat', 'petugas@example.com', 'petugas', true)
ON CONFLICT (id) DO UPDATE 
SET role = 'petugas', is_active = true, nama_lengkap = 'Petugas Zakat';

-- Viewer user
INSERT INTO public.users (id, nama_lengkap, email, role, is_active)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'viewer@example.com'), 
   'Viewer Only', 'viewer@example.com', 'viewer', true)
ON CONFLICT (id) DO UPDATE 
SET role = 'viewer', is_active = true, nama_lengkap = 'Viewer Only';

-- ============================================================================
-- VERIFY USERS CREATED
-- ============================================================================

SELECT 
  u.email,
  u.nama_lengkap,
  u.role,
  u.is_active,
  u.created_at
FROM public.users u
ORDER BY u.role, u.email;
