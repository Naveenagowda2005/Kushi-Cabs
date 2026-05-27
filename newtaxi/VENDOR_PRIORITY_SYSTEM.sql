-- ============================================================
-- VENDOR PRIORITY SYSTEM EXPLANATION
-- ============================================================

-- When Super Admin creates an enquiry, the system follows this flow:

-- 1. Trip is created with status = 'pending'
-- 2. Database trigger automatically sets vendor_visible_until = created_at + 5 minutes
-- 3. For FIRST 5 MINUTES: Only vendors can see and accept the trip
-- 4. AFTER 5 MINUTES: If no vendor accepts, drivers can see and accept it

-- ============================================================
-- HOW IT WORKS IN THE DATABASE
-- ============================================================

-- Vendors can see trips WHERE:
-- - status = 'pending' AND NOW() <= vendor_visible_until

-- Drivers can see trips WHERE:  
-- - status = 'pending' AND NOW() > vendor_visible_until

-- ============================================================
-- TESTING THE SYSTEM
-- ============================================================

-- To test the vendor priority system:

-- 1. Super Admin creates enquiry
-- 2. Check vendor visibility (should see it immediately):
SELECT 
  id,
  pickup_location,
  dropoff_location,
  fare_amount,
  created_at,
  vendor_visible_until,
  CASE 
    WHEN NOW() <= vendor_visible_until THEN 'VENDOR WINDOW - Vendors can see'
    ELSE 'DRIVER WINDOW - Drivers can see'
  END as current_visibility
FROM trips 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 3. Wait 5 minutes or manually expire vendor window for testing:
-- UPDATE trips 
-- SET vendor_visible_until = NOW() - INTERVAL '1 second'
-- WHERE status = 'pending' AND id = 'YOUR_TRIP_ID';

-- 4. Check driver visibility (should see it after 5 minutes):
-- Same query as above - status will change to "DRIVER WINDOW"

-- ============================================================
-- CURRENT SYSTEM STATUS
-- ============================================================

-- Check all pending trips and their visibility windows:
SELECT 
  'PENDING TRIPS VISIBILITY' as info,
  COUNT(*) FILTER (WHERE NOW() <= vendor_visible_until) as vendor_visible_count,
  COUNT(*) FILTER (WHERE NOW() > vendor_visible_until) as driver_visible_count,
  COUNT(*) as total_pending
FROM trips 
WHERE status = 'pending';

-- ============================================================