# DO THIS NOW - Super Admin Setup (2 Minutes)

## Step 1: Copy This SQL (SAFE - No Deletion)

```sql
UPDATE users 
SET 
  phone = '9686314982',
  email = '9686314982@kushicabs.phone',
  full_name = 'Super Admin',
  is_active = true
WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin');

SELECT id, phone, email, full_name, role_id, is_active 
FROM users 
WHERE role_id = (SELECT id FROM roles WHERE name = 'super_admin');
```

## Step 2: Go to Supabase Dashboard

1. Click: **SQL Editor**
2. Paste the SQL above
3. Click: **Execute**
4. You should see 1 row returned with phone `9686314982`

## Step 3: Test Login in App

- Role: **super_admin**
- Phone: **9686314982**
- Password: **otp-verified-user**
- Click: **Login**

## Done! ✅

That's it. You're done.

**Note**: This SQL UPDATES the existing super_admin user (doesn't delete), so all historical data is preserved.
