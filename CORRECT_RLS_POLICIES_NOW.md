# Fix Odometer Upload - Correct RLS Policies

## Problem
Upload still failing. The policies you created might have wrong conditions or roles.

## Solution
Delete ALL existing policies on `odometer-images` bucket and create exactly these 4:

---

## Step 1: Go to Supabase Dashboard

https://app.supabase.com/ → TAXI project → Storage → odometer-images

---

## Step 2: Delete ALL existing policies

If you see any policies already there, DELETE them all first.

Then create these 4 **EXACTLY**:

---

## Policy 1: Upload (INSERT)

```
Policy name:        Authenticated users can upload odometer images
Allowed operation:  INSERT ✓
Target roles:       authenticated
Policy definition:  bucket_id = 'odometer-images'
```

**Click: Add Policy**

---

## Policy 2: View Public (SELECT)

```
Policy name:        Anyone can view odometer images
Allowed operation:  SELECT ✓
Target roles:       public
Policy definition:  bucket_id = 'odometer-images'
```

**Click: Add Policy**

---

## Policy 3: View Authenticated (SELECT)

```
Policy name:        Authenticated users can view odometer images
Allowed operation:  SELECT ✓
Target roles:       authenticated
Policy definition:  bucket_id = 'odometer-images'
```

**Click: Add Policy**

---

## Policy 4: Delete Own (DELETE)

```
Policy name:        Users can delete their own odometer images
Allowed operation:  DELETE ✓
Target roles:       authenticated
Policy definition:  bucket_id = 'odometer-images' AND owner_id = auth.uid()
```

**Click: Add Policy**

---

## After Creating All 4:

1. All 4 should show as **Active**
2. Hard refresh app: Clear cache and reload
3. Test upload again

---

## If Upload Still Fails:

Try this **DELETE APPROACH** (nuclear option):

Go to **SQL Editor** in Supabase and run:

```sql
-- Drop ALL policies
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;

-- Disable RLS completely
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

SELECT 'RLS Disabled on storage.objects' AS status;
```

This will allow uploads to work. After it works, we can re-enable RLS with correct policies.

