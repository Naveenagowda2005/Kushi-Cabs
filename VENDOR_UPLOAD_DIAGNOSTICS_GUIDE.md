# Vendor Document Upload - Diagnostics Guide

## Enhanced Logging Now Active ✅

The app now has detailed logging for every step of the upload and load process. Use this guide to diagnose issues.

---

## 📝 Upload Flow - What to Look For

### Step 1: Image Selection
```
✅ handleUploadDocument: Image picked successfully, size: 52441
✅ handleUploadDocument: User ID: c1eee0f6-9538... Vendor ID: 12345678...
```

**If you don't see this:**
- Image picker failed
- Check file picker permissions
- Verify device has camera/gallery access

**Size should be:**
- > 10,000 bytes (10KB) - typically 50KB-500KB for photos
- If size is 0 → image not selected properly
- If size is huge (>5MB) → image too large

---

### Step 2: Check Existing Record
```
✅ handleUploadDocument: Fetch result - existingDocs: false, fetchError: PGRST116
```

**Meanings:**
- `PGRST116` = No record found (expected first time)
- `existingDocs: true` = Record found, will UPDATE
- `existingDocs: false, fetchError: null` = Record deleted? = Check RLS

---

### Step 3a: First Upload (INSERT)
```
✅ handleUploadDocument: No existing record, creating new one with vendor_id: 12345678
✅ handleUploadDocument: INSERT payload - user_id: c1eee0f6... vendor_id: 12345678
✅ handleUploadDocument: Document keys: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
✅ handleUploadDocument: Payload size: 94532 bytes
✅ handleUploadDocument: INSERT result - error: null, data: [...]
✅ handleUploadDocument: ✅ INSERT SUCCESS - returned documents keys: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
✅ handleUploadDocument: Returned record - id: abc123..., vendor_id: 12345678
```

**If you don't see INSERT SUCCESS:**

Check the error:
```
❌ handleUploadDocument: ❌ INSERT FAILED: {
  "code": "42501",
  "message": "new row violates row level security policy",
  ...
}
```

**Error codes mean:**
- `42501` = RLS policy denied INSERT (permissions issue)
- `23505` = Duplicate vendor_id (record already exists - weird!)
- `23503` = vendor_id doesn't exist in vendors table
- `23502` = Missing required field (user_id or vendor_id)

---

### Step 3b: Subsequent Uploads (UPDATE)
```
✅ handleUploadDocument: Updating existing record for user: c1eee0f6... vendor_id: 12345678
✅ handleUploadDocument: Current document keys before update: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
✅ handleUploadDocument: Updated PAN_CARD status: pending, data length: 52441
✅ handleUploadDocument: Document keys after update: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
✅ handleUploadDocument: UPDATE result - error: null, data: [...]
✅ handleUploadDocument: ✅ UPDATE SUCCESS - returned documents with keys: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
✅ handleUploadDocument: Verify PAN_CARD has data: true
```

**If UPDATE fails with RLS error:**
- Check policy: `vendors_update_own_documents`
- Verify user_id in token matches query filter
- Confirm auth.uid() returns correct value

---

### Step 4: Load After Upload
```
✅ handleUploadDocument: Upload successful
✅ loadDocuments: Starting load for user: c1eee0f6...
✅ loadDocuments: Retrieved document types: AADHAR, PAN_CARD, BANK_PASSBOOK_FRONT, VENDOR_SELFIE
✅ loadDocuments: AADHAR - status: pending, has data: true
✅ loadDocuments: PAN_CARD - status: pending, has data: true
✅ loadDocuments: BANK_PASSBOOK_FRONT - status: pending, has data: false
✅ loadDocuments: VENDOR_SELFIE - status: pending, has data: false
✅ loadDocuments: Final list: [{type: "AADHAR", status: "pending", hasData: true}, ...]
```

**Success indicators:**
- Retrieved all 4 document types
- At least 1 `has data: true`
- Final list matches number of uploads

**If documents show as `has data: false` after upload:**
1. INSERT/UPDATE says success but data not in database?
2. Check if JSONB column is being saved correctly
3. Check database directly:
   ```sql
   SELECT LENGTH(documents->'AADHAR'->>'document_data')
   FROM vendor_documents WHERE user_id = 'USER_ID';
   ```

---

## 🔍 Complete Error Scenarios

### Scenario 1: "vendor_id is null/undefined"
```
❌ handleUploadDocument: ERROR - vendor_id is null/undefined!
```

**Cause:**
- Vendor record doesn't exist for this user
- User was created but vendors table wasn't updated

**Fix:**
1. Check that vendor_id was populated:
   ```sql
   SELECT id, user_id FROM vendors WHERE user_id = 'USER_ID';
   ```
2. If empty → Create vendor record:
   ```sql
   INSERT INTO vendors (user_id, business_name)
   VALUES ('USER_ID', 'Business Name');
   ```

---

### Scenario 2: "INSERT FAILED: 42501 - RLS violation"
```
❌ handleUploadDocument: ❌ INSERT FAILED: {
  "code": "42501",
  "message": "new row violates row level security policy"
}
```

**Cause:** RLS policy `vendors_upload_documents` denied the INSERT

**Check:**
1. User has correct role_id for vendor:
   ```sql
   SELECT id, role_id FROM users WHERE id = 'USER_ID';
   ```
2. Vendor role exists:
   ```sql
   SELECT id, name FROM roles WHERE name = 'vendor';
   ```
3. RLS policy allows INSERT for this role:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'vendor_documents'
   AND policyname = 'vendors_upload_documents';
   ```

---

### Scenario 3: "UPDATE FAILED: 42501 - RLS violation"
```
❌ handleUploadDocument: ❌ UPDATE FAILED: {
  "code": "42501",
  "message": "new row violates row level security policy"
}
```

**Cause:** RLS policy `vendors_update_own_documents` denied the UPDATE

**Check:**
1. Record exists and belongs to user:
   ```sql
   SELECT id, user_id, vendor_id
   FROM vendor_documents
   WHERE user_id = 'USER_ID';
   ```
2. RLS policy uses `auth.uid() = user_id`:
   ```sql
   SELECT definition FROM pg_policies
   WHERE tablename = 'vendor_documents'
   AND policyname = 'vendors_update_own_documents';
   ```

---

### Scenario 4: "No record found (PGRST116)" on load
```
❌ loadDocuments: No record found (PGRST116) - showing empty template
```

**After upload, this is WRONG!**

**Cause:**
1. INSERT appeared to work but record not actually saved
2. RLS policy allows INSERT but not SELECT
3. Different user_id being used on load vs upload

**Verify:**
1. Check if record exists in database:
   ```sql
   SELECT COUNT(*) FROM vendor_documents
   WHERE user_id = 'USER_ID';
   ```
2. If count = 0 → INSERT was silent failure
3. If count > 0 → SELECT RLS policy is blocking
   - Check `vendors_view_own_documents` policy
   - Ensure `auth.uid() = user_id` in policy

---

## 🧪 Quick Debug Test

Add this to browser console to test vendor upload:

```javascript
// Test 1: Check user context
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user.id);

// Test 2: Check if vendor record exists
const { data: vendor } = await supabase
  .from('vendors')
  .select('*')
  .eq('user_id', user.id)
  .single();
console.log('Vendor:', vendor);

// Test 3: Check if documents record exists
const { data: docs } = await supabase
  .from('vendor_documents')
  .select('*')
  .eq('user_id', user.id)
  .single();
console.log('Documents:', docs);

// Test 4: Try INSERT
const { data: insert, error: insertErr } = await supabase
  .from('vendor_documents')
  .insert({
    user_id: user.id,
    vendor_id: vendor.id,
    documents: {
      AADHAR: { status: 'pending', document_data: null }
    }
  })
  .select();
console.log('INSERT result:', insert, insertErr);
```

---

## 📊 Database Verification Query

Use this to check the actual state of data:

```sql
-- Complete diagnostic view
SELECT 
  u.id as user_id,
  u.email,
  u.role_id,
  v.id as vendor_id,
  v.business_name,
  vd.id as doc_record_id,
  vd.created_at,
  vd.updated_at,
  jsonb_object_keys(vd.documents) as document_types,
  -- Check each document
  (vd.documents->>'AADHAR')::JSONB->>'status' as aadhar_status,
  LENGTH((vd.documents->>'AADHAR')::JSONB->>'document_data') as aadhar_data_bytes,
  (vd.documents->>'PAN_CARD')::JSONB->>'status' as pan_status,
  LENGTH((vd.documents->>'PAN_CARD')::JSONB->>'document_data') as pan_data_bytes,
  vvs.overall_status,
  vvs.all_documents_submitted
FROM users u
LEFT JOIN vendors v ON u.id = v.user_id
LEFT JOIN vendor_documents vd ON u.id = vd.user_id
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.id = 'USER_ID';
```

---

## ✅ Successful Upload Signature

You'll know upload is working when you see this sequence:

```
1. Image picked: size > 10000 bytes
2. Fetch existing: PGRST116 (first time) or existingDocs: true
3. INSERT or UPDATE: error: null
4. ✅ SUCCESS marker in logs
5. loadDocuments: Retrieved all 4 types
6. At least one document: has data: true
7. UI updates: document appears in list
```

---

## Next Steps if Debugging Needed

1. **Export logs:**
   - Tap developer menu in app
   - Share console logs via email

2. **Check database directly:**
   - Run verification query above
   - Share SQL results

3. **Test RLS:**
   - Run browser console tests
   - Share error details

4. **Report to team:**
   - Include: User ID, error code, exact error message
   - Include: Steps to reproduce
   - Include: Console logs (filtered for "handleUploadDocument")

---

**Created:** 2024  
**Status:** Ready for vendor testing  
**Diagnostics:** Enhanced with detailed logging
