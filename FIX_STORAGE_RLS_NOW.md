# Fix Storage Bucket RLS Policies

You're getting RLS errors because the buckets have security policies that block uploads. 

## Quick Fix (2 ways)

### Option 1: Disable RLS Completely (Easiest - for development)

Go to **Supabase Dashboard** → **Storage** → Click each bucket:

1. **driver-documents** → Click settings → Toggle OFF "Enable Row Level Security"
2. **vendor-documents** → Click settings → Toggle OFF "Enable Row Level Security"  
3. **user-avatars** → Click settings → Toggle OFF "Enable Row Level Security"

This allows anyone to upload. For production, use Option 2.

---

### Option 2: Add Proper RLS Policies (Secure - for production)

Go to **Supabase Dashboard** → **SQL Editor** and run this:

```sql
-- DRIVER DOCUMENTS BUCKET
CREATE POLICY "Allow authenticated users to upload driver documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'driver-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view driver documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'driver-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow super admin to delete driver documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'driver-documents'
  AND auth.jwt() ->> 'role' = 'super_admin'
);

-- VENDOR DOCUMENTS BUCKET
CREATE POLICY "Allow authenticated users to upload vendor documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view vendor documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'vendor-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow super admin to delete vendor documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vendor-documents'
  AND auth.jwt() ->> 'role' = 'super_admin'
);

-- USER AVATARS BUCKET
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-avatars'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to update their own avatar"
ON storage.objects
FOR UPDATE
WITH CHECK (
  bucket_id = 'user-avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.jwt() ->> 'role' = 'super_admin'
  )
);

CREATE POLICY "Allow users to delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.jwt() ->> 'role' = 'super_admin'
  )
);
```

---

## What to Choose?

- **Development**: Use Option 1 (disable RLS)
- **Production**: Use Option 2 (add policies)

After fixing, try uploading again. Uploads should work!
