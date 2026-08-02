# Complete Odometer Upload Fix Guide

## Current Situation

**Problem**: Driver cannot upload odometer images  
**Error**: "new row violates row-level security policy"  
**Root Cause**: RLS policies on `storage.objects` table are blocking uploads  
**Why SQL Won't Work**: `storage.objects` is Supabase-managed; you can't modify it via SQL migrations

**Solution**: Configure RLS policies via Supabase Dashboard Storage UI (the correct method)

---

## Phase 1: Configure RLS in Dashboard (5 minutes)

### 1. Access Supabase Dashboard

```
URL: https://app.supabase.com/
1. Login
2. Select your TAXI project
3. Click "Storage" in left sidebar
4. Find "odometer-images" bucket (should already exist from migration 109)
5. Click on it to open
```

### 2. Navigate to Policies

Look for one of these:
- **"Policies"** tab at top
- **Gear icon** → "Edit RLS policies"
- **Three dots menu** → "Policies"

Click to enter policy editor.

### 3. Create 4 Policies

#### ✅ Policy 1: Allow Authenticated Upload

| Field | Value |
|-------|-------|
| **Name** | Authenticated users can upload odometer images |
| **Operation** | INSERT |
| **Target Role** | authenticated |
| **Policy Expression** | `bucket_id = 'odometer-images'` |

**Then Click**: Save or Add Policy

---

#### ✅ Policy 2: Allow Public Read

| Field | Value |
|-------|-------|
| **Name** | Anyone can view odometer images |
| **Operation** | SELECT |
| **Target Role** | public |
| **Policy Expression** | `bucket_id = 'odometer-images'` |

**Then Click**: Save or Add Policy

---

#### ✅ Policy 3: Allow Authenticated Read

| Field | Value |
|-------|-------|
| **Name** | Authenticated users can view odometer images |
| **Operation** | SELECT |
| **Target Role** | authenticated |
| **Policy Expression** | `bucket_id = 'odometer-images'` |

**Then Click**: Save or Add Policy

---

#### ✅ Policy 4: Allow Users Delete Own

| Field | Value |
|-------|-------|
| **Name** | Users can delete their own odometer images |
| **Operation** | DELETE |
| **Target Role** | authenticated |
| **Policy Expression** | `bucket_id = 'odometer-images' AND owner_id = auth.uid()` |

**Then Click**: Save or Add Policy

---

### 4. Verify All Policies Saved

After adding all 4, dashboard should show:
- ✅ 1 INSERT policy
- ✅ 2 SELECT policies
- ✅ 1 DELETE policy

**Total**: 4 policies

---

## Phase 2: Test Upload (10 minutes)

### Step 1: Restart Backend (if using local IP)

```bash
# Terminal 1: Kill existing backend
# (Windows) Press Ctrl+C if running

# Restart backend
cd backend
npm start
# Should see: "Server listening on http://192.168.1.114:4000"
```

### Step 2: Restart Frontend (if using local IP)

```bash
# Terminal 2: Kill existing frontend
# (Windows) Press Ctrl+C if running

# Restart frontend
cd apps/unified
npm start

# When prompted: Press 'a' for Android or 'i' for iOS
# Or use Expo Go app if testing on phone
```

### Step 3: Test Driver Upload

**On Driver App:**

1. **Login** with a driver account (or create one)
2. **Create or find an active trip** (or vendor must publish a trip)
3. **Navigate to**: Active Trip screen
4. **Look for**: "Take Start Odometer Photo" or similar button
5. **Click**: Take Photo or Choose from Library
6. **Select/Take**: An image
7. **Tap**: Upload or Save
8. **Expected Result**: 
   - ✅ "Upload successful" message
   - ✅ Image displays in the UI
   - ❌ NO error about RLS policy

---

### Step 4: Verify Database

**In Supabase Dashboard - SQL Editor:**

```sql
-- Replace 'driver_phone' with actual driver phone number
SELECT 
  id,
  trip_number,
  start_odometer_image,
  end_odometer_image,
  created_at
FROM public.trips
WHERE driver_id = (
  SELECT id FROM public.users 
  WHERE phone_number = 'driver_phone'
)
ORDER BY created_at DESC
LIMIT 3;
```

**Expected Output:**

| Column | Value |
|--------|-------|
| id | abc123def |
| trip_number | TRX-2026-001 |
| start_odometer_image | https://[project].supabase.co/storage/v1/object/public/odometer-images/abc123/start_1722614000000.jpg |
| end_odometer_image | NULL (or similar if driver uploaded end) |

---

### Step 5: Verify Image Loads

**In Browser:**

1. Copy the `start_odometer_image` URL from database
2. Paste in new browser tab
3. **Expected**: Image displays
4. **If 403 Forbidden**: Policy 2 (public read) wasn't saved correctly

---

## Phase 3: Verify All Users Can View (5 minutes)

### Test 1: Vendor Can View Trip with Image

1. **Login as vendor**
2. **Go to**: My Trips or Recent Trips
3. **Open**: Trip with odometer image
4. **Expected**: Start/end odometer images display

### Test 2: Admin Can View Trip with Image

1. **Login as super admin**
2. **Go to**: Trips Dashboard
3. **Find**: Trip with odometer image
4. **Expected**: Images visible in trip details

### Test 3: API Returns Correct Data

```bash
# Test endpoint (backend running on 192.168.1.114:4000)
curl -X GET "http://192.168.1.114:4000/api/trips/abc123"
```

**Expected Response:**
```json
{
  "id": "abc123",
  "trip_number": "TRX-2026-001",
  "start_odometer_image": "https://[...].supabase.co/storage/v1/object/public/odometer-images/abc123/start_1722614000000.jpg",
  "end_odometer_image": null,
  "driver_id": "driver123"
}
```

---

## Phase 4: Performance Verification (5 minutes)

### Check Query Speed

**Before Fix** (base64 in database):
- Query time: 30+ seconds
- Data size: 500KB+ per image

**After Fix** (URL in database):
- Query time: 100-500ms
- Data size: 200 bytes per URL

**Run This Query:**

```sql
-- Check average size of odometer image URLs
SELECT 
  AVG(pg_column_size(start_odometer_image)) as start_avg_bytes,
  AVG(pg_column_size(end_odometer_image)) as end_avg_bytes
FROM public.trips
WHERE start_odometer_image IS NOT NULL 
   OR end_odometer_image IS NOT NULL;
```

**Expected**: ~200 bytes (just URL)  
**Not Expected**: 500000+ bytes (base64 data)

---

## Troubleshooting

### ❌ Error: "new row violates row-level security policy"

**Cause**: Policy 1 (INSERT) not created or not saved

**Fix**:
1. Verify you created Policy 1 with:
   - Operation: INSERT
   - Role: authenticated
   - Condition: `bucket_id = 'odometer-images'`
2. Make sure you clicked "Save" or "Add Policy"
3. Refresh dashboard and try again

---

### ❌ Error: "policy already exists"

**Cause**: Dashboard tried to create duplicate policy

**Fix**:
1. Delete the existing policy
2. Create new one with fresh name

---

### ❌ Upload Works but Image Shows 403

**Cause**: Policy 2 (public read) not configured

**Fix**:
1. Verify Policy 2 exists:
   - Operation: SELECT
   - Role: public
   - Condition: `bucket_id = 'odometer-images'`
2. If missing, create it
3. Test URL in browser again

---

### ❌ Image Doesn't Show in App

**Cause 1**: Database didn't save URL

**Fix**: Check database query result. If URL is NULL:
- Try uploading again
- Check backend logs for upload errors

**Cause 2**: Frontend not displaying correctly

**Fix**: 
1. Clear app cache: `npm start -- --reset-cache`
2. Log out and back in
3. Try again

---

### ❌ Backend Not Reachable

**Cause**: Using production URL instead of local IP

**Fix**:
1. Check `.env` file has: `EXPO_PUBLIC_SMS_API_URL=http://192.168.1.114:4000`
2. Check backend running on that IP: `npm start` in backend folder
3. Verify both on same WiFi network

---

## Success Checklist

After completing all phases:

- [ ] All 4 RLS policies created in Dashboard
- [ ] Driver can upload start odometer image
- [ ] Database shows URL (not base64)
- [ ] Image displays in driver app
- [ ] Vendor can view trip with images
- [ ] Admin can view trip with images
- [ ] Query performance is <500ms
- [ ] No "RLS policy" errors
- [ ] No "403 Forbidden" errors

---

## What's Next After Fix Works

1. **Test with multiple drivers** — upload different images, verify all work
2. **Test trip completion** — driver uploads start, then end, trip completes
3. **Check commission calculation** — verify nothing broke with storage move
4. **Monitor performance** — queries should be instant, trips table should be small

---

## File References

If issues persist:

- **App Upload Logic**: `apps/unified/src/services/uploadService.js`
- **Trip Display**: `apps/unified/src/screens/driver/ActiveTripScreen.js`
- **Bucket Config**: `supabase/migrations/109_create_odometer_images_bucket.sql`
- **Constants**: `apps/unified/src/constants.js` (STORAGE_BUCKETS.ODOMETER = 'odometer-images')

---

## Important Notes

✅ **DO** use Dashboard for storage bucket policies — this is Supabase-recommended  
❌ **DON'T** use SQL migrations to modify `storage.objects` — you don't own that table  
✅ **DO** test on local IP (192.168.1.114) — same WiFi network as backend  
✅ **DO** verify each policy is saved before testing  
❌ **DON'T** use base64 images in database — use URLs instead (much faster)

