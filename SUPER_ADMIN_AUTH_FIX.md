# Super Admin Setup - The Right Way

## The Problem
The `users` table has a foreign key constraint to `auth.users`. You can't insert into `users` without first creating an auth user.

## Solution: 2-Step Process

### Step 1: Create Auth User (via Supabase UI)

Go to your Supabase Dashboard:
1. https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** (left sidebar)
4. Click **Users** tab
5. Click **"Invite"** or **"Create new user"**
6. Enter:
   - **Email:** 9686314982@kushicabs.phone
   - **Password:** (set a password or auto-generate)
   - **Phone:** 9686314982 (optional field)
7. Click **Create user**

**Important:** Copy the **User ID** (UUID) shown. You'll need it for step 2.

### Step 2: Create User Profile (SQL)

Now that the auth user exists, add the profile:

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
  '<PASTE_USER_ID_HERE>',  -- Replace with the UUID from Step 1
  '9686314982@kushicabs.phone',
  '9686314982',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
)
RETURNING id, email, phone, full_name;
```

**Steps:**
1. Go to SQL Editor in Supabase
2. Replace `<PASTE_USER_ID_HERE>` with the User ID from Step 1
3. Run the query
4. ✅ Super admin created!

---

## Example

If your User ID from Step 1 was: `550e8400-e29b-41d4-a716-446655440000`

Your SQL becomes:

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
  '550e8400-e29b-41d4-a716-446655440000',
  '9686314982@kushicabs.phone',
  '9686314982',
  'Super Admin',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  true
)
RETURNING id, email, phone, full_name;
```

---

## Why This Approach?

- ✅ Respects foreign key constraints
- ✅ Keeps auth and profile data synchronized
- ✅ Follows Supabase best practices
- ✅ Works with RLS policies

---

## After Setup: Login

1. Open the Expo app
2. Select role: **Super Admin**
3. Enter phone: **9686314982**
4. Enter password: **Whatever you set in Step 1**
5. ✅ You're logged in!

---

## If Password Login Doesn't Work

If the app uses OTP instead of password:

In the Supabase UI after creating the user, you can send them a password reset link which they won't use, but it might trigger an OTP system. Or check if your app's auth flow supports direct password login.

---

## Alternative: Using Supabase Admin API

If you have the Supabase admin key, you can create users via API:

```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "9686314982@kushicabs.phone",
    "password": "admin123456",
    "phone": "9686314982",
    "user_metadata": {
      "full_name": "Super Admin"
    }
  }'
```

But the UI method above is simpler for now.

---

## Checklist

- [ ] Created auth user via Supabase UI
- [ ] Copied the User ID (UUID)
- [ ] Updated SQL with the User ID
- [ ] Ran SQL successfully
- [ ] User profile created in database
- [ ] Can login in app
