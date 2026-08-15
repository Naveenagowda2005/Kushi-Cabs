# Convert Roles Table to Numeric IDs (2, 3, 5)

## Goal
Change NEW account roles from UUID format to numeric IDs (2=vendor, 3=driver, 5=super_admin) to match OLD account.

---

## Quick Steps (5 minutes)

### Step 1: Go to NEW Account
- Open: https://cqfsirfjwfxvwggjkrvd.supabase.co
- SQL Editor → New Query

### Step 2: Copy & Run Script
1. Open file: `CONVERT_ROLES_STEP_BY_STEP.sql`
2. Copy ALL content
3. Paste into SQL Editor
4. Click **Run**

### Step 3: Verify
You should see:

```
FINAL VERIFICATION - Everything Ready!
total_roles: 3
users_with_valid_roles: [your user count]
Ready to import user data from OLD account!
```

---

## What Gets Changed

**BEFORE (UUID format):**
```
id: a1b2c3d4-e5f6-4a5b-8c9d-0e1f2g3h4i5j
name: vendor
```

**AFTER (numeric format):**
```
id: 2
name: vendor
```

---

## New Role IDs

| ID | Name | Use |
|----|------|-----|
| 2 | vendor | Company/vendor accounts |
| 3 | driver | Driver accounts |
| 5 | super_admin | Admin accounts |

---

## Process

1. ✅ Create new roles table with numeric IDs (2, 3, 5)
2. ✅ Map old UUIDs to new numeric IDs
3. ✅ Update all users with new numeric role_ids
4. ✅ Replace old roles table with new one
5. ✅ Clean up temporary tables

---

## After Conversion

✅ NEW account roles now match OLD account format  
✅ All users updated with numeric role_ids  
✅ Ready to import users from OLD account  
✅ No more UUID vs numeric mismatch  

---

## Next: Import Users

Now you can import users from OLD account without role_id conflicts:

```sql
-- OLD account role IDs work directly now
INSERT INTO users (..., role_id, ...)
VALUES
('user-uuid', 'phone', 'name', 2, 'email'),  -- 2 = vendor
('user-uuid', 'phone', 'name', 3, 'email'),  -- 3 = driver
('user-uuid', 'phone', 'name', 5, 'email');  -- 5 = super_admin
```

---

## What if Something Goes Wrong?

### Issue: "Cannot drop roles table - constraint violation"
→ The roles_old_backup table still has references  
→ Don't worry, the new roles table is active  
→ You can drop the backup table later

### Issue: "Users don't have role assignments"
→ Run STEP 7 verification query to check  
→ Should show user count by role

### Issue: "ERROR - role_id not found"
→ Make sure you ran all steps in order  
→ The mapping table needs to exist for the UPDATE

---

## Files

- `CONVERT_ROLES_STEP_BY_STEP.sql` - Main conversion script (EASIEST)
- `CHANGE_ROLES_TO_NUMERIC_IDS.sql` - Alternative (more detailed)

**Recommendation:** Use `CONVERT_ROLES_STEP_BY_STEP.sql`

---

## Timeline

⏱️ **2 min** - Backup current state  
⏱️ **1 min** - Create new roles table  
⏱️ **1 min** - Create mapping  
⏱️ **1 min** - Update users  
⏱️ **1 min** - Verify

**Total: ~5 minutes** ⚡

---

## Done!

After conversion, your roles table will have numeric IDs matching the OLD account. Everything is ready for user data import! 🚀
