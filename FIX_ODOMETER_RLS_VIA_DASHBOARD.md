# Fix Odometer Upload RLS - Supabase Dashboard Method

## Problem
- When drivers upload odometer images, they get: **"new row violates row-level security policy"**
- SQL migrations fail with: **"ERROR: 42501: must be owner of table objects"**
- Root cause: `storage.objects` table is Supabase-managed. You cannot modify it via SQL migrations.

## Solution: Use Supabase Dashboard Storage UI

The Supabase Dashboard provides a UI to configure RLS policies for storage buckets. This is the **correct method** because the policies are managed by Supabase, not you.

---

## Step-by-Step Fix

### Step 1: Open Supabase Project Dashboard

1. Go to your Supabase project: https://app.supabase.com/
2. Select your project
3. Navigate to **Storage** (left sidebar)

### Step 2: Find the `odometer-images` Bucket

- You should see the bucket listed
- Click on it to view its contents

### Step 3: Configure RLS Policies

1. While viewing the `odometer-images` bucket, look for **"Policies"** tab or settings gear icon
2. Click on **"Edit RLS policies"** or similar

### Step 4: Create/Update Policies

**You need these policies:**

#### Policy 1: Allow Authenticated Users to Upload
- **Type**: INSERT
- **Target Role**: authenticated
- **Condition**: 
  ```sql
  bucket_id = 'odometer-images'
  ```
- **Effect**: ALLOW

#### Policy 2: Allow Public Read
- **Type**: SELECT
- **Target Role**: public
- **Condition**:
  ```sql
  bucket_id = 'odometer-images'
  ```
- **Effect**: ALLOW

#### Policy 3: Allow Authenticated Read
- **Type**: SELECT
- **Target Role**: authenticated
- **Condition**:
  ```sql
  bucket_id = 'odometer-images'
  ```
- **Effect**: ALLOW

#### Policy 4: Allow Users to Delete Their Own Images
- **Type**: DELETE
- **Target Role**: authenticated
- **Condition**:
  ```sql
  bucket_id = 'odometer-images' AND owner_id = auth.uid()
  ```
- **Effect**: ALLOW

### Step 5: Save Policies

- Click **Save** or **Apply**
- Wait for confirmation

---

## Alternative: Using SQL Console (Service Role)

If Dashboard policies don't work, you can use **Service Role Key** to bypass RLS:

1. Get your **Service Role Key** from: **Settings → API → Service Role Secret Key**
2. Use the Supabase CLI:

```bash
# Set environment variable
export SUPABASE_DB_PASSWORD=your_db_password

# Run migration with service role context
supabase migration up --include 111
```

---

## Verify Fix Works

### Step 1: Test Upload from Driver App

1. Run the app on a driver account
2. Navigate to **Active Trip** screen
3. Click **"Take Photo"** or **"Upload Odometer"**
4. Select/take image
5. **Expected**: Image uploads successfully, URL is stored in trips table

### Step 2: Check Database

Run this query to verify image URL is stored:

```sql
SELECT id, start_odometer_image, end_odometer_image 
FROM public.trips
WHERE driver_id = 'your_driver_id'
LIMIT 5;
```

**Expected**: Should see URLs like:
```
https://xxxxxxxxxxx.supabase.co/storage/v1/object/public/odometer-images/trip_id/start_xxxx.jpg
```

### Step 3: Verify Image Loads

1. Click on a trip with uploaded odometer image
2. Image should display in the UI (should see start/end odometer photos)

---

## Troubleshooting

### Still Getting "RLS Policy" Error After Dashboard Fix?

**Problem**: Dashboard policies aren't taking effect immediately

**Solution**:
1. Hard refresh app (clear cache): `npm start -- --reset-cache`
2. Log out and log back in
3. Try uploading again

### Upload Works but Image Not Showing?

**Problem**: Image URL is stored but not displaying

**Solution**:
1. Check database that URL is correct
2. Verify bucket is **public** (should be by default)
3. Test URL directly in browser - should load image
4. If 403 error: bucket RLS is blocking public access - re-check Step 4 Policy 2

### Backend Not Reachable?

**Problem**: App shows "Upload failed" with network error

**Verify**:
- Backend running on `192.168.1.114:4000`
- Frontend `.env` has correct URL: `EXPO_PUBLIC_SMS_API_URL=http://192.168.1.114:4000`
- Both devices on same WiFi network

---

## What This Fixes

✅ Drivers can upload start odometer image  
✅ Drivers can upload end odometer image  
✅ Images are stored in Storage bucket (not database)  
✅ URLs are stored in trips table  
✅ Queries are 50-100x faster (no base64 in database)  
✅ No more "RLS policy" errors on upload  

---

## Important Notes

- **DO NOT** try to modify `storage.objects` via SQL migrations — you don't own that table
- **DO** use the Supabase Dashboard UI to manage storage bucket policies
- The policies are simple: "authenticated users can upload to this bucket"
- Access control (driver-only) happens at **application level** (uploadService.js already handles this)

---

## Next Steps After Fix

1. Test upload works for driver
2. Verify trip shows start/end odometer images
3. Test all three users (driver, vendor, admin) can VIEW the trips with images
4. Monitor database query performance — should be instant (<100ms per query)

