# NEW Badge for Unread/Read Trips - Implementation Complete ✅

## Overview
Added a "NEW" badge to trip cards in the vendor EnquiriesScreen to indicate unread trips. Badges automatically disappear when the vendor views or accepts a trip.

## Changes Made

### 1. Database Migration
**File**: `supabase/migrations/077_add_vendor_trip_read_status.sql`

Added new column to track when vendor first views a trip:
- `vendor_read_at`: TIMESTAMPTZ field - tracks when vendor first viewed the trip
- Includes index for better query performance

### 2. EnquiryCard Component
**File**: `src/components/EnquiryCard.js`

**Visual Changes**:
- Added RED "NEW" badge next to trip type
- Badge shows only if `trip.vendor_read_at` is null (not yet viewed)
- Badge automatically disappears after trip is marked as read

**New Badge Style**:
- Red background (#e94560)
- White text "NEW"
- Small, compact design
- Positioned next to trip type label

```
[TRIP TYPE] [NEW BADGE] [PAYMENT TYPE]
```

### 3. EnquiriesScreen Logic
**File**: `src/screens/vendor/EnquiriesScreen.js`

**New Function**: `markTripAsRead()`
- Called when vendor taps on trip card or accepts it
- Updates `vendor_read_at` timestamp in database
- Marks trip as "read" automatically
- Refetches enquiries to update badge display

**Automatic Read Marking**:
- When vendor clicks "View Details" → marks as read
- When vendor clicks "Accept" → marks as read
- Non-invasive - happens in background

## How It Works

### Initial State (Unread)
1. New trip appears in vendor's enquiries list
2. "NEW" badge displayed in red next to trip type
3. Trip not yet viewed by vendor

### After Vendor Views/Accepts
1. Vendor taps trip card or accepts it
2. `markTripAsRead()` updates database
3. `vendor_read_at` timestamp set
4. "NEW" badge disappears
5. Trip now shows as "read"

## Styling

**NEW Badge**:
```javascript
newBadge: {
  backgroundColor: '#e94560',     // Red background
  borderRadius: 4,
  paddingHorizontal: 8,
  paddingVertical: 2,
}
newBadgeText: {
  color: '#fff',                  // White text
  fontSize: 10,
  fontWeight: '700',
  letterSpacing: 0.3,
}
```

## Database

New field on `trips` table:
```sql
vendor_read_at TIMESTAMPTZ
```

Values:
- `NULL` = Unread (shows "NEW" badge)
- `TIMESTAMP` = Read (badge hidden)

## Testing

### To Test:
1. Open vendor app's EnquiriesScreen
2. Look for red "NEW" badges on available trips
3. Tap a trip with "NEW" badge
4. Badge should disappear after viewing/accepting
5. Refresh - badge should stay gone (marked as read)

### Expected Behavior:
- ✅ NEW badge appears on unread trips
- ✅ Badge disappears after viewing
- ✅ Badge disappears after accepting
- ✅ Persists across app refreshes
- ✅ Only one badge per unread trip

## Backend Requirements

You'll need to run the migration to add the `vendor_read_at` column:

```bash
# Run in Supabase SQL Editor
psql -c "
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vendor_read_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_trips_vendor_read_at ON trips(vendor_read_at);
"
```

## Features

✅ Visual indicator for new/unread trips
✅ Automatic marking when viewed or accepted
✅ Persistent across sessions
✅ Database-backed read status
✅ Clean, minimal UI design
✅ Performance optimized with indexing

## Future Enhancements

Possible additions:
- Bulk mark all as read button
- Read status count in tab badge
- Filter to show only unread trips
- Settings to hide read trips automatically
