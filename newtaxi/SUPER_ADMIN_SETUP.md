# Super Admin Setup Guide

## Issue: Super Admin Role Missing

The Super Admin app is failing because the `super_admin` role doesn't exist in the database yet.

## Quick Fix - Add Super Admin Role

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run this SQL command**:
   ```sql
   INSERT INTO roles (name) VALUES ('super_admin') 
   ON CONFLICT (name) DO NOTHING;
   ```

3. **Verify the role was added**:
   ```sql
   SELECT * FROM roles;
   ```
   You should see: admin, vendor, driver, super_admin

### Option 2: Using SQL File

1. **Open the file**: `newtaxi/ADD_SUPER_ADMIN_ROLE.sql`
2. **Copy the SQL content**
3. **Paste and run in Supabase SQL Editor**

## After Adding the Role

1. **Restart the Super Admin app**
2. **Use default credentials**:
   - Email: `admin@newtaxi.com`
   - Password: `admin123`
3. **The app will automatically create the super admin user profile**

## Expected Behavior

After adding the super_admin role:

1. ✅ App opens to login screen
2. ✅ Shows default credentials
3. ✅ Auto-creates super admin account on first run
4. ✅ Login works with default credentials
5. ✅ Access to full admin dashboard

## Troubleshooting

### If login still fails:
1. Check that the `super_admin` role exists in the roles table
2. Clear the app cache and restart
3. Try creating the account manually in Supabase Auth

### Manual Account Creation:
If automatic creation fails, you can manually create the account:

1. **In Supabase Auth Dashboard**:
   - Add user: admin@newtaxi.com / admin123

2. **In Supabase SQL Editor**:
   ```sql
   -- Get the user ID from auth.users
   SELECT id FROM auth.users WHERE email = 'admin@newtaxi.com';
   
   -- Insert into users table (replace USER_ID with actual ID)
   INSERT INTO users (id, full_name, email, role_id, is_active) 
   VALUES (
     'USER_ID_FROM_ABOVE', 
     'Super Administrator', 
     'admin@newtaxi.com', 
     (SELECT id FROM roles WHERE name = 'super_admin'), 
     true
   );
   ```

## Current Status

- ✅ Super Admin app is built and running
- ✅ Authentication system is implemented
- ✅ Default credentials are configured
- ⚠️ **Needs**: super_admin role in database
- ✅ All admin features are ready to use

Once the role is added, the Super Admin app will provide complete control over:
- Driver management
- Vendor management  
- Trip enquiries
- Commission settings
- Wallet monitoring
- Business analytics