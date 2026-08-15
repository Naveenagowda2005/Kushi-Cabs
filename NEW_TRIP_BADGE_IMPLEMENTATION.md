# New Trip Badge Implementation

## Overview
Drivers can now easily recognize new trips with a "New" badge that appears on trip cards. The badge automatically disappears when the driver returns to the dashboard screen after viewing it.

## Changes Made

### 1. New Hook: `useViewedTrips.js`
**Location:** `apps/unified/src/hooks/useViewedTrips.js`

This hook manages trip viewing state using AsyncStorage (local device storage):
- **`markAsViewed(tripId)`** - Marks a single trip as viewed
- **`markAllAsViewed(tripIds)`** - Marks multiple trips as viewed (called when dashboard loads)
- **`isNewTrip(tripId)`** - Checks if a trip is new (not yet viewed)
- **`viewedTripIds`** - Array of previously viewed trip IDs
- **`isLoading`** - Loading state for async operations

Each driver has separate viewed trip tracking using their user ID.

### 2. Updated: `DashboardScreen.js`
**Location:** `apps/unified/src/screens/driver/DashboardScreen.js`

Changes:
- Added import for `useViewedTrips` hook
- Integrated the hook to track viewed trips for current driver
- When dashboard gains focus (screen comes into view):
  - All available trips are marked as viewed
  - Badge will disappear for previously unseen trips
- Added `isNew` flag to each trip in the display list
- Modified sorting to show new trips first (highest priority)

### 3. Updated: `TripCard.js`
**Location:** `apps/unified/src/components/TripCard.js`

Changes:
- Added "New Trip" badge display in the header
- Badge shows only when `trip.isNew` is true
- Badge styling:
  - Pink/magenta background (#ff4081)
  - Spark icon with white text
  - Positioned next to trip type
- Added corresponding styles: `newTripBadge` and `newTripBadgeText`

## How It Works

1. **First Time Viewing:** When a driver opens the app and new trips appear:
   - Trips that haven't been viewed before show the "New" badge
   - Badge appears prominently next to the trip type

2. **Returning to Dashboard:** When driver navigates back to the dashboard:
   - `useFocusEffect` triggers the mark-as-viewed logic
   - All available trips are marked as viewed in local storage
   - On the next visit, previously seen trips won't show the badge

3. **Per-Driver Tracking:** 
   - Viewed trip data is stored per driver using AsyncStorage
   - Each driver has independent tracking
   - Data persists across app restarts

## Sorting Priority

Trips now display in this order:
1. **New trips** (not yet viewed) - highest priority
2. **Admin-assigned trips** (is_admin_trip = true)
3. **Vendor-assigned trips** (driver_id set by vendor)
4. **Regular trips** - sorted by newest first

## Visual Design

- **Badge Color:** Pink/Magenta (#ff4081)
- **Icon:** Spark icon (Ionicons: "spark")
- **Text:** "New" label
- **Placement:** Top-right area of trip type header
- **Font Weight:** Bold (700)

## Technical Stack

- **Storage:** AsyncStorage (React Native)
- **State Management:** React hooks (useState, useEffect)
- **Navigation:** React Navigation's useFocusEffect

## Testing

To test the feature:

1. Open the driver app
2. Check that new trips show the "New" badge
3. Navigate away from the dashboard (to another screen)
4. Return to dashboard - badge should disappear on previously viewed trips
5. If new trips arrive, they'll show the badge again

## Benefits

✅ Drivers can easily spot new trips at a glance
✅ Better visual hierarchy - new trips stand out
✅ Automatic badge management (no manual clearing needed)
✅ Per-driver tracking (works for multiple drivers on same device)
✅ Lightweight implementation using local storage
✅ No database changes required
