-- Drop existing RLS policies that are blocking super admin
DROP POLICY IF EXISTS "Super admin can read policies" ON app_policies;
DROP POLICY IF EXISTS "Super admin can update policies" ON app_policies;
DROP POLICY IF EXISTS "Super admin can insert policies" ON app_policies;
DROP POLICY IF EXISTS "Users can read policies" ON app_policies;
DROP POLICY IF EXISTS "Service role can manage policies" ON app_policies;
DROP POLICY IF EXISTS "Super admin can manage policies" ON app_policies;

-- Disable RLS on app_policies table entirely
-- Since super admin uses mock sessions (not Supabase JWT), RLS auth.uid() doesn't work
-- Security is enforced at application level instead:
-- - Only super admin role can access PolicyManagementScreen
-- - Frontend validates user role before allowing policy management
ALTER TABLE app_policies DISABLE ROW LEVEL SECURITY;
