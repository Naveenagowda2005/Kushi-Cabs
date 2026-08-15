# Fix: Backend URL Mismatch

## Problem
Documents are in the bucket, but super admin sees "document not found" when trying to view them because the backend can't fetch the file list.

## Root Cause
**Mismatch between configured and actual backend URL:**

**In `.env`:**
```
EXPO_PUBLIC_BACKEND_URL='http://192.168.1.114:4000'
```

**Backend actually running on:**
```
Port: 8080 (from index.js: const port = process.env.PORT || 8080)
```

**The flow:**
1. Frontend calls `http://192.168.1.114:4000/api/upload/list-documents/{driverId}`
2. Backend listening on `http://192.168.1.114:8080`
3. Request fails → returns 404 or connection refused
4. Frontend gets no documents
5. Super admin sees "not found" error

## Solution (Choose One)

### Option 1: Update .env to correct port (RECOMMENDED)

**File:** `apps/unified/.env`

Change:
```
EXPO_PUBLIC_BACKEND_URL='http://192.168.1.114:4000'
```

To:
```
EXPO_PUBLIC_BACKEND_URL='http://192.168.1.114:8080'
```

Then restart the app.

### Option 2: Change backend to run on port 4000

**If you want backend on port 4000, set the environment variable:**

```bash
export PORT=4000
```

Or in a `.env` file for the backend:
```
PORT=4000
```

## Verification

After fixing:

1. Start backend: `node backend/index.js`
   - Should see: `✅ Taxi SMS backend listening on http://127.0.0.1:8080`
   - Or if using PORT=4000: `✅ Taxi SMS backend listening on http://127.0.0.1:4000`

2. Test endpoint manually:
   ```bash
   curl http://192.168.1.114:8080/api/upload/list-documents/a3c7433b-e2d9-4963-b378-30d3996e23af
   ```
   Should return:
   ```json
   {
     "success": true,
     "driverId": "a3c7433b-e2d9-4963-b378-30d3996e23af",
     "documents": [...],
     "count": 9
   }
   ```

3. Restart super admin app

4. Go to Driver Verification
   - Click on driver
   - Click on document
   - Should now see image (not "document not found")

## Current Status

✅ Documents in bucket
✅ Database records created
✅ Admin verification dashboard shows driver
❌ Document viewer fails (backend URL wrong)
→ Fix: Update .env to port 8080

## Why This Matters

The backend's `list-documents` endpoint is the bridge between:
- Frontend (needs to know which documents exist)
- Storage bucket (has the actual files)
- Database (has the metadata)

If frontend can't reach backend, the entire verification chain breaks.
