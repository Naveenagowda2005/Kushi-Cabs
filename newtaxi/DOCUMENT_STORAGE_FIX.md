# Document Storage Issue - Root Cause & Complete Fix

## Problem
Upload shows success but documents not stored. Error: `duplicate key value violates unique constraint`

## Root Cause Analysis

### Issue 1: Column Type Mismatch ⚠️ CRITICAL
**Problem**: Database schema defines `document_data` as `BYTEA` (binary), but code stores base64 strings (TEXT)

**Location**: `supabase/migrations/037_driver_documents_verification.sql` line 40
```sql
document_data BYTEA NOT NULL,  -- Binary data for the document
```

**Impact**: Type mismatch causes storage issues

**Solution**: Change column type from `BYTEA` to `TEXT`

### Issue 2: Upsert Not Working Properly
**Problem**: The delete-then-insert pattern wasn't working reliably

**Location**: `src/services/documentService.js`

**Impact**: Duplicate key constraint violations

**Solution**: Use proper upsert with `onConflict` parameter

## Complete Fix

### Step 1: Apply Migration 040 ✅

**File**: `supabase/migrations/040_fix_document_data_type.sql`

**What it does**:
- Changes `document_data` column from `BYTEA` to `TEXT`
- Recreates all triggers and functions
- Maintains data integrity

**How to apply**:

**Option A: Using Supabase CLI**
```bash
cd newtaxi
supabase db push
```

**Option B: Manual SQL**
1. Go to Supabase Dashboard → SQL Editor
2. Copy SQL from `APPLY_MIGRATION_040.md`
3. Run the query

### Step 2: Update Service Code ✅

**File**: `src/services/documentService.js`

**Changes**:
- Reverted to proper upsert pattern
- Uses `onConflict: 'driver_id,document_type'`
- Handles both insert and update cases

```javascript
const { data, error } = await supabase
  .from('driver_documents')
  .upsert(
    {
      driver_id: driverId,
      document_type: documentType,
      document_data: base64Data,
      document_name: imageData.fileName,
      document_mime_type: 'image/jpeg',
      status: 'pending',
    },
    { 
      onConflict: 'driver_id,document_type'
    }
  )
  .select()
  .single();
```

## Why This Works

### Before Fix
```
App sends base64 string (TEXT)
    ↓
Database expects BYTEA (binary)
    ↓
Type mismatch
    ↓
Storage fails silently
```

### After Fix
```
App sends base64 string (TEXT)
    ↓
Database column is TEXT
    ↓
Types match
    ↓
Upsert handles insert/update
    ↓
Document stored successfully
```

## Implementation Steps

### Step 1: Apply Migration (5 minutes)

**Using CLI**:
```bash
cd newtaxi
supabase db push
```

**Or manually in Supabase**:
- Go to SQL Editor
- Run SQL from APPLY_MIGRATION_040.md
- Wait for success

### Step 2: Restart App (2 minutes)

```bash
# Stop Expo
Ctrl+C

# Clear cache and restart
npx expo start --clear
```

### Step 3: Test Upload (5 minutes)

1. Sign up as driver
2. Upload a document
3. Check console for logs
4. Verify success alert
5. Check Supabase database

## Verification

### Check 1: Column Type
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'driver_documents' AND column_name = 'document_data';
```

Should show: `document_data | text`

### Check 2: Upload Success
Console should show:
```
uploadDocumentImage: Starting upload for DL driver: <id>
uploadDocumentImage: Base64 data length: 179844
uploadDocumentImage: Successfully uploaded DL
```

### Check 3: Database Storage
Supabase `driver_documents` table should have:
- `driver_id`: Your user ID
- `document_type`: DL
- `document_data`: Base64 string (starts with iVBORw0KGgo... for images)
- `status`: pending

## Expected Results

### ✅ Success Indicators
- Upload shows success alert
- No error in console
- Document appears in list
- Document in Supabase database
- Base64 data stored correctly

### ❌ Failure Indicators
- Error: "duplicate key value violates unique constraint"
- Error: "type mismatch"
- Document not in database
- Base64 data not stored

## Troubleshooting

### If Migration Fails

**Error: "Cannot drop function"**
- Some functions might not exist
- This is OK, continue

**Error: "Column type conversion failed"**
- Check if there's existing data
- Migration should handle it

**Solution**: Run migration again or check Supabase logs

### If Upload Still Fails

**Check 1: Verify Migration Applied**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'driver_documents' AND column_name = 'document_data';
```

Should show `text` not `bytea`

**Check 2: Clear App Cache**
```bash
npx expo start --clear
```

**Check 3: Check Console Logs**
Look for error messages in console

**Check 4: Verify User Authentication**
- User must be logged in
- User must have 'driver' role

### If Still Not Working

1. Check Supabase logs for errors
2. Verify RLS policies are correct
3. Run debug script: `debug-document-upload.js`
4. Check network connection

## Files Modified

| File | Changes | Status |
|------|---------|--------|
| `supabase/migrations/040_fix_document_data_type.sql` | NEW - Fix column type | ✅ |
| `src/services/documentService.js` | Use proper upsert | ✅ |

## Timeline

| Step | Time | Action |
|------|------|--------|
| 1 | 5 min | Apply migration 040 |
| 2 | 2 min | Restart app |
| 3 | 5 min | Test upload |
| 4 | 2 min | Verify database |
| **Total** | **14 min** | **Complete** |

## Success Criteria

All of the following must be true:

1. **Migration Applied**
   - [ ] Column type changed to TEXT
   - [ ] Triggers recreated
   - [ ] No errors in migration

2. **Upload Works**
   - [ ] No error in console
   - [ ] Success alert shown
   - [ ] Document in list

3. **Database Storage**
   - [ ] Document in driver_documents table
   - [ ] Base64 data present
   - [ ] Status is pending

## Next Steps

1. **Apply Migration 040**
   - Use Supabase CLI or manual SQL
   - Verify success

2. **Restart App**
   - Stop Expo
   - Clear cache
   - Start again

3. **Test Upload**
   - Sign up as driver
   - Upload document
   - Check console and database

4. **Continue Testing**
   - Upload all 6 documents
   - Submit for verification
   - Test admin approval
   - Test login

## Support

For issues:
1. Check console logs
2. Verify migration applied
3. Check column type in database
4. Review this document
5. Run debug script

---

**Status**: Ready to apply migration
**Next Action**: Apply migration 040
**Estimated Time**: 14 minutes
