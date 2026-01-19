-- ============================================================================
-- CREATE TEST ADMIN USER
-- Date: January 13, 2026
-- ============================================================================
--
-- INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/zuykdhqdklsskgrtwejg/sql
-- 2. Copy and paste this entire file
-- 3. Click "Run" button
-- 4. Login with: admin@test.com / Admin123!
--
-- ============================================================================

-- First, let's see what users currently exist
SELECT 
  email,
  raw_user_meta_data->>'nama_lengkap' as nama,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at::date as created_date
FROM auth.users
ORDER BY created_at;

-- ============================================================================
-- Create admin test user (idempotent - safe to run multiple times)
-- ============================================================================

DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Check if admin already exists
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@test.com' LIMIT 1;
  
  IF v_admin_id IS NULL THEN
    -- Generate new UUID for admin
    v_admin_id := gen_random_uuid();
    
    -- Create auth user
    INSERT INTO auth.users (
      id, 
      instance_id, 
      aud, 
      role, 
      email,
      encrypted_password, 
      email_confirmed_at,
      raw_app_meta_data, 
      raw_user_meta_data,
      created_at, 
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      v_admin_id, 
      '00000000-0000-0000-0000-000000000000', 
      'authenticated', 
      'authenticated', 
      'admin@test.com',
      crypt('Admin123!', gen_salt('bf')), 
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('nama_lengkap', 'Admin Test', 'role', 'admin'),
      now(), 
      now(),
      '',
      ''
    );

    -- Create identity record
    INSERT INTO auth.identities (
      provider_id, 
      user_id, 
      identity_data, 
      provider, 
      created_at, 
      updated_at
    ) VALUES (
      'admin@test.com',
      v_admin_id,
      jsonb_build_object(
        'sub', v_admin_id::text, 
        'email', 'admin@test.com', 
        'email_verified', true
      ),
      'email',
      now(), 
      now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;
    
    RAISE NOTICE 'Created new admin user with ID: %', v_admin_id;
  ELSE
    RAISE NOTICE 'Admin user already exists with ID: %', v_admin_id;
  END IF;

  -- Ensure public.users record exists (creates or updates)
  INSERT INTO public.users (
    id, 
    email, 
    nama_lengkap, 
    role, 
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    v_admin_id, 
    'admin@test.com', 
    'Admin Test', 
    'admin', 
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET 
    role = 'admin', 
    nama_lengkap = 'Admin Test',
    is_active = true,
    updated_at = now();
    
  RAISE NOTICE 'Public user record synced';
END $$;

-- Verify the admin user was created
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmed,
  pu.nama_lengkap,
  pu.role,
  pu.is_active
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
WHERE u.email = 'admin@test.com';
