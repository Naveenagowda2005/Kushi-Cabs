# Expected Console Logs for Vendor Approval Flow

## ✅ ADMIN SIDE (When Approving Last Document)

Look for these logs in order:

```
✅ vendor_documents updated, checking if all required docs are approved...
📋 Required docs check:
  AADHAR: approved
  PAN_CARD: approved
  BANK_PASSBOOK_FRONT: approved
  VENDOR_SELFIE: approved
🎉 All REQUIRED documents are approved! Updating overall_status to approved...
📊 vendor.user_id: [uuid-here]
📊 vendor.vendor_id: [uuid-here]
✅ vendor_verification_status record exists, updating...
✅ Status update response: [{...vendor_verification_status_record...}]
✅ Update returned 1 records
✅ Users table updated
Success: "[DocumentType] approved - Vendor application approved!"
```

**If any of above logs are missing**, check what error appears instead.

---

## ✅ VENDOR SIDE (Polling Detection)

Look for these logs in vendor console (check every 1-2 seconds):

**Before Approval:**
```
VendorNavigator: Status from DB: pending ✅
VendorNavigator: FULL RECORD: {"user_id":"...", "overall_status": "pending", ...}
```

**After Approval (polling will detect within 1 second):**
```
VendorNavigator [Check #45]: Status = approved, Approved = [timestamp], Submitted = [timestamp]
VendorNavigator [Check #45]: Complete record: {..., "overall_status": "approved", "approved_at": "[timestamp]"}
VendorNavigator: ✅ Status CHANGED from pending to approved ✅
```

**Alert Will Show:**
```
Alert: "Approved!"
Alert Message: "Your account has been approved by the admin. You can now access all features."
```

**After Clicking OK:**
```
Navigation reset to: VendorHome (dashboard)
```

---

## ❌ TROUBLESHOOTING - If You Don't See Expected Logs

### Admin Side Issues

**Log shows**: `❌ Error updating vendor_documents: [error]`
- Vendor documents record doesn't exist or user_id is wrong
- Check database: `SELECT * FROM vendor_documents WHERE user_id = 'YOUR_ID'`

**Log shows**: `⚠️ vendor_verification_status record does not exist, creating...`
- This is actually OK! System will create it
- If it shows error after this: RLS or permissions issue

**Log shows**: `❌ Error updating status: [error]`
- Likely an RLS policy issue
- Check RLS policies on vendor_verification_status table

**Log shows**: `⚠️ Warning: Update query returned no records.`
- Update query didn't match any records
- Check that user_id exists in vendor_verification_status table
- Try manual update: `UPDATE vendor_verification_status SET overall_status = 'approved' WHERE user_id = 'UUID'`

### Vendor Side Issues

**Log shows**: `VendorNavigator: No verification record found for user [uuid]`
- vendor_verification_status table doesn't have a record for this user
- Admin needs to approve documents first to create record
- OR manually create it

**Log shows**: `VendorNavigator: vendor_verification_status table not created yet`
- Migration 051 didn't run
- Run migrations in Supabase

**Log shows**: `VendorNavigator: Status from DB: pending ✅` (but it's been 5+ minutes)
- Admin hasn't updated database yet
- OR polling isn't working properly
- Try clicking "Check Status" button manually

**No "✅ Status CHANGED" log appearing**
- Status hasn't actually changed in database
- Check database directly: `SELECT overall_status FROM vendor_verification_status WHERE user_id = 'UUID'`

---

## 📊 Database State Check

Run this SQL to see current state:

```sql
SELECT 
  u.id,
  u.full_name,
  u.phone,
  u.verification_status,
  vvs.overall_status,
  vvs.approved_at,
  vvs.submitted_at,
  vvs.created_at
FROM users u
LEFT JOIN vendor_verification_status vvs ON u.id = vvs.user_id
WHERE u.role = 'vendor'
ORDER BY vvs.updated_at DESC NULLS LAST
LIMIT 10;
```

Expected values after approval:
- `u.verification_status` = 'approved' ✅
- `vvs.overall_status` = 'approved' ✅
- `vvs.approved_at` = some timestamp ✅
- `vvs.submitted_at` = some timestamp ✅

---

## 🔍 Document Status Check

Check if documents are actually marked as approved:

```sql
SELECT 
  vd.user_id,
  u.full_name,
  vd.documents
FROM vendor_documents vd
JOIN users u ON vd.user_id = u.id
WHERE u.role = 'vendor'
ORDER BY vd.updated_at DESC
LIMIT 1;
```

Expected `documents` JSONB structure:
```json
{
  "AADHAR": {"status": "approved", "document_data": "...", "approved_at": "..."},
  "PAN_CARD": {"status": "approved", "document_data": "...", "approved_at": "..."},
  "BANK_PASSBOOK_FRONT": {"status": "approved", "document_data": "...", "approved_at": "..."},
  "VENDOR_SELFIE": {"status": "approved", "document_data": "...", "approved_at": "..."}
}
```

If any status is still "pending" → Admin hasn't approved all documents yet.

---

## 🛠️ Quick Fixes

### Issue: Documents show "approved" in UI but overall_status still "pending"

**Run this:**
```sql
UPDATE vendor_verification_status
SET overall_status = 'approved', verified_at = NOW(), approved_at = NOW()
WHERE user_id = (
  SELECT user_id FROM vendor_documents 
  WHERE documents->'AADHAR'->>'status' = 'approved'
  AND documents->'PAN_CARD'->>'status' = 'approved'
  AND documents->'BANK_PASSBOOK_FRONT'->>'status' = 'approved'
  AND documents->'VENDOR_SELFIE'->>'status' = 'approved'
);
```

Then vendor will see approval alert on next poll (1 second).

---

**Last Updated**: June 5, 2026  
**For Support**: Check these logs in order and match against troubleshooting section
