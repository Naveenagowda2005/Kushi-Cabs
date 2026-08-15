# FIX: Driver Redirected to Navigation Screen - Can't Upload Start Odometer

## Problem
After driver accepts an assigned trip, they're redirected to the navigation/dashboard screen instead of staying on the ActiveTrip screen where they should upload the start odometer.

## Root Cause
The `accept_trip` RPC function was setting status to `in_progress` immediately. This causes:

1. Driver clicks "Accept Trip" on TripDetailScreen
2. RPC updates trip status to `in_progress` 
3. TripDetailScreen redirects to ActiveTrip screen
4. But useActiveTrip hook refetches and sees status = `in_progress`
5. ActiveTripScreen immediately shows IN_PROGRESS step (navigation), skipping ACCEPTED step (odometer upload)

## Solution
**Keep status as `accepted` after driver accepts. Only change to `in_progress` when driver clicks "Start Trip"**

This allows:
- Driver accepts trip → status stays `accepted`
- ActiveTripScreen shows ACCEPTED step → driver uploads start odometer
- Driver clicks "Start Trip" → status changes to `in_progress`
- Navigation map appears

---

## How to Apply Fix

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/projects
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **+ New Query**

### Step 2: Copy & Run the SQL
Copy ALL of this SQL and run it in Supabase:

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
    IF v_trip.driver_id IS NOT NULL THEN
      IF v_trip.status NOT IN ('pending', 'accepted') THEN
        RETURN json_build_object('success', false, 'error', 'Trip already accepted or unavailable');
      END IF;
    ELSE
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

    -- KEEP STATUS AS 'accepted' - driver clicks "Start Trip" to change to 'in_progress'
    UPDATE trips SET
      status      = 'accepted',
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

SELECT 'Migration applied - Driver can now upload start odometer after accepting';
```

### Step 3: Verify Success
You should see: `Migration applied - Driver can now upload start odometer after accepting`

### Step 4: Reload Your App
Clear cache or restart the app to use the updated function.

---

## New Trip Status Flow

### Before (BROKEN):
```
Vendor Accepts Trip
  ↓ (status = accepted)
Vendor Assigns to Driver
  ↓ (driver_id set, status = accepted)
Driver Accepts Trip
  ↓ (status changed to in_progress immediately) ❌
ActiveTrip Screen shows navigation
  ↓ NO ODOMETER UPLOAD SCREEN! ❌
```

### After (FIXED):
```
Vendor Accepts Trip
  ↓ (status = accepted)
Vendor Assigns to Driver
  ↓ (driver_id set, status = accepted)
Driver Accepts Trip
  ↓ (status stays accepted) ✅
ActiveTrip Screen shows ACCEPTED step
  ↓
Driver enters start KM + uploads odometer photo ✅
  ↓
Driver clicks "Start Trip" 
  ↓ (status changes to in_progress)
Navigation map appears ✅
  ↓
Driver completes trip
```

---

## Files Updated
- Migration: `074_fix_driver_accept_vendor_assigned_trip.sql`
- SQL to Run: `RUN_MIGRATION_074_UPDATED.sql`

---

## Testing

1. **Vendor accepts trip** → Trip in pending/available tab
2. **Vendor assigns to driver** → Driver sees trip with "Vendor Assigned" badge
3. **Driver accepts trip** → Should stay on ActiveTrip screen (not redirect to navigation)
4. **Driver enters start KM** and **captures odometer photo** ✅
5. **Driver clicks "Start Trip"** → Navigation map appears ✅
6. **Driver completes trip** → Enters end KM and odometer photo ✅

---

## Technical Details

### Key Change in accept_trip RPC

**Before:**
```sql
UPDATE trips SET
  status = 'in_progress',  -- ❌ Changes immediately
  driver_id = v_driver.id,
  ...
```

**After:**
```sql
UPDATE trips SET
  status = 'accepted',  -- ✅ Stays as accepted
  driver_id = v_driver.id,
  ...
-- Driver clicks "Start Trip" to change status to 'in_progress'
```

### ActiveTripScreen Logic
- When trip status = `accepted`: Shows ACCEPTED step (odometer upload)
- When trip status = `in_progress`: Shows IN_PROGRESS step (navigation map)
- When trip status = `completed`: Shows DONE step (payment collection)

