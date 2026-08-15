-- ============================================================
-- Migration: Add avatar_base64 column to users table
-- Purpose: Store user profile photos as base64 encoded strings
-- ============================================================

-- Add avatar_base64 column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_base64 TEXT;

-- Add comment
COMMENT ON COLUMN public.users.avatar_base64 IS 
  'Base64 encoded user profile photo (data URI format)';

-- Index for faster lookups (optional)
-- Note: Don't index TEXT fields with base64 data as they're usually large
