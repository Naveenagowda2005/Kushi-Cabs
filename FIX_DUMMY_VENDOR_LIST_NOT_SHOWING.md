# Fix: Dummy Vendors Not Showing in List ✅

## Problem
- ✅ Dummy vendor creates successfully
- ✅ Message shows success
- ❌ Vendor doesn't appear in the list below
- ❌ Says "0 dummy vendor(s)"

## Root Cause
**RLS (Row Level Security) Policy Issue**

The `vendors` table has a restrictive RLS policy that only allows vendors to read their **own** record. Super admins can't read all vendors because there's no super admin policy on the `vendors` table itself.

### Current Policy (Too Restrictive)
```sql
CREATE POLICY "Vendors can read own record"
  ON vendors FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  
-- This means: Only the vendor owner can read their own vendor record
-- Super admin CAN'T read it
```

## Solution: Add Super Admin Read Policy

### Step 1: Go to Supabase Dashboard
1. Log in to https://supabase.com
2. Click on your project: **kushi-cabs** (or similar)
3. Go to **SQL Editor**
4. Click **+ New Query**

### Step 2: Copy & Execute SQL
Copy and paste this SQL:

```sql
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Vendors can read own record" ON vendors;

-- Policy 1: Vendors can read their own record
CREATE POLICY IF NOT EXISTS "vendors_read_own_record"
  ON vendors FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Super admins can read all vendors (NEW!)
CREATE POLICY IF NOT EXISTS "super_admins_read_all_vendors"
  ON vendors FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );
```

### Step 3: Click **RUN**
- Should execute successfully
- No errors

### Step 4: Verify Policies
Paste this query to verify:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
```

You should see:
```
tablename | policyname
-----------|--------------------------------
vendors    | super_admins_read_all_vendors
vendors    | vendors_read_own_record
```

---

## Test After Fix

### In Expo App:
1. Go back to Settings
2. Pull down to refresh
3. Or click expand button again on "Emergency Dummy Vendors"
4. **✅ Should now show all created dummy vendors!**

### Expected Result:
```
Emergency Dummy Vendors

Phone: 9999888877
Company: Test Vendor
Status: approved

(List appears here)
```

---

## Why This Fix Works

### Before
```
Super Admin query: SELECT * FROM vendors WHERE company_name LIKE 'DUMMY%'
RLS check: Is this user the vendor owner? NO → Denied
Result: ❌ No vendors returned
```

### After
```
Super Admin query: SELECT * FROM vendors WHERE company_name LIKE 'DUMMY%'
RLS check 1: Is this user the vendor owner? NO
RLS check 2: Is this user a super admin? YES → Allowed
Result: ✅ All vendors returned
```

---

## File Reference

The migration code is also in:
- `newtaxi/supabase/migrations/068_vendors_super_admin_read_policy.sql`
- `FIX_VENDOR_LIST_RLS.sql` (quick fix script)

---

## Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Create dummy vendor | ✅ Works |
| 2 | Success message shows | ✅ Works |
| 3 | **Query vendor list** | ❌ **Blocked by RLS** |
| **AFTER FIX** | **Query vendor list** | ✅ **Works** |

---

**Once you run the SQL above, the dummy vendors will appear in the list immediately!** 🎉

The fix is simple - just add the super admin policy to allow reading all vendors.
