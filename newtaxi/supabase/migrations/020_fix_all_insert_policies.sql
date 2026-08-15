-- ============================================================
-- Fix all missing INSERT/UPDATE policies for registration flow
-- ============================================================

-- USERS
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- DRIVERS
DROP POLICY IF EXISTS "Users can insert own driver record" ON drivers;
CREATE POLICY "Users can insert own driver record"
  ON drivers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own driver record" ON drivers;
CREATE POLICY "Users can update own driver record"
  ON drivers FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Allow drivers to read their own record
DROP POLICY IF EXISTS "Drivers can read own record" ON drivers;
CREATE POLICY "Drivers can read own record"
  ON drivers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- VENDORS
DROP POLICY IF EXISTS "Users can insert own vendor record" ON vendors;
CREATE POLICY "Users can insert own vendor record"
  ON vendors FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own vendor record" ON vendors;
CREATE POLICY "Users can update own vendor record"
  ON vendors FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can read own record" ON vendors;
CREATE POLICY "Vendors can read own record"
  ON vendors FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- WALLETS (insert needed for trigger + manual creation)
DROP POLICY IF EXISTS "System can insert wallets" ON wallets;
CREATE POLICY "System can insert wallets"
  ON wallets FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
