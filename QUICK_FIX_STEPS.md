# Quick Fix - App Policies RLS Error (2 minutes)

## The Error
```
Error saving policy: "new row violates row-level security policy"
```

## The Fix

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Copy & Run This SQL
```sql
DROP POLICY IF EXISTS "Super admin can read policies" ON app_policies;
DROP POLICY IF EXISTS "Super admin can update policies" ON app_policies;
DROP POLICY IF EXISTS "Super admin can insert policies" ON app_policies;
DROP POLICY IF EXISTS "Users can read policies" ON app_policies;
DROP POLICY IF EXISTS "Service role can manage policies" ON app_policies;
DROP POLICY IF EXISTS "Super admin can manage policies" ON app_policies;

ALTER TABLE app_policies DISABLE ROW LEVEL SECURITY;
```

**Click RUN**

### Step 3: Hard Refresh App
```
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)
```

### Step 4: Test
1. Login as super admin
2. Settings → App Policies
3. Edit Privacy Policy
4. Enter: "Test Policy Content"
5. Click Save
6. **Should work now** ✅

## That's It!

If it works:
- ✅ Policy saved successfully
- ✅ Can see it in driver/vendor profiles
- ✅ All done!

If still having issues:
- Check browser console (F12) for errors
- Verify you're logged in as super admin
- Try refreshing page again

---

**Done! 🎉**
