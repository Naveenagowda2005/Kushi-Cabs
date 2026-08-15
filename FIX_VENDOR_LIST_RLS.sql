-- IMMEDIATE FIX: Add Super Admin read policy for vendors table
-- This allows super admins to see the list of all vendors

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Vendors can read own record" ON vendors;

-- Policy 1: Vendors can read their own record
CREATE POLICY IF NOT EXISTS "vendors_read_own_record"
  ON vendors FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Super admins can read all vendors
CREATE POLICY IF NOT EXISTS "super_admins_read_all_vendors"
  ON vendors FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Verify the policies are in place
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
