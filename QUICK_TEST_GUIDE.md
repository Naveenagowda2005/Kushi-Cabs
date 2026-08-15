# Quick Test Guide: Vendor Assigns Driver

## Test in 5 Minutes

### Step 1: Vendor Side (1 min)
```
1. Log in as vendor
2. Create or accept a trip
3. Click "Assign Trip to Driver" button
4. AssignDriver screen opens
5. Select any driver
6. Click "Assign to [Driver Name]"
7. Confirm in alert
✓ Button changes to "Assigned" (blue, disabled)
```

### Step 2: Check Database (1 min)
```sql
-- Go to Supabase Dashboard → SQL Editor
SELECT 
  id,
  status,
  driver_id,
  accepted_by,
  started_at
FROM trips
WHERE status = 'in_progress'
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- driver_id: SET ✓
-- accepted_by: SET ✓ (driver's user ID)
-- status: in_progress ✓
-- started_at: timestamp ✓
```

### Step 3: Driver Side (1 min)
```
1. Log in as the assigned driver
2. Open driver app
3. Go to Dashboard tab
✓ Trip should appear
✓ Should auto-redirect to ActiveTrip screen
```

### Step 4: Verify RLS (1 min)
```sql
-- Check RLS policy was applied
SELECT policyname, qual FROM pg_policies
WHERE tablename = 'trips' AND policyname LIKE '%Drivers%';

-- Should see in the condition: accepted_by = auth.uid()
```

### Step 5: Check Console (1 min)
```javascript
// Driver Console Logs (F12)
// Should see:
"🚗 DriverNavigator: Found active trip, redirecting to ActiveTrip screen"
// OR trip appears in dashboard

// OR Check for any errors
```

---

## What Should Happen

✅ **Before Assignment**:
- "Assign Trip to Driver" button (green)

✅ **After Assignment**:
- Button changes to "Assigned" (blue)
- Database updated with driver_id & accepted_by
- Driver sees trip on dashboard

✅ **If It Works**:
- Driver can view trip details
- Driver can complete trip
- Payment processing works

---

## If It Doesn't Work

| Issue | Check | Fix |
|-------|-------|-----|
| Button doesn't change | Trip has `driver_id`? | Refresh vendor app |
| Driver doesn't see trip | RLS policy updated? | Re-run Migration 072 |
| Photos don't load | Driver has DRIVER_SELFIE? | Driver needs to upload selfie |
| Search doesn't work | Filter code in place? | Check AssignDriver code |
| Dummy drivers showing | Filter applied? | Verify both name & license check |

---

## Key Files to Check

1. **AssignDriverScreen.js** - Assign button logic
2. **EnquiriesScreen.js** - MyTripCard button state
3. **Migration 072** - RLS policy fix
4. **useTrips.js** - Active trip detection

---

## Success Criteria

- ✅ Vendor can assign driver
- ✅ Button changes to "Assigned"
- ✅ Driver sees trip on dashboard
- ✅ No errors in console
- ✅ Database shows correct data
- ✅ RLS policy allows access

---

**Time**: ~5 minutes
**Complexity**: Low
**Risk**: None
