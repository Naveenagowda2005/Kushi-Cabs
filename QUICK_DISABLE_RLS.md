# Quick RLS Disable Guide

## Option 1: Using Supabase Dashboard (EASIEST)

1. Go to: https://cqfsirfjwfxvwggjkrvd.supabase.co
2. Click **SQL Editor**
3. Click **New Query**
4. Copy and paste ALL the SQL from below
5. Click **Run** (or press Ctrl+Enter)
6. Done! RLS is disabled

---

## SQL to Run - Copy and Paste All:

```sql
-- Disable RLS on all tables
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE driver_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE seater_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions DISABLE ROW LEVEL SECURITY;

-- Verify all RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## What This Does:

✅ **Disables RLS** on all public tables  
✅ **Allows unrestricted access** to all data  
✅ **Useful for development/testing**  
✅ **Must be re-enabled for production**

---

## After Running:

- All tables will be accessible without RLS restrictions
- Users can read/write any data
- No permission checks
- Ready for development testing

---

## To Re-Enable RLS Later:

Use the SQL from `ENABLE_ALL_RLS.sql` file in the same SQL Editor.

---

## Steps:

1. Copy the SQL above
2. Open https://cqfsirfjwfxvwggjkrvd.supabase.co
3. Go to SQL Editor → New Query
4. Paste the SQL
5. Click Run
6. Done!

**Expected Result:** Query completes successfully, verification query shows empty result (no RLS-enabled tables)
