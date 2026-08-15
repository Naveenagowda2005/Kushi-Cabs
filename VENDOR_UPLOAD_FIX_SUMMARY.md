# Vendor Document Upload Issue - Complete Analysis & Fix

## Problem Summary
Vendors cannot upload documents to the app:
1. When vendors pick an image and try to upload, the app shows "Success" alert
2. But documents don't appear in the upload screen
3. Nothing is being saved to the database
4. Admin cannot see any documents in the verification dashboard

## Root Cause Analysis

### Why Documents Aren't Saving

The issue is likely one of three things:

1. **Missing Vendor Record**
   - Vendor must exist in `vendors` table before uploading documents
   - If vendor_id is NULL, the foreign key constraint fails silently
   - Documents table requires: `vendor_id` (not NULL, foreign key to vendors)

2. **RLS Policy Blocking Inserts**
   - Even though RLS policy `vendors_upload_documents` exists, it might not be working
   - Requires: `auth.uid() = user_id` AND proper Supabase session
   - If session context is missing, all INSERT operations fail silently

3. **vendor_documents Record Not Being Fetched After Insert**
   - After INSERT succeeds, `loadDocuments()` is called
   - But there's a race condition - the record might not be visible immediately
   - Or there's a RLS READ policy preventing the fetch

## Changes Made

### 1. Enhanced Logging in VendorDocumentUploadScreen.js (COMPLETED)

Added detailed console logs to track:
```javascript
// Before upload
console.log('handleUploadDocument: User ID:', user.id, 'Vendor ID:', vendorId);

// After fetch
console.log('handleUploadDocument: Fetch result - existingDocs:', !!existingDocs, 'fetchError:', fetchError?.code);

// Before INSERT/UPDATE
console.log('handleUploadDocument: INSERT payload:', { ...payload, documents: {...} });

// After INSERT/UPDATE
console.log('handleUploadDocument: INSERT result - error:', insertError, 'data:', insertData);
```

**What to Look For:**
- If `Vendor ID: null` → vendor record missing
- If `fetchError: PGRST116` → record doesn't exist (expected for first upload)
- If `INSERT result` shows an error → RLS or constraint violation
- If no "handleUploadDocument:" logs appear → function not being called

### 2. New Backend Diagnostic Endpoint (COMPLETED)

Added: `GET /admin/vendor-debug/:userId`

Returns complete diagnostic information:
```bash
curl http://192.168.1.110:4000/admin/vendor-debug/USER_ID
```

**Response includes:**
- ✅ User record status
- ✅ Vendor record (if exists)
- ✅ Vendor verification status
- ✅ Vendor documents records
- ✅ RLS policy test result (tries admin INSERT)

**If admin INSERT succeeds but user INSERT fails → RLS is blocking user**

## How to Diagnose

### Step 1: Check Frontend
1. Open app in debug/console mode
2. Vendor navigates to Upload Documents screen
3. Vendor selects image and uploads
4. Search console for: `handleUploadDocument:`
5. Collect the logs

### Step 2: Check Backend
1. Get the user_id from app (or logs)
2. Call diagnostic endpoint:
   ```bash
   curl http://192.168.1.110:4000/admin/vendor-debug/c1eee0f6-9538-49ef-a2c7-db007c3426ab
   ```
3. Check debug output

### Step 3: Identify Issue

**If debug shows:**
```
"vendor": { "error": "No rows found", "code": "PGRST116" }
```
→ **PROBLEM: Vendor record missing**
→ **FIX**: Create vendor record

**If debug shows:**
```
"vendor_documents": { "error": "No rows found", "code": "PGRST116" }
"rls_test_insert": { "success": true }
```
→ **PROBLEM: RLS blocking user INSERT**
→ **FIX**: Check RLS policies on vendor_documents table

**If debug shows:**
```
"rls_test_insert": { "success": true }
"vendor_documents": { "id": "...", "documents": {...} }
```
→ **SUCCESS**: Everything is set up correctly
→ **ISSUE**: Client-side RLS or session problem

## Database Fixes

### Fix 1: Create Missing Vendor Record
```sql
-- If vendor doesn't exist
INSERT INTO vendors (user_id, company_name, commission_pct)
VALUES ('USER_ID', 'Vendor Company', 15.0)
ON CONFLICT (user_id) DO NOTHING;
```

### Fix 2: Verify RLS Policies
```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'vendor_documents';

-- Should show:
-- - vendors_upload_documents (INSERT)
-- - vendors_update_own_documents (UPDATE)
-- - super_admins_view_all_vendor_documents (SELECT)
-- - vendors_view_own_documents (SELECT)
```

### Fix 3: Check RLS is Enabled
```sql
-- Verify table has RLS enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'vendor_documents';

-- Result should show: relrowsecurity = true
```

## Testing the Fix

After applying fixes:

1. **Vendor uploads document:**
   ```
   ✅ Check console for: "handleUploadDocument: INSERT result - error: null, data: [...]"
   ```

2. **Document appears in UI:**
   ```
   ✅ Document should show with status "pending"
   ✅ Progress bar should update
   ```

3. **All 4 documents uploaded:**
   ```
   ✅ Progress bar shows 4/4
   ✅ "Submit for Verification" button appears
   ```

4. **Submit for Verification:**
   ```
   ✅ Button shows loading state
   ✅ vendor_verification_status.overall_status = 'pending'
   ✅ Navigates to waiting screen
   ```

5. **Admin approves vendor:**
   ```
   ✅ Real-time update received by navigator
   ✅ Vendor automatically sees dashboard
   ✅ No need to refresh/logout
   ```

## Files Modified

1. **newtaxi/apps/unified/src/screens/vendor/VendorDocumentUploadScreen.js**
   - Added enhanced logging to `handleUploadDocument()`
   - Now shows full error details
   - Logs user_id, vendor_id, fetch result, insert/update result

2. **backend/routes/admin.js**
   - Added `/admin/vendor-debug/:userId` endpoint
   - Provides complete diagnostic information
   - Tests RLS policies with admin client

## Next Steps

1. **Verify frontend changes are loaded** (reload app)
2. **Test vendor document upload** with enhanced logs
3. **Call backend diagnostic endpoint** with user_id
4. **Apply database fixes** if needed
5. **Retest upload flow** end-to-end
6. **Verify admin dashboard** shows uploaded documents
7. **Test real-time approval** flow

## Commits Needed

```bash
git add -A
git commit -m "Fix vendor document upload: Add enhanced logging and diagnostic endpoint"
git push origin master
```
