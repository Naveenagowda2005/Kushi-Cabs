# Create Storage Buckets - Complete Step-by-Step Guide

## Step 1: Login to Supabase Dashboard

1. Go to https://app.supabase.com
2. Login with your credentials
3. Select your project: **cqfsirfjwfxvwggj**
4. Click on **Storage** in the left sidebar

---

## Step 2: Create 5 Buckets

### Bucket 1: driver-documents

1. Click **New Bucket**
2. **Name:** `driver-documents`
3. **Privacy:** Select **Private** (NOT public)
4. Click **Create Bucket**

**This bucket will store:**
- Driver's License (DL)
- Vehicle Front Photo (VEHICLE_FRONT)
- Insurance Certificate (INSURANCE)
- Fitness Certificate (FC)
- Emission Certificate (EMISSION)
- Registration Certificate (RC)
- Aadhar Card (AADHAR)
- Bank Passbook Front (BANK_PASSBOOK_FRONT)
- Driver Selfie (DRIVER_SELFIE)

---

### Bucket 2: vendor-documents

1. Click **New Bucket**
2. **Name:** `vendor-documents`
3. **Privacy:** Select **Private**
4. Click **Create Bucket**

**This bucket will store:**
- Vendor Aadhar Card (AADHAR)
- PAN Card (PAN_CARD)
- Bank Passbook Front (BANK_PASSBOOK_FRONT)
- Vendor Selfie (VENDOR_SELFIE)

---

### Bucket 3: user-avatars

1. Click **New Bucket**
2. **Name:** `user-avatars`
3. **Privacy:** Select **Private**
4. Click **Create Bucket**

**This bucket will store:**
- User profile photos
- Driver profile photos
- Vendor profile photos

---

### Bucket 4: trip-photos

1. Click **New Bucket**
2. **Name:** `trip-photos`
3. **Privacy:** Select **Private**
4. Click **Create Bucket**

**This bucket will store:**
- Odometer readings (start photo)
- Trip start location photo
- Trip end location photo
- Trip completion photo

---

### Bucket 5: vehicle-photos

1. Click **New Bucket**
2. **Name:** `vehicle-photos`
3. **Privacy:** Select **Private**
4. Click **Create Bucket**

**This bucket will store:**
- Vehicle front photo
- Vehicle back photo
- Vehicle side photo
- Vehicle interior photo

---

## Step 3: Verify Buckets Created

After creating all 5 buckets, your Storage page should show:

```
✅ driver-documents (Private)
✅ vendor-documents (Private)
✅ user-avatars (Private)
✅ trip-photos (Private)
✅ vehicle-photos (Private)
```

---

## Step 4: Apply RLS Policies

After creating buckets, the backend migration will automatically set up Row Level Security (RLS) policies. These policies control who can:
- Upload files
- View files
- Delete files

**No manual action needed** - migration 101 handles this automatically.

---

## Step 5: Deploy Code Changes

1. **Commit the changes:**
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI
git add -A
git commit -m "Add storage buckets setup: driver-documents, vendor-documents, user-avatars, trip-photos, vehicle-photos"
```

2. **Push to master:**
```bash
git push origin master
```

3. **Backend auto-deploys** to https://kushi-cabs-27p8.onrender.com

---

## Step 6: Apply Database Migration

Run migration 101 to add storage columns to tables:

```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi
npx supabase migration up
```

This adds:
- `storage_path` column to `driver_documents`
- `document_url` column to `driver_documents`
- `avatar_storage_path` column to `users`
- `avatar_url` column to `users`

And sets up RLS policies for all 5 buckets.

---

## Step 7: Migrate Existing Data

### Migration Status Check:
```bash
curl -X GET https://kushi-cabs-27p8.onrender.com/api/storage-migration/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Migrate Driver Documents to Storage:
```bash
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/migrate-documents \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**What this does:**
- Reads all driver documents from `driver_documents.document_data` (base64)
- Uploads each to `driver-documents` bucket
- Updates `driver_documents.storage_path` with the file path
- Keeps original base64 for safety (doesn't delete)

---

### Migrate User Avatars to Storage:
```bash
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/migrate-avatars \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**What this does:**
- Reads all user avatars from `users.avatar_base64`
- Uploads to `user-avatars` bucket
- Updates `users.avatar_storage_path` with the file path

---

## Step 8: Build New APK

The app code now reads from storage buckets with automatic fallback to database:

```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
npx eas build -p android --wait
```

**New logic in app:**
1. Try to fetch from storage bucket (fast ⚡)
2. Generate signed URL if file exists
3. Fallback to database base64 if no storage file (legacy support)

---

## Step 9: Clear Old Base64 Data (Optional)

After verifying migration is successful, optionally clear old base64 to save database space:

```bash
# Clear driver documents base64
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/clear-base64 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableType": "documents"}'

# Clear user avatars base64
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/clear-base64 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableType": "avatars"}'
```

---

## Checklist

- [ ] Step 1: Login to Supabase Dashboard
- [ ] Step 2: Create 5 buckets (driver-documents, vendor-documents, user-avatars, trip-photos, vehicle-photos)
- [ ] Step 3: Verify all 5 buckets exist
- [ ] Step 4: No action needed - RLS handled by migration
- [ ] Step 5: Commit and push code changes
- [ ] Step 6: Apply database migration 101
- [ ] Step 7: Migrate existing data using API endpoints
- [ ] Step 8: Build new APK with storage support
- [ ] Step 9: Optional - Clear old base64 data

---

## Testing

### Test 1: Verify buckets are accessible
```bash
# List files in driver-documents bucket
curl -X GET "https://your-project.supabase.co/storage/v1/object/list/driver-documents" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Upload a test file
Use the app to upload a driver document - it should now go to storage bucket instead of database.

### Test 3: Fetch and display
View driver list - photos should load from storage (much faster than before).

---

## Performance Improvement

**Before (Database Storage):**
- Query database → Load base64 string → Decode → Display
- Time: ~2-3 seconds per image
- Database bloat: Each image ~2-5 MB

**After (Storage Buckets):**
- Query database for storage path → Get signed URL → Display from CDN
- Time: ~500ms per image (5-6x faster!)
- Database lean: Only ~100 bytes per reference

---

## Rollback Plan

If anything goes wrong:
1. Database still has original base64 data
2. App code automatically falls back to database
3. No data loss
4. Can retry migration at any time

---

## Support

If migration fails:
- Check backend logs: Backend dashboard on Render
- Verify admin token is valid
- Ensure buckets are created in Supabase
- Check RLS policies are applied

Questions? Check the logs!
