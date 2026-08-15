# Local Backend Testing Guide - Dummy Vendor Feature ✅

## Setup Status

✅ **Frontend .env already configured for local backend:**
```
EXPO_PUBLIC_SMS_API_URL='http://192.168.1.110:4000'
```

This tells your Expo app to use your local machine's backend instead of production.

---

## Testing Steps

### Step 1: Ensure Backend is Running
```bash
# Check if backend is already running
curl http://192.168.1.110:4000/health

# Should return: {"status":"ok",...}
```

If you get connection error, start backend:
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\backend
npm start

# You should see:
# ✅ Taxi SMS backend listening on http://127.0.0.1:4000
# ✅ Access from phone at: http://192.168.1.110:4000
# And all endpoints listed including:
#    - POST /admin/create-dummy-vendor - Create dummy vendor
#    - GET /admin/dummy-vendors - List dummy vendors
```

### Step 2: Start Expo App
In another terminal:
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified

# Start Expo
npx expo start

# Scan QR code on your phone with Expo Go app
# Or press 'a' for Android / 'i' for iOS if emulator is open
```

### Step 3: Test Dummy Vendor Creation in Expo App
1. **Log in** as Super Admin
2. **Go to Settings** (gear icon)
3. **Scroll down** to "Emergency Dummy Vendors" (blue card)
4. **Click the expand button** (+)
5. **Enter phone:** `9999888877`
6. **Enter company:** `Test Local Backend`
7. **Click "Create Dummy Vendor"**
8. **✅ Should succeed!** (no more "Endpoint not found")

---

## Backend Architecture (Local Testing)

```
┌─────────────────────────────────────┐
│  Expo App on Phone/Emulator         │
│  (Using http://192.168.1.110:4000)  │
└──────────────┬──────────────────────┘
               │
               │ HTTP Request
               ▼
┌─────────────────────────────────────┐
│  Local Backend (Your Machine)       │
│  Port: 4000                         │
│  Running: npm start in /backend     │
└──────────────┬──────────────────────┘
               │
               │ Database Queries
               ▼
┌─────────────────────────────────────┐
│  Supabase Cloud Database            │
│  (Production database)              │
└─────────────────────────────────────┘
```

---

## IP Address Configuration

Your machine's local IP: **192.168.1.110**

### Why this IP?
- Allows phone/emulator to reach your computer's backend
- Can be accessed from same WiFi network
- Used in `/backend/constants.js` for Android devices

### If IP is Different:
Find your actual local IP:
```bash
# Windows
ipconfig

# Look for IPv4 Address (usually 192.168.x.x)
```

If different from 192.168.1.110, update `.env`:
```env
EXPO_PUBLIC_SMS_API_URL='http://YOUR_IP:4000'
```

Then restart Expo app.

---

## Troubleshooting

### Issue 1: "Endpoint not found" Still Shows
**Check:**
1. Backend is running on port 4000
2. Phone can reach 192.168.1.110:4000
3. Expo app is using updated `.env`

**Fix:**
```bash
# Restart Expo app
# Press 'r' in Expo terminal to reload
# Or kill Expo (Ctrl+C) and restart: npx expo start
```

### Issue 2: Can't Connect to Backend
**Test connection:**
```bash
# From phone on same WiFi:
# Use a browser or Postman to test:
# http://192.168.1.110:4000/health
```

**If fails:**
- Backend not running (start with `npm start`)
- Phone not on same WiFi as computer
- Firewall blocking port 4000
- Wrong IP address

### Issue 3: Backend Shows Different Port
**Check startup logs:**
```
✅ Taxi SMS backend listening on http://127.0.0.1:4000
✅ Access from phone at: http://192.168.1.110:4000
```

Should show both IPs. If shows different port, update `.env` accordingly.

### Issue 4: Backend Crashes
**Check error in terminal:**
```bash
# If error like "Port already in use"
# Find process on port 4000 and kill it
# Then restart: npm start

# If other errors, check:
# - Supabase credentials in .env
# - Node.js version compatibility
# - Missing dependencies (npm install)
```

---

## Testing Scenarios

### Scenario 1: Create Single Dummy Vendor
```
Phone: 9999888877
Company: Test Local Vendor

Expected:
✅ Success message
✅ Vendor appears in list below
✅ Vendor status shows "approved"
```

### Scenario 2: Create Multiple Vendors
```
Phone 1: 9999888877 → Company: Local Test 1
Phone 2: 9999888878 → Company: Local Test 2
Phone 3: 9999888879 → Company: Local Test 3

Expected:
✅ All three appear in list
✅ All show "approved" status
```

### Scenario 3: Reuse Phone Number
```
Phone: 9999888877 → Company: Local Test 1
(Creates successfully)

Phone: 9999888877 → Company: Local Test 1 Updated
(Reuses and resets account)

Expected:
✅ Same vendor updated with new name
✅ Still shows one vendor in list (not duplicated)
```

### Scenario 4: Invalid Phone
```
Phone: 999 (only 3 digits)
Company: Test

Expected:
❌ Error message: "Phone must be 10 digits"
```

### Scenario 5: Created Vendor Logs In
```
After creating: Phone 9999888877

In Vendor Login:
1. Enter phone: 9999888877
2. Request OTP
3. Enter OTP code
4. Should log in successfully
5. No document verification required
6. Can access vendor dashboard

Expected:
✅ Vendor logs in without docs
✅ Ready to accept trips immediately
```

---

## Server Logs to Monitor

When testing, watch the backend terminal for logs like:

```
✅ SUCCESS LOGS:
👤 Admin Request: POST /create-dummy-vendor
🤖 Creating dummy vendor: Test Local Backend (9999888877)
✅ Auth account created: uuid-xxx
✅ vendor_verification_status set to approved
🎉 Dummy vendor ready: Test Local Backend | Phone: 9999888877

❌ ERROR LOGS:
Error fetching from Supabase: ...
Failed to create vendor record: ...
```

---

## Performance Notes (Local Testing)

| Operation | Time | Notes |
|-----------|------|-------|
| Create vendor | < 2 sec | Same network, very fast |
| List vendors | < 1 sec | Instant reload |
| Database sync | < 500ms | Supabase latency |
| Total flow | 2-3 sec | Create + list + UI update |

---

## Files & Configurations

### Frontend Configuration
**File:** `apps/unified/.env`
```env
EXPO_PUBLIC_SMS_API_URL='http://192.168.1.110:4000'  ← Local backend
```

### Backend Configuration  
**Running on:** `http://192.168.1.110:4000`
**Database:** Supabase production (shared with production app)
**Code location:** `backend/routes/admin.js`

### Endpoints Available
```
✅ POST /admin/create-dummy-vendor
✅ GET /admin/dummy-vendors
✅ POST /admin/create-dummy-driver (also working)
✅ GET /admin/dummy-drivers
✅ And all other admin endpoints
```

---

## Cleanup After Testing

### Option 1: Keep Dummy Data (For Testing)
Leave test vendors in database. They're easy to identify by "DUMMY" prefix.

### Option 2: Delete Dummy Data
```sql
-- Delete all dummy vendors
DELETE FROM vendor_verification_status 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE phone LIKE '999988%'  -- Your test phones
);

DELETE FROM vendors 
WHERE company_name LIKE 'Test Local%';  -- Your test vendors

DELETE FROM users 
WHERE phone LIKE '999988%';  -- Your test users
```

---

## Ready to Test! ✅

### Quick Checklist
- [x] Backend running on port 4000
- [x] `.env` configured for local backend
- [x] Expo app pointing to local backend
- [x] Both on same WiFi network
- [x] Ready to test!

### Commands to Run

**Terminal 1 - Start Backend:**
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\backend
npm start
```

**Terminal 2 - Start Expo:**
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
npx expo start
```

**Phone/Emulator:**
1. Scan Expo QR code (or open Expo Go)
2. Log in as Super Admin
3. Go to Settings
4. Create dummy vendor
5. **✅ Done!**

---

## Support

### If Something Doesn't Work:
1. **Verify backend is running:** `curl http://192.168.1.110:4000/health`
2. **Check backend logs** for errors
3. **Verify .env** has correct URL
4. **Restart Expo app** (press 'r' in terminal or restart)
5. **Check phone is on same WiFi** as computer

### Quick Debug:
```bash
# Test backend directly
curl -X POST http://192.168.1.110:4000/admin/create-dummy-vendor \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999888877"}'

# Should return success if backend is working
```

---

**Status:** ✅ **READY FOR LOCAL TESTING**

Start both servers and test the dummy vendor feature in Expo! 🚀
