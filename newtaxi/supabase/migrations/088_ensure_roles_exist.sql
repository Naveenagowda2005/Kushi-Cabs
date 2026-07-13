-- ============================================================
-- Migration: Ensure all required roles exist
-- Purpose: Seed the roles table with driver, vendor, and super_admin
-- ============================================================

-- Insert roles if they don't exist
INSERT INTO public.roles (name) 
VALUES ('driver'), ('vendor'), ('super_admin')
ON CONFLICT (name) DO NOTHING;

-- Verify roles were created
SELECT * FROM public.roles;
