# Fix Storage Bucket RLS to Enable Document Listing

## Problem
- Documents are uploading to the bucket successfully ✅
- But the app can't LIST files from the bucket ❌
- Cause: RLS (Row Level Security) policies are blocking list operations

## Solution: Disable RLS on driver-documents Bucket

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project
3. Go to **Storage** section (left sidebar)

### Step 2: Access driver-documents Bucket
1. Click on the **driver-documents** bucket
2. You should see the files you uploaded: `DL.jpg`, `VEHICLE_FRONT.jpg`, etc.

### Step 3: Disable RLS
1. In the bucket view, click the **Policies** tab
2. Look for the toggle: "RLS is [ON/OFF]"
3. If it's ON (enabled), click to turn it OFF
4. Confirm the action

### Step 4: Make Bucket Public
1. Go to bucket **Settings**
2. Look for "Access Control" or "Public"
3. Make sure the bucket is set to PUBLIC (not private)
4. This allows anyone with the public URL to view documents

### Step 5: Verify and Test
1. Upload a document again in the app
2. Check the logs - should see:
   - `✅ Uploaded via Backend API: https://...`
   - `getDriverAllDocuments: Found N files in bucket`
   - `loadDocuments: ✅ Found uploaded document for DL`
3. The document should show as "Uploaded - Pending Review"

## What This Fixes
- ✅ App can LIST files from bucket
- ✅ App can view document URLs
- ✅ Documents display as "Uploaded" instead of "Not Uploaded"
- ✅ No need to store anything in database

## Repeat for Other Buckets
Also disable RLS on:
- **vendor-documents** bucket
- **user-avatars** bucket

---

## Troubleshooting

**Still seeing "Not Uploaded"?**
1. Check browser/app console logs for errors
2. Verify `getDriverAllDocuments: Found N files` appears
3. Check Supabase Dashboard to confirm bucket is PUBLIC and RLS is OFF

**Files still creating duplicates?**
1. Clear old files from bucket manually
2. Upload fresh document
3. Should only create one file: `DL.jpg` (not `DL_timestamp.jpg`)

**Backend upload failing?**
1. Check backend is running: `PORT=4000 node backend/index.js`
2. Verify correct IP in `.env`: `EXPO_PUBLIC_BACKEND_URL='http://192.168.1.114:4000'`
3. Check backend logs for upload errors
