# Odometer Upload RLS Fix - Apply Now

## PROBLEM IDENTIFIED
The odometer image upload fails with: `new row violates row-level security policy`

**Root Cause:** The RLS policies are comparing `bucket_id` (which is a UUID type in Supabase) with the text string `'odometer-images'`. This type mismatch causes PostgreSQL to reject the comparison.

Error: `ERROR: 42883: operator does not exist: text = uuid`

## SOLUTION
Use a subquery to join with `storage.buckets` table instead of direct text comparison.

## STEPS TO FIX

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.co and log in
2. Select your project
3. Navigate to: **SQL Editor** → **New Query**

### Step 2: Run the Fix SQL
Copy and paste the entire SQL below into the editor and execute:

```sql
-- ============================================================
-- Odometer RLS Quick Fix
-- Drop broken policies and recreate with correct UUID comparison
-- ============================================================

-- Drop ALL existing odometer policies
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;

-- Create correct RLS policies - Use subquery for UUID comparison
CREATE POLICY "Authenticated users can upload odometer images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
  );

CREATE POLICY "Anyone can view odometer images"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
  );

CREATE POLICY "Users can update their own odometer images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
    AND owner_id = auth.uid()
  );

CREATE POLICY "Users can delete their own odometer images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
    AND owner_id = auth.uid()
  );
```

### Step 3: Verify Success
You should see:
- All DROP POLICY statements succeed (even if policies don't exist)
- All CREATE POLICY statements succeed with no errors

### Step 4: Test Upload
1. Restart your app (Ctrl+C and restart, or refresh)
2. Log in as a driver
3. Navigate to an active trip
4. Try uploading an odometer image
5. **Upload should succeed now** ✅

## What Changed
| Aspect | Before | After |
|--------|--------|-------|
| Bucket ID Comparison | `bucket_id = 'odometer-images'` (TEXT = UUID) ❌ | `bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')` (UUID = UUID) ✅ |
| Policy Behavior | Type mismatch error | Correct UUID comparison |
| Upload Permission | BLOCKED (RLS error) | ALLOWED (authenticated users) |

## If You Get an Error
If you get an error like `operator does not exist`, ensure:
1. You're using the exact SQL above (no modifications)
2. You're executing in the SQL Editor, not the console
3. The `storage.objects` and `storage.buckets` tables exist in your database

## Reverting (if needed)
The old policies will be automatically dropped. If you need to restore them, run migration 109 or 110 from the migrations folder.
