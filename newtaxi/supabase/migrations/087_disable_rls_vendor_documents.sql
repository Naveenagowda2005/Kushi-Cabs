-- ============================================================
-- Migration: Disable RLS on vendor_documents and vendor_verification_status
-- Purpose: Remove all RLS policies and disable RLS on these tables
-- ============================================================

-- ============================================================
-- VENDOR_DOCUMENTS TABLE
-- ============================================================

-- Drop all existing RLS policies on vendor_documents
DROP POLICY IF EXISTS "vendor_documents_vendor_view" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_vendor_insert" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_vendor_update" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_documents_super_admin_all" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendors can upload their own documents" ON public.vendor_documents;
DROP POLICY IF EXISTS "admins can view all vendor documents" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendors can update their own documents" ON public.vendor_documents;

-- Disable RLS on vendor_documents table
ALTER TABLE public.vendor_documents DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- VENDOR_VERIFICATION_STATUS TABLE
-- ============================================================

-- Drop all existing RLS policies on vendor_verification_status
DROP POLICY IF EXISTS "vendor_verification_vendors_view_own" ON public.vendor_verification_status;
DROP POLICY IF EXISTS "vendor_verification_vendors_insert" ON public.vendor_verification_status;
DROP POLICY IF EXISTS "vendor_verification_super_admin_all" ON public.vendor_verification_status;
DROP POLICY IF EXISTS "vendors can view their own verification status" ON public.vendor_verification_status;
DROP POLICY IF EXISTS "vendors can insert their own verification status" ON public.vendor_verification_status;
DROP POLICY IF EXISTS "super_admin can view all verification status" ON public.vendor_verification_status;
DROP POLICY IF EXISTS "super_admin can update verification status" ON public.vendor_verification_status;

-- Disable RLS on vendor_verification_status table
ALTER TABLE public.vendor_verification_status DISABLE ROW LEVEL SECURITY;
