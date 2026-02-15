-- ============================================
-- MANUAL EMAIL CONFIRMATION FIX
-- ============================================
-- Purpose: Manually confirm email for users who didn't receive confirmation email
-- Reason: Email templates not configured in Supabase yet
-- Date: February 15, 2026
-- ============================================

-- Step 1: Check current status of the user
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as status
FROM auth.users
WHERE email = 'dimy.jtk09@gmail.com';

-- Step 2: Manually confirm the email
-- NOTE: Only update email_confirmed_at (confirmed_at is auto-generated)
UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'dimy.jtk09@gmail.com'
  AND email_confirmed_at IS NULL;

-- Step 3: Verify the fix worked
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ CONFIRMED - User can now login!'
    ELSE '❌ Still not confirmed - Check again'
  END as status
FROM auth.users
WHERE email = 'dimy.jtk09@gmail.com';

-- ============================================
-- OPTIONAL: Confirm multiple users at once
-- ============================================
-- Use this if you have multiple users waiting for confirmation

-- View all unconfirmed users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as status
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Confirm ALL unconfirmed users (use with caution!)
-- Uncomment the lines below to run:

-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- ============================================
-- NOTES:
-- ============================================
-- 1. This is a temporary fix until email templates are configured
-- 2. After configuring email templates, new users will automatically receive confirmation emails
-- 3. This script should only be used for users who registered before email templates were set up
-- 4. Always verify the user's identity before manually confirming their email
-- ============================================
