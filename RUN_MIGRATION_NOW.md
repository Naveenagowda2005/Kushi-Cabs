# ⚠️ CRITICAL: Run Database Migration

## Error Received
```
Could not find the 'admin_assigned_drivers' column of 'trips' in the schema cache
```

## Solution: Execute Migration in Supabase

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project
2. Click on **SQL Editor** (left sidebar)
3. Click **New query** (or paste in existing query editor)

### Step 2: Copy and Paste SQL

Copy this entire SQL block and paste it into the Supabase SQL editor:

```sql
-- ============================================================
-- Migration: Add admin_trip_assignments table for tracking
-- admin-created trips assigned to specific drivers
-- ============================================================

-- Create admin_trip_assignments table
CREATE TABLE IF NOT EXISTS admin_trip_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES users(id),
  
  -- Track if driver has seen/accepted this admin-assigned trip
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_trip_assignments ENABLE ROW LEVEL SECURITY;

-- Create indices for faster queries
CREATE INDEX idx_admin_trip_assignments_trip_id ON admin_trip_assignments(trip_id);
CREATE INDEX idx_admin_trip_assignments_driver_id ON admin_trip_assignments(driver_id);

-- Policy: Allow super admin to view all assignments
CREATE POLICY "super_admin_view_all_assignments"
  ON admin_trip_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users 
    WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
  ));

-- Policy: Allow drivers to view their assigned trips
CREATE POLICY "driver_view_own_assignments"
  ON admin_trip_assignments
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Policy: Allow admin to create assignments
CREATE POLICY "admin_create_assignments"
  ON admin_trip_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    assigned_by IN (
      SELECT id FROM users 
      WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Policy: Allow admin to update assignments (e.g., mark as viewed)
CREATE POLICY "admin_update_assignments"
  ON admin_trip_assignments
  FOR UPDATE
  TO authenticated
  USING (
    assigned_by IN (
      SELECT id FROM users 
      WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

-- Add columns to trips table if they don't exist
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_admin_trip BOOLEAN DEFAULT FALSE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS admin_assigned_drivers UUID[] DEFAULT '{}';

-- Create index for finding admin-created trips
CREATE INDEX IF NOT EXISTS idx_trips_is_admin_trip ON trips(is_admin_trip) WHERE is_admin_trip = TRUE;

-- Ensure we can query trips where driver is in admin_assigned_drivers array
CREATE INDEX IF NOT EXISTS idx_trips_admin_assigned_drivers ON trips USING GIN(admin_assigned_drivers);

COMMENT ON TABLE admin_trip_assignments IS 'Tracks which drivers are assigned to admin-created trips';
COMMENT ON COLUMN trips.is_admin_trip IS 'Whether this trip was created by super admin (TRUE) or vendor (FALSE)';
COMMENT ON COLUMN trips.admin_assigned_drivers IS 'Array of driver UUIDs assigned to this admin trip';
```

### Step 3: Execute Query
1. Click **Run** button (or Ctrl+Enter)
2. Wait for completion
3. Should see: **Query executed successfully** (no errors)

### Step 4: Verify

Run this query to verify the columns were added:

```sql
-- Check if columns exist in trips table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND column_name IN ('is_admin_trip', 'admin_assigned_drivers')
ORDER BY column_name;
```

Expected output:
```
column_name           | data_type
---------------------|------------------
admin_assigned_drivers| uuid[]
is_admin_trip         | boolean
```

### Step 5: Verify admin_trip_assignments table

```sql
-- Check if admin_trip_assignments table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'admin_trip_assignments';
```

Expected: Returns 1 row with `admin_trip_assignments`

---

## After Migration Complete

1. **Reload Frontend**: Press 'r' in Expo terminal to reload
2. **Try Creating Admin Trip Again**: 
   - Go to Settings
   - Click "Create Admin Trip"
   - Fill form
   - Click "Create & Assign Trip"
   - Should work now! ✅

---

## What This Migration Does

✅ **Creates `admin_trip_assignments` table** - tracks which drivers are assigned to admin trips

✅ **Adds columns to trips table**:
- `is_admin_trip` (BOOLEAN) - marks trip as admin-created
- `admin_assigned_drivers` (UUID array) - stores list of assigned driver IDs

✅ **Sets up RLS policies** - ensures data access control

✅ **Creates indices** - improves query performance

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "relation admin_trip_assignments already exists" | Already migrated, skip this |
| "column admin_assigned_drivers already exists" | Already migrated, skip this |
| Permission denied error | Use service role key or elevated permissions |
| Connection timeout | Wait a moment and retry |

---

## ✅ Success Indicators

After running the migration, you should see:
- ✅ No error messages
- ✅ Query executed successfully
- ✅ New table `admin_trip_assignments` created
- ✅ New columns in `trips` table: `is_admin_trip`, `admin_assigned_drivers`
- ✅ All indices created
- ✅ Admin trip creation now works!

---

**Next Step**: After running migration, try creating an admin trip again!

Generated: July 2, 2026
Urgency: HIGH - Blocking admin trip creation feature
