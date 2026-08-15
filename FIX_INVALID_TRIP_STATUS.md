# Fix Invalid Trip Status Values

## Problem
Some trips in the database have an invalid status value "started" which is not part of the `trip_status` enum. Valid values are:
- `pending`
- `accepted`
- `in_progress`
- `completed`
- `cancelled`

This causes errors when trying to update these trips.

## Solution
Run the migration `090_fix_invalid_trip_status.sql` to:
1. Convert all trips with status "started" to "in_progress"
2. Convert any other invalid statuses to "pending"

## How to Apply

### Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire content of `newtaxi/supabase/migrations/090_fix_invalid_trip_status.sql`
3. Paste into the editor
4. Click "Run"
5. Verify the results in the output

### Option 2: Using Migration System
If you have Supabase CLI set up:
```bash
supabase migration up
```

## Verification
After applying the migration, check that all trips have valid status:

```sql
SELECT DISTINCT status FROM trips;
```

Should only show: `pending`, `accepted`, `in_progress`, `completed`, `cancelled`

## After Fix
The reassign feature should now work correctly for pending admin-created trips.
