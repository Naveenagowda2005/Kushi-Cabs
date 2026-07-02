# Fix: "You already have an active trip" Error When Accepting Vendor-Assigned Trip

## Problem
When a driver tries to accept a vendor-assigned trip (status = `accepted`, `driver_id` already set), they get the error:
```
ERROR  Accept trip error: [Error: You already have an active trip]
```

## Root Cause
The `accept_trip` RPC function checks if `drivers.current_trip_id IS NOT NULL`. If the driver has:
1. A previous trip that was cancelled but `current_trip_id` was never reset to NULL (stale value)
2. OR the same trip assigned to them (vendor already set driver_id)

The function blocks the accept with "You already have an active trip".

## Solution
Update the `accept_trip` RPC function to:

### 1. **Allow accepting the same trip**
Change the active trip check from:
```sql
IF v_driver.current_trip_id IS NOT NULL THEN
  RETURN error;
END IF;
```

To:
```sql
IF v_driver.current_trip_id IS NOT NULL AND v_driver.current_trip_id != p_trip_id THEN
  -- Driver has a DIFFERENT active trip, so reject
  RETURN error;
END IF;
```

This allows the driver to accept a trip that's already assigned to them.

### 2. **Clean up stale current_trip_id values**
For any driver with `current_trip_id` pointing to a trip that is not in `accepted` or `in_progress` status, reset to NULL.

```sql
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT d.user_id, d.id
    FROM drivers d
    WHERE d.current_trip_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM trips t 
      WHERE t.id = d.current_trip_id 
      AND t.status IN ('accepted', 'in_progress')
    )
  LOOP
    UPDATE drivers SET current_trip_id = NULL WHERE user_id = r.user_id;
  END LOOP;
END $$;
```

## Files to Apply
- **Migration**: `075_fix_accept_trip_active_trip_check.sql` (in supabase/migrations/)
- **Ready-to-run**: `RUN_MIGRATION_075.sql` (copy and paste entire content into Supabase SQL editor)

## Expected Flow After Fix
1. ✅ Vendor accepts trip (status = accepted, accepted_by = vendor)
2. ✅ Vendor assigns to driver (driver_id set, status stays accepted)
3. ✅ Driver accepts trip (status stays accepted, accepted_by = driver)
4. ✅ Driver uploads start odometer (status changes to in_progress)
5. ✅ Driver ends trip (status changes to completed)

## Testing
After applying the migration, run:
```sql
-- Verify the function was updated
SELECT * FROM information_schema.routines 
WHERE routine_name = 'accept_trip' 
AND routine_schema = 'public';

-- Test: Try accepting a vendor-assigned trip
SELECT * FROM trips 
WHERE driver_id IS NOT NULL 
AND status = 'accepted' 
LIMIT 1;
```
