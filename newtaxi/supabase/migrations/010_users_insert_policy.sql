-- Allow authenticated users to insert their own profile row
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Allow authenticated users to insert their own driver record  
CREATE POLICY "Users can insert own driver record"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert their own vendor record
CREATE POLICY "Users can insert own vendor record"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
