-- ============================================================
-- FIX: Update vendor_visible_until trigger to use app_settings
-- ============================================================
-- Run this SQL in Supabase SQL Editor to fix the vendor window time issue

-- Step 1: Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  vendor_window_minutes INTEGER DEFAULT 15,
  driver_window_minutes INTEGER DEFAULT 60,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Insert default settings if not exists
INSERT INTO app_settings (id, vendor_window_minutes, driver_window_minutes)
VALUES ('global', 15, 60)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Update the trigger function to use app_settings
CREATE OR REPLACE FUNCTION set_vendor_visible_until()
RETURNS TRIGGER AS $$
DECLARE
  vendor_window_mins INTEGER;
BEGIN
  -- Get vendor window from app_settings, default to 15 if not found
  SELECT vendor_window_minutes INTO vendor_window_mins
  FROM app_settings
  WHERE id = 'global'
  LIMIT 1;
  
  -- If no setting found, use default
  IF vendor_window_mins IS NULL THEN
    vendor_window_mins := 15;
  END IF;
  
  -- Only set vendor_visible_until if it's not already provided by the app
  IF NEW.vendor_visible_until IS NULL THEN
    NEW.vendor_visible_until := NEW.created_at + (vendor_window_mins || ' minutes')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate the trigger with the updated function
DROP TRIGGER IF EXISTS trg_set_vendor_visible_until ON trips;

CREATE TRIGGER trg_set_vendor_visible_until
  BEFORE INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION set_vendor_visible_until();

-- Verify the changes
SELECT 'Migration complete!' as status;
SELECT * FROM app_settings WHERE id = 'global';
