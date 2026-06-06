# Quick Test Guide - Policy Management System

## ⚡ Fast Setup (2 minutes)

### 1. Hard Refresh Frontend
```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```
Wait for app to fully load.

### 2. Test Super Admin Access
1. Login as super admin
2. Tap **Settings** tab (at the top)
3. You should see **"App Policies"** card
4. Tap it

### 3. Create a Test Policy
1. In Policy Management screen, tap **"Privacy Policy"**
2. Tap to edit
3. Enter: `This is a test privacy policy - Updated by Super Admin`
4. Tap **"Save Policy"**
5. Confirm: "Privacy Policy updated successfully"

### 4. Test Driver Access
1. Logout (if same device) or open another browser
2. Login as driver
3. Tap **Profile** tab (bottom right)
4. Scroll down to menu items
5. Tap **"Privacy Policy"**
6. You should see: `This is a test privacy policy - Updated by Super Admin`

### 5. Test Vendor Access
1. Logout and login as vendor
2. Tap **Profile** tab (bottom right)
3. Scroll down to menu items
4. Tap **"Privacy Policy"**
5. You should see SAME content as driver

## ✅ What Should Happen

**Super Admin:**
- Settings has "App Policies" card
- Can edit all 5 policy types
- See "Configured" badge after editing
- See content preview

**Driver:**
- Profile menu has 5 policy items
- Each opens full policy content
- Shows super admin's content

**Vendor:**
- Profile menu has 5 policy items
- Each opens full policy content
- Shows SAME super admin's content as driver

## ❌ If Something Doesn't Work

1. **Policy Management not appearing in Settings**
   - Hard refresh: Ctrl+Shift+R
   - Check browser console for errors (F12)

2. **"App Policies" screen is blank**
   - Check Supabase - is migration applied?
   - Go to SQL Editor and run: `SELECT COUNT(*) FROM app_policies;`

3. **Can't edit policies**
   - Check RLS policies in Supabase
   - Verify logged in as super admin (role_id = 1)

4. **Drivers/Vendors can't see policy content**
   - Hard refresh browser
   - Check RLS policies allow read
   - Verify useAppPolicies hook loaded

5. **Changes don't appear immediately**
   - Manual refresh (pull down if mobile)
   - Wait 10 seconds for auto-refresh
   - Check console for errors

## 🔍 Quick Checks

**In Browser Console (F12):**
```javascript
// Check if hook is working
// Look for: "LOG useAppPolicies: policies loaded"
```

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Run: `SELECT policy_type, content FROM app_policies;`
3. Should show updated policies

**Routes to Verify:**
- Super Admin: Settings → (PolicyManagement screen)
- Driver: Profile → (ViewPolicy screen with policyType param)
- Vendor: Profile → (ViewPolicy screen with policyType param)

## 📱 Testing Checklist

- [ ] Super admin can access Settings
- [ ] App Policies card appears in Settings
- [ ] Can open Policy Management screen
- [ ] Can edit Privacy Policy
- [ ] Can save Privacy Policy
- [ ] Driver sees policy in menu
- [ ] Driver can view policy content
- [ ] Vendor sees policy in menu
- [ ] Vendor can view policy content
- [ ] Content matches what super admin entered
- [ ] Multiple policies work (test 2-3)
- [ ] All 5 policy types accessible

## 🚀 Next Steps After Testing

1. Update all 5 policies with real content
2. Test on real devices (iOS/Android)
3. Test with multiple users
4. Monitor console for errors
5. Check Supabase logs for RLS issues

---

**Ready to test? Start with Step 1: Hard Refresh! 🎯**
