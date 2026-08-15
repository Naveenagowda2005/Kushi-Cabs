# Fix Applied: Show Old Images & Documents

## Issue
Previous images and documents stored as base64 in database were not showing in AdminVerificationDashboard because the query was not fetching the `document_data` column.

## Root Cause
In AdminVerificationDashboard.js, the line:
```javascript
.select('id, driver_id, document_type, status, created_at, document_mime_type, verified_at, verified_by, rejection_reason')
```

This was missing:
- `storage_path` - Path to migrated files in storage
- `document_url` - Public URL for migrated files
- `document_data` - Base64 data for old unmigrated files

## Fix Applied
Updated the query to include ALL needed columns:

```javascript
.select('id, driver_id, document_type, status, created_at, document_mime_type, verified_at, verified_by, rejection_reason, storage_path, document_url, document_data')
```

## What This Means
Now the screen will:

1. ✅ Show migrated images from storage (via storage_url or storage_path)
2. ✅ Show old base64 images from database (fallback)
3. ✅ Automatically use the faster storage version if available
4. ✅ Fall back to database base64 for unmigrated data

## Technical Details

The `handleViewDocument` function already has proper fallback logic:

```javascript
if (document.storage_path) {
  // Try to get from storage first (fast)
} else {
  // Fallback to database base64 (slow but works)
}
```

Now that we're fetching `document_data`, the fallback will work!

## Files Changed
- `newtaxi/apps/unified/src/screens/superadmin/AdminVerificationDashboard.js`
  - Updated document query to include all columns needed for both storage and database fallback

## Testing
After this fix, you should see:
- ✅ All old documents displaying in AdminVerificationDashboard
- ✅ New documents showing from storage (after migration)
- ✅ Proper fallback logic working

## Next Steps
1. Build new APK with this fix
2. Test that old documents show
3. Run migration to move data to storage
4. Verify migrated documents still show (now from storage instead of database)
