-- CORRECT FIX: Add Super Admin read policy for vendors table
-- PostgreSQL doesn't support IF NOT EXISTS with CREATE POLICY
-- So we must drop first, then create

-- Drop existing policies
DROP POLICY IF EXISTS "Vendors can read own record" ON vendors;
DROP POLICY IF EXISTS "vendors_read_own_record" ON vendors;
DROP POLICY IF EXISTS "super_admins_read_all_vendors" ON vendors;

-- Policy 1: Vendors can read their own record
CREATE POLICY "vendors_read_own_record"
  ON vendors FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Super admins can read all vendors
CREATE POLICY "super_admins_read_all_vendors"
  ON vendors FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Verify policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
