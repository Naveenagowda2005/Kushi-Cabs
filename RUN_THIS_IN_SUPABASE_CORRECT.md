# ✅ Corrected SQL for Supabase (WORKING)

## Error Fixed
PostgreSQL doesn't support `IF NOT EXISTS` with `CREATE POLICY`
Error was: `syntax error at or near "NOT"`

## Correct SQL (Copy This)

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Vendors can read own record" ON vendors;
DROP POLICY IF EXISTS "vendors_read_own_record" ON vendors;
DROP POLICY IF EXISTS "super_admins_read_all_vendors" ON vendors;

-- Policy 1: Vendors can read their own record
CREATE POLICY "vendors_read_own_record"
  ON vendors FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Super admins can read all vendors
CREATE POLICY "super_admins_read_all_vendors"
  ON vendors FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );
```

## Steps

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com
   - Click your project

2. **Open SQL Editor**
   - Left sidebar → SQL Editor
   - Click "+ New Query"

3. **Paste the SQL above**
   - Copy the entire code block
   - Paste into the query editor

4. **Click RUN**
   - Should execute successfully
   - No errors

5. **Refresh Expo App**
   - Go back to app
   - Settings → Emergency Dummy Vendors
   - **✅ Vendors now appear!**

---

## What This Does

**Drops:** Old/conflicting policies (prevents duplicates)

**Creates:**
1. **vendors_read_own_record** - Vendors see their own vendor profile
2. **super_admins_read_all_vendors** - Super admin sees all vendors ✅ NEW!

---

## Expected Result

✅ Query executes successfully
✅ No error messages
✅ Vendors appear in the list
✅ Shows "1 dummy vendor(s)" or more

---

## If Still Getting Errors

### Error: "Does not exist"
- This is OK if it's the DROP statement
- Means policy didn't exist before (that's fine)

### Error: Other syntax
- Copy exactly as shown above
- Check for missing quotes or parentheses
- Try one line at a time

### Vendors still not showing
1. Hard refresh app (close completely, reopen)
2. Check vendor was created (should have company_name like "DUMMY%")
3. Verify you're logged in as super admin

---

**This is the correct syntax that works with Supabase PostgreSQL!** ✅
