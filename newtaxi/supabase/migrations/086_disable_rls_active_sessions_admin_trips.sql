-- ============================================================
-- Migration: Disable RLS on active_sessions and admin_trip_assignments
-- Purpose: Remove all RLS policies and disable RLS on these tables
-- ============================================================

-- ============================================================
-- ACTIVE_SESSIONS TABLE
-- ============================================================

-- Drop all existing RLS policies on active_sessions
DROP POLICY IF EXISTS "users_view_own_sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "users_update_own_sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "users_delete_own_sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "users_insert_own_sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "superadmin_view_all_sessions" ON public.active_sessions;

-- Disable RLS on active_sessions table
ALTER TABLE public.active_sessions DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- ADMIN_TRIP_ASSIGNMENTS TABLE
-- ============================================================

-- Drop all existing RLS policies on admin_trip_assignments
DROP POLICY IF EXISTS "super_admin_view_all_assignments" ON public.admin_trip_assignments;
DROP POLICY IF EXISTS "driver_view_own_assignments" ON public.admin_trip_assignments;
DROP POLICY IF EXISTS "admin_create_assignments" ON public.admin_trip_assignments;
DROP POLICY IF EXISTS "admin_update_assignments" ON public.admin_trip_assignments;

-- Disable RLS on admin_trip_assignments table
ALTER TABLE public.admin_trip_assignments DISABLE ROW LEVEL SECURITY;
