# Fix Completed Trips Query Timeout

## Problem
Vendor's "Completed" trips filter shows only 1 trip instead of all completed trips. Root cause:
- Queries for `created_by` and `vendor_id` with status='completed' are timing out
- These queries scan too many rows before applying RLS policies
- Only `accepted_by` query works (returns 1 trip)

## Symptoms
- Console logs show Query 3 & 5 timeout errors (code 57014)
- Only Query 4 succeeds (returns 1 trip)
- Filter shows 1 completed trip only

## Current Workaround (Temporary)
Updated `useVendorTrips` hook to skip the timeout queries and only fetch:
- Active trips (pending, accepted, in_progress) for created_by, accepted_by, vendor_id
- Completed trips only from accepted_by

This prevents app crash but won't show all completed trips.

## Permanent Solution Required

### Step 1: Create Database Indexes (Critical)
Run migration to add performance indexes:
```sql
-- File: supabase/migrations/078_add_trips_index_for_performance.sql

CREATE INDEX IF NOT EXISTS idx_trips_created_by_status 
ON trips(created_by, status) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_trips_accepted_by_status 
ON trips(accepted_by, status) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_trips_vendor_id_status 
ON trips(vendor_id, status) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_trips_status_created_at 
ON trips(status, created_at DESC);
```

### Step 2: Check RLS Policies
Verify RLS policies on trips table aren't causing full table scans:
```sql
-- Check current RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trips';

-- These should use indexed columns:
-- - created_by
-- - accepted_by  
-- - vendor_id
-- - status
```

### Step 3: Re-enable Full Completed Trips Queries
Once indexes are created, update the hook to fetch all completed trips:
```javascript
// In src/hooks/useEnquiries.js - useVendorTrips function

// Add back these queries after indexes are created:
supabase
  .from('trips')
  .select('*')
  .eq('created_by', userId)
  .eq('status', 'completed')
  .order('created_at', { ascending: false }),

supabase
  .from('trips')
  .select('*')
  .eq('vendor_id', vendorRow.id)
  .eq('status', 'completed')
  .order('created_at', { ascending: false })
```

## Steps to Apply Fix

### For Immediate Relief:
Current code works - shows 1 completed trip (all trips accepted by vendor)

### For Permanent Fix:
1. **Run Migration 078** in Supabase
   - Go to SQL Editor
   - Copy migration 078 SQL
   - Execute it

2. **Wait for indexes to be created** (should be instant)

3. **Uncomment the timeout queries** in hook and redeploy app

4. **Test**:
   - Open My Trips → Completed filter
   - Should see all completed trips now

## Timeline
- **Temporary workaround**: Active now
- **Permanent fix with indexes**: Run migration when ready
- **Full functionality**: After migration + app redeploy

## Files
- `supabase/migrations/078_add_trips_index_for_performance.sql` - Create indexes
- `src/hooks/useEnquiries.js` - Hook with workaround (lines ~56-120)
- `src/screens/vendor/EnquiriesScreen.js` - Filter UI works correctly
