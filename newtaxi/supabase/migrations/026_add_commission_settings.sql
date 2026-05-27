-- ============================================================
-- ADD VENDOR COMMISSION SETTINGS TO APP_SETTINGS
-- ============================================================

-- Add vendor commission columns if they don't exist
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS vendor_commission_type TEXT DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS vendor_commission_value NUMERIC(10,2) DEFAULT 5;

-- Update existing record with default values
UPDATE app_settings 
SET 
  vendor_commission_type = 'percentage',
  vendor_commission_value = 5,
  updated_at = NOW()
WHERE id = 'global';

-- Verify
SELECT * FROM app_settings WHERE id = 'global';
