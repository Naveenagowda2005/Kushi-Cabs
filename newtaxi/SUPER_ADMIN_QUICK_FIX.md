# Super Admin Login - Quick Fix (5 Minutes)

## The Issue
Super admin login fails with "Invalid login credentials"

## The Fix
You need to ensure the auth user exists in Supabase with the correct password.

---

## Option A: Using Email (Recommended) ✅

### Fastest Setup:

1. **Go to Supabase Dashboard**
   - Click: Authentication → Users
   - Click: Add user
   - Email: `admin@newtaxi.com`
   - Password: `Admin@123` (or any password you want)
   - Click: Create user

2. **Update Database** (copy-paste this in SQL Editor):
```sql
INSERT INTO users (email, phone, full_name, role_id, is_active)
VALUES ('admin@newtaxi.com', '9686314982', 'Super Admin', 5, true)
ON CONFLICT (email) DO UPDATE SET role_id = 5, is_active = true;
```

3. **Test Login in App**:
   - Select: Super Admin
   - Email: `admin@newtaxi.com`
   - Password: `Admin@123`
   - Click: Login

✅ **Done!** You should be logged in.

---

## Option B: Using Phone-Based Email ✅

### Alternative Setup:

1. **Go to Supabase Dashboard**
   - Click: Authentication → Users
   - Click: Add user
   - Email: `9686314982@kushicabs.phone`
   - Password: `otp-verified-user`
   - Click: Create user

2. **Update Database** (copy-paste this in SQL Editor):
```sql
INSERT INTO users (phone, email, full_name, role_id, is_active)
VALUES ('9686314982', '9686314982@kushicabs.phone', 'Super Admin', 5, true)
ON CONFLICT (phone) DO UPDATE SET role_id = 5, is_active = true;
```

3. **Test Login in App**:
   - Select: Super Admin
   - Email/Phone: `9686314982` (will be auto-converted)
   - Password: `otp-verified-user`
   - Click: Login

✅ **Done!** You should be logged in.

---

## What Changed in Code

The app now tries **multiple email formats** for super_admin:

```
If you enter: admin@newtaxi.com
  → Tries: admin@newtaxi.com ✅

If you enter: 9686314982
  → Tries: 9686314982@kushicabs.phone ✅
  → Also tries: 9686314982 (if that's the email)

If you enter: 9686314982@kushicabs.phone
  → Tries: 9686314982@kushicabs.phone ✅
```

**So either setup works!**

---

## Troubleshooting

### Still getting "Invalid credentials"?

1. **Check auth user exists**:
   - Go to Supabase → Authentication → Users
   - Search for your email
   - If not there → create it (see above)

2. **Check password**:
   - The password MUST match exactly what's in Supabase
   - Case-sensitive
   - No extra spaces

3. **Check database user**:
   - Run in SQL Editor:
   ```sql
   SELECT email, phone, role_id, is_active FROM users WHERE email LIKE '%admin%';
   ```
   - Should see your user with `role_id = 5` and `is_active = true`

4. **Test in Supabase directly**:
   - Go to Supabase Auth Playground
   - Try to sign in with your email/password
   - If this works in playground but not in app → app issue
   - If this fails in playground too → auth setup issue

---

## Console Logs You'll See

### Success:
```
LOG  Super Admin login attempt with: admin@newtaxi.com
LOG  Super Admin: Trying email formats: ["admin@newtaxi.com"]
LOG  Super Admin: Trying email: admin@newtaxi.com
LOG  Super Admin: Authentication succeeded with: admin@newtaxi.com
LOG  Super Admin authenticated successfully
```

### Failure:
```
LOG  Super Admin login attempt with: admin@newtaxi.com
LOG  Super Admin: Trying email formats: ["admin@newtaxi.com"]
LOG  Super Admin: Trying email: admin@newtaxi.com
LOG  Super Admin: Authentication failed with: admin@newtaxi.com error: Invalid login credentials
ERROR  Super Admin login error: Invalid login credentials
```

If you see the failure logs, check:
- Auth user exists in Supabase
- Password is correct
- User is confirmed

---

## Summary

✅ Code updated to try multiple email formats
✅ Both email and phone-based setups work
✅ Choose Option A or B above
✅ 5 minutes to get working

**Next Step**: Pick Option A or B and follow the 3 steps. That's it!
