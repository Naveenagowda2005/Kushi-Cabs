# Super Admin Setup - Step by Step (With Screenshots Guide)

## Overview
Creating a super admin involves 2 steps:
1. Create auth user (via Supabase UI)
2. Create user profile (via SQL)

---

## STEP 1: Create Auth User

### 1.1 Go to Supabase Dashboard
- URL: https://supabase.com/dashboard
- Select your project

### 1.2 Click Authentication
```
Left Sidebar:
├── Project Settings ← You are here
├── SQL Editor
├── Database
├── Authentication ← Click this
```

### 1.3 Click Users Tab
```
Top tabs:
├── Users ← Click here
├── Providers
├── Policies
├── Logs
```

### 1.4 Create New User

Click **"Invite"** or **"Create new user"** button

Fill in:
```
┌─────────────────────────────────────┐
│ Email: 9686314982@kushicabs.phone  │
│ Password: (auto-generate or set)   │
│ Phone: 9686314982 (optional)       │
└─────────────────────────────────────┘
```

Click **"Create user"**

### 1.5 Copy User ID

After creation, you'll see:
```
┌──────────────────────────────────────────────┐
│ User ID: 550e8400-e29b-41d4-a716-446655... │ ← Copy this
│ Email: 9686314982@kushicabs.phone          │
│ Status: Not confirmed                       │
└──────────────────────────────────────────────┘
```

**IMPORTANT:** Copy the full User ID (UUID)

---

## STEP 2: Create User Profile

### 2.1 Go to SQL Editor
```
Left Sidebar:
├── Authentication (where you came from)
├── SQL Editor ← Click here
```

### 2.2 Click New Query
Button at top: **"New Query"** or **"+"**

### 2.3 Copy SQL Template
Use this template from: `newtaxi/SUPER_ADMIN_TEMPLATE.sql`

```sql
INSERT INTO users (
  id,
  email,
  phone,
  full_name,
  role_id,
  is_active
)
VALUES (
  'YOUR_USER_ID_HERE',  -- ← PASTE THE UUID HERE
  '9686314982@kushicabs.phone',
  '9686314982',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
)
RETURNING 
  id as "User ID",
  email,
  phone,
  full_name,
  'SUCCESS' as status;
```

### 2.4 Replace the Placeholder

Change this line:
```
'YOUR_USER_ID_HERE',
```

To your copied User ID:
```
'550e8400-e29b-41d4-a716-446655440000',
```

Full example:
```sql
INSERT INTO users (
  id,
  email,
  phone,
  full_name,
  role_id,
  is_active
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  ← Your UUID
  '9686314982@kushicabs.phone',
  '9686314982',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
)
RETURNING 
  id as "User ID",
  email,
  phone,
  full_name,
  'SUCCESS' as status;
```

### 2.5 Click Run
Button: **Run** (▶️) or press **Ctrl+Enter**

### 2.6 Verify Success
You should see:
```
┌──────────────────────────────────────────┐
│ User ID        | 550e8400-e29b-41d4...  │
│ email          | 9686314982@kushicabs..│
│ phone          | 9686314982            │
│ full_name      | Super Admin           │
│ status         | SUCCESS               │
└──────────────────────────────────────────┘
```

✅ **Super Admin Created!**

---

## STEP 3: Login in App

### 3.1 Open Expo App

On your phone/emulator, open the app

### 3.2 Select Role: Super Admin

Role Selection Screen:
```
┌─────────────────────┐
│ Super Admin         │ ← Tap this
│ (System Admin...)   │
│ [TAP]               │
└─────────────────────┘
```

### 3.3 Enter Phone

Login Screen:
```
Phone: 9686314982 ← Enter this
[Next]
```

### 3.4 Enter Password

Password Screen:
```
Password: (whatever you set in Step 1.4)
[Login]
```

Or if using OTP:
```
Wait for SMS
OTP: XXXX
[Submit]
```

### 3.5 Success!

You should see the **Super Admin Dashboard** with:
- ✓ Trips Screen
- ✓ Drivers Screen
- ✓ Vendors Screen
- ✓ Settings Screen

---

## Quick Reference

| Field | Value |
|-------|-------|
| Phone | 9686314982 |
| Email | 9686314982@kushicabs.phone |
| Role | Super Admin |
| Password | (what you set) |

---

## Troubleshooting

### "User ID not found in auth"
- Make sure you copied the full UUID from Step 1
- Check you didn't accidentally add extra spaces

### "Role super_admin not found"
- Migrations might not have been applied
- Run: `supabase db push` in the `newtaxi` directory

### "Unique constraint violation on phone"
- The phone number already exists
- Use a different phone number

---

## Files Reference

- 📄 `SUPER_ADMIN_AUTH_FIX.md` - Detailed explanation
- 📄 `newtaxi/SUPER_ADMIN_TEMPLATE.sql` - SQL template
- 📄 `START_HERE_FRESH_ACCOUNT.md` - Overview

---

**You got this!** 🚀 Follow the steps above and you'll have a working admin account.
