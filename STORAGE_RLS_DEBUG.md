# Storage RLS Error - Debug & Fix

## Problem
"new row violates row-level security policy" when uploading to storage buckets

## Root Causes

1. **RLS still enabled on buckets** - Toggle wasn't saved
2. **Bucket is Private** - Need to make it Public for uploads
3. **Browser cache** - Old policy cached

## Fix Steps

### Step 1: Make Buckets PUBLIC

Go to **Supabase Dashboard → Storage**:

For each bucket (driver-documents, vendor-documents, user-avatars):
1. Click the bucket name
2. Click **Settings** (top right)
3. Find **"Public bucket"** toggle
4. Turn it **ON** (make public)
5. Click **Update bucket**

### Step 2: Verify RLS is OFF

1. Still in bucket settings
2. Find **"Enable Row Level Security"** toggle
3. Make sure it's **OFF** (no checkmark)

### Step 3: Hard Refresh App

After making buckets public:
1. Close the app completely
2. Clear app cache (Settings → App → Clear Cache)
3. Reopen the app
4. Try uploading again

---

## Expected Result

Upload should succeed with:
```
✅ Document uploaded to storage: https://...
✅ Successfully uploaded DL to storage bucket
```

---

## If Still Failing

Try this SQL in Supabase SQL Editor:

```sql
-- Drop all storage policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to upload driver documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view driver documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow super admin to delete driver documents" ON storage.objects;

-- Disable RLS entirely (public access)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

Then try uploading again.
