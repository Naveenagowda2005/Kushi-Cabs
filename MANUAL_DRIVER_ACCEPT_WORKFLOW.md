# Manual Driver Accept Workflow - Implementation Complete

## Overview
Modified the trip assignment workflow so drivers must **manually accept** trips assigned by vendors, instead of being auto-redirected.

---

## New Workflow

### 1. Vendor Accepts Trip
- Trip created in **pending** status
- Vendor accepts → trip status = **accepted**, `accepted_by = vendor_user_id`

### 2. Vendor Assigns to Driver  
- Vendor clicks "Assign to Driver"
- Set `driver_id` = driver's profile ID
- **Keep status = "accepted"** (don't change it)
- **Keep accepted_by = vendor_user_id** (vendor still owns it)

### 3. Driver Sees Assigned Trip on Dashboard ✅
- Driver app shows trip on "Available" tab
- Trip appears because `useAvailableTrips` now queries:
  - Vendor-published trips (status = pending, is_published = true)
  - Admin-assigned trips 
  - **NEW: Vendor-assigned trips** (status = accepted, driver_id = driver's ID)

### 4. Driver Manually Accepts Trip ✅
- Driver clicks trip → opens TripDetailScreen
- Driver clicks "Accept Trip"
- Status changes to **in_progress**
- Driver is redirected to ActiveTrip screen

### 5. ActiveTrip Screen Opens ✅
- Only shown when trip status = **in_progress**
- Not shown on initial app load (no auto-redirect to ActiveTrip)

---

## Files Modified

### 1. `src/hooks/useTrips.js`
**Changed: useAvailableTrips()**
- Added fetch for vendor-assigned trips:
  ```javascript
  // Get trips where driver_id = this driver AND status = accepted
  .eq('driver_id', driverProfile.id)
  .eq('status', TRIP_STATUS.ACCEPTED)
  ```
- Combines 3 types of trips:
  1. Vendor-published (pending, is_published=true)
  2. Admin-assigned (is_admin_trip=true)
  3. **Vendor-assigned** (driver_id set, status=accepted) ← NEW

**Changed: useActiveTrip()**
- Query now filters for **status = IN_PROGRESS only**
  ```javascript
  .eq('status', TRIP_STATUS.IN_PROGRESS)
  ```
- Changed from: `.in('status', ['accepted', 'in_progress'])`
- Real-time subscription also only triggers on IN_PROGRESS status

### 2. `src/navigation/DriverNavigator.js`
**Changed: useEffect (checkVerificationAndActiveTrip)**
- **Removed auto-redirect logic** on app initialization
- No longer checks for active trip on mount
- Only checks driver verification status
- Always starts on Dashboard screen (initialRouteName = 'Dashboard')

### 3. `src/screens/driver/DashboardScreen.js`
**No changes needed** - existing logic works correctly:
- Displays available trips (now includes assigned ones)
- Auto-redirect to ActiveTrip only happens if `activeTrip` exists AND `activeTab === 0`
- Since activeTrip only exists when status = IN_PROGRESS, redirect only happens after driver accepts

---

## Status Flow

```
PENDING (vendor-published)
   ↓
ACCEPTED (vendor accepts)
   ├─ Then vendor assigns to driver (driver_id set, status stays ACCEPTED)
   ├─ Driver sees trip on dashboard
   ├─ Driver clicks & accepts
   ↓
IN_PROGRESS (driver started trip)
   ├─ Auto-redirect to ActiveTrip screen
   ├─ Driver completes trip
   ↓
COMPLETED
```

---

## Key Points

✅ **Driver Assignment** - Only sets `driver_id`, doesn't change status  
✅ **Driver Visibility** - Sees assigned trips via `useAvailableTrips()` query  
✅ **Manual Accept** - Driver must click to accept (changes to IN_PROGRESS)  
✅ **Auto-Redirect** - Only happens after driver manually accepts (IN_PROGRESS status)  
✅ **No App-Load Redirect** - DriverNavigator no longer checks for active trips  
✅ **Vendor Ownership** - `accepted_by = vendor_user_id` stays set after assignment  

---

## Testing Checklist

- [ ] Vendor accepts trip → status = accepted, accepted_by = vendor
- [ ] Vendor assigns to driver → driver_id set, status still = accepted
- [ ] Driver opens app → sees trip on Available tab, NOT auto-redirected
- [ ] Driver clicks trip → TripDetailScreen shows assignment indicator
- [ ] Driver clicks Accept → status changes to in_progress
- [ ] Driver auto-redirected to ActiveTrip screen
- [ ] Driver starts trip → ActiveTrip screen opens successfully

