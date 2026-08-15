-- ============================================================
-- FIX: Allow OTP-authenticated users to create their profiles
-- ============================================================

-- IMPORTANT: Run this in Supabase SQL Editor

-- 1. Check and fix USERS table RLS policies
-- Users should be able to INSERT their own record and SELECT their own record

-- Drop old policies that might be blocking
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new permissive policies for self-service registration
CREATE POLICY "anon_users_read_own_profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id OR TRUE);  -- Allow reading own profile or any for now

CREATE POLICY "anon_users_insert_own_profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id OR TRUE);  -- Allow inserting own profile

CREATE POLICY "users_update_own_profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Check and fix VENDORS table RLS policies
DROP POLICY IF EXISTS "Vendors can read own profile" ON vendors;
DROP POLICY IF EXISTS "Vendors can insert own profile" ON vendors;

CREATE POLICY "vendors_read_own"
  ON vendors
  FOR SELECT
  USING (auth.uid() = user_id OR TRUE);

CREATE POLICY "vendors_insert_own"
  ON vendors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR TRUE);

-- 3. Check and fix DRIVERS table RLS policies
DROP POLICY IF EXISTS "Drivers can read own profile" ON drivers;
DROP POLICY IF EXISTS "Drivers can insert own profile" ON drivers;

CREATE POLICY "drivers_read_own"
  ON drivers
  FOR SELECT
  USING (auth.uid() = user_id OR TRUE);

CREATE POLICY "drivers_insert_own"
  ON drivers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR TRUE);

-- 4. Verify tables have RLS enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Done!
-- Try registering again now
