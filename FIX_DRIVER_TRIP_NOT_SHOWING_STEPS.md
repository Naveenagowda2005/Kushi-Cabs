# Fix: Driver Not Seeing Assigned Trip

## Problem
Vendor assigns a trip to a driver, but the trip doesn't appear on the driver's dashboard.

## Root Cause
The RLS policy might be blocking the query OR the migration hasn't been applied yet.

---

## Solution: Apply Migration 073

### Step 1: Run Migration in Supabase
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of: `newtaxi/supabase/migrations/073_fix_driver_trip_visibility_comprehensive.sql`
5. Click **Run**
6. Check for success message

### Step 2: Verify Policy Applied
```sql
-- Run this query to verify the policy exists:
SELECT policyname, cmd, SUBSTRING(qual, 1, 100) as policy_definition
FROM pg_policies 
WHERE tablename = 'trips' 
  AND policyname = 'Drivers see available and own trips';

-- Expected: Should return 1 row with the policy
```

### Step 3: Test With Database Query
Replace `[DRIVER-USER-ID]` with an actual driver's user ID:

```sql
-- Test if driver can see their own assigned trips
SELECT id, status, driver_id, accepted_by, 
       pickup_location, dropoff_location
FROM trips
WHERE accepted_by = '[DRIVER-USER-ID]'
  AND status IN ('accepted', 'in_progress')
LIMIT 5;

-- Expected: Should return assigned trips (not empty result)
```

### Step 4: Restart Driver App
1. Close the driver app completely
2. Kill and restart the app
3. Open dashboard
4. Trip should now appear

---

## Testing Flow

### Vendor Side:
1. Vendor opens "My Trips"
2. Selects a trip in "ACCEPTED" status
3. Taps "Assign Trip to Driver"
4. Selects a driver
5. Confirms assignment

**Check Console for:**
```
📤 ASSIGNING TRIP:
  Trip ID: xyz
  Driver ID (from drivers table): abc  
  Driver User ID (auth.uid): def-auth-id
✅ Trip updated in database: [...]
```

### Driver Side:
1. Driver opens app
2. Should see the assigned trip on dashboard

**Check Console for:**
```
🔄 useActiveTrip: Fetching active trips for user: [driver-user-id]
🔄 useActiveTrip result: Trip xyz (accepted)
📡 useActiveTrip: Setting up real-time subscription
```

---

## If Trip Still Doesn't Appear

### Debug Step 1: Check Database
```sql
-- Verify trip was assigned correctly
SELECT id, status, driver_id, accepted_by, 
       pickup_location, dropoff_location
FROM trips
WHERE status = 'accepted' 
  AND accepted_by IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- Should show recently assigned trips
```

### Debug Step 2: Verify Driver Exists
```sql
-- Replace [DRIVER-USER-ID] with actual ID
SELECT d.id as driver_id,
       d.user_id,
       u.full_name,
       u.phone,
       u.is_active
FROM drivers d
JOIN users u ON u.id = d.user_id
WHERE d.user_id = '[DRIVER-USER-ID]';

-- Should return 1 row
```

### Debug Step 3: Check RLS Policy
```sql
-- Manually test the policy condition
SELECT COUNT(*) FROM trips
WHERE accepted_by = '[DRIVER-USER-ID]'
  AND status IN ('accepted', 'in_progress');

-- If returns 0, driver can't see trip (RLS blocking)
-- If returns > 0, trip exists and should be visible
```

### Debug Step 4: Force App Refresh
In driver console, check if logs show:
```
✅ Trip is accepted/in_progress, updating state
```

If not, try:
1. Force refresh: F5 or Cmd+R
2. Restart app completely
3. Check if real-time subscription connected

---

## Files Modified/Created

- `newtaxi/apps/unified/src/screens/vendor/AssignDriverScreen.js` - Added logging
- `newtaxi/apps/unified/src/hooks/useTrips.js` - Enhanced useActiveTrip with real-time subscription
- `newtaxi/apps/unified/src/screens/driver/DashboardScreen.js` - Fixed refetch callback
- `newtaxi/supabase/migrations/073_fix_driver_trip_visibility_comprehensive.sql` - NEW: Better RLS policy

---

## Expected End-to-End Flow

1. ✅ Vendor clicks "Assign Trip to Driver"
2. ✅ Vendor selects driver → confirms
3. ✅ Trip updated in DB: `accepted_by = driver.user_id`, `status = 'accepted'`
4. ✅ Real-time notification sent to driver
5. ✅ Driver's useActiveTrip hook receives update
6. ✅ Trip appears on driver's dashboard
7. ✅ Driver gets redirected to ActiveTrip screen automatically

---

## Key Changes Made

### RLS Policy (Migration 073)
**Before:** Used `get_my_role()` function which might fail
**After:** Directly checks if user exists in drivers table (more reliable)

### useActiveTrip Hook
**Before:** Only fetched once on mount
**After:** Fetches on mount + subscribes to real-time updates

### DashboardScreen
**Before:** Ignored active trip updates from realtime
**After:** Calls `refetchActiveTrip()` when driver is assigned a trip

### AssignDriverScreen  
**Before:** Set `status = IN_PROGRESS`
**After:** Sets `status = ACCEPTED` (driver starts it themselves)

---

## Troubleshooting Checklist

- [ ] Migration 073 applied in Supabase
- [ ] Policy exists when queried
- [ ] Database query returns assigned trips
- [ ] Driver app restarted
- [ ] Console shows useActiveTrip fetching
- [ ] Console shows real-time subscription
- [ ] Driver sees trip on dashboard
- [ ] Clicking trip navigates to ActiveTrip screen

---

## Contact
If issue persists after all steps, provide:
1. Driver user ID
2. Trip ID  
3. Console logs from vendor assignment
4. Console logs from driver dashboard
5. Result of database verification query
