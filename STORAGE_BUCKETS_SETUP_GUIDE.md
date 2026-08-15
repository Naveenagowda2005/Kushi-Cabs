# Storage Buckets Setup Guide

## Overview
Move images and documents from database (base64 storage) to Supabase Storage buckets for better performance and scalability.

**Benefits:**
- ✅ Faster file retrieval (CDN optimized)
- ✅ Reduced database size
- ✅ Better bandwidth management
- ✅ Easier image optimization/compression
- ✅ Scalable file storage

---

## Step 1: Create Storage Buckets

### Via Supabase Dashboard:
1. Go to https://app.supabase.com/project/cqfsirfjwfxvwggjkrvd
2. Navigate to **Storage** > **Buckets**
3. Create these 4 buckets (all **PRIVATE**, not public):

```
Bucket 1: driver-documents
- Purpose: Driver's License, RC, Insurance, FC, Aadhar, etc.
- Privacy: Private
- File Types: JPG, PNG, PDF

Bucket 2: user-avatars
- Purpose: User profile photos
- Privacy: Private (but readable by authenticated users)
- File Types: JPG, PNG, WebP

Bucket 3: trip-photos
- Purpose: Odometer readings, trip start/end photos
- Privacy: Private
- File Types: JPG, PNG

Bucket 4: vehicle-photos
- Purpose: Vehicle front/back/side photos
- Privacy: Private
- File Types: JPG, PNG, WebP
```

---

## Step 2: Apply Database Migration

Run the storage migration SQL:

```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi
npx supabase migration up

# Or manually run:
# - supabase/migrations/101_create_storage_buckets.sql
```

This creates:
- RLS policies for each bucket
- Helper functions for signed URLs
- storage_path columns in tables

---

## Step 3: Install Files

The following new files are created:
- `newtaxi/apps/unified/src/services/storageService.js` - Client library
- `backend/routes/storage-migration.js` - Backend migration service

---

## Step 4: Update Backend Server

Add storage migration routes to your backend:

```javascript
// In backend/index.js or main server file

const storageMigration = require('./routes/storage-migration');

// Add routes
app.use('/api/storage-migration', storageMigration);
```

---

## Step 5: Migrate Existing Data

### Check Migration Status:
```bash
curl -X GET https://kushi-cabs-27p8.onrender.com/api/storage-migration/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Migrate Documents:
```bash
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/migrate-documents \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Migrate Avatars:
```bash
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/migrate-avatars \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**This will:**
1. Read all base64 data from database
2. Upload to appropriate storage bucket
3. Update database with storage_path
4. Keep original base64 data (for safety)

---

## Step 6: Update Application Code

### Upload Driver Document (Example):

**OLD (Database):**
```javascript
const base64Data = await capturePhotoAsBase64();
const { error } = await supabase
  .from('driver_documents')
  .insert({
    user_id: userId,
    document_type: 'DL',
    document_data: base64Data, // Stored in table
  });
```

**NEW (Storage):**
```javascript
import { uploadDriverDocument } from '../services/storageService';

const photoUri = await capturePhotoUri(); // Local file path
const result = await uploadDriverDocument(
  userId,
  photoUri,
  'DL',
  'image/jpeg'
);

// result = { path: 'user-id/DL_timestamp.jpg', url: 'https://...', ... }

// Store reference in database
const { error } = await supabase
  .from('driver_documents')
  .insert({
    user_id: userId,
    document_type: 'DL',
    storage_path: result.path, // Reference to storage
    document_url: result.url, // Public/signed URL
  });
```

### Upload User Avatar (Example):

**OLD:**
```javascript
const avatarBase64 = await pickImageAsBase64();
const { error } = await supabase
  .from('users')
  .update({ avatar_base64: avatarBase64 })
  .eq('id', userId);
```

**NEW:**
```javascript
import { uploadUserAvatar } from '../services/storageService';

const avatarUri = await pickImageUri();
const result = await uploadUserAvatar(userId, avatarUri, 'image/jpeg');

const { error } = await supabase
  .from('users')
  .update({
    avatar_storage_path: result.path,
    avatar_url: result.url,
  })
  .eq('id', userId);
```

### Display Images (Example):

**OLD:**
```javascript
<Image 
  source={{ uri: `data:image/jpeg;base64,${user.avatar_base64}` }}
  style={styles.avatar}
/>
```

**NEW:**
```javascript
// Direct public URL (if public bucket)
<Image 
  source={{ uri: user.avatar_url }}
  style={styles.avatar}
/>

// Or use signed URL for private buckets
import { getSignedUrl } from '../services/storageService';
const signedUrl = await getSignedUrl('user-avatars', user.avatar_storage_path);
<Image 
  source={{ uri: signedUrl }}
  style={styles.avatar}
/>
```

---

## Step 7: Update Tables

Add new columns to track storage paths:

```sql
-- Already done by migration 101, but here's what was added:

ALTER TABLE driver_documents
ADD COLUMN storage_path TEXT COMMENT 'Path to document in driver-documents bucket';

ALTER TABLE users
ADD COLUMN avatar_storage_path TEXT COMMENT 'Path to avatar in user-avatars bucket';

-- Optional: Add columns for public URLs
ALTER TABLE driver_documents
ADD COLUMN document_url TEXT COMMENT 'Public URL for document';

ALTER TABLE users
ADD COLUMN avatar_url TEXT COMMENT 'Public URL for avatar';
```

---

## RLS Policies Applied

### Driver Documents:
- ✅ Users can upload their own documents
- ✅ Users can view their own documents
- ✅ Super admin can view/delete all documents

### User Avatars:
- ✅ Users can upload/update/delete their own avatar
- ✅ Authenticated users can view avatars

### Trip Photos:
- ✅ Vendors and drivers can upload
- ✅ Authorized users can view

### Vehicle Photos:
- ✅ Vendors can upload
- ✅ Authorized users can view

---

## Storage Service API Reference

```javascript
import {
  uploadFile,           // Generic upload
  downloadFile,         // Download to device
  getSignedUrl,        // Temporary access URL
  getPublicUrl,        // Public URL
  deleteFile,          // Delete from storage
  uploadDriverDocument,
  uploadUserAvatar,
  uploadTripPhoto,
  uploadVehiclePhoto,
  listFiles,
  validateFile,
  STORAGE_BUCKETS,
} from '../services/storageService';

// Upload a file
const result = await uploadFile(
  'bucket-name',
  'file:///local/path',
  'filename.jpg',
  { userId, mimeType: 'image/jpeg' }
);
// Returns: { path, url, bucket, fileName }

// Get signed URL (for private files, expires in 1 hour)
const url = await getSignedUrl('driver-documents', 'user-id/DL_123.jpg');

// Get public URL
const url = getPublicUrl('user-avatars', 'user-id/avatar_123.jpg');

// Delete file
await deleteFile('bucket-name', 'path/to/file.jpg');

// Validate before upload
const validation = await validateFile('file:///path', 'avatar');
if (!validation.valid) {
  console.error(validation.error);
}

// List files in directory
const files = await listFiles('driver-documents', 'user-id/');
```

---

## Performance Comparison

### Before (Database Storage):
```
- Document size: ~2-5 MB (base64)
- Query time: Database query + base64 decode
- Bandwidth: Full file downloaded to client
- Storage: Takes up database space (expensive)
```

### After (Cloud Storage):
```
- Document size: ~2-5 MB (compressed)
- Query time: Direct CDN + optional image optimization
- Bandwidth: CDN edge cache + compression
- Storage: Separate from database (cheaper)
```

**Expected improvement:** 3-5x faster file loading

---

## Optional: Clear Old Base64 Data

After verifying migration is complete, clear base64 columns:

```bash
# Check status first
curl -X GET https://kushi-cabs-27p8.onrender.com/api/storage-migration/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# If successful, clear documents
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/clear-base64 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableType": "documents"}'

# Clear avatars
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/clear-base64 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableType": "avatars"}'
```

This will:
- Reduce database size significantly
- Save on storage costs
- Keep backup of data in storage buckets

---

## Troubleshooting

### Files not uploading?
- Check file size limits (Avatar: 5MB, Document: 10MB, Photo: 15MB)
- Verify MIME types are allowed
- Check RLS policies in Supabase Dashboard

### Signed URLs not working?
- Make sure bucket is PRIVATE
- Check token expiration (default 1 hour)
- Verify user has proper permissions

### Migration failing?
- Check backend logs: `pm2 logs app`
- Verify admin token is valid
- Ensure buckets exist in Supabase

### Old base64 queries slow?
- Run migration to move to storage
- Check database indexes
- Consider archiving old data

---

## Testing

### Test Upload (Frontend):
```javascript
import { uploadUserAvatar } from '../services/storageService';

async function testAvatarUpload() {
  try {
    // Pick an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.cancelled) return;

    // Upload to storage
    const uploadResult = await uploadUserAvatar(
      'test-user-id',
      result.uri,
      'image/jpeg'
    );

    console.log('✅ Upload successful:', uploadResult);
    // { path, url, bucket, fileName }
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}
```

### Test Download (Backend):
```javascript
const fs = require('fs');
const supabase = require('@supabase/supabase-js');

async function testDownload() {
  const { data, error } = await supabase.storage
    .from('driver-documents')
    .download('user-id/DL_123.jpg');

  if (error) throw error;

  fs.writeFileSync('test-download.jpg', data);
  console.log('✅ Downloaded successfully');
}
```

---

## Summary

| Step | Task | Status |
|------|------|--------|
| 1 | Create 4 buckets in Supabase Dashboard | ⚪ TODO |
| 2 | Apply migration 101 | ⚪ TODO |
| 3 | Files already created | ✅ DONE |
| 4 | Add routes to backend | ⚪ TODO |
| 5 | Migrate existing data | ⚪ TODO |
| 6 | Update app code | ⚪ TODO |
| 7 | Test uploads/downloads | ⚪ TODO |
| 8 | Clear old base64 data | ⚪ TODO |

---

## Questions?

- Storage API: https://supabase.com/docs/guides/storage
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- This guide covers the entire setup process
