# Super Admin Setup Guide - Fresh Account

## Overview
This guide will help you create a super admin user in your new Supabase account for testing the admin dashboard.

## Prerequisites
✅ New Supabase account created
✅ All migrations have been applied
✅ Database is ready

## Step 1: Run the SQL Script

### Option A: Using Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Open file: `newtaxi/ADD_SUPER_ADMIN_NEW_ACCOUNT.sql`
6. Copy all the content
7. Paste into the SQL Editor
8. Click **"Run"** button (▶️)

### Option B: Using Command Line
```bash
cd newtaxi
supabase db push  # If migrations not yet applied
# Then run the SQL script manually via dashboard
```

## Step 2: Note the User ID

After running the script, you'll see output like:

```
User ID                              | email                      | phone        | full_name   
550e8400-e29b-41d4-a716-446655440000 | 9686314982@kushicabs.phone | 9686314982   | Super Admin
```

**Copy this User ID** - you'll need it for verification.

## Step 3: Test Super Admin Login

### On the App:

1. Open the app (should be running on Expo)
2. You should see the **Role Selection Screen**
3. Tap **"Super Admin"** role
4. You'll be taken to the login screen
5. Enter phone: **9686314982**
6. Wait for OTP (it should come to your SMS backend)
7. Enter the OTP code
8. You should now see the **Super Admin Dashboard**

### If you Don't Have SMS:

For local testing, you can:
1. Check backend logs for the generated OTP
2. Use that OTP in the app
3. Or disable OTP verification in dev mode

## Step 4: Verify Admin Access

Once logged in as super admin, you should have access to:

✅ **Trips Screen** - View all trips
✅ **Drivers Screen** - Manage drivers
✅ **Vendors Screen** - Manage vendors
✅ **Wallets Screen** - Monitor wallets
✅ **Enquiries Screen** - View customer enquiries
✅ **Settings Screen** - Configure app settings
✅ **Verification Dashboard** - Approve drivers/vendors

## Super Admin Credentials (Fresh Account)

| Property | Value |
|----------|-------|
| **Role** | Super Admin |
| **Phone** | 9686314982 |
| **Email** | 9686314982@kushicabs.phone |
| **Full Name** | Super Admin |
| **Status** | Active |

## Testing Checklist

After setup, verify:

- [ ] Can login with phone number
- [ ] OTP verification works
- [ ] Redirects to super admin dashboard
- [ ] Can see Trips screen
- [ ] Can see Drivers list
- [ ] Can see Vendors list
- [ ] Can manage settings
- [ ] Can verify users

## Troubleshooting

### Issue: "User not found"
**Solution:** Make sure the migrations were run first, then run the super admin script.

### Issue: "Invalid role"
**Solution:** Check that the `super_admin` role exists by running:
```sql
SELECT * FROM roles WHERE name = 'super_admin';
```

### Issue: OTP not sending
**Solution:** Check backend is running:
```bash
npm run dev  # in backend folder
```

### Issue: Still showing registration screen
**Solution:** 
1. Tap "Clear Storage for Fresh Start" on role selection
2. Try again

## Multiple Admins (Optional)

If you want to add multiple admin users, you can duplicate the script and change:
- `admin_phone` to a different number
- `admin_email` to a different email
- `admin_name` to a different name

## Security Notes

⚠️ This is for **development/testing only**

For production:
- Use strong, unique phone numbers
- Enable proper authentication
- Use environment variables for sensitive data
- Implement proper admin verification flow

## Next Steps

After super admin is set up:

1. **Create Test Driver** - Register a driver user
2. **Create Test Vendor** - Register a vendor user
3. **Create Test Trip** - Vendor creates an enquiry
4. **Accept Trip** - Driver accepts the trip
5. **Test Verification** - Approve documents in admin dashboard

---

**File Location:** `newtaxi/ADD_SUPER_ADMIN_NEW_ACCOUNT.sql`
