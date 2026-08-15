# Driver Trip Assignment Debug Guide

## Issue
When a vendor assigns a trip to a driver, the trip doesn't appear on the driver's dashboard.

## Root Causes to Check

### 1. RLS Policy Not Applied
**Check:**
```sql
-- Verify the RLS policy exists
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'trips' AND policyname LIKE '%Drivers%';
```

**Expected:** Should see `Drivers see available and own trips` or `Drivers see own trips` policy

**If Missing:** Run migration 072 or 073:
```sql
-- Run in Supabase SQL Editor
-- File: newtaxi/supabase/migrations/072_fix_driver_trip_visibility.sql
```

---

### 2. Trip Not Being Updated in Database
**When vendor assigns a trip:**
- Vendor app calls AssignDriverScreen.handleAssignDriver()
- Should update trips table with:
  - `driver_id` = drivers.id (from drivers table)
  - `accepted_by` = user_id (from auth)
  - `status` = 'accepted'

**Check in Console:**
Look for logs like:
```
📤 ASSIGNING TRIP:
  Trip ID: xyz
  Driver ID (from drivers table): abc
  Driver User ID (auth.uid): def-auth-id
  Status before: accepted
  Status after: accepted
✅ Trip updated in database: [...]
```

**Verify in Database:**
```sql
-- Check recent assignments
SELECT 
  id, status, driver_id, accepted_by, 
  pickup_location, dropoff_location, 
  created_at, updated_at
FROM trips
WHERE status = 'accepted'
  AND accepted_by IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- Verify the accepted_by matches a driver's user_id
SELECT 
  accepted_by,
  d.id as driver_id,
  d.user_id,
  u.full_name
FROM trips t
LEFT JOIN drivers d ON d.user_id = t.accepted_by
LEFT JOIN users u ON u.id = t.accepted_by
WHERE t.status = 'accepted' AND t.accepted_by IS NOT NULL
LIMIT 5;
```

---

### 3. Driver's App Not Fetching Active Trip
**When driver opens dashboard:**
- useActiveTrip hook runs and queries trips table
- Should find trip where `accepted_by = auth.uid()`

**Check in Console (Driver App):**
Look for logs like:
```
🔄 useActiveTrip: Fetching active trips for user: [driver-user-id]
🔄 useActiveTrip result: Trip xyz (accepted)
```

**If not appearing:**
- Check driver's user_id is correct
- Verify network request in Network tab
- Check if query returns null

---

### 4. Real-Time Subscription Issue
**Real-time updates should trigger when trip is assigned:**

**Check in Console:**
```
📡 useActiveTrip: Setting up real-time subscription for user: [user-id]
📡 Real-time subscription status: SUBSCRIBED
🔔 Real-time trip update received: {trip_id: xyz, status: accepted}
✅ Trip is accepted/in_progress, updating state
```

**If subscription doesn't connect:**
- Check Supabase realtime is enabled
- Verify `postgres_changes` permissions are set
- Check browser DevTools Network tab for realtime messages

---

### 5. RLS Policy Blocking Query
**If RLS policy is blocking the SELECT:**

**Test Policy:**
```sql
-- Login as a driver and run:
SELECT id, status, accepted_by FROM trips 
WHERE accepted_by = auth.uid() 
  AND status = 'accepted' 
LIMIT 5;

-- Should return assigned trips, not empty result
```

**Common RLS Issues:**
- `get_my_role()` not returning 'driver' → Check users.role column
- `accepted_by = auth.uid()` fails if accepted_by is NULL
- `vendor_visible_until` comparison fails if NULL

---

## Step-by-Step Troubleshooting

### Step 1: Verify Assignment
1. Vendor assigns trip to driver
2. Check logs in vendor app console
3. Run SQL query from "2. Trip Not Being Updated" section
4. Confirm `accepted_by` is populated with driver's user_id

### Step 2: Verify RLS Policy
1. Run SQL query from "1. RLS Policy Not Applied" section
2. If policy missing, apply migration 073

### Step 3: Verify Driver Can Query
1. Have driver open app
2. Check driver's user_id from Settings or console
3. Run manual SQL query with that user_id
4. Verify policy allows SELECT

### Step 4: Verify Real-Time
1. Check console logs for subscription
2. Open browser DevTools → Network tab
3. Look for WebSocket connections (should see realtime messages)

### Step 5: Force Refresh
1. Force refresh driver app (F5 or Ctrl+R)
2. Or restart app completely
3. Trip should appear

---

## Logs to Check

### Vendor Console (When Assigning):
```
📤 ASSIGNING TRIP: [details]
✅ Trip updated in database: [return value]
```

### Driver Console (When Opening Dashboard):
```
🔄 useActiveTrip: Fetching active trips for user: [id]
🔄 useActiveTrip result: Trip [id] ([status])
📡 useActiveTrip: Setting up real-time subscription
📡 Real-time subscription status: SUBSCRIBED
```

### Real-Time Update (When Trip Assigned):
```
🔔 Real-time trip update received: {trip_id: ..., status: accepted}
✅ Trip is accepted/in_progress, updating state
```

---

## Quick Fixes

### Fix 1: Re-run Migration
```bash
# Apply the RLS policy fix
cd newtaxi
# Run migration 073 in Supabase SQL Editor
```

### Fix 2: Force Driver Refetch
Add to DashboardScreen:
```javascript
// Add button for testing
<Button onPress={() => refetchActiveTrip()} title="Force Refresh Active Trip" />
```

### Fix 3: Check Supabase Real-Time
1. Go to Supabase dashboard
2. Settings → Realtime
3. Ensure realtime is enabled
4. Check `postgres_changes` policy

---

## Expected Flow

1. ✅ Vendor opens AssignDriverScreen
2. ✅ Vendor selects driver and taps "Assign"
3. ✅ Trip updated: `accepted_by = driver.user_id`, `status = 'accepted'`
4. ✅ Real-time event fires to driver's app
5. ✅ Driver's useActiveTrip hook receives update
6. ✅ Trip appears on driver's dashboard
7. ✅ Driver redirects to ActiveTrip screen

---

## Database Schema Reference

```sql
-- trips table
trips {
  id: UUID
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  driver_id: UUID (references drivers.id) - NULLABLE
  accepted_by: UUID (references users.id) - NULLABLE
  created_by: UUID (references users.id)
  ...
}

-- drivers table
drivers {
  id: UUID (PRIMARY KEY)
  user_id: UUID (references users.id) - UNIQUE
  vehicle_number: STRING
  is_online: BOOLEAN
  ...
}

-- users table
users {
  id: UUID (PRIMARY KEY)
  full_name: STRING
  phone: STRING
  role: 'driver' | 'vendor' | 'super_admin'
  ...
}
```

When vendor assigns trip to driver:
- `driver_id` ← drivers.id (drivers table PK)
- `accepted_by` ← drivers.user_id (user's auth ID)

---

## Contact Support

If issue persists:
1. Collect console logs from both vendor and driver
2. Run debug SQL queries from this guide
3. Check Supabase dashboard for realtime status
4. Verify migration 072/073 is applied
