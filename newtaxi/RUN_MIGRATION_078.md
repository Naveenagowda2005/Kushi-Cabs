# Migration 078: Add Trips Table Indexes for Performance

## Problem
Completed trips queries were timing out because:
- Large number of completed trips in database
- No indexes on `created_by`, `accepted_by`, `vendor_id` with `status` filter
- Complex queries without proper indexing

## Solution
Added 4 new indexes to optimize trip queries:
1. `idx_trips_created_by_status` - For trips created by vendor filtered by status
2. `idx_trips_accepted_by_status` - For trips accepted by vendor filtered by status
3. `idx_trips_vendor_id_status` - For trips assigned to vendor filtered by status
4. `idx_trips_status_created_at` - General status + ordering index

## How to Run

### Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of: `supabase/migrations/078_add_trips_index_for_performance.sql`
3. Paste and run the SQL
4. Verify no errors

### Option 2: Using Supabase CLI
```bash
supabase db push
```

## Expected Result
After running this migration:
- ✅ Completed trips queries will complete without timeout
- ✅ All completed trips will be visible in the "Completed" filter
- ✅ Query performance significantly improved
- ✅ Vendor can see all their trips across all statuses

## Testing
1. Open vendor app
2. Go to "My Trips" tab
3. Click "Completed" filter
4. Should see all completed trips (not just 1)
5. Check console - should see all trips loaded successfully

## File Location
`supabase/migrations/078_add_trips_index_for_performance.sql`
