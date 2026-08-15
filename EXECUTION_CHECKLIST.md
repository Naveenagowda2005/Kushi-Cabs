# Execution Checklist - Odometer RLS Fix

## Pre-Implementation

### Understanding
- [ ] Read: `START_HERE_ODOMETER.md`
- [ ] Read: `DO_THIS_NOW_ODOMETER_FIX.md`
- [ ] Understand: You need to create 4 RLS policies
- [ ] Confirm: No code changes needed

### Choose Method
- [ ] Decided: Dashboard (Option 1) OR
- [ ] Decided: Python script (Option 2) OR
- [ ] Decided: cURL commands (Option 3)

---

## Implementation Phase

### For Dashboard Method (Option 1)

#### Step 1: Access Dashboard
- [ ] Go to: https://app.supabase.com/
- [ ] Logged in with your account
- [ ] Can see TAXI project

#### Step 2: Navigate to Storage
- [ ] Clicked: Storage in left sidebar
- [ ] Found: odometer-images bucket
- [ ] Clicked: odometer-images to open

#### Step 3: Open Policies
- [ ] Found: Policies tab or gear icon ⚙️
- [ ] Clicked: Policies or "Edit RLS Policies"
- [ ] See: Policies editor interface

#### Step 4: Create Policy 1
- [ ] Name: "Authenticated users can upload odometer images"
- [ ] Operation: INSERT
- [ ] Role: authenticated
- [ ] Condition: `bucket_id = 'odometer-images'`
- [ ] Clicked: Save
- [ ] Status: ✅ Showing as created

#### Step 5: Create Policy 2
- [ ] Name: "Anyone can view odometer images"
- [ ] Operation: SELECT
- [ ] Role: public
- [ ] Condition: `bucket_id = 'odometer-images'`
- [ ] Clicked: Save
- [ ] Status: ✅ Showing as created

#### Step 6: Create Policy 3
- [ ] Name: "Authenticated users can view odometer images"
- [ ] Operation: SELECT
- [ ] Role: authenticated
- [ ] Condition: `bucket_id = 'odometer-images'`
- [ ] Clicked: Save
- [ ] Status: ✅ Showing as created

#### Step 7: Create Policy 4
- [ ] Name: "Users can delete their own odometer images"
- [ ] Operation: DELETE
- [ ] Role: authenticated
- [ ] Condition: `bucket_id = 'odometer-images' AND owner_id = auth.uid()`
- [ ] Clicked: Save
- [ ] Status: ✅ Showing as created

#### Step 8: Verify All Policies
- [ ] Count: 4 policies visible
- [ ] Status: All marked as "Active" or "Enabled"
- [ ] Dashboard: No error messages

---

### For Python Script Method (Option 2)

#### Step 1: Get Access Token
- [ ] Opened: https://app.supabase.com/account/tokens
- [ ] Created: Personal Access Token
- [ ] Copied: Token value to clipboard
- [ ] Saved: Token temporarily (keep secure)

#### Step 2: Run Script
- [ ] Terminal: Navigated to project root
- [ ] Command: `python3 setup_odometer_rls.py YOUR_TOKEN`
- [ ] Replaced: YOUR_TOKEN with actual token
- [ ] Executed: Script ran
- [ ] Result: Shows "All policies created successfully" ✅

#### Step 3: Verify in Dashboard
- [ ] Opened: Supabase Dashboard Storage
- [ ] Found: odometer-images bucket
- [ ] Checked: 4 policies are visible and active
- [ ] Confirmed: Matches the 4 from script

---

### For cURL Method (Option 3)

#### Step 1: Get Access Token
- [ ] Same as Python method
- [ ] Copied: Token value

#### Step 2: Run cURL Commands
- [ ] Terminal: Ready to run commands
- [ ] Replaced: YOUR_ACCESS_TOKEN_HERE in all 4 commands
- [ ] Executed: All 4 cURL commands
- [ ] Result: Each returns success response

#### Step 3: Verify
- [ ] API responses: All show 201 or 200 status
- [ ] Dashboard: All 4 policies visible and active

---

## Post-Implementation

### Restart Services

#### Backend
- [ ] Terminal 1: Opened
- [ ] Killed: Existing backend process (Ctrl+C)
- [ ] Command: `cd backend && npm start`
- [ ] Output: "Server listening on http://192.168.1.114:4000"
- [ ] Status: ✅ Backend running

#### Frontend
- [ ] Terminal 2: Opened
- [ ] Killed: Existing frontend process (Ctrl+C)
- [ ] Command: `cd apps/unified && npm start`
- [ ] Status: ✅ Frontend ready (waiting for a/i prompt)

---

### Test Upload

#### Login as Driver
- [ ] Pressed: 'a' for Android or 'i' for iOS
- [ ] App opened: Driver login screen
- [ ] Entered: Driver phone number
- [ ] Entered: OTP (123456 if test mode)
- [ ] Logged in: ✅ Successfully authenticated

#### Find Active Trip
- [ ] Screen: Home/trips screen displayed
- [ ] Trip found: An active trip assigned by vendor
- [ ] Clicked: Trip to open details

#### Upload Odometer Image
- [ ] Button found: "Upload Start Odometer" or similar
- [ ] Clicked: Upload button
- [ ] Photo option: Took photo or selected from library
- [ ] Image selected: ✅ Photo chosen
- [ ] Clicked: Use/Save/Upload
- [ ] Result: ✅ "Upload successful" message appeared
- [ ] No error: ✅ NO RLS policy error
- [ ] Image display: ✅ Image visible in app

---

### Verify Database

#### Check Database
- [ ] Dashboard: SQL Editor opened
- [ ] Query: Pasted verification query
- [ ] Executed: SELECT statement
- [ ] Result: Got 1 row with odometer image

#### Verify URL Format
- [ ] Column: start_odometer_image
- [ ] Type: NOT NULL (has data)
- [ ] Format: Starts with `https://`
- [ ] Contains: `supabase.co/storage/v1/object/public/odometer-images/`
- [ ] NOT: Base64 string (long encoded text)

#### Test Image Loading
- [ ] URL: Copied from database result
- [ ] Browser: Opened new tab
- [ ] Pasted: URL into address bar
- [ ] Loaded: ✅ Image displays (not 403 error)
- [ ] Result: ✅ Image visible in browser

---

### Final Verification

#### Complete Workflow Test
- [ ] Driver app: Showing trip with uploaded image
- [ ] Image display: ✅ Visible in app
- [ ] Performance: Fast (instant, not slow)
- [ ] No errors: ✅ No messages or crashes

#### Admin Views
- [ ] Vendor app: Can see trip with images ✅
- [ ] Admin dashboard: Can view trip with images ✅
- [ ] All users: Can see odometer images properly ✅

---

## Success Criteria

### All Must Be True
- [ ] 4 RLS policies created in Supabase
- [ ] All 4 policies showing as "Active"
- [ ] Backend restarted on 192.168.1.114:4000
- [ ] Frontend restarted successfully
- [ ] Driver can upload start odometer image
- [ ] NO RLS policy error message
- [ ] Image URL in database (not NULL)
- [ ] Image URL format: https://...supabase.co/storage/...
- [ ] Image loads in browser (no 403)
- [ ] Image displays in app
- [ ] Vendor can view trip with images
- [ ] Admin can view trip with images

### Result
If all above checked: ✅ **FIX SUCCESSFUL**

---

## Troubleshooting if Needed

### If Upload Still Fails
- [ ] Read: DO_THIS_NOW_ODOMETER_FIX.md (Troubleshooting section)
- [ ] Checked: All 4 policies created (re-verify in Dashboard)
- [ ] Checked: All policies marked as "Active"
- [ ] Restarted: Backend AND frontend (both)
- [ ] Cleared: App cache: `npm start -- --reset-cache`
- [ ] Retried: Upload again

### If Image Shows 403 in Browser
- [ ] Verified: Policy 2 (public SELECT) exists
- [ ] Checked: Role = public (NOT authenticated)
- [ ] Checked: Condition = `bucket_id = 'odometer-images'`
- [ ] Resaved: The policy
- [ ] Tested: URL again

### If Database URL is NULL
- [ ] Upload might have failed silently
- [ ] Try: Upload again
- [ ] Check: Backend logs for errors
- [ ] Verify: Network connectivity

---

## Time Log

| Phase | Planned | Actual |
|-------|---------|--------|
| Read documentation | 5 min | ___ min |
| Create policies | 5 min | ___ min |
| Restart services | 2 min | ___ min |
| Test upload | 5 min | ___ min |
| Verify database | 2 min | ___ min |
| **Total** | **19 min** | **___ min** |

---

## Notes

Space for any issues encountered:

```




```

---

## Sign-Off

- [ ] All checks completed
- [ ] Fix verified working
- [ ] Ready to proceed with next tasks
- [ ] Date completed: ___________
- [ ] Time taken: ___________

---

**Congratulations! Odometer upload RLS fix is complete!** ✅

