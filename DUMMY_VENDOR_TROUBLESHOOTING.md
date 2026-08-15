# Dummy Vendor Creation - Troubleshooting Guide

## Issue 1: "Endpoint not found" Error

### Symptoms
```
POST /admin/create-dummy-vendor
Error: Endpoint not found
```

### Causes & Solutions

#### Cause A: Backend server not restarted
**Check:** Is backend running the new code?
```bash
# Check backend logs - should show all endpoints including:
# - POST /admin/create-dummy-vendor - Create dummy vendor
```

**Fix:**
```bash
# Stop old backend
Ctrl+C in backend terminal

# Start fresh
cd backend
npm start

# Verify it shows new endpoints in startup message
```

#### Cause B: Wrong URL format
**Check:** Is the URL correct?
```
✅ CORRECT: POST http://127.0.0.1:4000/admin/create-dummy-vendor
❌ WRONG: http://127.0.0.1:4000/create-dummy-vendor (missing /admin)
❌ WRONG: http://127.0.0.1:3000/admin/create-dummy-vendor (wrong port)
```

#### Cause C: Backend not running at all
**Check:** Is backend process running?
```bash
# Test health endpoint
curl http://127.0.0.1:4000/health

# Should return: {"status":"ok",...}
# If fails, backend is down
```

**Fix:**
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\backend
npm start
```

---

## Issue 2: "Phone must be 10 digits" Error

### Symptoms
```json
{
  "error": "Phone must be 10 digits"
}
```

### Causes & Solutions

#### Cause: Invalid phone number
**Check:** Is phone exactly 10 digits?
```
✅ CORRECT: "9876543210" (10 digits)
❌ WRONG: "98765432" (8 digits)
❌ WRONG: "98765432100" (11 digits)
❌ WRONG: "+919876543210" (includes country code)
❌ WRONG: "9876-543-210" (has dashes)
```

**Fix:**
Send exactly 10 digits only:
```javascript
{
  "phone": "9876543210",
  "companyName": "DUMMY Vendor"
}
```

---

## Issue 3: "phone is required" Error

### Symptoms
```json
{
  "error": "phone is required"
}
```

### Cause & Solution
Phone field is missing from request body.

**Fix:**
Always include phone:
```javascript
{
  "phone": "9876543210",        // ← REQUIRED
  "companyName": "DUMMY Vendor"  // ← optional
}
```

---

## Issue 4: "Vendor role not found" Error

### Symptoms
```json
{
  "error": "Vendor role not found"
}
```

### Cause
Vendor role doesn't exist in database.

**Check:**
```sql
SELECT id, name FROM roles WHERE name = 'vendor';
```

**Fix:** Create vendor role if missing
```sql
INSERT INTO roles (id, name) VALUES (
  uuid_generate_v4(),
  'vendor'
);
```

---

## Issue 5: "Failed to create vendor record" Error

### Symptoms
```json
{
  "error": "Failed to create vendor record: ..."
}
```

### Possible Causes

#### Cause A: Duplicate phone
**Check:**
```sql
SELECT * FROM users WHERE phone = '9876543210';
SELECT * FROM vendors WHERE user_id = (
  SELECT id FROM users WHERE phone = '9876543210'
);
```

**Fix:** Use different phone or reuse same phone (it resets it)

#### Cause B: Database connection issue
**Check:** Is Supabase accessible?
```bash
# Test backend connectivity
curl http://127.0.0.1:4000/health

# Check server logs for connection errors
```

**Fix:** Check Supabase credentials in `.env`:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## Issue 6: Vendor Created But Not Appearing in List

### Symptoms
- Vendor creation returns success
- But vendor doesn't appear in Settings vendor list

### Causes & Solutions

#### Cause A: Company name doesn't start with DUMMY
**Check:** What company name was used?
```javascript
// If you created with:
{
  "phone": "9876543210",
  "companyName": "My Vendor Co"  // ← doesn't start with DUMMY
}

// The app filters for company names LIKE 'DUMMY%'
// So it won't appear in the list!
```

**Fix:** Use DUMMY prefix in company name:
```javascript
{
  "phone": "9876543210",
  "companyName": "DUMMY My Vendor Co"  // ← starts with DUMMY
}

// OR leave it empty for auto-generated name:
{
  "phone": "9876543210"
  // Will be: "DUMMY Vendor 3210"
}
```

#### Cause B: Frontend not refreshed
**Check:** Is the app showing old data?

**Fix:** 
1. Go back from Settings
2. Return to Settings (triggers refresh)
3. Or pull down to refresh
4. Or restart the app

#### Cause C: Database query failed
**Check:** Verify vendor exists
```sql
SELECT * FROM vendors WHERE company_name ILIKE 'DUMMY%';
```

**Fix:** If vendor exists but app doesn't show it, check:
- RLS policies might be blocking read access
- Check for database errors in server logs

---

## Issue 7: Phone Number Already in Use

### Symptoms
```json
{
  "error": "Failed to create user record: ..."
}
```

### Cause
Phone is already registered to another account.

**Check:**
```sql
SELECT * FROM users WHERE phone = '9876543210';
```

**Solutions:**

Option A: Use different phone
```javascript
{
  "phone": "9876543211",  // ← different number
  "companyName": "DUMMY Vendor"
}
```

Option B: Reuse same phone (resets the account)
```javascript
{
  "phone": "9876543210",  // ← same number - resets it
  "companyName": "DUMMY New Company"
}
// This updates the old account with new company name
```

---

## Issue 8: Vendor Created But Can't Log In

### Symptoms
- Vendor was created successfully
- But getting authentication errors on login

### Causes & Solutions

#### Cause A: Phone number format wrong
**Check:** Is phone exactly what was used during creation?
```
Created: 9876543210
Login: 9876543210  ✅ CORRECT
Login: +919876543210  ❌ WRONG (extra country code)
Login: 98 7654 3210  ❌ WRONG (spaces/formatting)
```

**Fix:** Use exactly same phone without formatting.

#### Cause B: User not marked as active
**Check:**
```sql
SELECT * FROM users WHERE phone = '9876543210';
-- Check if is_active = true
```

**Fix:** Activate user if needed
```sql
UPDATE users SET is_active = true WHERE phone = '9876543210';
```

#### Cause C: Verification status wrong
**Check:**
```sql
SELECT * FROM users WHERE phone = '9876543210';
-- Check verification_status = 'approved'
```

---

## Issue 9: App Still Shows Old Error

### Symptoms
- Backend is working now
- But app still shows "Endpoint not found" error

### Cause
App's JavaScript code is cached or needs restart.

**Fix:**
1. **Close app completely** (swipe it out)
2. **Reopen app**
3. **Try again**

If still not working:
1. **Clear app cache** (Settings → Apps → [App Name] → Storage → Clear Cache)
2. **Restart phone**
3. **Try again**

---

## General Troubleshooting Steps

### Step 1: Check Backend is Running
```bash
# Should show port 4000 listening
curl http://127.0.0.1:4000/health

# Should return: {"status":"ok",...}
```

### Step 2: Check Endpoint Works
```bash
curl -X POST http://127.0.0.1:4000/admin/create-dummy-vendor \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999888877"}'

# Should return success response
```

### Step 3: Verify Database
```sql
-- Check if vendor was created
SELECT * FROM vendors WHERE company_name ILIKE 'DUMMY%';

-- Check if user was created
SELECT * FROM users WHERE phone = '9999888877';
```

### Step 4: Check Logs
- **Backend logs:** Look for 🤖, ✅, 🎉 messages
- **Frontend console:** Check browser/app console for errors
- **Database logs:** Check Supabase logs for issues

---

## Quick Reference: Common Fixes

| Problem | Quick Fix |
|---------|-----------|
| "Endpoint not found" | Restart backend (`npm start` in backend folder) |
| "Phone must be 10 digits" | Use exactly 10 digits (no formatting) |
| "Phone is required" | Include `"phone": "1234567890"` in request |
| "Role not found" | Create vendor role in database |
| Vendor not in list | Use company name starting with "DUMMY" |
| Can't log in | Use exact phone number from creation |
| App shows old error | Close and reopen app |

---

## Still Having Issues?

### Check These Files First:
1. **`DUMMY_VENDOR_CONFIRMED_WORKING.md`** - Shows working test
2. **`DUMMY_VENDOR_IMPLEMENTATION_SUMMARY.md`** - Technical details
3. **`DUMMY_VENDOR_CREATION_FIXED.md`** - Schema explanation

### Server Logs to Check:
- Terminal where `npm start` is running (backend)
- Browser console (frontend)
- Supabase dashboard (database)

### What to Collect for Support:
1. Exact error message
2. Server logs (lines around error)
3. Request body (what you sent)
4. Response body (what you got back)
5. Database query results

---

**Status:** Keep this guide handy for troubleshooting! 📋
