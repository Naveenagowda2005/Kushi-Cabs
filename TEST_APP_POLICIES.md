# Test App Policies Navigation

## Quick Test (1 minute)

### Step 1: Hard Refresh
```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```
Wait for app to fully load.

### Step 2: Login as Super Admin
- Use phone + OTP
- Should see Settings tab

### Step 3: Click App Policies
1. In Settings tab
2. You should see "App Policies" card
3. Tap it
4. **Expected**: PolicyManagement screen appears

### Step 4: Edit a Policy
1. Tap "Privacy Policy"
2. Tap to edit
3. Enter test content
4. Tap "Save Policy"
5. **Expected**: Confirmation message shows

### Step 5: Back Button
1. Tap back button (chevron-back icon at top)
2. **Expected**: Returns to Settings tab
3. Tap App Policies again
4. **Expected**: Still works

### Step 6: Verify Policies Show in Driver/Vendor
1. Logout super admin
2. Login as driver
3. Go to Profile
4. Scroll to menu
5. **Expected**: See all 5 policies listed
6. Tap one
7. **Expected**: See the content super admin entered

## ✅ Success Checklist

- [ ] App Policies card is clickable in Settings
- [ ] PolicyManagement screen opens
- [ ] Can see all 5 policy types
- [ ] Can edit Privacy Policy
- [ ] Can save policy
- [ ] Back button works
- [ ] Returns to Settings
- [ ] Driver can see policy in profile menu
- [ ] Driver can view policy content
- [ ] Vendor can see policy in profile menu
- [ ] Vendor can view policy content

## ❌ Troubleshooting

**App Policies card not clickable:**
- Hard refresh: Ctrl+Shift+R
- Check browser console (F12) for errors

**PolicyManagement screen doesn't open:**
- Check console for navigation errors
- Verify you logged in as super admin
- Make sure Settings tab is active

**Back button doesn't work:**
- Close and reopen app
- Try hard refresh
- Check console for errors

**Can't save policies:**
- Check Supabase connection
- Verify RLS policies are in place
- Check console for errors

## Console Commands to Debug

```javascript
// Check localStorage for session
localStorage.getItem('superAdminSession')

// Check if navigation works
// Look for navigation calls in console
```

---

**Ready to test? Start with Step 1!** 🚀
