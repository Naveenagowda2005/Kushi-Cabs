# Odometer RLS Policies - Quick Reference for Dashboard

## Why Dashboard Over SQL?

- ❌ SQL migrations fail: "must be owner of table objects"
- ✅ Dashboard works: Supabase-approved method for storage policies
- ✅ Immediate effect: No need to re-deploy migrations

---

## Dashboard Navigation

```
🔹 app.supabase.com
   ↓
   🔹 Select Project
   ↓
   🔹 Storage (left sidebar)
   ↓
   🔹 Click "odometer-images" bucket
   ↓
   🔹 Policies tab or gear icon → "Edit RLS Policies"
```

---

## 4 Policies to Create/Verify

### 1️⃣ INSERT - Allow Authenticated Upload

```
Name: "Authenticated users can upload odometer images"
Type: INSERT
Target: authenticated
Condition: bucket_id = 'odometer-images'
```

**Purpose**: Drivers can upload photos

---

### 2️⃣ SELECT - Allow Public Read

```
Name: "Anyone can view odometer images"
Type: SELECT
Target: public
Condition: bucket_id = 'odometer-images'
```

**Purpose**: Images are accessible via public URLs (no auth needed for viewing)

---

### 3️⃣ SELECT - Allow Authenticated Read

```
Name: "Authenticated users can view odometer images"
Type: SELECT
Target: authenticated
Condition: bucket_id = 'odometer-images'
```

**Purpose**: Logged-in users (drivers, vendors, admins) can view images

---

### 4️⃣ DELETE - Allow Users to Delete Own

```
Name: "Users can delete their own odometer images"
Type: DELETE
Target: authenticated
Condition: bucket_id = 'odometer-images' AND owner_id = auth.uid()
```

**Purpose**: Drivers can delete their uploaded images if needed

---

## Testing After Setup

### 1. Driver App Upload Test

```javascript
// In ActiveTripScreen.js - this should now work:
const uploadStartImage = async () => {
  const image = await pickOdometerImage();
  const url = await uploadOdometerImage(image, tripId, 'start');
  // ✅ Should see: "Upload successful"
  // ❌ Should NOT see: "new row violates row-level security policy"
};
```

### 2. Verify Database

```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  trip_number,
  start_odometer_image,
  end_odometer_image
FROM public.trips
WHERE driver_id = (SELECT id FROM public.users WHERE phone_number = '...')
LIMIT 1;
```

Expected output:
```
id           | trip_number | start_odometer_image                           | end_odometer_image
-------------|-------------|------------------------------------------------|--
abc123       | TRX001      | https://.../odometer-images/abc123/start_....jpg | NULL
```

### 3. Open Image in Browser

- Copy the URL from database
- Paste in browser
- ✅ Should load image
- ❌ If 403: Your bucket RLS policy is blocking public read

---

## Common Issues & Fixes

### Issue: "Policy already exists" Error
**Fix**: Delete existing policy first, then create new one

### Issue: Upload still fails after dashboard fix
**Fix**: 
1. Clear app cache: `npm start -- --reset-cache`
2. Log out + log back in
3. Try again

### Issue: Policies not saving
**Fix**:
1. Check you have admin role in Supabase project
2. Try incognito mode to clear browser cache
3. Refresh dashboard page

### Issue: Image shows 403 Forbidden
**Fix**:
1. Verify Policy 2 (public read) is created
2. Make sure condition is just: `bucket_id = 'odometer-images'`
3. Target should be: `public`

---

## RLS Policy Syntax Guide

### Common Conditions

```sql
-- Allow specific bucket only
bucket_id = 'odometer-images'

-- Allow user's own files
owner_id = auth.uid()

-- Combine conditions (AND)
bucket_id = 'odometer-images' AND owner_id = auth.uid()

-- Check if user is driver
EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role_id = (SELECT id FROM public.roles WHERE name = 'driver')
)
```

**For Odometer**: Use simple conditions. Application-level code (uploadService.js) ensures only drivers call upload.

---

## Commit These Policies

Once policies are working, they should persist in your Supabase project. But document them:

**File**: `docs/ODOMETER_RLS_POLICIES.md` (for team reference)

Content:
```markdown
# Odometer Images Bucket - RLS Policies

Created via Supabase Dashboard (Storage → odometer-images → Edit RLS Policies)

## Policies

1. INSERT: authenticated, bucket_id = 'odometer-images'
2. SELECT: public, bucket_id = 'odometer-images'
3. SELECT: authenticated, bucket_id = 'odometer-images'
4. DELETE: authenticated, bucket_id = 'odometer-images' AND owner_id = auth.uid()

These allow drivers to upload odometer images and anyone to view them.
```

---

## After Policies Work

### Performance Verification

Before (base64 in database):
- Query time: 30+ seconds
- Data per trip: 500KB+ base64

After (URL in database):
- Query time: 100-500ms
- Data per trip: 200 bytes URL

Run this query to verify:

```sql
SELECT 
  COUNT(*) as trip_count,
  AVG(pg_column_size(start_odometer_image)) as avg_size_bytes
FROM public.trips;
```

**Expected**: avg_size_bytes should be ~200 (just URL), not 500000+ (base64)

