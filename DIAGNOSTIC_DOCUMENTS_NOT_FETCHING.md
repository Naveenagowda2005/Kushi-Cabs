# Diagnostic: Documents Not Fetching From Bucket

## Problem
Even after all fixes, documents still not showing in super admin verification screen.

## Debug Steps (In Order)

### Step 1: Verify Backend is Running

**Terminal:**
```bash
# Check if backend is listening
netstat -an | grep 8080
# Or
lsof -i :8080
```

**Should show:**
```
LISTENING  :::8080
```

**If not running, start it:**
```bash
cd /path/to/backend
node index.js
```

**Should see logs:**
```
✅ Taxi SMS backend listening on http://127.0.0.1:8080
✅ Access from phone at: http://192.168.1.114:8080
```

---

### Step 2: Test Backend Endpoint Directly

**curl command:**
```bash
curl -X GET "http://192.168.1.114:8080/api/upload/list-documents/a3c7433b-e2d9-4963-b378-30d3996e23af"
```

**Expected response:**
```json
{
  "success": true,
  "driverId": "a3c7433b-e2d9-4963-b378-30d3996e23af",
  "documents": [
    {
      "document_type": "DL",
      "document_url": "https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/driver-documents/drivers/a3c7433b-e2d9-4963-b378-30d3996e23af/DL.jpg",
      "file_name": "DL.jpg",
      "uploaded_at": "2026-07-19T08:07:47.854962+00:00",
      "status": "pending",
      "rejection_reason": null
    },
    ...
  ],
  "count": 9
}
```

**If error:**
- If `curl: (7) Failed to connect` → Backend not running
- If `{"error": "Failed to list documents"}` → Supabase bucket issue
- If `{"documents": []}` → Check Step 3 (no database records)

---

### Step 3: Check Database Records

**SQL Query:**
```sql
SELECT 
  id,
  driver_id,
  document_type,
  status,
  uploaded_at
FROM driver_documents
WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af'
ORDER BY document_type;
```

**Expected:** 9 rows with different document types

**If empty:**
- Need to backfill database records
- Run: `INSERT INTO driver_documents (...) VALUES (...)`

---

### Step 4: Check Bucket Files

**In Supabase Dashboard:**
1. Go to Storage → driver-documents
2. Navigate to: `drivers/a3c7433b-e2d9-4963-b378-30d3996e23af/`
3. Should see 9 files:
   - AADHAR.jpg
   - BANK_PASSBOOK_FRONT.jpg
   - DL.jpg
   - DRIVER_SELFIE.jpeg
   - EMISSION.jpg
   - FC.jpg
   - INSURANCE.jpg
   - RC.jpg
   - VEHICLE_FRONT.jpg

**If missing:**
- Documents weren't uploaded
- Check driver app logs

---

### Step 5: Check Frontend Logs

**In Super Admin App:**
1. Open browser DevTools (Chrome: F12)
2. Go to Console tab
3. Trigger document fetch
4. Look for logs:
   ```
   getDriverAllDocuments: Fetching documents for driver: a3c7433b-e2d9-4963-b378-30d3996e23af
   getDriverAllDocuments: Calling backend API: http://192.168.1.114:8080/api/upload/list-documents/a3c7433b-e2d9-4963-b378-30d3996e23af
   getDriverAllDocuments: Backend response: {...}
   getDriverAllDocuments: Found 9 documents
   ```

**If error:**
```
getDriverAllDocuments: Backend returned error: 404
Please ensure backend is running on http://192.168.1.114:8080
```

---

### Step 6: Check Network in Browser

**DevTools → Network tab:**
1. Refresh super admin app
2. Click on driver card
3. Look for request: `list-documents/a3c7433b-e2d9-4963-b378-30d3996e23af`
4. Check:
   - Status: 200 (should be green)
   - Response: Should have `documents` array
   - Headers: Verify URL is correct

**If red (error):**
- Status 404: Backend endpoint not found
- Status 500: Backend error (check backend logs)
- Status "pending": Network timeout (backend not responding)

---

## Common Issues & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Backend returned error: 404" | Backend endpoint doesn't exist | Verify router.get('/list-documents/:driverId') in document-upload.js |
| "Backend returned error: 500" | Backend crashed | Check backend logs, restart |
| "Connection refused" | Backend not running | `node backend/index.js` |
| "documents: []" | Database records missing | Run SQL backfill |
| "Empty array" | No files in bucket | Driver needs to re-upload |
| "Please ensure backend is running" | CORS or network issue | Check firewall, restart app |

---

## Checklist for Full Debugging

- [ ] Backend running? (`netstat -an | grep 8080`)
- [ ] Backend responds to curl? (`curl http://192.168.1.114:8080/health`)
- [ ] Database has records? (`SELECT * FROM driver_documents WHERE driver_id = '...'`)
- [ ] Bucket has files? (Supabase Dashboard Storage tab)
- [ ] Backend endpoint works? (curl to /api/upload/list-documents/{driverId})
- [ ] App env correct? (.env has `EXPO_PUBLIC_BACKEND_URL='http://192.168.1.114:8080'`)
- [ ] App restarted? (After .env change, force quit and restart)
- [ ] Browser logs show success? (DevTools Console)
- [ ] Network request succeeds? (DevTools Network tab)

---

## Quick Fix Steps

If everything is there but still not showing:

1. **Restart backend:**
   ```bash
   pkill -f "node backend"
   node backend/index.js
   ```

2. **Restart app:**
   - Force quit super admin app
   - Restart it
   - Go to Driver Verification

3. **Clear cache:**
   - DevTools → Application → Clear Site Data
   - Reload page

4. **Check logs:**
   - Backend terminal: Should show `📋 Listing documents for driver: ...`
   - Browser console: Should show `getDriverAllDocuments: Found X documents`

---

## If Still Not Working

Post the following information:

1. Backend startup log output
2. Response from: `curl http://192.168.1.114:8080/api/upload/list-documents/a3c7433b-e2d9-4963-b378-30d3996e23af`
3. SQL query result: `SELECT COUNT(*) FROM driver_documents WHERE driver_id = 'a3c7433b-e2d9-4963-b378-30d3996e23af'`
4. Browser console log (from DevTools)
5. Network request status (from DevTools Network tab)
