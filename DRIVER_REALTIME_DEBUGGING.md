# Driver Real-time Debugging Guide

## Quick Diagnosis Flowchart

```
Is trip count updating when new trip created?
├─ YES → Sound not playing?
│       ├─ YES → Sound service issue, check soundService.js
│       └─ NO → ✅ WORKING! All good
└─ NO → Real-time not connecting
        ├─ Check console for "SUBSCRIBED" status
        ├─ Check if "Realtime INSERT received" is logged
        └─ If neither, see "Real-time Connection Issues" below
```

## Console Logs Guide

### What You Should See When App Loads

**Good:**
```
🔄 Setting up realtime trip subscription for driver: f47d2c1a-8234-4567-89ab-cdef01234567
📡 Subscription status: SUBSCRIBED
```

**Bad:**
```
🔄 Setting up realtime trip subscription for driver: f47d2c1a-8234-4567-89ab-cdef01234567
⏭️ useRealtimeTrips: userId not ready, skipping subscription
```
❌ userId is null or undefined. Check auth context.

**Bad:**
```
🔄 Setting up realtime trip subscription for driver: f47d2c1a-8234-4567-89ab-cdef01234567
❌ Realtime subscription error: Error: realtimeMessageAck request failed: ...
```
❌ Supabase real-time not enabled or network issue.

### What You Should See When New Trip Created

**Good Sequence:**
```
📨 Realtime INSERT received: 123e4567-e89b-12d3-a456-426614174000
✅ Calling onNewTrip for: 123e4567-e89b-12d3-a456-426614174000
🔔 New trip available via real-time: 123e4567-e89b-12d3-a456-426614174000
✅ Added new trip. Total: 1
📊 Trip count change: 0 → 1 {isScreenFocused: false, hasInitialized: true, isOnline: true}
🔊 PLAYING SOUND! 1 new trip(s) available
```

**Bad: Event received but callback not called**
```
📨 Realtime INSERT received: 123e4567-e89b-12d3-a456-426614174000
⏭️ Trip filtered out - status: pending vendor_window_passed: false
```
❌ Trip doesn't pass filter. Check `vendor_visible_until` in database.

**Bad: Event received but no trip update**
```
📨 Realtime INSERT received: 123e4567-e89b-12d3-a456-426614174000
✅ Calling onNewTrip for: 123e4567-e89b-12d3-a456-426614174000
🔔 New trip available via real-time: 123e4567-e89b-12d3-a456-426614174000
⏭️ Trip 123e4567-e89b-12d3-a456-426614174000 already in list, skipping
```
✅ This is normal - trip already exists in state.

**Bad: Sound not playing**
```
📊 Trip count change: 0 → 1 {isScreenFocused: false, hasInitialized: true, isOnline: true}
⏭️ Trip count increased but screen just focused, skipping sound (likely from refetch)
```
This happens immediately after opening app (screen focus refresh). Wait a moment and try again.

## Real-time Connection Issues

### Issue: "Subscription status: SUBSCRIBED" never appears

**Diagnosis:**
1. Open browser DevTools → Network tab → filter by "WebSocket"
2. Look for a connection to something like `wss://project.supabase.co/...`
3. If no WebSocket connection, check:

```javascript
// Add this to DashboardScreen to debug
useEffect(() => {
  console.log('📱 Current state:', {
    userId: user?.id,
    isOnline,
    activeTab,
    displayTripsCount: displayTrips.length,
  });
}, [user?.id, isOnline, activeTab, displayTrips.length]);
```

**Checklist:**
- [ ] Supabase real-time is **enabled** in database settings
- [ ] You have a valid auth session (not signed out)
- [ ] Network isn't blocked by firewall/VPN
- [ ] Browser console shows no CORS errors
- [ ] Try in incognito mode (bypass cache)
- [ ] Restart the app

### Issue: Events received but callback not called

**Sign:** You see `📨 Realtime INSERT received` but NOT `✅ Calling onNewTrip`

**Check the filter:**
```javascript
// In useRealtimeTrips.js - this line filters events
if (trip.status === TRIP_STATUS.PENDING && vendorWindowPassed) {
  onNewTrip?.(trip);  // Only called if BOTH conditions true
}
```

**Debug by adding:**
```javascript
console.log('🔍 Trip filter check:', {
  tripId: trip.id,
  status: trip.status,
  expectedStatus: 'PENDING',
  vendor_visible_until: trip.vendor_visible_until,
  vendorWindowPassed,
});
```

**Fix:** Check database:
```sql
SELECT id, status, vendor_visible_until FROM trips 
WHERE id = '[trip-id]'
LIMIT 1;
```

Make sure:
- ✅ `status` = `'pending'`
- ✅ `vendor_visible_until` IS NULL or is in the past

### Issue: Callbacks not being called (no "Calling onNewTrip")

**Sign:** Events arrive (`📨 Realtime INSERT received`) but nothing happens

**This means:** The callback is stale or undefined

**Fix:** Verify DashboardScreen is passing useCallback callbacks:
```javascript
// Should see this in DashboardScreen
const handleNewTrip = useCallback((trip) => { ... }, [refetch]);

// Not this (inline function)
onNewTrip: (trip) => { ... }  // ❌ WRONG
```

## State Update Not Happening

### Issue: Trip appears briefly then disappears

**Possible causes:**
1. `useAvailableTrips()` is refetching and replacing state
2. Duplicate prevention is removing it
3. Status changed between arrival and display

**Debug:**
```javascript
// In DashboardScreen, in the sound effect
console.log('🎯 Current displayTrips:', displayTrips.map(t => ({ 
  id: t.id, 
  status: t.status, 
  isNew: t.isNew 
})));
```

### Issue: Count increases but trip not in list

**This means:** Real-time added it to state but filtering removed it

**Check:** The filtering logic in DashboardScreen:
```javascript
useEffect(() => {
  const sorted = [...availableTrips]
    .map(trip => ({ ...trip, isNew: trip.isNew || isNewTrip(trip.id) }))
    .sort((a, b) => {
      // Sorting logic
    });
  setDisplayTrips(sorted);
}, [availableTrips, isNewTrip]);
```

## Sound Not Playing

### Issue: Count updates but no sound

**Check logs for:**
```
🔊 PLAYING SOUND! X new trip(s) available
```

If not present, check why sound didn't play:

```
📊 Trip count change: 0 → 1 {
  isScreenFocused: false,
  hasInitialized: false,  // ❌ False on first load - skip sound
  isOnline: false,        // ❌ Driver offline - skip sound
}
```

**Fix:**
- If `hasInitialized: false` → wait for first load to complete
- If `isOnline: false` → toggle driver online
- If both true but no sound → check soundService.js

### Issue: Sound plays multiple times for one trip

**This means:** Effect is running multiple times on same trip

**Debug:**
```javascript
console.log('🔊 Sound effect running:', {
  prevCount: prevTripCountRef.current,
  currentCount: displayTrips.length,
  screenFocused: isScreenFocusRef.current,
});
```

**Fix:** Check if displayTrips is being updated multiple times for same trip.

## Manual Testing Commands

### Test 1: Verify Subscription
In browser console:
```javascript
// This should show your subscription
console.log('Active subscriptions:', supabase._realtime_subscriptions);
```

### Test 2: Simulate Real-time Event
In database (or Supabase dashboard):
```sql
-- Insert test trip (from SQL editor)
INSERT INTO trips (
  status, 
  is_published, 
  is_admin_trip, 
  fare_amount, 
  pickup_location, 
  dropoff_location, 
  created_by
) VALUES (
  'pending',
  true,
  false,
  500,
  'Test Pickup',
  'Test Dropoff',
  'admin-user-id'
);
```

Watch the driver app - trip should appear instantly.

### Test 3: Check Connection
```javascript
// In browser console
fetch('https://your-supabase-url/rest/v1/trips?limit=1')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
```

If this fails, your connection is broken.

## Advanced Debugging

### Enable Supabase Debug Logs
```javascript
// In your app initialization
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  debug: true,  // Enable debug logging
});
```

### Check Realtime Server Status
Visit: https://status.supabase.com/

Look for any incidents affecting Real-time.

### Monitor WebSocket
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Click on the connection
4. Go to "Messages" tab
5. Watch for real-time events coming through

**Good message:**
```json
{
  "type": "postgres_changes",
  "event": "INSERT",
  "schema": "public",
  "table": "trips",
  "record": { ... }
}
```

## Common Issues Summary

| Issue | Sign | Fix |
|-------|------|-----|
| Real-time not connected | No "SUBSCRIBED" log | Check Supabase settings, network |
| Events not filtering | "Trip filtered out" message | Check `status` and `vendor_visible_until` in DB |
| Callbacks stale | "Realtime INSERT" but no "Calling onNewTrip" | Verify useCallback wrapped callbacks |
| State not updating | Count updates but trip missing | Check filtering logic |
| Sound not playing | No "🔊 PLAYING SOUND" log | Check isOnline and hasInitialized flags |
| Multiple subscriptions | Excessive logs | Check if hook dependencies are correct |

## Getting Help

If none of this works, provide:
1. Browser console logs (full output)
2. Network tab screenshot showing WebSocket
3. Current values of user.id, isOnline, displayTrips.length
4. Steps to reproduce
5. Which feature works: count update OR sound (or neither)
