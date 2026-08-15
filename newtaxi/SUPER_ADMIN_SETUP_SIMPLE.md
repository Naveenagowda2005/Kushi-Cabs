# Super Admin Setup - Simple

## What You Need

**Super admin credentials**:
- Phone: `9686314982`
- Password: `otp-verified-user`
- Role: `super_admin`

That's it! The app will automatically convert the phone to email format.

---

## Setup Steps (2 Minutes)

### Step 1: Create Auth User in Supabase

1. Go to: **Supabase Dashboard**
2. Click: **Authentication**
3. Click: **Users**
4. Click: **Add user**

Fill in:
- **Email**: `9686314982@kushicabs.phone`
- **Password**: `otp-verified-user`
- Click: **Create user**

### Step 2: Create Database User

Run this in **Supabase SQL Editor**:

```sql
INSERT INTO users (phone, email, full_name, role_id, is_active)
VALUES ('9686314982', '9686314982@kushicabs.phone', 'Super Admin', 5, true)
ON CONFLICT (phone) DO UPDATE SET 
  email = '9686314982@kushicabs.phone',
  role_id = 5, 
  is_active = true;
```

### Step 3: Test Login

In the app:
- Select: **Super Admin** role
- Enter: **9686314982** (just the phone number)
- Enter: **otp-verified-user** (the password)
- Click: **Login**

✅ **Done!** You should be logged in.

---

## How It Works

```
User enters:
  Phone: 9686314982
  Password: otp-verified-user

App converts:
  9686314982 → 9686314982@kushicabs.phone

App tries to login:
  Email: 9686314982@kushicabs.phone
  Password: otp-verified-user

Supabase validates and authenticates ✅
```

---

## Expected Console Logs

### Success:
```
LOG  Super Admin login attempt with: 9686314982
LOG  Super Admin: Phone: 9686314982 Email: 9686314982@kushicabs.phone
LOG  Super Admin authenticated successfully
LOG  Unified fetchUserProfile called for user: (user-id)
LOG  Unified auto-selecting role: super_admin
```

### Failure:
```
LOG  Super Admin login attempt with: 9686314982
LOG  Super Admin: Phone: 9686314982 Email: 9686314982@kushicabs.phone
ERROR  Super Admin login error: Invalid login credentials
```

If you see failure, check:
1. Auth user exists in Supabase with email `9686314982@kushicabs.phone`
2. Password is exactly `otp-verified-user`
3. Database user exists with phone `9686314982`

---

## Verify Setup

### Check Auth User
1. Go to Supabase → Authentication → Users
2. Search: `9686314982`
3. Should find user with email: `9686314982@kushicabs.phone`

### Check Database User
Run in SQL Editor:
```sql
SELECT id, phone, email, full_name, role_id, is_active 
FROM users 
WHERE phone = '9686314982';
```

Should return one row with:
- `role_id` = 5 (super_admin)
- `is_active` = true
- `email` = `9686314982@kushicabs.phone`

---

## Login Details

When you want to login as super_admin, use:

| Field | Value |
|-------|-------|
| **Role** | super_admin |
| **Phone/Email** | 9686314982 |
| **Password** | otp-verified-user |

---

## That's It!

✅ Super admin setup complete
✅ Phone-based authentication
✅ Works exactly like drivers
✅ Simple and consistent

**Next**: Login and test!
