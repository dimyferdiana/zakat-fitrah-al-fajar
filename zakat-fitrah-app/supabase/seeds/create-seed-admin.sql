-- Create seed admin user for local development
-- Email: seed-admin@example.com
-- Password: password123

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  hashed_password text := crypt('password123', gen_salt('bf'));
BEGIN
  -- Insert into auth.users with all required fields
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'seed-admin@example.com',
    hashed_password,
    now(),
    now(),
    '',
    '',
    '',
    '',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nama":"Admin Seed"}'::jsonb,
    false
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    'seed-admin@example.com',
    'email',
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'seed-admin@example.com',
      'email_verified', true
    ),
    now(),
    now(),
    now()
  );

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    nama_lengkap,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'seed-admin@example.com',
    'Admin Seed',
    'admin',
    now(),
    now()
  );

  RAISE NOTICE 'Created user with ID: %', new_user_id;
END $$;
