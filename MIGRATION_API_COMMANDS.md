# Storage Migration - API Commands (Copy & Paste Ready)

## BEFORE RUNNING THESE COMMANDS

1. Get your **SUPABASE_SERVICE_ROLE_TOKEN**:
   - Go to: https://app.supabase.com
   - Click your project
   - Settings → API
   - Copy the "Service Role" token (keep it SECRET!)

2. Make sure Migration 101 has been applied in Supabase SQL Editor

3. Replace `YOUR_SERVICE_ROLE_TOKEN` in commands below with your actual token

---

## Command 1: Migrate Driver Documents

**What it does:** Moves all driver documents (DL, RC, Insurance, etc.) from database to storage buckets

```bash
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/migrate-documents \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (Success):**
```json
{
  "message": "Documents migration completed",
  "total": 45,
  "success": 45,
  "failed": 0,
  "results": [
    {
      "id": "doc-123",
      "status": "success",
      "storagePath": "user-id/DL_doc-123.jpg"
    }
  ]
}
```

**If you see `failed: 0` - Migration successful! ✅**

---

## Command 2: Migrate User Avatars

**What it does:** Moves all user/driver/vendor profile photos from database to storage

```bash
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/migrate-avatars \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (Success):**
```json
{
  "message": "Avatars migration completed",
  "total": 156,
  "success": 156,
  "failed": 0,
  "results": [
    {
      "id": "user-456",
      "status": "success",
      "storagePath": "user-456/avatar_user-456.jpg"
    }
  ]
}
```

**If you see `failed: 0` - Migration successful! ✅**

---

## Command 3: Check Migration Status

**What it does:** Shows how many documents/avatars are in storage vs still in database

```bash
curl -X GET https://kushi-cabs-27p8.onrender.com/api/storage-migration/status \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_TOKEN"
```

**Expected Response:**
```json
{
  "documents": {
    "migratedToStorage": 45,
    "stillInBase64": 0
  },
  "avatars": {
    "migratedToStorage": 156,
    "stillInBase64": 0
  }
}
```

**What this means:**
- `migratedToStorage: 45` = 45 documents now in CDN storage ✅
- `stillInBase64: 0` = All data migrated! ✅
- If `stillInBase64` is 0 for both, you're ready to build APK!

---

## Command 4: OPTIONAL - Clear Old Base64 Data (After Verification)

⚠️ **ONLY RUN AFTER:**
- Verifying all data is in storage
- Testing the new APK works
- Having a backup

**For Documents:**
```bash
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/clear-base64 \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableType": "documents"}'
```

**For Avatars:**
```bash
curl -X POST https://kushi-cabs-27p8.onrender.com/api/storage-migration/clear-base64 \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableType": "avatars"}'
```

**Response:**
```json
{
  "message": "Cleared base64 data for documents",
  "rowsAffected": 45
}
```

---

## TROUBLESHOOTING

### Error: "Admin access required"
**Cause:** Token doesn't have super_admin role
**Fix:** Make sure you're using SERVICE_ROLE token, not anon token

### Error: "No token provided"
**Cause:** Authorization header missing
**Fix:** Add `-H "Authorization: Bearer YOUR_TOKEN"` to command

### Error: "Invalid token"
**Cause:** Token is expired or malformed
**Fix:** Get a fresh SERVICE_ROLE token from Supabase

### Response: `"failed": 5`
**Cause:** Some documents failed to upload
**Fix:** Check the `results` array for which ones failed. Usually because:
- File too large
- Invalid base64 data
- Storage bucket not found

**Solution:** Verify buckets exist and retry

### Response: `stillInBase64: 45`
**Cause:** Migration didn't complete
**Fix:** Check failed count and retry migrate-documents command

---

## RUNNING IN WINDOWS POWERSHELL

If you're on Windows and curl doesn't work, use PowerShell with Invoke-WebRequest:

```powershell
$token = "YOUR_SERVICE_ROLE_TOKEN"

# Migrate Documents
Invoke-WebRequest -Uri "https://kushi-cabs-27p8.onrender.com/api/storage-migration/migrate-documents" `
  -Method POST `
  -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
  -Body "{}"

# Check Status
Invoke-WebRequest -Uri "https://kushi-cabs-27p8.onrender.com/api/storage-migration/status" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}
```

---

## EXECUTION ORDER

1. ✅ Apply Migration 101 in Supabase SQL Editor
2. ✅ Run: **Command 1** (Migrate Documents)
3. ✅ Run: **Command 2** (Migrate Avatars)  
4. ✅ Run: **Command 3** (Check Status) - verify `stillInBase64: 0` for both
5. ✅ Build new APK
6. ✅ Test new APK
7. ✅ (Optional) Run Command 4 to clear old data
8. ✅ Commit and push

---

## EXPECTED TIMES

- Command 1: 2-5 minutes (depends on document count)
- Command 2: 1-3 minutes (depends on avatar count)
- Command 3: 5 seconds
- Command 4: 30 seconds
- **Total migration time: 5-10 minutes**

---

## AFTER MIGRATION

- ✅ Images load 5-10x faster
- ✅ App feels more responsive
- ✅ Database load reduced significantly
- ✅ Fallback to base64 works for older data
- ✅ New APK with storage integration ready
