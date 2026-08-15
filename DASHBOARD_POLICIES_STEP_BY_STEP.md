# Dashboard Policies - Step by Step with Screenshots Guide

## Overview

This guide walks you through creating RLS policies for the odometer-images bucket using Supabase Dashboard.

**Time**: 5-10 minutes  
**Difficulty**: Very Easy  
**Prerequisites**: Access to Supabase project

---

## Step 1: Login to Supabase

**URL**: https://app.supabase.com/

1. Enter your email
2. Enter your password
3. Click "Sign In"

---

## Step 2: Select Your Project

1. You should see a list of projects
2. Find the **TAXI** project
3. Click on it

You're now in your Supabase project dashboard.

---

## Step 3: Navigate to Storage

1. Look at the **left sidebar** (dark panel)
2. Find **"Storage"** option
3. Click on it

You should now see your storage buckets.

---

## Step 4: Open odometer-images Bucket

1. In the main panel, look for **"odometer-images"**
2. Click on it to open

You should see a folder structure (currently empty unless images have been uploaded).

---

## Step 5: Access Policies

Look for one of these options:

**Option A**: Tab at top
- Look for a **"Policies"** tab
- Click it

**Option B**: Gear icon/Menu
- Look for **gear icon** ⚙️ or **three dots** ⋮
- Click it
- Select **"Edit RLS policies"** or **"Policies"**

You should now see a policies editor panel.

---

## Step 6: Create Policy 1 - Upload

### If "Add Policy" button visible:

1. Click **"Add Policy"** or **"New Policy"** button
2. A form should appear

### Fill in the form:

| Field | Value |
|-------|-------|
| **Policy Name** | `Authenticated users can upload odometer images` |
| **Allowed operation** | SELECT "INSERT" (or "Upload") |
| **Target roles** | SELECT "authenticated" |
| **Condition** | `bucket_id = 'odometer-images'` |

### Save:
1. Click **"Save"** or **"Create"** button
2. Wait for confirmation (usually says "Policy created")

---

## Step 7: Create Policy 2 - Public Read

1. Click **"Add Policy"** again

### Fill in the form:

| Field | Value |
|-------|-------|
| **Policy Name** | `Anyone can view odometer images` |
| **Allowed operation** | SELECT "SELECT" (or "Read") |
| **Target roles** | SELECT "public" (not authenticated, PUBLIC) |
| **Condition** | `bucket_id = 'odometer-images'` |

### Save:
1. Click **"Save"** or **"Create"**
2. Wait for confirmation

---

## Step 8: Create Policy 3 - Authenticated Read

1. Click **"Add Policy"** again

### Fill in the form:

| Field | Value |
|-------|-------|
| **Policy Name** | `Authenticated users can view odometer images` |
| **Allowed operation** | SELECT "SELECT" (or "Read") |
| **Target roles** | SELECT "authenticated" |
| **Condition** | `bucket_id = 'odometer-images'` |

### Save:
1. Click **"Save"** or **"Create"**
2. Wait for confirmation

---

## Step 9: Create Policy 4 - Delete Own

1. Click **"Add Policy"** again

### Fill in the form:

| Field | Value |
|-------|-------|
| **Policy Name** | `Users can delete their own odometer images` |
| **Allowed operation** | SELECT "DELETE" |
| **Target roles** | SELECT "authenticated" |
| **Condition** | `bucket_id = 'odometer-images' AND owner_id = auth.uid()` |

### Save:
1. Click **"Save"** or **"Create"**
2. Wait for confirmation

---

## Step 10: Verify All Policies Created

After Step 9, you should see a list showing:

```
✓ Authenticated users can upload odometer images (INSERT)
✓ Anyone can view odometer images (SELECT - public)
✓ Authenticated users can view odometer images (SELECT - authenticated)
✓ Users can delete their own odometer images (DELETE)
```

**If you see these 4**: Great! ✅ Proceed to Step 11.

**If policies are missing**: 
- Try refreshing the page (F5)
- If still missing, try creating them again

---

## Step 11: Close Policy Editor

1. Look for a **"Save"**, **"Apply"**, or **"Done"** button at the top or bottom
2. Click it to apply all policies
3. Wait for success message

You should see: "Policies updated successfully" or similar

---

## Step 12: Verify Policies Are Active

1. Stay on the Storage → odometer-images page
2. Look for policy status (should show all as "Active" or "Enabled")
3. If all 4 show as active: ✅ **Policies are working**

---

## Step 13: Restart Services

Open two terminal windows:

### Terminal 1: Restart Backend

```bash
# Press Ctrl+C to kill existing process (if running)
# Then run:
cd backend
npm start

# Expected output:
# Server listening on http://192.168.1.114:4000
```

### Terminal 2: Restart Frontend

```bash
# Press Ctrl+C to kill existing process (if running)
# Then run:
cd apps/unified
npm start

# Follow prompts:
# Press 'a' for Android or 'i' for iOS
# Or open Expo Go app on your phone
```

---

## Step 14: Test Upload

### On Driver App:

1. **Login** with driver account
   - Phone: (any driver phone)
   - OTP: (use 123456 if in test mode)

2. **Go to Active Trip**
   - Look for a trip assigned by vendor
   - Or create a test trip as admin

3. **Find Odometer Upload**
   - Look for button like "Upload Start Odometer"
   - Or "Take Start Photo"

4. **Click Upload**
   - Take a photo or choose from library
   - Tap "Use" or "Save"

5. **Expected Result**: ✅ Image uploads, displays in app

6. **Error Result**: ❌ If you see "RLS policy" error:
   - Go back to Step 5-10
   - Make sure all 4 policies are created
   - Refresh dashboard and try again

---

## Step 15: Verify in Database

### In Supabase Dashboard:

1. Go to **"SQL Editor"**
2. Paste this query:

```sql
SELECT 
  id,
  trip_number,
  start_odometer_image
FROM public.trips
WHERE start_odometer_image IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```

3. Click **"Run"**

### Expected Output:

```
id           | trip_number | start_odometer_image
-------------|-------------|-----------------------------------------------------
abc123def    | TRX-2026-001 | https://xyz.supabase.co/storage/v1/object/public/...
```

### If you see:
- ✅ **URL**: Upload worked correctly
- ❌ **NULL**: Upload failed, try again
- ❌ **Long base64**: Upload went to database (wrong), should be URL

---

## Step 16: Test Image Loads

1. Copy the URL from database query result (Step 15)
2. Open new browser tab
3. Paste the URL and press Enter
4. **Expected**: Image displays
5. **If 403 error**: 
   - Go back to Step 7 (Policy 2)
   - Make sure "public" role is selected (not "authenticated")
   - Save and try again

---

## Troubleshooting This Process

### "Can't find Storage option"
- Make sure you're in the correct project (top left)
- Try refreshing page (F5)
- Look for storage icon 📦 in sidebar

### "Can't find odometer-images bucket"
- Bucket should exist from migration 109
- Try refreshing page
- If still missing, create bucket: name = "odometer-images", public = true

### "Can't find Policies section"
- Try clicking on bucket name again
- Look for gear ⚙️ or three dots ⋮ menu
- Try right-clicking on bucket

### "Policy save failed"
- Check you have admin role
- Try again
- If error persists, check Supabase status page

### "Upload still fails after policies"
- Hard refresh app: `npm start -- --reset-cache`
- Log out and log back in
- Try upload again
- If still fails, check database if URL was saved

---

## Success = Seeing This

```
Dashboard → Storage → odometer-images → Policies Tab
  ├─ ✓ Authenticated users can upload odometer images (INSERT, authenticated)
  ├─ ✓ Anyone can view odometer images (SELECT, public)
  ├─ ✓ Authenticated users can view odometer images (SELECT, authenticated)
  └─ ✓ Users can delete their own odometer images (DELETE, authenticated)

App Upload Test:
  Driver clicks "Upload Start Odometer" → Selects image → "Upload successful"

Database Verification:
  SELECT query shows URL like: https://....supabase.co/storage/v1/object/public/...

Browser Test:
  Paste URL in browser → Image displays (no 403 error)
```

---

## Next Steps After Success

1. ✅ Test multiple drivers can upload
2. ✅ Test vendor can see trips with images
3. ✅ Test admin can see trips with images
4. ✅ Test trip completion with images
5. ✅ Monitor query performance (should be instant)

---

## Common Terms in Dashboard

| Term | Means |
|------|-------|
| **Policy** | A rule that controls who can do what with data |
| **INSERT** | Upload/create new file |
| **SELECT** | View/read file |
| **DELETE** | Remove file |
| **authenticated** | Logged-in users (drivers, vendors, admins) |
| **public** | Anyone (no login needed) |
| **bucket_id** | The folder/bucket name |
| **owner_id** | The user who created/owns the file |
| **auth.uid()** | Current logged-in user's ID |

---

## Quick Links

- **Supabase Dashboard**: https://app.supabase.com/
- **Storage Documentation**: https://supabase.com/docs/guides/storage
- **RLS Policies Guide**: https://supabase.com/docs/guides/storage/security/access-control

---

**You've got this! 5 minutes and you're done.** ✅

