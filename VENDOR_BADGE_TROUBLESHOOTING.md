# Vendor Badge Troubleshooting

## Issue
Vendor badge not showing on assigned trips in driver dashboard.

## Root Cause Found & Fixed
The `driver_id` field was NOT included in the SELECT statement when fetching vendor-assigned trips in `useAvailableTrips()`.

### Before (Broken)
```javascript
.select('id, pickup_location, dropoff_location, fare_amount, commission_amount, ... is_admin_trip')
// ❌ Missing driver_id
```

### After (Fixed)
```javascript
.select('id, pickup_location, dropoff_location, fare_amount, commission_amount, ... is_admin_trip, driver_id')
// ✅ Added driver_id at the end
```

## Modified File
**`src/hooks/useTrips.js`**
- Line 61: Added `driver_id` to the SELECT clause for vendor-assigned trips

## How the Badge Works

### TripCard Component Logic
```javascript
{trip.driver_id && !trip.is_admin_trip && (
  <View style={styles.vendorBadge}>
    <Ionicons name="person-circle-outline" size={14} color="#fff" />
    <Text style={styles.vendorBadgeText}>Vendor Assigned</Text>
  </View>
)}
```

**Conditions for badge to show:**
1. `trip.driver_id` must exist (truthy) ✅ NOW FIXED
2. `trip.is_admin_trip` must be false

## Debug Information
A debug log has been added to TripCard that will log when `driver_id` is missing:
```
🔍 TripCard - vendor badge NOT shown: driver_id is undefined for trip [trip_id]
```

Check the React Native console for this message if the badge still doesn't appear.

## How to Verify the Fix

### Step 1: Vendor Accepts Trip
- Trip status = `accepted`
- `accepted_by = vendor_user_id`

### Step 2: Vendor Assigns to Driver
- `driver_id = driver_profile_id` ✅ This should now be in the query result
- Status stays = `accepted`

### Step 3: Driver Opens App
- See trip on "Available" tab
- Badge should show: "🧑 Vendor Assigned" (orange, below trip type)

### Step 4: Check Console Logs
- Should see: `✅ Available trips fetched: X (Y vendor + Z admin + W assigned)`
- Should NOT see the debug error message

## Testing Checklist

- [ ] Vendor assigned trip appears on driver dashboard
- [ ] Trip has `driver_id` field in the data
- [ ] "Vendor Assigned" badge appears (orange, person-circle icon)
- [ ] Badge disappears after driver accepts the trip
- [ ] Badge does NOT appear on public/pending trips
- [ ] Badge does NOT appear on admin-assigned trips

## Next Steps

1. Clear app cache/reload the app to ensure new code is running
2. Have vendor assign a trip to driver
3. Driver opens app - should see the orange "Vendor Assigned" badge
4. Check React Native console for any debug messages

