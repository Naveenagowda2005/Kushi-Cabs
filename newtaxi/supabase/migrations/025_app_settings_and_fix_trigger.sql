-- ============================================================
-- APP SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  vendor_window_minutes INTEGER DEFAULT 15,
  driver_window_minutes INTEGER DEFAULT 60,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO app_settings (id, vendor_window_minutes, driver_window_minutes)
VALUES ('global', 15, 60)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- UPDATE TRIGGER: Use app_settings for vendor_visible_until
-- ============================================================
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

-- The trigger already exists, so we just recreate it with the new function
DROP TRIGGER IF EXISTS trg_set_vendor_visible_until ON trips;

CREATE TRIGGER trg_set_vendor_visible_until
  BEFORE INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION set_vendor_visible_until();
