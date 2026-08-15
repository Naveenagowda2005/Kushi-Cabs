-- ============================================================
-- Migration: Disable RLS on app_settings table
-- Purpose: Remove all RLS policies and disable RLS entirely
-- ============================================================

-- Drop all existing RLS policies on app_settings
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Only super admins can update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert app settings" ON public.app_settings;
DROP POLICY IF EXISTS "No one can delete app settings" ON public.app_settings;

-- Disable RLS entirely on app_settings table
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;
