# Booking ID Seq - Complete Fix

## Problem
The `booking_id_seq` column doesn't exist in the trips table, causing all trips to show booking ID "KUSH-B-000001".

## Root Cause
Migration 094 (`094_add_booking_id_sequence.sql`) was not applied to the database. The column was never created.

## Solution - Complete Steps

### Step 1: Run Database Migration
Run this SQL in Supabase SQL Editor:

**File to Run**: `FIX_BOOKING_ID_SEQ_ALL_TRIPS.sql` OR `supabase/migrations/096_add_booking_id_seq_column.sql`

This migration will:
1. Create the sequence `trips_booking_id_seq`
2. Add the `booking_id_seq` column to trips table
3. Create a UNIQUE INDEX to prevent duplicates
4. Backfill all existing trips with sequential numbers (1, 2, 3...)
5. Grant permissions on the sequence

**Copy and paste into Supabase SQL Editor:**
```sql
-- Create sequence
CREATE SEQUENCE IF NOT EXISTS public.trips_booking_id_seq 
  START WITH 1 INCREMENT BY 1;

-- Add column
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS booking_id_seq BIGINT;

-- Set default for new rows
ALTER TABLE public.trips 
ALTER COLUMN booking_id_seq SET DEFAULT nextval('public.trips_booking_id_seq');

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_booking_id_seq 
ON public.trips(booking_id_seq) WHERE booking_id_seq IS NOT NULL;

-- Backfill existing rows
WITH numbered_trips AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) as seq_num
  FROM public.trips WHERE booking_id_seq IS NULL
)
UPDATE public.trips t SET booking_id_seq = nt.seq_num
FROM numbered_trips nt WHERE t.id = nt.id;

-- Grant permissions
GRANT USAGE, SELECT ON SEQUENCE public.trips_booking_id_seq TO authenticated, anon;
```

### Step 2: Updated App Code
The following files have been updated to fetch `booking_id_seq`:

✅ **`src/hooks/useTrips.js`**
- Added `booking_id_seq` to all SELECT queries
- Vendor trips query
- Admin trips query
- Admin-reassigned trips query
- Vendor-assigned trips query

✅ **`src/hooks/useEnquiries.js`**
- Added `booking_id_seq` to useAvailableEnquiries SELECT query

✅ **`src/components/EnquiryCard.js`**
- Added booking ID generation logic
- Added booking ID badge display
- Added debug logging

✅ **`src/components/TripCard.js`**
- Already had booking ID generation logic
- Already displays booking ID

### Step 3: Verify Database Setup
After running the migration, verify with this query in Supabase:

```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'trips' AND column_name = 'booking_id_seq';

-- Check booking IDs
SELECT id, booking_id_seq, 'KUSH-B-' || LPAD(booking_id_seq::TEXT, 6, '0') as formatted_id
FROM trips 
LIMIT 10;

-- Verify uniqueness
SELECT COUNT(*) as total_trips, COUNT(DISTINCT booking_id_seq) as unique_ids
FROM trips;
```

### Step 4: Clear App Cache and Restart
1. Close the app completely
2. Clear app cache (or uninstall/reinstall)
3. Restart the app
4. Navigate to vendor enquiries or driver available trips
5. Each trip should now show a different booking ID

## Expected Results

✅ **Each trip now has a unique booking ID:**
- Trip 1: KUSH-B-000001
- Trip 2: KUSH-B-000002
- Trip 3: KUSH-B-000003
- etc.

✅ **Console Logs:**
```
🎫 TripCard received: {
  trip_id: "abc-123",
  booking_id_seq: 1,
  formatted_booking_id: "KUSH-B-000001",
  has_booking_id: true
}
```

✅ **UI Display:**
- Blue badge showing "Booking ID" label
- Formatted ID: KUSH-B-000001, KUSH-B-000002, etc.
- Each trip card shows different ID

## Files Modified (App Code)
1. `src/hooks/useTrips.js` - Added booking_id_seq to 4 SELECT queries
2. `src/hooks/useEnquiries.js` - Added booking_id_seq to SELECT query
3. `src/components/EnquiryCard.js` - Added booking ID generation and display

## Files to Run (Database)
1. `FIX_BOOKING_ID_SEQ_ALL_TRIPS.sql` - Quick fix
2. OR `supabase/migrations/096_add_booking_id_seq_column.sql` - Proper migration

## Troubleshooting

**Issue: Still showing KUSH-B-000001 for all trips**
- Solution: Clear app cache, restart app, and ensure booking_id_seq column exists in database

**Issue: Column doesn't exist after running migration**
- Solution: Check Supabase SQL Editor for errors, run migration again

**Issue: Some trips have NULL booking_id_seq**
- Solution: Run the backfill UPDATE query to assign sequential numbers

---

**Status**: 🔧 Ready to Deploy
**Priority**: 🔴 High - Required for unique booking IDs
