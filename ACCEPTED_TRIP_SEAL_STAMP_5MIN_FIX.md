# Accepted Trip Seal Stamp - 5-Minute Visibility Fix

## Problem
When a driver accepted a trip, the trip card immediately disappeared from other drivers' screens instead of showing the red seal stamp for 5 minutes as intended.

## Root Cause
The `useAvailableTrips` hook was only fetching trips with `status = 'pending'`. When a driver accepted a trip, the status changed to `'in_progress'`, and the trip was immediately filtered out and removed from the available trips list.

## Solution Implemented

### 1. Modified `useAvailableTrips` Hook (`useTrips.js`)

**Changed trip filtering logic:**
- Previous: Only fetch trips with `status = 'pending'`
- Now: Fetch trips with `status = 'pending'` + `status = 'in_progress'` (with 5-minute window check)

**Added 5-minute window filter:**
```javascript
const filteredVendorTrips = (vendorTrips || []).filter(trip => {
  if (trip.status === TRIP_STATUS.PENDING) {
    return true; // All pending trips are visible
  }
  if (trip.status === TRIP_STATUS.IN_PROGRESS && trip.accepted_at) {
    // Include in_progress trips that were accepted within last 5 minutes
    const acceptedTime = new Date(trip.accepted_at).getTime();
    const elapsedMs = now.getTime() - acceptedTime;
    return elapsedMs < FIVE_MIN_MS; // 5 * 60 * 1000 ms
  }
  return false;
});
```

**Auto-refetch every 30 seconds:**
- Added `setInterval` to refetch trips every 30 seconds
- Ensures the 5-minute window is accurately maintained
- Automatically removes trips when the 5-minute window expires
- Cleanup on component unmount

### 2. Database Fields Already Present
✅ `trips.accepted_at` - Records when trip was accepted (set by accept_trip RPC)
✅ `trips.accepted_by` - Records who accepted the trip (user_id)

### 3. TripCard Component Already Complete
✅ Seal stamp rendering with 5-minute countdown timer
✅ Timer updates every second
✅ Seal disappears after 5 minutes
✅ Red circular design with "TRIP ACCEPTED" text
✅ Countdown timer showing remaining seconds

## How It Works Now

1. **Trip is pending (visible to all drivers)**
   - Status: `pending`
   - Seal: ❌ Not shown
   - Available to: All drivers

2. **Driver accepts trip**
   - Status changes to: `in_progress`
   - `accepted_at` timestamp set to: NOW()
   - `accepted_by` set to: driver's user_id
   - Seal stamp appears immediately with 300-second countdown

3. **Seal visibility for 5 minutes**
   - Other drivers see red circular seal stamp
   - Countdown shows: "300s", "299s", "298s", etc.
   - Trip remains in available trips list for 5 minutes
   - Auto-refetch every 30 seconds maintains accurate countdown

4. **After 5 minutes**
   - Seal stamp disappears
   - Trip no longer visible in available trips list
   - `useAvailableTrips` hook filters out expired trips
   - Driver can no longer accept this trip

## Files Modified
- `newtaxi/apps/unified/src/hooks/useTrips.js` - Enhanced `useAvailableTrips` hook

## Testing Checklist
- [ ] Create and publish a trip
- [ ] Driver 1 accepts the trip
- [ ] Verify other drivers see seal stamp immediately
- [ ] Verify countdown timer shows 300s and counts down
- [ ] Wait 5 minutes (or manually test by setting accepted_at to past time)
- [ ] Verify seal disappears and trip removed from list
- [ ] Check console logs for "Auto-refetching trips" every 30 seconds

## Performance Notes
- Auto-refetch interval: 30 seconds (balanced between accuracy and performance)
- Only refetches trips that need filtering (in_progress trips)
- Real-time subscriptions still work for new pending trips
- No infinite loops - intervals properly cleaned up on unmount

## Database Queries
- Fetches trips with both `status = 'pending'` AND `status = 'in_progress'`
- Client-side filtering handles the 5-minute window check
- Prevents unnecessary database queries

---

**Status**: ✅ Complete and Ready for Testing
