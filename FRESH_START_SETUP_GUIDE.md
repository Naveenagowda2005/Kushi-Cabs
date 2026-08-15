# Fresh Start Setup Guide - New Supabase Account

## Overview
You're starting with a new Supabase account with no previous data. This guide walks through setting up everything from scratch.

## Step 1: Update Environment Variables

Replace the old Supabase credentials with your new account details:

```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
```

Update `.env` file with your new Supabase URL and ANON KEY:

```env
EXPO_PUBLIC_SUPABASE_URL='https://your-new-project.supabase.co'
EXPO_PUBLIC_SUPABASE_ANON_KEY='your-new-anon-key'
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY='AIzaSyDpDaKo6KF_eV1ZoebbaGVATyialRD0wms'
EXPO_PUBLIC_SMS_API_URL='https://kushi-cabs.onrender.com'
```

**Where to get these:**
1. Go to https://supabase.com/dashboard
2. Select your new project
3. Go to Settings → API
4. Copy the Project URL and anon public key

## Step 2: Run Database Migrations

Navigate to your project directory:
```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi
```

Link Supabase CLI to your new project:
```bash
supabase link --project-ref your-project-ref
```

Push all migrations to create the schema:
```bash
supabase db push
```

This will:
- Create all tables (users, drivers, vendors, trips, etc.)
- Set up Row Level Security (RLS) policies
- Create functions and triggers
- Initialize app settings

## Step 3: Seed Initial Data (Optional but Recommended)

After migrations complete, you can seed basic data:

1. Go to Supabase Dashboard → SQL Editor
2. Run the seeding scripts to create:
   - Admin user
   - Initial app settings
   - Sample data (optional)

## Step 4: Clear App Cache & Restart

Since you have a fresh database, clear the app cache:

```bash
cd c:\Users\navee\OneDrive\Desktop\TAXI\newtaxi\apps\unified
```

**For Expo:**
```bash
expo start -c
```

**For React Native:**
```bash
npm start -- --reset-cache
```

## Step 5: Test Fresh Registration

Try registering a new user through the app:

1. **Driver Registration:**
   - Phone number (fresh account, no history)
   - OTP verification
   - Document upload
   - Profile completion

2. **Vendor Registration:**
   - Company details
   - Document verification
   - Admin approval process

3. **Super Admin Access:**
   - Create admin credentials in database
   - Login to admin dashboard

## Important Notes

### ⚠️ No Migration Data
- Previous user accounts won't exist
- Previous trips/transactions won't be available
- Previous settings need to be reconfigured

### ✅ Best Practices
- Always test registration flow first
- Verify admin login works
- Check SMS/OTP delivery
- Test a complete trip creation → acceptance → completion flow

### 📊 Verification Checklist
- [ ] Environment variables updated
- [ ] All migrations applied successfully
- [ ] Tables created with correct schema
- [ ] RLS policies enabled
- [ ] Admin user created
- [ ] Fresh registration tested
- [ ] SMS delivery working
- [ ] Dashboard loads without errors

## Troubleshooting

### Issue: "Table doesn't exist"
```
Run migrations again:
supabase db push
```

### Issue: "Permission denied" during registration
```
Check RLS policies are correct:
- Verify INSERT policies on users table
- Check JWT claims match your auth setup
```

### Issue: SMS not sending
```
Check backend URL in .env:
EXPO_PUBLIC_SMS_API_URL='https://kushi-cabs.onrender.com'
```

## What's Next?

Once fresh setup is verified:
1. Test all user roles (Admin, Vendor, Driver, Customer)
2. Create test trips
3. Verify commission calculations
4. Test payment flow
5. Check admin dashboards
6. Set up monitoring/logging

---

**Need help?** Check the migration files in `newtaxi/supabase/migrations/`
