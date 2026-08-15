# Data Migration Guide: Old → New Supabase Account

## Overview
Migrate all data from the old Supabase account to the new account while preserving data integrity.

**OLD Account:** `https://vofupwsnbcidjnifaihm.supabase.co`  
**NEW Account:** `https://cqfsirfjwfxvwggjkrvd.supabase.co`

---

## Step 1: Prerequisites

✅ All migrations are applied on NEW account (25 tables created)  
✅ All RLS policies are disabled on NEW account  
✅ Backend has both database credentials configured  
✅ You have direct access to both Supabase accounts

---

## Step 2: Choose Your Migration Method

### Option A: Using Supabase Dashboard (MANUAL - Easiest)
- Best for small-to-medium data volumes
- No coding required
- Visual confirmation of data

### Option B: Using SQL Export/Import (SEMI-AUTOMATED)
- Best for large data volumes
- Faster migration
- Requires running SQL commands

### Option C: Using Backend API (AUTOMATED)
- Best for production setups
- Can be scheduled
- More complex to set up

**RECOMMENDED:** Start with Option B (SQL Export/Import)

---

## Option B: SQL Export/Import (RECOMMENDED)

### Step 1: Generate Export SQL from OLD Account

Run these queries in OLD account to export data:

```sql
-- You'll run this in: https://vofupwsnbcidjnifaihm.supabase.co SQL Editor
-- Then copy the exported data to use in NEW account

-- 1. Export Users
SELECT 'Users: ' || COUNT(*) as status FROM users;
SELECT * FROM users;

-- 2. Export Vendors
SELECT 'Vendors: ' || COUNT(*) as status FROM vendors;
SELECT * FROM vendors;

-- 3. Export Drivers
SELECT 'Drivers: ' || COUNT(*) as status FROM drivers;
SELECT * FROM drivers;

-- 4. Export Trips
SELECT 'Trips: ' || COUNT(*) as status FROM trips;
SELECT * FROM trips;

-- 5. Export Other Data
SELECT 'Wallets: ' || COUNT(*) as status FROM wallets;
SELECT 'Transactions: ' || COUNT(*) as status FROM transactions;
SELECT 'Payment Orders: ' || COUNT(*) as status FROM payment_orders;
SELECT 'Trip Segments: ' || COUNT(*) as status FROM trip_segments;
SELECT 'Trip Packages: ' || COUNT(*) as status FROM trip_packages;
SELECT 'Documents: ' || COUNT(*) as status FROM documents;
SELECT 'Driver Documents: ' || COUNT(*) as status FROM driver_documents;
SELECT 'Vendor Documents: ' || COUNT(*) as status FROM vendor_documents;
SELECT 'Active Sessions: ' || COUNT(*) as status FROM active_sessions;

-- Get full data with all relationships
SELECT * FROM users;
SELECT * FROM vendors;
SELECT * FROM drivers;
SELECT * FROM trips;
SELECT * FROM wallets;
SELECT * FROM transactions;
SELECT * FROM payment_orders;
SELECT * FROM trip_segments;
SELECT * FROM trip_packages;
SELECT * FROM documents;
SELECT * FROM driver_documents;
SELECT * FROM vendor_documents;
SELECT * FROM active_sessions;
```

### Step 2: Import Data to NEW Account

**IMPORTANT ORDER (to maintain foreign key relationships):**

1. **roles** (if not already seeded)
2. **users** (with role references)
3. **app_settings** & **app_policies**
4. **vendors** (references users)
5. **drivers** (references users)
6. **car_types, seater_types, fuel_types** (lookup tables)
7. **trip_packages** (reference data)
8. **trips** (references vendors, drivers, car_types, etc)
9. **trip_segments** (references trips)
10. **wallets** (references users/vendors/drivers)
11. **transactions** (references wallets)
12. **payment_orders** (references transactions)
13. **documents** (references users)
14. **driver_documents** (references drivers, documents)
15. **vendor_documents** (references vendors, documents)
16. **driver_verification_status** (references drivers)
17. **vendor_verification_status** (references vendors)
18. **active_sessions** (references users)

### Step 3: Run Import SQL in NEW Account

```sql
-- NEW Account: https://cqfsirfjwfxvwggjkrvd.supabase.co
-- SQL Editor → New Query

-- Disable triggers temporarily to speed up import
ALTER TABLE wallets DISABLE TRIGGER ALL;
ALTER TABLE trips DISABLE TRIGGER ALL;
ALTER TABLE payment_orders DISABLE TRIGGER ALL;

-- Import Users (MUST preserve UUID and timestamps)
INSERT INTO users (
  id, phone, name, role, email, created_at, updated_at, 
  is_verified, verification_status, is_active
) VALUES
-- Copy data from OLD account SELECT result here
-- Format: (UUID, 'phone', 'name', 'role_id', 'email', timestamp, timestamp, boolean, 'status', boolean)
ON CONFLICT (id) DO NOTHING;

-- Import Vendors
INSERT INTO vendors (
  id, user_id, company_name, registration_number, gst_number, 
  bank_details, average_rating, status, created_at, updated_at
) VALUES
-- Copy data from OLD account
ON CONFLICT (id) DO NOTHING;

-- Import Drivers
INSERT INTO drivers (
  id, user_id, license_number, license_expiry, average_rating, 
  is_verified, status, created_at, updated_at
) VALUES
-- Copy data from OLD account
ON CONFLICT (id) DO NOTHING;

-- Import Trips
INSERT INTO trips (
  id, vendor_id, driver_id, customer_phone, customer_name, 
  pickup_location, dropoff_location, trip_status, 
  base_fare, distance_km, duration_minutes, commission, 
  created_at, updated_at
) VALUES
-- Copy data from OLD account
ON CONFLICT (id) DO NOTHING;

-- Import Wallets
INSERT INTO wallets (
  id, user_id, user_type, balance, total_earned, total_spent, 
  minimum_balance, created_at, updated_at
) VALUES
-- Copy data from OLD account
ON CONFLICT (id) DO NOTHING;

-- Import Transactions
INSERT INTO transactions (
  id, wallet_id, transaction_type, amount, description, 
  reference_id, created_at
) VALUES
-- Copy data from OLD account
ON CONFLICT (id) DO NOTHING;

-- Import Payment Orders
INSERT INTO payment_orders (
  id, user_id, amount, payment_gateway, payment_status, 
  transaction_id, created_at, updated_at
) VALUES
-- Copy data from OLD account
ON CONFLICT (id) DO NOTHING;

-- Re-enable triggers
ALTER TABLE wallets ENABLE TRIGGER ALL;
ALTER TABLE trips ENABLE TRIGGER ALL;
ALTER TABLE payment_orders ENABLE TRIGGER ALL;

-- Verify import
SELECT 'Users Imported: ' || COUNT(*) FROM users;
SELECT 'Vendors Imported: ' || COUNT(*) FROM vendors;
SELECT 'Drivers Imported: ' || COUNT(*) FROM drivers;
SELECT 'Trips Imported: ' || COUNT(*) FROM trips;
SELECT 'Wallets Imported: ' || COUNT(*) FROM wallets;
SELECT 'Transactions Imported: ' || COUNT(*) FROM transactions;
```

---

## Option A: Manual Dashboard Import (EASIER FOR SMALL DATA)

### Step 1: OLD Account - Export Table Data

1. Go to: https://vofupwsnbcidjnifaihm.supabase.co
2. Click **SQL Editor** → **New Query**
3. For each table, run:
   ```sql
   SELECT * FROM users;
   ```
4. Copy results to Excel/CSV
5. Repeat for all tables

### Step 2: NEW Account - Import Data

1. Go to: https://cqfsirfjwfxvwggjkrvd.supabase.co
2. For each table in order, click **Data** section
3. Click **Insert** (or manually enter rows)
4. Paste data from CSV/Excel
5. Verify counts match

---

## Data Migration Checklist

- [ ] **Step 1:** Count records in OLD account
  ```sql
  SELECT 'users' as tbl, COUNT(*) FROM users UNION ALL
  SELECT 'vendors', COUNT(*) FROM vendors UNION ALL
  SELECT 'drivers', COUNT(*) FROM drivers UNION ALL
  SELECT 'trips', COUNT(*) FROM trips UNION ALL
  SELECT 'wallets', COUNT(*) FROM wallets UNION ALL
  SELECT 'transactions', COUNT(*) FROM transactions;
  ```

- [ ] **Step 2:** Run all migrations on NEW account (already done ✅)

- [ ] **Step 3:** Disable RLS on NEW account (already done ✅)

- [ ] **Step 4:** Choose migration method (A, B, or C)

- [ ] **Step 5:** Export data from OLD account

- [ ] **Step 6:** Import data to NEW account in correct order

- [ ] **Step 7:** Verify record counts match
  ```sql
  SELECT 'users' as tbl, COUNT(*) FROM users UNION ALL
  SELECT 'vendors', COUNT(*) FROM vendors UNION ALL
  SELECT 'drivers', COUNT(*) FROM drivers UNION ALL
  SELECT 'trips', COUNT(*) FROM trips UNION ALL
  SELECT 'wallets', COUNT(*) FROM wallets UNION ALL
  SELECT 'transactions', COUNT(*) FROM transactions;
  ```

- [ ] **Step 8:** Test app connections to NEW account

- [ ] **Step 9:** Verify all data relationships (foreign keys intact)

- [ ] **Step 10:** Archive OLD account (do NOT delete)

---

## Quick Count Check

### In OLD Account (Copy-Paste):
```sql
SELECT 'OLD Account Data Count' as "Account",
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM vendors) as vendors,
  (SELECT COUNT(*) FROM drivers) as drivers,
  (SELECT COUNT(*) FROM trips) as trips,
  (SELECT COUNT(*) FROM wallets) as wallets,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM payment_orders) as payment_orders;
```

### In NEW Account (Copy-Paste):
```sql
SELECT 'NEW Account Data Count' as "Account",
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM vendors) as vendors,
  (SELECT COUNT(*) FROM drivers) as drivers,
  (SELECT COUNT(*) FROM trips) as trips,
  (SELECT COUNT(*) FROM wallets) as wallets,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM payment_orders) as payment_orders;
```

**Both should show identical counts after migration.**

---

## Troubleshooting

### Issue: Foreign Key Violations
**Solution:** Import tables in the correct order (relationships must exist first)

### Issue: UUID Conflicts
**Solution:** Use `ON CONFLICT (id) DO NOTHING` or `DO UPDATE` to handle duplicates

### Issue: Trigger Errors During Import
**Solution:** Disable triggers before import:
```sql
ALTER TABLE wallets DISABLE TRIGGER ALL;
-- do your INSERT
ALTER TABLE wallets ENABLE TRIGGER ALL;
```

### Issue: Timestamp Mismatches
**Solution:** Ensure old/new account use same timezone (UTC recommended)

---

## Next Steps After Migration

1. ✅ Verify all data is in NEW account
2. ✅ Test app with NEW account credentials
3. ✅ Run full app testing (all flows)
4. ✅ Archive OLD account (keep as backup)
5. ✅ Update any backup scripts to use NEW account
6. ✅ Monitor NEW account performance

---

## Keeping Old Account as Backup

**Before deleting OLD account:**

1. Download database backup
2. Export all tables to CSV
3. Take screenshots of important data
4. Document any custom configurations
5. Test NEW account thoroughly
6. Only then consider archiving OLD account

**Keep OLD account at least 30 days for reference.**

