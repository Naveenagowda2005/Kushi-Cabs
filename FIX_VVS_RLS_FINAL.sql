-- Check existing policies
SELECT policyname, cmd, qual FROM pg_policies
WHERE tablename = 'vendor_verification_status';

-- Drop EVERY policy on vendor_verification_status
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'vendor_verification_status'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON vendor_verification_status', r.policyname);
  END LOOP;
END $$;

-- Disable and re-enable RLS to reset
ALTER TABLE vendor_verification_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_verification_status ENABLE ROW LEVEL SECURITY;

-- Create single permissive SELECT policy
CREATE POLICY "vvs_select_own"
  ON vendor_verification_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "vvs_insert_own"
  ON vendor_verification_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vvs_update_own"
  ON vendor_verification_status FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vvs_admin_all"
  ON vendor_verification_status FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Verify policies were created
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'vendor_verification_status';
