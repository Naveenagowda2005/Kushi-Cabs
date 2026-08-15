-- ============================================================
-- FIX DRIVER DOCUMENTS SCHEMA
-- Migration: 104_fix_driver_documents_nullable.sql
-- Purpose: Make document_data nullable since files are in bucket
-- ============================================================

-- Documents are now stored in Supabase Storage bucket (driver-documents)
-- Database only tracks metadata and verification status
-- So document_data column should be nullable

ALTER TABLE driver_documents 
  ALTER COLUMN document_data DROP NOT NULL;

-- Also add a note that this column is deprecated
COMMENT ON COLUMN driver_documents.document_data IS 'DEPRECATED: Files stored in Supabase Storage bucket instead. This column kept for backward compatibility.';
