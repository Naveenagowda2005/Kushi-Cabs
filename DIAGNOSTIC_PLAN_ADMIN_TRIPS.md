# Diagnostic Plan: Why Admin-Reassigned Trips Not Showing

## The Core Issue
Admin creates trip → Admin assigns to driver → Driver doesn't see trip in dashboard

## What We Know
✅ Code changes made:
- `handleReassignTrip()` now sets `driver_id` + `accepted_by` + `admin_assigned_drivers`
- `useAvailableTrips()` now queries for pending admin trips by `driver_id`
- Migration 093 created RLS policy to allow admin trips

❌ But trip still doesn't appear to driver

## Root Cause Likely: RLS Policy Blocking

The driver app query looks like:
```javascript
SELECT * FROM trips 
WHERE driver_id = 'xyz' 
  AND status = 'pending' 
  AND is_admin_trip = true
```

But if RLS policy doesn't allow the driver to **read** rows where `is_admin_trip = true`, the query returns empty.

## Diagnostic Test (Do This Now)

### Step 1: Run SQL to Disable RLS
In Supabase SQL Editor, run:
```sql
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
```

### Step 2: Test in App
1. Restart app (kill processes, restart npm)
2. Login as admin
3. Create admin trip
4. Reassign to dummy driver
5. Logout and login as dummy driver
6. **Check if trip now appears**

### Step 3: Interpret Results

**If trip NOW appears:**
- ✅ RLS policies are the blocker
- ✅ Our code changes are correct
- Next step: Re-enable RLS and fix policies

**If trip STILL doesn't appear:**
- ❌ Problem is NOT RLS
- ❌ Could be: data not being saved, query not running, app bug
- Next step: Check database directly

## Database Verification (Check Now)

Run in Supabase SQL Editor:
```sql
-- Find the most recent admin trip
SELECT 
  id, 
  status, 
  is_admin_trip, 
  driver_id, 
  accepted_by, 
  admin_assigned_drivers,
  created_at
FROM trips 
WHERE is_admin_trip = TRUE 
ORDER BY created_at DESC 
LIMIT 1;
```

Expected output:
```
id           | ... | driver_id              | accepted_by (user_id)   | admin_assigned_drivers        | ...
trip-uuid    | ... | driver-profile-uuid    | user-uuid               | ["user-uuid"]                 | ...
```

If `driver_id` is NULL after reassign:
- ❌ The reassign function isn't working properly
- ❌ Check backend logs for errors

If `driver_id` is set but trip doesn't appear to driver:
- ❌ RLS policy is blocking it
- ✅ Do Step 1 (disable RLS) to confirm

## Backend Verification

Check backend logs when you reassign:
```
🔍 Fetching latest trip data before reassignment
✅ Latest trip data: { ... driver_id: null ... }
🔄 Assigning trip to driver: user-uuid
   Driver ID (from drivers table): driver-profile-uuid
   Current admin_assigned_drivers: []
   Updated admin_assigned_drivers: ["user-uuid"]
UPDATE trips SET driver_id=..., accepted_by=..., admin_assigned_drivers=...
✅ Trip successfully assigned
```

If you don't see these logs:
- ❌ The reassign function isn't being called
- ✅ Check that Reassign button is visible
- ✅ Check that you're tapping the right button

## Action Checklist

- [ ] Disable RLS on trips table (run SQL above)
- [ ] Restart app and backend
- [ ] Create admin trip
- [ ] Reassign to driver
- [ ] Login as driver and check dashboard
- [ ] **Report: does trip appear or not?**
- [ ] If yes: RLS was issue, we fix policies
- [ ] If no: investigate database and backend logs

## If RLS Was the Issue

Once confirmed, we'll:
1. Re-enable RLS
2. Fix the driver SELECT policy to allow the new conditions
3. Test again with policies active

Current policy should allow drivers to see trips where:
- `driver_id` matches their driver profile ID (✓ should work)
- `accepted_by` matches their user ID (✓ should work)  
- `is_admin_trip = true` AND `status = 'pending'` AND driver in array (✗ might be blocked)

## Next Steps (After You Report)

Tell me:
1. **Does trip appear after disabling RLS?** (YES/NO)
2. **What do the database query results show?** (driver_id value)
3. **Any error messages?** (app logs, backend logs)

Based on your answers, I can:
- Fix the RLS policies (if that's the issue)
- Debug the reassign function (if data not being saved)
- Debug the app query (if app issue)
