# Vendor Document Upload Not Saving - Debugging Guide

## Problem
When vendors try to upload documents, they see success alerts but:
1. Documents are not appearing in the upload screen
2. Documents are not being saved to the database
3. No error messages appear in the console

## Root Causes Identified

### 1. Missing vendor_documents Record
The app tries to fetch existing vendor_documents record using:
```javascript
.from('vendor_documents')
.select('*')
.eq('user_id', userId)
.single()
```

If no record exists, it gets `PGRST116` error (no rows). But then the INSERT to create one might fail silently due to RLS policies.

### 2. Possible RLS Policy Issues
Even though RLS policies are defined, they depend on:
- `auth.uid()` being the authenticated user ID
- Proper session context in the client

### 3. Missing vendor_id
If the vendor record doesn't exist in the vendors table, the foreign key constraint fails.

## Diagnostic Steps

### Step 1: Check Backend Endpoint
Run this to get full debug info about the vendor:

```bash
curl http://192.168.1.110:4000/admin/vendor-debug/USER_ID
```

Replace USER_ID with the actual user ID from the app.

**Expected Response:**
```json
{
  "success": true,
  "userId": "c1eee0f6-...",
  "debug": {
    "user": { "id": "...", "email": "...", "phone": "...", "verification_status": "..." },
    "vendor": { "id": "...", "company_name": "...", "user_id": "..." },
    "vendor_verification_status": { "overall_status": "...", ... },
    "vendor_documents": { "error": "No rows found", "code": "PGRST116" },
    "rls_test_insert": { "success": true } // If admin can insert, RLS is blocking user
  }
}
```

### Step 2: Check Frontend Logs
Look for these specific logs when uploading a document:

```
handleUploadDocument: User ID: <USER_ID> Vendor ID: <VENDOR_ID>
handleUploadDocument: Fetch result - existingDocs: false fetchError: PGRST116
handleUploadDocument: No existing record, creating new one with vendor_id: <VENDOR_ID>
handleUploadDocument: INSERT result - error: <ERROR_INFO> data: <DATA>
```

## Common Issues & Solutions

### Issue 1: vendor_id is null
**Symptom:** `Vendor ID: null` in logs

**Cause:** Vendor record doesn't exist in vendors table

**Solution:**
```sql
-- As admin, check if vendor exists
SELECT id, user_id, company_name FROM vendors WHERE user_id = 'USER_ID';

-- If missing, insert it:
INSERT INTO vendors (user_id, company_name, commission_pct)
VALUES ('USER_ID', 'Vendor Company', 15.0);
```

### Issue 2: INSERT fails silently
**Symptom:** No error in logs, but documents don't save

**Cause:** RLS policy not allowing INSERT

**Check:**
```javascript
// The INSERT call should show detailed error
const { error: insertError, data: insertData } = await supabase
  .from('vendor_documents')
  .insert(insertPayload)
  .select();

console.log('Insert error:', insertError, 'Data:', insertData);
```

**Solution:**
Verify RLS policies exist:
```sql
SELECT * FROM pg_policies WHERE tablename = 'vendor_documents';
```

Should see:
- `vendors_upload_documents` - INSERT policy
- `vendors_update_own_documents` - UPDATE policy

### Issue 3: auth.uid() is NULL
**Symptom:** RLS policies fail but no clear error

**Cause:** Session not properly authenticated

**Check:**
```sql
-- Check if user session is valid
SELECT current_user_id(); -- Should return USER_ID
```

## Changes Made to Help Debugging

### 1. Enhanced Logging in VendorDocumentUploadScreen.js
Added detailed logs for:
- User ID and Vendor ID at upload start
- Fetch result (success or error code)
- INSERT/UPDATE payload (with document_data truncated)
- Full error details

### 2. New Backend Endpoint
Added: `GET /admin/vendor-debug/:userId`

Returns complete vendor setup information:
- User record status
- Vendor record existence  
- Verification status
- Document records
- RLS policy test result

## How to Use the Fixed Code

When user uploads a document:

1. **Check Frontend Logs:**
   - Open app console (usually Expo debug output)
   - Look for `handleUploadDocument:` logs
   - Identify where it's failing (Fetch, INSERT, or UPDATE)

2. **Get Backend Debug Info:**
   - Copy USER_ID from logs or auth context
   - Call: `http://BACKEND_IP:4000/admin/vendor-debug/USER_ID`
   - Review the returned debug object

3. **Fix Issues:**
   - If vendor_id is null → Create vendor record
   - If PGRST116 continues → Check RLS policies
   - If error shows permission denied → Check auth session

## Testing

After making fixes, test upload flow:

1. Vendor picks document image
2. Check `handleUploadDocument: User ID: ... Vendor ID: ...` appears in logs
3. Check `handleUploadDocument: INSERT result` shows no error
4. Document should appear in upload screen
5. Check database: `SELECT * FROM vendor_documents WHERE user_id = 'USER_ID';`

## Next Steps

Once documents are saving:
1. Verify all 4 required documents can be uploaded
2. Verify "Submit for Verification" button works
3. Verify admin can see vendor documents in dashboard
4. Verify real-time updates work when admin approves
