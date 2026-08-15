-- Allow users to upsert (insert or update) their own profile
-- Needed when registration is retried after a partial failure

-- Drop insert policy if exists and recreate to cover upsert
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Vendors upsert
DROP POLICY IF EXISTS "Users can insert own vendor record" ON vendors;

CREATE POLICY "Users can insert own vendor record"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Drivers upsert  
DROP POLICY IF EXISTS "Users can insert own driver record" ON drivers;

CREATE POLICY "Users can insert own driver record"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own vendor/driver records (needed for upsert)
CREATE POLICY "Users can update own vendor record"
  ON vendors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own driver record"
  ON drivers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
