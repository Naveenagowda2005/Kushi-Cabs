-- ============================================================
-- FIX EXISTING DOCUMENTS STATUS
-- Migration: 042_fix_existing_documents_status.sql
-- ============================================================
-- Purpose: Update all existing 'pending' documents to 'pending_review'
-- These are documents that were already submitted before migration 041

-- Update all remaining 'pending' documents to 'pending_review'
UPDATE driver_documents 
SET status = 'pending_review'::verification_status
WHERE status = 'pending'::verification_status;

-- Log the operation
-- This ensures all submitted documents are now marked as 'pending_review'
