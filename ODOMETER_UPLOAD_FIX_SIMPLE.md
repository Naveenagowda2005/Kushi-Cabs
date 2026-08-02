# 🔧 FIX ODOMETER UPLOAD - SIMPLEST APPROACH

## Error
**"Failed to upload start image"**

## Reason
The RLS policies for odometer-images bucket are blocking uploads.

## Quick Fix

### Copy & Paste This SQL Into Supabase SQL Editor

```sql
-- Drop all old policies
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload odometer images v2" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Public read odometer images v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Update own odometer images v2" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Delete own odometer images v2" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to odometer-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read odometer-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated manage odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;

-- Create simple policies
CREATE POLICY "odometer_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'odometer-images');

CREATE POLICY "odometer_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'odometer-images');
```

### Then Click "Run"

---

## Test
1. Open driver app
2. Go to active trip
3. Click upload odometer photo
4. ✅ Should upload successfully now

---

**File**: `SIMPLEST_FIX_ODOMETER.sql`
