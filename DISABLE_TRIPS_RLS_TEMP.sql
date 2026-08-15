-- TEMPORARY: Disable RLS on trips table to test if that's the issue
-- This will allow ALL authenticated users to see ALL trips

-- First, check current state
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'trips';

-- Disable RLS on trips table
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'trips';
