# Booking ID Showing Same for All Trips - Fix

## Problem
All trip cards were showing the same booking ID (likely KUSH-B-000001 for all) instead of unique sequential IDs.

## Root Cause
**Existing trips created before migration 094 don't have `booking_id_seq` values**
- Migration 094 added the `booking_id_seq` column with default `nextval('trips_booking_id_seq')`
- But existing trips before the migration stayed NULL
- When `booking_id_seq` is NULL, the code defaults to 1: `const serial = (bookingIdSeq || 1).toString()`
- Result: All trips with NULL `booking_id_seq` show "KUSH-B-000001"

## Solution Applied

### 1. Updated useAvailableEnquiries Hook
**File**: `src/hooks/useEnquiries.js`

Changed:
```javascript
.select('*')  // This should include booking_id_seq but wasn't being used
```

To:
```javascript
.select('*, booking_id_seq')  // Explicitly fetch booking_id_seq
```

### 2. Run Database Backfill Migration
**File**: `BACKFILL_BOOKING_ID_SEQ.sql`

This SQL script:
1. Assigns the sequence to all trips with NULL `booking_id_seq`
2. Uses `nextval('trips_booking_id_seq')` to get next available number
3. Ensures every trip gets a unique booking ID

```sql
UPDATE public.trips 
SET booking_id_seq = nextval('trips_booking_id_seq')
WHERE booking_id_seq IS NULL
ORDER BY created_at ASC;
```

### 3. Added Debug Logging
**File**: `src/components/EnquiryCard.js`

Added console log to verify `booking_id_seq` is being received:
```javascript
console.log('🎫 EnquiryCard received trip:', {
  trip_id: trip.id,
  booking_id_seq: trip.booking_id_seq,
  formatted_booking_id: bookingId,
  has_booking_id: !!trip.booking_id_seq,
});
```

## How to Fix

### Step 1: Run the Backfill Migration
Copy and run `BACKFILL_BOOKING_ID_SEQ.sql` in Supabase SQL editor:
1. Go to Supabase dashboard
2. SQL Editor
3. Copy entire content of `BACKFILL_BOOKING_ID_SEQ.sql`
4. Run the query
5. Verify output shows unique booking IDs

### Step 2: Refresh the App
After running the migration:
1. Clear app cache or restart the app
2. Navigate to vendor enquiries screen
3. Check if each trip shows a different booking ID
4. Check browser console for debug logs

## Expected Results After Fix

✅ **Each trip now has a unique booking ID:**
- Trip 1 (first created): KUSH-B-000001
- Trip 2: KUSH-B-000002
- Trip 3: KUSH-B-000003
- etc.

✅ **Console shows different values:**
```
🎫 EnquiryCard received trip: {
  trip_id: "abc-123",
  booking_id_seq: 1,
  formatted_booking_id: "KUSH-B-000001",
  has_booking_id: true
}
🎫 EnquiryCard received trip: {
  trip_id: "def-456",
  booking_id_seq: 2,
  formatted_booking_id: "KUSH-B-000002",
  has_booking_id: true
}
```

## Files Modified
- `src/hooks/useEnquiries.js` - Added explicit booking_id_seq to SELECT
- `src/components/EnquiryCard.js` - Added debug logging

## Files to Run
- `BACKFILL_BOOKING_ID_SEQ.sql` - Database migration to backfill existing trips

## Notes
- New trips created after migration 094 will automatically get unique sequential booking IDs
- This backfill ensures all existing trips also get unique IDs
- The sequence will continue from the last assigned number (e.g., if 50 trips exist, next trip gets KUSH-B-000051)

---

**Status**: 🔧 Ready for Database Migration
