# ✅ Frontend Restart Guide - Complete Fix

## Why Frontend Needs Restart

**Backend is working perfectly** ✅
- Returns all 9 documents
- Status from database
- URLs from bucket

**Frontend needs to load:**
1. Updated `.env` with correct IP
2. Updated `documentService.js` with correct IP fallbacks
3. Updated `AdminVendorVerificationDashboard.js` with correct prop names
4. Rebuild JavaScript bundle

---

## Step-by-Step Frontend Restart

### Step 1: Stop the Frontend App Completely

**On your phone/device running super admin app:**
- Swipe up from bottom (iPhone) or use back button (Android)
- Force close the app completely
- Wait 2 seconds

**Or if web app:**
- Close all browser tabs with the app
- Clear browser cache: Ctrl+Shift+Delete

---

### Step 2: Clear Frontend Cache

**Option A: iOS App**
```
Settings → Apps → [Your App Name] → Storage → Clear Cache
```

**Option B: Android App**
```
Settings → Apps → [Your App Name] → Storage → Clear Cache
```

**Option C: Web/Browser**
```
Developer Tools → Application → Clear Site Data
```

---

### Step 3: Restart the Frontend

**Open the app fresh:**
- Tap app icon to open
- Let it load completely (wait 5-10 seconds)
- Should rebuild the JavaScript bundle with new code

**Signs of successful restart:**
- App loads fresh (not from cache)
- DevTools shows new logs
- IP in console shows `.114`

---

## Verification Steps

### Step 1: Confirm Backend Responding

Open browser and test:
```
http://192.168.1.114:8080/health
```

Should return:
```json
{"status": "ok", ...}
```

✅ Backend ready

---

### Step 2: Open Super Admin App

1. Open app
2. Navigate to **Driver Verification** tab
3. Should see driver "Smiling" in the list

✅ Driver appears

---

### Step 3: Expand Driver Card

1. Click on driver card
2. Card should expand to show documents
3. Should see all 9 documents listed:
   - DL
   - VEHICLE_FRONT
   - INSURANCE
   - FC
   - EMISSION
   - RC
   - AADHAR
   - BANK_PASSBOOK_FRONT
   - DRIVER_SELFIE

✅ Documents appear

---

### Step 4: Click on Document

1. Click on any document (e.g., DL)
2. Document viewer should open
3. Image should load from bucket
4. **No "document not found" error**

✅ Image loads

---

### Step 5: Approve/Reject Document

1. Click **Approve** button
2. Status should change to "Approved"
3. Or click **Reject** and provide reason
4. Status should change to "Rejected"

✅ Approval works

---

## What Changed (Already Done)

### Code Changes ✅
1. **`apps/unified/.env`**
   - Backend URL: `http://192.168.1.114:8080`

2. **`apps/unified/src/services/documentService.js`**
   - Upload fallback IP: `.114` (was `.110`)
   - List docs fallback IP: `.114` (was `.110`)
   - Better error logging

3. **`apps/unified/src/screens/superadmin/AdminVendorVerificationDashboard.js`**
   - DocumentViewer prop: `documentUrl` (was `documentData`)

### Database ✅
- Schema: `document_data` column is nullable
- Records: 9 documents for driver
- Status: All set to "pending"

### Backend ✅
- Running on port 8080
- Listing documents from bucket
- Fetching status from database
- Merging both data

---

## Troubleshooting

### Issue: Still showing 0 documents

**Solution:**
1. Hard refresh app (Ctrl+Shift+R)
2. Clear ALL cache
3. Restart phone/browser
4. Check backend logs (should show requests)

### Issue: "Document not found" error

**Solution:**
1. Verify backend is running: `http://192.168.1.114:8080/health`
2. Check browser console for URL being called
3. Make sure it says `.114:8080`
4. Not `.110` or wrong port

### Issue: Images won't load

**Solution:**
1. Check Supabase bucket is PUBLIC
2. Test URL directly in browser:
   ```
   https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/driver-documents/drivers/a3c7433b-e2d9-4963-b378-30d3996e23af/DL.jpg
   ```
3. Should display image

### Issue: Buttons don't work

**Solution:**
1. Check super admin has correct role
2. Verify RLS policies allow updates
3. Check backend logs for errors

---

## Success Indicators

✅ **Backend logs show:**
```
📋 Listing documents for driver: a3c7433b-e2d9-4963-b378-30d3996e23af
✅ Found 9 files for driver
✅ Mapped 9 documents with database status
```

✅ **Frontend console shows:**
```
getDriverAllDocuments: Calling backend API: http://192.168.1.114:8080/api/upload/list-documents/...
getDriverAllDocuments: Found 9 documents
```

✅ **Super admin app shows:**
- Driver in verification list
- 9 documents under driver
- Images load when clicked
- Approve/Reject buttons work

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Backend running | ✅ Done | |
| Backend tested | ✅ Done | |
| Code updated | ✅ Done | |
| Database ready | ✅ Done | |
| **Frontend restart** | ⏳ TODO | **← YOU ARE HERE** |
| Verify in app | ⏳ TODO | |
| Test documents | ⏳ TODO | |
| Test approve/reject | ⏳ TODO | |

---

## Next Action

**RIGHT NOW:**
1. Force close super admin app completely
2. Clear all app cache
3. Restart app fresh
4. Navigate to Driver Verification
5. Documents should now appear ✅

**If issues:**
- Check backend is running (see logs you posted)
- Hard refresh browser or restart phone
- Check IP is `.114` not `.110`

---

## Summary

**Backend:** ✅ Working perfectly (9 documents, correct status)
**Database:** ✅ Ready (records exist, status tracked)
**Code:** ✅ Updated (IP corrected, props fixed)
**Env:** ✅ Configured (IP and port correct)

**System Status: READY FOR FRONTEND RESTART** 🚀

**Do this now:**
```
Force Close App → Clear Cache → Restart App → Test Documents
```

You should see documents immediately!
