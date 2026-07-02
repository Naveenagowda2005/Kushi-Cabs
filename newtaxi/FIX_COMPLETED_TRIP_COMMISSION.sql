-- ============================================================
-- FIX: Revert commission for completed trips that were over-calculated
-- This script finds trips where commission was recalculated incorrectly
-- and resets it based on what the driver should have earned
-- ============================================================

-- First, let's see what trips have incorrect commission
SELECT id, fare_amount, commission_amount, (fare_amount * 0.08) as calculated_8_percent
FROM trips
WHERE status = 'completed'
AND commission_amount != ROUND(fare_amount * 0.08, 2)
ORDER BY created_at DESC
LIMIT 10;

-- If you find your trip, you can manually fix it like this:
-- UPDATE trips SET commission_amount = 100 WHERE id = '<trip-id>';

-- Or if all your completed trips have the wrong commission and you know the correct rate:
-- UPDATE trips 
-- SET commission_amount = ROUND(fare_amount * 0.05, 2)  -- Change 0.05 to your correct percentage
-- WHERE status = 'completed' AND commission_amount > fare_amount * 0.08;
