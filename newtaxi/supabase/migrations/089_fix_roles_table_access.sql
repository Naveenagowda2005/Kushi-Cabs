-- ============================================================
-- Migration: Fix roles table access
-- Purpose: Ensure all users can read the roles table
-- ============================================================

-- Check current RLS status
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "allow_select_roles" ON public.roles;
DROP POLICY IF EXISTS "allow_read_roles" ON public.roles;
DROP POLICY IF EXISTS "Public read access to roles" ON public.roles;

-- Create policy to allow authenticated users to read roles
CREATE POLICY "allow_authenticated_read_roles" ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow anon to read roles (for initial auth flow)
CREATE POLICY "allow_anon_read_roles" ON public.roles
  FOR SELECT
  TO anon
  USING (true);

-- Verify roles still exist
SELECT * FROM public.roles;
