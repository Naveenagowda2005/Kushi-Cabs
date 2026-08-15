# Fix: Driver Can't See Vendor-Assigned Trips

## Problem
When a vendor assigns a trip to a driver, the driver's dashboard doesn't show the trip even though:
- The trip is updated with `driver_id` and `accepted_by`
- The DriverNavigator checks for active trips correctly
- The `useActiveTrip` hook queries trips with `accepted_by = user.id`

## Root Cause
**RLS (Row Level Security) Policy** on the `trips` table was preventing drivers from seeing trips where `accepted_by = auth.uid()`.

The existing policy only allowed drivers to see:
1. Pending trips after the 5-minute visibility window
2. Trips where `driver_id = drivers.id`

But it did NOT include trips where `accepted_by = auth.uid()` (which is set by vendor assignment).

## Solution
**Update the RLS policy** to include a third condition: `accepted_by = auth.uid()`

### SQL Migration (072_fix_driver_trip_visibility.sql)

```sql
DROP POLICY IF EXISTS "Drivers see available and own trips" ON trips;

CREATE POLICY "Drivers see available and own trips"
  ON trips FOR SELECT USING (
    get_my_role() = 'driver' AND (
      -- Condition 1: Pending trips after 5-min visibility window
      (status = 'pending' AND NOW() > vendor_visible_until)
      -- Condition 2: Trips directly assigned to this driver (by driver_id)
      OR driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
      -- Condition 3: Trips accepted_by this driver (vendor-assigned trips) ← NEW
      OR accepted_by = auth.uid()
    )
  );
```

## How to Apply the Fix

### Option 1: Run in Supabase Dashboard (Recommended)
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open file: `RUN_MIGRATION_072.sql`
3. Copy and paste the SQL
4. Click **Execute**
5. Verify: Should see policy created successfully

### Option 2: Apply Full Migration
1. Run full migration file: `supabase/migrations/072_fix_driver_trip_visibility.sql`
2. Through your migration system (Expo, CLI, etc.)

## What Gets Fixed

### Before Fix
```
Vendor assigns trip → Trip updated (driver_id, accepted_by, status=in_progress)
↓
Driver opens app → Dashboard is EMPTY (can't see trip)
```

### After Fix
```
Vendor assigns trip → Trip updated (driver_id, accepted_by, status=in_progress)
↓
Driver opens app → Dashboard SHOWS trip (RLS allows visibility via accepted_by)
↓
DriverNavigator redirects to ActiveTrip screen
```

## Testing Steps

### Step 1: Verify Policy Exists
```sql
SELECT policyname, qual FROM pg_policies
WHERE tablename = 'trips' AND policyname LIKE '%Drivers%';
```

Should return: `Drivers see available and own trips` with condition including `accepted_by = auth.uid()`

### Step 2: Test as Vendor
1. Vendor creates/accepts a trip
2. Vendor assigns trip to a driver
3. Check console: Should see "Trip assigned successfully"
4. Check database: `driver_id`, `accepted_by`, `status` all set correctly

### Step 3: Test as Driver
1. Log in as the assigned driver
2. Open driver app
3. Check dashboard
4. **Expected**: Trip appears in dashboard
5. **Expected**: App auto-redirects to ActiveTrip screen
6. Check console: Should see "🚗 DriverNavigator: Found active trip"

### Step 4: Database Verification
```sql
-- Check if trip is properly set up
SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  started_at,
  (SELECT full_name FROM users WHERE id = accepted_by) as driver_name
FROM trips
WHERE driver_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

Expected columns:
- `driver_id`: Set ✓
- `accepted_by`: Should match driver's user_id ✓
- `status`: Should be 'in_progress' ✓
- `started_at`: Should have timestamp ✓

## Why This Works

The RLS policy is a **security rule** that determines what data each user can see:

### Before: Drivers CANNOT see
- Trips where `accepted_by = their_user_id` (because policy didn't check this)

### After: Drivers CAN see
- Pending trips after 5-minute window ✓
- Trips assigned directly to them ✓
- Trips where vendor set them as `accepted_by` ✓ (NEW)

## Related Code

### Trip Assignment (Vendor Side)
File: `AssignDriverScreen.js`
```javascript
await supabase.from('trips').update({
  driver_id: selectedDriver.id,
  accepted_by: selectedDriver.user_id,  // ← Sets this
  status: 'in_progress',
  started_at: new Date().toISOString(),
}).eq('id', trip.id);
```

### Trip Detection (Driver Side)
File: `useTrips.js` - `useActiveTrip` hook
```javascript
const { data } = await supabase
  .from('trips')
  .select('*')
  .in('status', ['accepted', 'in_progress'])
  .eq('accepted_by', userId)  // ← Queries this field
  .maybeSingle();
```

The RLS policy must allow this query to return results!

## Troubleshooting

### Issue: Still No Trip After Fix
**Check**:
1. Policy was created: `SELECT * FROM pg_policies WHERE tablename = 'trips'`
2. Trip data updated: `SELECT driver_id, accepted_by, status FROM trips WHERE id = '<trip_id>'`
3. Driver ID matches: `SELECT id FROM drivers WHERE user_id = '<driver_user_id>'`
4. User role is 'driver': `SELECT role FROM users WHERE id = '<driver_user_id>'`

### Issue: Error "permission denied"
**Solution**: Make sure RLS is ENABLED on trips table:
```sql
SELECT relname FROM pg_class 
WHERE relname = 'trips' AND relrowsecurity = true;
-- Should return 'trips'
```

If not enabled:
```sql
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
```

## Files Created/Modified

1. **Created**:
   - `supabase/migrations/072_fix_driver_trip_visibility.sql` (migration file)
   - `RUN_MIGRATION_072.sql` (quick run script)

2. **Modified**:
   - AssignDriverScreen.js (added `accepted_by` update)
   - EnquiriesScreen.js (button state update)

3. **No Changes** (already working correctly):
   - useTrips.js (already queries by `accepted_by`)
   - DriverNavigator.js (already checks for active trips)
   - DashboardScreen.js (already fetches with `accepted_by`)

## Security Impact

This change is **safe** because:
- Only drivers can see their own trips (filtered by `accepted_by = auth.uid()`)
- Doesn't expose vendor trips to other drivers
- Doesn't allow drivers to see anyone else's trips
- Maintains existing security boundaries

---

**Status**: ✅ Ready to Apply
**Urgency**: High (blocks driver assignment workflow)
**Risk**: Low (RLS policy change only, no data changes)
