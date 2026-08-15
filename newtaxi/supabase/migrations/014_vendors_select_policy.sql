-- Allow vendors to read their own record
CREATE POLICY "Vendors can read own record"
  ON vendors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
