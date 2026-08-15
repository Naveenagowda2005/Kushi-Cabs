# Storage Buckets Migration - Next Steps

✅ **COMPLETED:**
- 3 storage buckets created in Supabase: `driver-documents`, `user-avatars`, `vendor-documents`
- All code files created and ready
- Backend API endpoints ready

## STEP 1: Run Migration 101 in Supabase SQL Editor

1. Go to **https://app.supabase.com** → Your Project → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the entire SQL from `newtaxi/supabase/migrations/101_create_storage_buckets.sql`
4. Click **"Run"** (execute the query)

This will:
- ✅ Add `storage_path` and `document_url` columns to `driver_documents` table
- ✅ Add `avatar_storage_path` and `avatar_url` columns to `users` table
- ✅ Create indexes for faster lookups
- ✅ Enable RLS on storage buckets
- ✅ Create all RLS policies for the 3 buckets

**Wait for:** Query to complete successfully (check for green checkmark)

---

## STEP 2: Run Data Migration API Calls

Once migration 101 is applied, call these API endpoints from your backend to migrate existing base64 data:

### Call 1: Migrate Driver Documents
```
POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/migrate-documents
Headers:
  Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_TOKEN>
  Content-Type: application/json
```

**Expected response:**
```json
{
  "message": "Documents migration completed",
  "total": X,
  "success": X,
  "failed": 0,
  "results": [...]
}
```

### Call 2: Migrate User Avatars
```
POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/migrate-avatars
Headers:
  Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_TOKEN>
  Content-Type: application/json
```

**Expected response:**
```json
{
  "message": "Avatars migration completed",
  "total": X,
  "success": X,
  "failed": 0,
  "results": [...]
}
```

### Call 3: Check Migration Status
```
GET https://kushi-cabs-27p8.onrender.com/api/storage-migration/status
Headers:
  Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_TOKEN>
```

**Expected response:**
```json
{
  "documents": {
    "migratedToStorage": X,
    "stillInBase64": 0
  },
  "avatars": {
    "migratedToStorage": X,
    "stillInBase64": 0
  }
}
```

---

## STEP 3: Build New APK with Storage Support

Once all migrations are complete:

```bash
cd newtaxi/apps/unified
npx eas build -p android --wait
```

This will package all storage bucket integration code into the new APK.

---

## FILES CHANGED:

**Backend:**
- `backend/index.js` - Added storage migration routes
- `backend/routes/storage-migration.js` - Migration API endpoints

**Frontend:**
- `newtaxi/apps/unified/src/services/storageService.js` - Storage utilities
- `newtaxi/apps/unified/src/screens/vendor/AssignDriverScreen.js` - Updated to fetch from storage
- `newtaxi/apps/unified/src/screens/superadmin/AdminVerificationDashboard.js` - Updated to fetch from storage

**Database:**
- `newtaxi/supabase/migrations/101_create_storage_buckets.sql` - Migration file

---

## IMPORTANT:
- ⚠️ Do NOT commit yet - wait for all steps to complete
- 🔒 Keep SUPABASE_SERVICE_ROLE_TOKEN secret
- 📊 Verify migration status before building APK
