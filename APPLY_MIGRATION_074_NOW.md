# CRITICAL: Apply Migration 074 - Fix Driver Accept Vendor-Assigned Trip Error

## Error You're Seeing
```
ERROR  Accept trip error: [Error: Trip already accepted or unavailable]
```

This error occurs when a driver tries to accept a trip that was assigned by a vendor (trip has `driver_id` set and status = `accepted`).

---

## Root Cause
The database RPC function `accept_trip` was not updated. The old function only accepts trips with status = `pending`, but vendor-assigned trips have status = `accepted`.

---

## IMMEDIATE FIX - Run This Now

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project: https://supabase.com/projects
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **+ New Query**

### Step 2: Copy & Paste the SQL
Copy the entire SQL from: `RUN_MIGRATION_074_FIX_VENDOR_ASSIGNED_TRIP.sql`

Or use the SQL below:

```sql
CREATE OR REPLACE FUNCTION accept_trip(
  p_trip_id    UUID,
  p_user_id    UUID,
  p_role       TEXT,
  p_min_balance NUMERIC DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_trip        trips%ROWTYPE;
  v_wallet      wallets%ROWTYPE;
  v_driver      drivers%ROWTYPE;
  v_vendor      vendors%ROWTYPE;
BEGIN
  SELECT * INTO v_trip FROM trips WHERE id = p_trip_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trip not found');
  END IF;

  IF p_role = 'driver' THEN
    -- Check if vendor-assigned (driver_id set) or public (driver_id NULL)
    IF v_trip.driver_id IS NOT NULL THEN
      -- Vendor-assigned: allow 'pending' OR 'accepted'
      IF v_trip.status NOT IN ('pending', 'accepted') THEN
        RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
      END IF;
    ELSE
      -- Public: only allow 'pending'
      IF v_trip.status <> 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
      END IF;
    END IF;

    SELECT * INTO v_driver FROM drivers WHERE user_id = p_user_id;
    IF v_driver.current_trip_id IS NOT NULL THEN
      RETURN json_build_object('success', false, 'error', 'You already have an active trip');
    END IF;

    SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id;
    IF v_wallet.balance < p_min_balance THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;

    UPDATE trips SET
      status      = 'in_progress',
      driver_id   = v_driver.id,
      accepted_by = p_user_id,
      accepted_at = NOW()
    WHERE id = p_trip_id;

    UPDATE drivers SET
      is_available    = FALSE,
      current_trip_id = p_trip_id
    WHERE user_id = p_user_id;

  ELSIF p_role = 'vendor' THEN
    IF v_trip.status <> 'pending' THEN
      RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
    END IF;

    IF NOW() > v_trip.vendor_visible_until THEN
      RETURN json_build_object('success', false, 'error', 'Vendor acceptance window has expired');
    END IF;

    SELECT * INTO v_vendor FROM vendors WHERE user_id = p_user_id;

    UPDATE trips SET
      status      = 'accepted',
      vendor_id   = v_vendor.id,
      accepted_by = p_user_id,
      accepted_at = NOW()
    WHERE id = p_trip_id;
  END IF;

  RETURN json_build_object('success', true, 'trip_id', p_trip_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 3: Run the Query
Click the **▶ Run** button or press `Ctrl+Enter`

### Step 4: Verify Success
You should see:
```
Migration 074 applied successfully - accept_trip function updated
```

---

## How This Fixes the Issue

### Before (BROKEN):
```sql
IF v_trip.status <> 'pending' THEN
  RETURN error;  -- ❌ Rejects vendor-assigned trips with status = 'accepted'
END IF;
```

### After (FIXED):
```sql
IF v_trip.driver_id IS NOT NULL THEN
  -- Vendor-assigned trip: allow both 'pending' and 'accepted'
  IF v_trip.status NOT IN ('pending', 'accepted') THEN
    RETURN error;
  END IF;
ELSE
  -- Public trip: only allow 'pending'
  IF v_trip.status <> 'pending' THEN
    RETURN error;
  END IF;
END IF;
```

---

## What This Allows

✅ **Public Trips** (driver_id = NULL):
- Status must be `pending`
- Driver accepts → status → `in_progress`

✅ **Vendor-Assigned Trips** (driver_id set):
- Status can be `pending` OR `accepted`
- Driver accepts → status → `in_progress`
- NO MORE ERROR!

---

## After Applying

1. **Reload your app** (or kill and restart)
2. **Test with vendor-assigned trip**:
   - Vendor accepts trip
   - Vendor assigns to driver
   - Driver tries to accept → **SHOULD WORK NOW** ✅

---

## Related Files

- Migration file: `newtaxi/supabase/migrations/074_fix_driver_accept_vendor_assigned_trip.sql`
- SQL to run: `RUN_MIGRATION_074_FIX_VENDOR_ASSIGNED_TRIP.sql`
- Documentation: `FIX_DRIVER_ACCEPT_ASSIGNED_TRIP.md`

---

## Troubleshooting

**Still getting error after applying?**
1. Verify the query ran without errors in Supabase
2. Restart your app completely
3. Check that your Supabase project was updated (not a different project)
4. Create a test trip and retry

