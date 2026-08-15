# Role ID Mapping: OLD Account → NEW Account

## The Problem

OLD Account uses numeric role IDs:
- 2 = vendor
- 3 = driver
- 5 = super_admin

NEW Account uses UUID role IDs (different format).

## Solution: Map Roles Before Importing Users

### Step 1: Get NEW Account Role UUIDs

Go to NEW Account: https://cqfsirfjwfxvwggjkrvd.supabase.co

SQL Editor → New Query → Run this:

```sql
SELECT id, name FROM roles ORDER BY id;
```

This will show you the NEW account role UUIDs. Write them down:

```
vendor role_uuid: ___________
driver role_uuid: ___________
super_admin role_uuid: ___________
```

### Step 2: Create Role Mapping

Once you have the UUIDs, use this mapping when importing users:

**OLD role_id → NEW role_id (UUID)**

```
2 (vendor) → [UUID from step 1]
3 (driver) → [UUID from step 1]
5 (super_admin) → [UUID from step 1]
```

### Step 3: Transform User Data

When preparing user data for import, replace role IDs:

**Before (from OLD account):**
```sql
INSERT INTO users (id, phone, name, role_id, email)
VALUES
('uuid-1', '9876543210', 'John', 2, 'john@example.com'),  -- role_id = 2 (vendor)
('uuid-2', '9876543211', 'Jane', 3, 'jane@example.com');   -- role_id = 3 (driver)
```

**After (for NEW account with correct UUIDs):**
```sql
INSERT INTO users (id, phone, name, role_id, email)
VALUES
('uuid-1', '9876543210', 'John', 'vendor-uuid-from-new-account', 'john@example.com'),
('uuid-2', '9876543211', 'Jane', 'driver-uuid-from-new-account', 'jane@example.com');
```

---

## Quick Steps

1. ✅ Run the SELECT query above in NEW account to get role UUIDs
2. ✅ Note the 3 role UUIDs
3. ✅ Replace numeric IDs with UUIDs in user import data
4. ✅ Import users with correct role IDs
5. ✅ Then import active_sessions (user IDs will exist)

---

## Role Name to ID Mapping

| OLD ID | NEW Name | NEW UUID (run query to get) |
|--------|----------|---------------------------|
| 2 | vendor | ??? |
| 3 | driver | ??? |
| 5 | super_admin | ??? |

Fill in the ??? with values from the SELECT query.

---

## After You Have the UUIDs

Update your user import SQL with the correct role_id values, and everything will work! 🚀
