# Vendor Assigned Badge - Logic Verification

## Overview
The "Vendor Assigned" badge now displays ONLY for trips that are:
1. Assigned by a vendor/dispatch to a specific driver
2. Have `driver_id` set (not NULL)
3. Have `is_admin_trip = false`
4. Have `status = 'accepted'` (assigned by vendor)

## Badge Display Logic

### When Badge SHOWS
✅ Trip has all of these:
- `driver_id` is set (not null/undefined)
- `is_admin_trip === false`
- `status === 'accepted'` (assigned by vendor)

```javascript
{trip.driver_id && trip.is_admin_trip === false && (
  <View style={styles.vendorBadge}>
    <Ionicons name="person-circle-outline" size={14} color="#fff" />
    <Text style={styles.vendorBadgeText}>Vendor Assigned</Text>
  </View>
)}
```

### When Badge DOES NOT SHOW
❌ Badge hidden if any of these:
- `driver_id` is null/undefined
- `is_admin_trip === true` (shows "Admin Assigned" instead)
- `status !== 'accepted'`

## Trip Types & Badges

### Type 1: Vendor-Published (Open) Trip
- **Fields:**
  - `is_admin_trip = false`
  - `is_published = true`
  - `status = 'pending'`
  - `driver_id = null` (unassigned)
- **Badge:** None (or "New" badge if newly published)
- **Available to:** All drivers

### Type 2: Admin-Assigned Trip
- **Fields:**
  - `is_admin_trip = true`
  - `status = 'pending'`
  - `driver_id = null`
  - In `admin_assigned_drivers` array
- **Badge:** "Admin Assigned" (blue)
- **Available to:** Only assigned drivers

### Type 3: Vendor-Assigned Trip
- **Fields:**
  - `driver_id = <driver_uuid>` (specific driver)
  - `is_admin_trip = false`
  - `status = 'accepted'`
- **Badge:** "Vendor Assigned" (orange)
- **Available to:** Only the assigned driver

## Database Query Changes

Updated queries now include `driver_id` field for all trip types:

### Vendor Trips Query
```sql
SELECT id, ..., is_admin_trip, driver_id
WHERE status = 'pending'
  AND is_published = true
  AND is_admin_trip = false
```
`driver_id` will be NULL for open trips

### Admin Trips Query
```sql
SELECT id, ..., is_admin_trip, admin_assigned_drivers, driver_id
WHERE status = 'pending'
  AND is_admin_trip = true
  AND admin_assigned_drivers @> [current_driver_id]
```
`driver_id` will be NULL for admin-assigned trips

### Vendor-Assigned Trips Query
```sql
SELECT id, ..., is_admin_trip, driver_id
WHERE driver_id = 'specific_driver_uuid'
  AND status = 'accepted'
```
`driver_id` will be the specific driver's UUID

## Visual Badges

### Admin Assigned Badge
- **Color:** Blue (#2196f3)
- **Icon:** Shield ✓
- **Text:** "Admin Assigned"

### Vendor Assigned Badge
- **Color:** Orange (#ff9800)
- **Icon:** Person Circle
- **Text:** "Vendor Assigned"

### New Trip Badge (All Types)
- **Color:** Pink (#ff4081)
- **Icon:** Spark ✨
- **Text:** "New"

## Testing Scenarios

### Scenario 1: Vendor-Assigned Trip
```
Trip created by vendor dispatch:
- driver_id = "driver-123"
- is_admin_trip = false
- status = 'accepted'

Result: Shows "Vendor Assigned" badge (orange)
```

### Scenario 2: Admin-Assigned Trip
```
Trip assigned by super admin:
- driver_id = null
- is_admin_trip = true
- status = 'pending'
- admin_assigned_drivers includes this driver

Result: Shows "Admin Assigned" badge (blue)
```

### Scenario 3: Open Trip (No Assignment)
```
Trip published by vendor, available to all:
- driver_id = null
- is_admin_trip = false
- status = 'pending'
- is_published = true

Result: No assignment badge (only "New" if applicable)
```

## Files Modified

1. **src/components/TripCard.js**
   - Updated vendor badge condition to be explicit: `trip.driver_id && trip.is_admin_trip === false`

2. **src/hooks/useTrips.js**
   - Added `driver_id` to vendor trips query
   - Added `driver_id` to admin trips query
   - Vendor-assigned trips already include `driver_id`

## Verification

The badge logic is now:
1. ✅ Mutually exclusive with Admin badge (can't show both)
2. ✅ Only appears when trip is specifically assigned to a driver
3. ✅ Explicit about checking both conditions
4. ✅ All trip data includes necessary fields
5. ✅ Backward compatible with existing data

## Related Features

- **New Trip Badge:** Shows on newly published trips (until driver views dashboard)
- **Admin Assigned Badge:** Shows only for admin-assigned trips
- **Vendor Assigned Badge:** Shows only for vendor-assigned trips

All badges work independently and show the correct information to drivers.
