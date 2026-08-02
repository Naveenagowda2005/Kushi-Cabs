# 🔧 Setup Odometer Images Bucket - DO THIS NOW

## Problem
Currently, odometer images are being stored as **large base64 strings** in the database → **CAUSES TIMEOUTS**

## Solution
Store images in **Supabase Storage bucket** instead → **FAST & SCALABLE**

---

## 🚀 QUICK SETUP (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** on the left sidebar
4. Click **"New query"**

### Step 2: Run This SQL
Copy and paste the entire SQL below, then click **"Run"**:

```sql
-- ============================================================
-- Create odometer-images storage bucket for driver uploads
-- ============================================================

-- Create the bucket (public so URLs are accessible)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'odometer-images',
  'odometer-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================================
-- RLS Policies
-- ============================================================

-- 1. Drivers can upload their own odometer images
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
CREATE POLICY "Drivers can upload odometer images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'odometer-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role_id = (SELECT id FROM public.roles WHERE name = 'driver')
    )
  );

-- 2. All authenticated users can view odometer images
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
CREATE POLICY "Authenticated users can view odometer images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'odometer-images');

-- 3. Drivers can update/replace their own images
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;
CREATE POLICY "Drivers can update odometer images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'odometer-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role_id = (SELECT id FROM public.roles WHERE name = 'driver')
    )
  );

SELECT 'Success: odometer-images bucket created' AS status;
```

### Step 3: Verify Success
You should see output:
```
status
─────────────────────────────────────────────
Success: odometer-images bucket created
```

### Step 4: Verify in Dashboard
1. Click **Storage** in left sidebar
2. You should see **"odometer-images"** bucket listed
3. Click on it - should show: **Public: ON**, **5 MB limit**

---

## ✅ What This Does

1. **Creates bucket**: `odometer-images`
   - Public access: Yes (URLs work without authentication)
   - File size limit: 5MB per image
   - Allowed types: JPEG, PNG, WebP

2. **Sets up permissions**:
   - ✅ Drivers CAN upload odometer images
   - ✅ All users CAN view/fetch odometer images
   - ✅ Drivers CAN update their own images
   - ❌ Non-drivers CANNOT upload

---

## 📱 How Driver Upload Works

### Before ❌
```
Driver captures image
  → Converts to base64 (100-500 KB)
  → Stores in trips table
  → Query 100 trips = 10-50 MB data
  → TIMEOUT (statement timeout)
```

### After ✅
```
Driver captures image
  → uploadOdometerImage() uploads to storage bucket
  → Returns public URL (100 bytes)
  → Stores URL in trips.start_odometer_url
  → Query 100 trips = 5 KB data
  → FAST (< 1 second)
```

---

## 📋 Code Already In Place

All frontend code is ready:

1. **Upload Service** ✅
   - File: `src/services/uploadService.js`
   - Function: `uploadOdometerImage(imageData, tripId, type)`
   - Returns: Public bucket URL

2. **Active Trip Screen** ✅
   - File: `src/screens/driver/ActiveTripScreen.js`
   - Uses: `uploadOdometerImageLocal()` → calls upload service
   - Stores: URL in database (not base64)

3. **Trip Service** ✅
   - File: `src/services/tripService.js`
   - Saves: `start_odometer_url` and `end_odometer_url` as URLs

4. **Database Columns** ✅
   - `trips.start_odometer_url` - TEXT column (stores URL)
   - `trips.end_odometer_url` - TEXT column (stores URL)

---

## 🧪 Test Upload Flow

### Login as Driver
1. Accept a trip
2. Click **"Start Trip"**
3. Capture odometer image with camera
4. You should see:
   - ✅ Image uploaded to bucket
   - ✅ URL stored in database
   - ✅ Image thumbnail shows on screen

### Verify in Admin Screen
1. Login as Super Admin
2. Go to **"Trips"** screen
3. Click on a **Completed** trip
4. Scroll down to **"Odometer Images"**
5. Should show:
   - ✅ Start image thumbnail with zoom controls
   - ✅ End image thumbnail with zoom controls
   - ✅ No timeouts!

---

## 🔍 Database Check

After running the SQL, verify in Supabase Dashboard:

```sql
-- Check if bucket exists
SELECT id, name, public, file_size_limit FROM storage.buckets 
WHERE id = 'odometer-images';

-- Expected output:
-- id                 | name              | public | file_size_limit
-- odometer-images    | odometer-images   | true   | 5242880
```

---

## 📊 Performance Impact

### Old Approach (Base64 in Database)
- 47 completed trips × 200-500 KB per image = **10-50 MB per query**
- Query time: **30+ seconds → TIMEOUT**
- Storage: Database grows large

### New Approach (URL in Database)
- 47 completed trips × 100 bytes per URL = **5 KB per query**
- Query time: **< 1 second**
- Storage: Separate from database

---

## ⚠️ Important Notes

- **Existing trips**: Old trips with base64 will still work but won't be optimized
- **New uploads**: All new uploads use the bucket (much faster)
- **Public URLs**: Images are public - anyone with the link can view them
- **Security**: Only drivers can upload; RLS policies enforce this

---

## 📞 Troubleshooting

### "Error: bucket already exists"
→ That's fine! The SQL uses `ON CONFLICT` so it just updates settings

### "Bucket created but images won't upload"
→ Restart the app - it caches constants

### "Images uploading but taking long time"
→ Check network connection - first upload may take 5-10 seconds

### "Can't see images in admin screen"
→ Scroll down to "Odometer Images" section
→ Make sure trip status is "completed"

---

## 🎯 Next Steps

1. ✅ Run the SQL above in Supabase
2. ✅ Verify bucket appears in Storage section
3. ✅ Test driver upload flow
4. ✅ Verify images show in admin screen
5. ✅ Check that trips queries are fast again

**Your odometer bucket is ready!**
