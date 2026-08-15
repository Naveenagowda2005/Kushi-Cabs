# 🚨 IMMEDIATE ACTION REQUIRED

## Quick Fix: Driver Can't See Vendor-Assigned Trips

### The Problem
✗ Vendor assigns trip to driver
✗ Driver doesn't see trip on dashboard

### The Fix (30 seconds)
Go to **Supabase Dashboard** → **SQL Editor** → Copy & Paste & Execute:

```sql
DROP POLICY IF EXISTS "Drivers see available and own trips" ON trips;

CREATE POLICY "Drivers see available and own trips"
  ON trips FOR SELECT USING (
    get_my_role() = 'driver' AND (
      (status = 'pending' AND NOW() > vendor_visible_until)
      OR driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
      OR accepted_by = auth.uid()
    )
  );
```

### Verify It Works
1. Vendor assigns trip to driver
2. Driver opens app
3. **Expected**: Trip appears on dashboard ✓

### What Changed?
Added one line to RLS policy:
```
OR accepted_by = auth.uid()
```

This allows drivers to see trips where `accepted_by` matches their user ID (which is set by vendor assignment).

### Why It Works
- Vendor sets: `accepted_by = driver.user_id`
- Driver queries: trips where `accepted_by = my_user_id`
- RLS policy now allows it ✓

### Related Files
- `FIX_DRIVER_ASSIGNED_TRIP_VISIBILITY.md` - Detailed explanation
- `supabase/migrations/072_fix_driver_trip_visibility.sql` - Migration file
- `RUN_MIGRATION_072.sql` - Quick run script

---

**Time to Apply**: 30 seconds
**Impact**: Fixes driver assignment workflow
**Risk**: None (security safe)
