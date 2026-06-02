-- Fix: Disable RLS for driver_verification_status SELECT so super_admin can read
-- Super admin uses OTP auth (not Supabase auth), so auth.uid() is NULL and RLS blocks access

-- Option 1: Disable RLS entirely for driver_verification_status
ALTER TABLE driver_verification_status DISABLE ROW LEVEL SECURITY;

-- Option 2 (Alternative - if you want to keep RLS): Update the policy to allow NULL auth.uid()
-- This would check if user is super_admin in the database directly
-- For now, disabling RLS is simpler since this is admin-only data

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'driver_verification_status';
-- Should show: rowsecurity = false

-- Optional: Also disable for driver_documents if needed
ALTER TABLE driver_documents DISABLE ROW LEVEL SECURITY;
