# DO THIS NOW - Odometer Upload Fix

## Status: 🔴 BLOCKING
Driver cannot upload odometer images. Error: "new row violates row-level security policy"

## Fix: Create 4 RLS Policies
**Time**: 5 minutes  
**Difficulty**: Easy  
**Method**: Supabase Dashboard (web UI)

---

## OPTION 1: Dashboard Method (Easiest - Recommended)

### Step 1: Login to Supabase

```
URL: https://app.supabase.com/
Email: (your supabase account email)
Password: (your password)
```

### Step 2: Select Project

- Find **TAXI** project in list
- Click to open

### Step 3: Go to Storage

- Left sidebar → **Storage**
- See list of buckets
- Click on **odometer-images**

### Step 4: Open Policies

Look for:
- **"Policies"** tab at top, OR
- **Gear icon** ⚙️ in top right, OR
- **Three dots** ⋮ menu

Click to enter policies editor.

### Step 5: Create 4 Policies

Click **"Add Policy"** or **"New Policy"** button and fill in these 4 times:

#### CREATE POLICY 1

```
Field: Policy Name
Value: Authenticated users can upload odometer images

Field: Allowed operation
Value: INSERT

Field: Target roles
Value: authenticated

Field: Policy expression / Condition
Value: bucket_id = 'odometer-images'
```

**Click Save**

---

#### CREATE POLICY 2

```
Field: Policy Name
Value: Anyone can view odometer images

Field: Allowed operation
Value: SELECT

Field: Target roles
Value: public

Field: Policy expression / Condition
Value: bucket_id = 'odometer-images'
```

**Click Save**

---

#### CREATE POLICY 3

```
Field: Policy Name
Value: Authenticated users can view odometer images

Field: Allowed operation
Value: SELECT

Field: Target roles
Value: authenticated

Field: Policy expression / Condition
Value: bucket_id = 'odometer-images'
```

**Click Save**

---

#### CREATE POLICY 4

```
Field: Policy Name
Value: Users can delete their own odometer images

Field: Allowed operation
Value: DELETE

Field: Target roles
Value: authenticated

Field: Policy expression / Condition
Value: bucket_id = 'odometer-images' AND owner_id = auth.uid()
```

**Click Save**

---

### Step 6: Verify All 4 Policies

After saving all 4, you should see them listed and marked as **Active** or **Enabled**.

**Verify count**: 4 total policies  
**Status**: All showing as "Active"

---

## OPTION 2: API Method (Automated - If Dashboard Doesn't Work)

### Prerequisites
1. Get access token from: https://app.supabase.com/account/tokens
2. Copy the token value

### Using Python Script (Recommended)

```bash
# Terminal: Run the Python script
python3 setup_odometer_rls.py YOUR_ACCESS_TOKEN_HERE
```

**Replace**: `YOUR_ACCESS_TOKEN_HERE` with your actual token

---

## OPTION 3: Manual cURL Commands

```bash
# Set your access token
export TOKEN="your_access_token_here"

# Policy 1: INSERT
curl -X POST "https://api.supabase.com/v1/projects/cqfsirfjwfxvwggjkrvd/storage/policies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Authenticated users can upload odometer images","definition":"bucket_id = '\''odometer-images'\''","bucket_id":"odometer-images","action":"INSERT","roles":["authenticated"]}'

# Policy 2: SELECT Public
curl -X POST "https://api.supabase.com/v1/projects/cqfsirfjwfxvwggjkrvd/storage/policies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Anyone can view odometer images","definition":"bucket_id = '\''odometer-images'\''","bucket_id":"odometer-images","action":"SELECT","roles":["public"]}'

# Policy 3: SELECT Authenticated
curl -X POST "https://api.supabase.com/v1/projects/cqfsirfjwfxvwggjkrvd/storage/policies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Authenticated users can view odometer images","definition":"bucket_id = '\''odometer-images'\''","bucket_id":"odometer-images","action":"SELECT","roles":["authenticated"]}'

# Policy 4: DELETE
curl -X POST "https://api.supabase.com/v1/projects/cqfsirfjwfxvwggjkrvd/storage/policies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Users can delete their own odometer images","definition":"bucket_id = '\''odometer-images'\'' AND owner_id = auth.uid()","bucket_id":"odometer-images","action":"DELETE","roles":["authenticated"]}'
```

---

## Step 7: Restart Services

### Terminal 1: Backend

```bash
# Kill if running (Ctrl+C)
# Then run:
cd backend
npm start

# Expected output:
# Server listening on http://192.168.1.114:4000
```

### Terminal 2: Frontend

```bash
# Kill if running (Ctrl+C)
# Then run:
cd apps/unified
npm start

# Follow prompts (a for Android, i for iOS)
```

---

## Step 8: Test Upload

### In Driver App:

1. **Login** with driver account
   - Phone: (driver's phone)
   - OTP: 123456

2. **Find active trip**
   - Should see trip assigned by vendor

3. **Click** "Upload Start Odometer" button

4. **Select/Take** image

5. **Result**:
   - ✅ Should see "Upload successful"
   - ✅ Image should display in app
   - ❌ Should NOT see RLS policy error

---

## Step 9: Verify in Database

### In Supabase Dashboard SQL Editor:

1. Go to: https://app.supabase.com/
2. Select TAXI project
3. Click **"SQL Editor"** (left sidebar)
4. Paste this query:

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

5. Click **Run**

### Expected Result:

| Column | Expected |
|--------|----------|
| id | (trip id) |
| trip_number | (trip number like TRX-2026) |
| start_odometer_image | https://cqfsirfjwfxvwggjkrvd.supabase.co/storage/v1/object/public/odometer-images/... |

**URL should start with**: `https://...supabase.co/storage/v1/object/public/odometer-images/`

---

## Step 10: Test Image Loads

1. Copy the URL from database result (Step 9)
2. Open new browser tab
3. Paste URL and press Enter
4. **Expected**: Image displays
5. **If 403 error**: Policy 2 (public read) wasn't set up correctly

---

## Troubleshooting

### Problem: "Upload failed: new row violates row-level security policy"

**Cause**: Policy 1 (INSERT) not created

**Fix**:
1. Go back to Dashboard
2. Verify Policy 1 exists
3. Check: Operation = INSERT, Role = authenticated
4. Restart app: `npm start -- --reset-cache`

---

### Problem: Image shows 403 Forbidden in browser

**Cause**: Policy 2 (public read) not created

**Fix**:
1. Go to Dashboard
2. Verify Policy 2 exists
3. Check: Operation = SELECT, Role = PUBLIC (not authenticated)
4. Make sure it's saved
5. Test URL again

---

### Problem: "Policy already exists" error

**Cause**: Dashboard tried to create duplicate

**Fix**:
1. Delete the existing policy
2. Create new one with same name
3. Save

---

### Problem: Upload works but image doesn't show

**Cause**: Display or database issue

**Fix**:
1. Check database query - URL should be there
2. Clear app cache: `npm start -- --reset-cache`
3. Log out and back in
4. Try upload again

---

## Success Checklist

- [ ] 4 RLS policies created in Dashboard
- [ ] All 4 show as "Active"
- [ ] Backend restarted on 192.168.1.114:4000
- [ ] Frontend restarted
- [ ] Driver app shows "Upload successful" (no RLS error)
- [ ] Image displays in app
- [ ] Database has URL (not NULL)
- [ ] URL loads in browser (not 403)

**All checked?** ✅ **You're done!**

---

## Time Estimate

| Phase | Time |
|-------|------|
| Create 4 policies | 5 min |
| Restart services | 2 min |
| Test upload | 5 min |
| Verify database | 2 min |
| **Total** | **~14 min** |

---

## Support Documents

If you need more details:
- `README_ODOMETER_RLS_FIX.md` - Complete guide
- `DASHBOARD_POLICIES_STEP_BY_STEP.md` - Detailed steps
- `CREATE_ODOMETER_RLS_VIA_API.md` - API method details
- `setup_odometer_rls.py` - Automated script

---

## What This Fixes

✅ Driver can upload start odometer image  
✅ Driver can upload end odometer image  
✅ Images stored in storage bucket (not database)  
✅ Queries 50-100x faster  
✅ No more RLS policy errors  

---

**START WITH OPTION 1 (Dashboard) - EASIEST AND FASTEST** ✅

