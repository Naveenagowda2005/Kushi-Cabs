-- ============================================================
-- CHECK AND FIX TRIGGERS ON TRIPS TABLE
-- ============================================================
-- Run this SQL in Supabase SQL Editor to check and fix any triggers

-- 1. List all triggers on trips table
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'trips'
ORDER BY trigger_name;

-- 2. If there are multiple triggers, drop the old one and keep only the new one
-- DROP TRIGGER IF EXISTS trg_set_vendor_visible_until ON trips;

-- 3. Verify the trigger function
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'set_vendor_visible_until'
AND routine_schema = 'public';

-- 4. Make sure the trigger is ONLY on INSERT, not on UPDATE
-- The trigger should look like this:
-- CREATE TRIGGER trg_set_vendor_visible_until
--   BEFORE INSERT ON trips
--   FOR EACH ROW EXECUTE FUNCTION set_vendor_visible_until();

-- 5. If you see the trigger is firing on UPDATE, recreate it:
DROP TRIGGER IF EXISTS trg_set_vendor_visible_until ON trips;

CREATE TRIGGER trg_set_vendor_visible_until
  BEFORE INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION set_vendor_visible_until();

-- 6. Verify the trigger is correct
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'trips'
AND trigger_name = 'trg_set_vendor_visible_until';
