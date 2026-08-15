# Quick Fix Guide - Document Upload Not Storing

## Problem
✗ Documents show "successfully uploaded" but don't appear in database

## Root Cause
RLS policies checking for wrong role name ('admin' instead of 'super_admin')

## Quick Fix (5 minutes)

### Step 1: Update RLS Policies in Supabase
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Create new query
4. Copy and paste this SQL:

```sql
-- Drop old policies with wrong role name
DROP POLICY IF EXISTS "super_admins_view_all_documents" ON driver_documents;
DROP POLICY IF EXISTS "super_admins_verify_documents" ON driver_documents;
DROP POLICY IF EXISTS "super_admins_view_all_verification_status" ON driver_verification_status;
DROP POLICY IF EXISTS "super_admins_view_all_users_verification_status" ON users;

-- Create new policies with correct role name 'super_admin'
CREATE POLICY "super_admins_view_all_documents"
  ON driver_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "super_admins_verify_documents"
  ON driver_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "super_admins_view_all_verification_status"
  ON driver_verification_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );

CREATE POLICY "super_admins_view_all_users_verification_status"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );
```

5. Click "Run"
6. Wait for success message

### Step 2: Restart App
1. Stop Expo server (Ctrl+C)
2. Clear cache: `npx expo start --clear`
3. Reload app

### Step 3: Test Upload
1. Sign up as driver
2. Upload a document
3. Check console for logs
4. Document should now appear in list

## Verification

### Check Console Logs
You should see:
```
uploadDocumentImage: Starting upload for DL driver: <id>
uploadDocumentImage: Base64 data length: 12345
uploadDocumentImage: Successfully uploaded DL
loadDocuments: Retrieved documents: [...]
```

### Check Database
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select `driver_documents` table
4. Should see new row with your document

## If Still Not Working

### Check 1: Verify RLS Policies
```sql
-- Run this to see current policies
SELECT * FROM pg_policies WHERE tablename = 'driver_documents';
```

Should show policies with 'super_admin' (not 'admin')

### Check 2: Verify User Role
```sql
-- Check if user has correct role
SELECT u.id, u.phone, r.name as role
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.phone = '9686314982';
```

Should show role as 'driver'

### Check 3: Check RLS Enabled
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('driver_documents', 'driver_verification_status');
```

Should show `rowsecurity = true`

## Files Updated

✅ `supabase/migrations/039_driver_verification_rls_policies.sql` - Fixed role names
✅ `src/services/documentService.js` - Better upload logic
✅ `src/screens/driver/DriverDocumentUploadScreen.js` - Added logging

## Expected Result

After fix:
- ✅ Upload shows success message
- ✅ Document appears in list
- ✅ Document stored in database
- ✅ Admin can see document
- ✅ Admin can approve/reject

## Support

For detailed information, see: `DOCUMENT_UPLOAD_FIX.md`
