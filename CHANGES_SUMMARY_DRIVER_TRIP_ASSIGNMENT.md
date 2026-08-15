# Changes Summary: Fix Driver Not Seeing Assigned Trips

## Status: Ready to Test ✅

Date: July 3, 2026

---

## Problem Statement
When a vendor assigns a trip to a driver, the trip doesn't appear on the driver's dashboard. The vendor successfully assigns it, and it shows on the vendor's card, but the assigned driver never sees it.

---

## Root Causes Identified

1. **`useActiveTrip` hook was not subscribing to real-time updates** - Only fetched once on mount
2. **DashboardScreen wasn't refetching active trip when notified** - Real-time updates were ignored
3. **AssignDriverScreen set status to `IN_PROGRESS`** - Should be `ACCEPTED` until driver starts
4. **RLS policy might rely on broken `get_my_role()` function** - Needed more direct approach
5. **Missing real-time subscription logging** - Couldn't diagnose if subscriptions were working

---

## Files Modified

### 1. `newtaxi/apps/unified/src/hooks/useTrips.js`
**Changes:**
- Enhanced `useActiveTrip` hook to include real-time Supabase subscriptions
- Added detailed logging to track when trips are fetched and updated
- Subscription listens for any UPDATE on trips where `accepted_by = userId`
- Automatically updates state when trip status changes

**Before:** Only fetched once, no real-time updates
**After:** Fetches on mount + subscribes to real-time changes

**Key Addition:**
```javascript
// Subscribe to real-time updates on active trips for this driver
useEffect(() => {
  if (!userId) return;
  
  const channel = supabase.channel(channelName)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'trips',
      filter: `accepted_by=eq.${userId}`,
    }, (payload) => {
      // Update state when trip status changes
      if (payload.new.status === 'accepted' || 'in_progress') {
        setTrip(payload.new);
      }
    })
    .subscribe();
}, [userId]);
```

---

### 2. `newtaxi/apps/unified/src/screens/driver/DashboardScreen.js`
**Changes:**
- Modified `useRealtimeTrips` callback to refetch active trip when assigned
- Changed from directly navigating to calling `refetchActiveTrip()`
- Let the existing useEffect handle automatic navigation

**Before:**
```javascript
onTripUpdated: (trip) => {
  if (trip.status === 'accepted' || trip.status === 'in_progress') {
    navigation.navigate('ActiveTrip', { trip });
  }
}
```

**After:**
```javascript
onTripUpdated: (trip) => {
  if ((trip.status === 'accepted' || trip.status === 'in_progress') &&
      (trip.accepted_by === user?.id || trip.driver_id === user?.id)) {
    console.log('✅ Driver assigned trip detected! Refetching active trip...');
    refetchActiveTrip(); // Refetch to pick up the change
  }
}
```

---

### 3. `newtaxi/apps/unified/src/screens/vendor/AssignDriverScreen.js`
**Changes:**
- Added detailed logging when assigning trips
- Changed trip status from `IN_PROGRESS` to `ACCEPTED`
- Removed `started_at` setting (driver sets this when they actually start)
- Added `.select()` to return updated data for verification

**Before:**
```javascript
status: TRIP_STATUS.IN_PROGRESS,
started_at: new Date().toISOString(),
```

**After:**
```javascript
status: TRIP_STATUS.ACCEPTED, // Set to accepted, not in_progress
// Don't set started_at here - driver will set it when they actually start
```

**Added Logging:**
```javascript
console.log('📤 ASSIGNING TRIP:');
console.log('  Trip ID:', trip.id);
console.log('  Driver ID (from drivers table):', selectedDriver.id);
console.log('  Driver User ID (auth.uid):', selectedDriver.user_id);
```

---

### 4. `newtaxi/supabase/migrations/073_fix_driver_trip_visibility_comprehensive.sql` (NEW)
**Purpose:** Fix RLS policy to reliably allow drivers to see assigned trips

**Key Changes:**
- Removed dependency on potentially-broken `get_my_role()` function
- Uses direct check: `EXISTS (SELECT 1 FROM drivers WHERE user_id = auth.uid())`
- More explicit and reliable conditions
- Added indices for performance

**Policy Allows Drivers to See:**
1. Pending trips after 5-min vendor window
2. Trips with `driver_id` set to this driver
3. Trips with `accepted_by = auth.uid()` (vendor-assigned trips) ← KEY

**Indices Added:**
- `idx_trips_accepted_by` - For faster vendor assignment queries
- `idx_trips_driver_id` - For faster direct assignment queries

---

## Testing Instructions

### Quick Test (No Database Needed)
1. Restart driver app
2. Vendor assigns a trip to the driver
3. Driver should see trip appear on dashboard automatically

### Full Test with Logging
1. Open vendor console (F12 → Console)
2. Vendor assigns trip
3. Check for logs:
   ```
   📤 ASSIGNING TRIP: [details]
   ✅ Trip updated in database: [data]
   ```

4. Open driver console
5. Check for logs:
   ```
   🔄 useActiveTrip: Fetching active trips for user: [id]
   📡 Real-time subscription status: SUBSCRIBED
   🔔 Real-time trip update received: [trip details]
   ✅ Trip is accepted/in_progress, updating state
   ```

6. Trip should appear and driver redirected to ActiveTrip screen

### Database Verification
```sql
-- Replace [DRIVER-USER-ID] with actual driver's user ID
SELECT id, status, driver_id, accepted_by, pickup_location
FROM trips
WHERE accepted_by = '[DRIVER-USER-ID]'
  AND status = 'accepted';

-- Should return the assigned trip
```

---

## Migration Required

**Must Run:** `APPLY_FIX_DRIVER_TRIP_VISIBILITY.sql`

Steps:
1. Open Supabase Dashboard
2. SQL Editor → New Query
3. Copy entire contents of `APPLY_FIX_DRIVER_TRIP_VISIBILITY.sql`
4. Click Run
5. Verify success (should show policy and indices created)

---

## Expected Behavior After Fix

### Vendor Workflow:
1. Vendor opens "My Trips" → selects trip
2. Vendor taps "Assign Trip to Driver"
3. Vendor selects driver from list
4. Vendor confirms assignment
5. ✅ Trip updates in database with `accepted_by = driver.user_id`
6. ✅ Trip status shows as "Assigned" on vendor's card

### Driver Workflow:
1. Driver opens app
2. ✅ useActiveTrip queries trips where `accepted_by = auth.uid()`
3. ✅ RLS policy allows query (passed database check)
4. ✅ Trip is returned from database
5. ✅ Real-time subscription activates
6. ✅ When trip is assigned, real-time update fires
7. ✅ Trip appears on driver's dashboard
8. ✅ Driver is automatically redirected to ActiveTrip screen

---

## Performance Improvements

- Added indices on `accepted_by` and `driver_id` columns
- Real-time subscription more efficient (filtered by user_id)
- Reduced unnecessary database queries

---

## Rollback Plan (if needed)

If issues occur after applying migration:

1. Drop the new policy:
```sql
DROP POLICY IF EXISTS "Drivers see available and own trips" ON trips;
```

2. Restore old policy from migration 072:
```sql
-- Re-run migration 072 to restore old policy
```

---

## Files Created for Debugging

1. `DEBUG_TRIP_ASSIGNMENT.sql` - Database verification queries
2. `DRIVER_TRIP_ASSIGNMENT_DEBUG.md` - Comprehensive debug guide
3. `FIX_DRIVER_TRIP_NOT_SHOWING_STEPS.md` - Step-by-step fix instructions
4. `APPLY_FIX_DRIVER_TRIP_VISIBILITY.sql` - Ready-to-run SQL fix
5. `CHANGES_SUMMARY_DRIVER_TRIP_ASSIGNMENT.md` - This file

---

## Next Steps

1. ✅ Review all changes above
2. ✅ Run migration 073 in Supabase
3. ✅ Restart both vendor and driver apps
4. ✅ Test the assignment flow
5. ✅ Check console logs for successful connection
6. ✅ Verify trip appears on driver dashboard
7. ✅ Verify driver is redirected to ActiveTrip screen

---

## Known Limitations

- Real-time subscription requires Supabase Realtime enabled (should be by default)
- WebSocket connection required for real-time updates
- If no real-time connection, driver must manually refresh (F5)
- Trip status must be 'accepted' or 'in_progress' for visibility

---

## Questions to Verify

Before declaring complete:
- [ ] Does vendor see "Assigned" status on trip card after assignment?
- [ ] Does driver see trip appear on dashboard within 2-3 seconds?
- [ ] Does driver automatically redirect to ActiveTrip screen?
- [ ] Do console logs show real-time subscription connecting?
- [ ] Does manual refresh show the trip if real-time fails?
- [ ] Is status showing as "Accepted" (not "In Progress")?

