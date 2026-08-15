# Manual Data Migration Steps (Click-by-Click Guide)

## ⚠️ IMPORTANT PREREQUISITES

Before starting migration, ensure:
- ✅ All migrations applied to NEW account
- ✅ RLS disabled on ALL tables in NEW account  
- ✅ You have login to both Supabase accounts
- ✅ You have a backup of OLD account (screenshot important data)

---

## STEP 1: Count Data in OLD Account

### Go to OLD Account:
1. Open: https://vofupwsnbcidjnifaihm.supabase.co
2. Login with OLD Supabase credentials
3. Click **SQL Editor**
4. Click **New Query**
5. Copy this:
```sql
SELECT 'Users: ' || COUNT(*)::TEXT FROM users UNION ALL
SELECT 'Vendors: ' || COUNT(*)::TEXT FROM vendors UNION ALL
SELECT 'Drivers: ' || COUNT(*)::TEXT FROM drivers UNION ALL
SELECT 'Trips: ' || COUNT(*)::TEXT FROM trips UNION ALL
SELECT 'Wallets: ' || COUNT(*)::TEXT FROM wallets UNION ALL
SELECT 'Transactions: ' || COUNT(*)::TEXT FROM transactions UNION ALL
SELECT 'Payment Orders: ' || COUNT(*)::TEXT FROM payment_orders;
```
6. Click **Run** (or Ctrl+Enter)
7. **Note down these numbers** - Write them down exactly:
   - Users: ___
   - Vendors: ___
   - Drivers: ___
   - Trips: ___
   - Wallets: ___
   - Transactions: ___
   - Payment Orders: ___

---

## STEP 2: Export Users Data

### Still in OLD Account SQL Editor:

1. Copy this query:
```sql
SELECT id, phone, name, role, email, is_verified, verification_status, 
       is_active, created_at, updated_at
FROM users
ORDER BY created_at;
```

2. Click **Run**
3. Click **Download** or **Copy** (button appears on results)
4. If "Download" - save as `users_export.csv`
5. If "Copy" - paste to text editor and save as `users_data.txt`

**Expected:** See all user records with columns

---

## STEP 3: Export Other Critical Tables

### Repeat this process for each table:

#### 3A - Vendors:
```sql
SELECT id, user_id, company_name, registration_number, gst_number, 
       bank_details, average_rating, status, is_verified, 
       verification_status, created_at, updated_at
FROM vendors
ORDER BY created_at;
```
Save as `vendors_data.csv`

#### 3B - Drivers:
```sql
SELECT id, user_id, license_number, license_expiry, average_rating, 
       is_verified, verification_status, status, created_at, updated_at
FROM drivers
ORDER BY created_at;
```
Save as `drivers_data.csv`

#### 3C - Trips:
```sql
SELECT id, vendor_id, driver_id, customer_phone, customer_name,
       pickup_location, dropoff_location, trip_status,
       base_fare, distance_km, duration_minutes, commission,
       car_type_id, fuel_type_id, is_published, created_at, updated_at
FROM trips
ORDER BY created_at;
```
Save as `trips_data.csv`

#### 3D - Wallets:
```sql
SELECT id, user_id, user_type, balance, total_earned, total_spent,
       minimum_balance, created_at, updated_at
FROM wallets
ORDER BY created_at;
```
Save as `wallets_data.csv`

#### 3E - Transactions:
```sql
SELECT id, wallet_id, transaction_type, amount, description,
       reference_id, created_at
FROM transactions
ORDER BY created_at;
```
Save as `transactions_data.csv`

#### 3F - Payment Orders:
```sql
SELECT id, user_id, amount, payment_gateway, payment_status,
       transaction_id, created_at, updated_at
FROM payment_orders
ORDER BY created_at;
```
Save as `payment_orders_data.csv`

---

## STEP 4: Go to NEW Account

1. Open: https://cqfsirfjwfxvwggjkrvd.supabase.co
2. Login with NEW Supabase credentials
3. Click **SQL Editor**

---

## STEP 5: Import Users to NEW Account

### In NEW Account SQL Editor:

1. Click **New Query**
2. Paste this template:
```sql
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

INSERT INTO users (id, phone, name, role, email, is_verified, 
                   verification_status, is_active, created_at, updated_at)
VALUES
-- PASTE YOUR DATA HERE
-- Example rows (replace with actual data from CSV):
-- ('uuid-1', '9876543210', 'John Doe', 'role_uuid', 'john@example.com', true, 'approved', true, '2024-01-01 10:00:00', '2024-01-01 10:00:00'),
-- ('uuid-2', '9876543211', 'Jane Smith', 'role_uuid', 'jane@example.com', true, 'approved', true, '2024-01-02 10:00:00', '2024-01-02 10:00:00');

ON CONFLICT (id) DO NOTHING;
```

3. **Transform your CSV data to SQL format:**
   - Open your `users_data.csv` in text editor
   - Each row becomes: `('id', 'phone', 'name', 'role_id', 'email', ...),`
   - Copy and paste into the VALUES section

4. Click **Run**

**Expected:** "Query successful" message

---

## STEP 6: Import Other Tables (SAME ORDER)

### Import in this order to maintain relationships:

#### Step 6A - Vendors:
```sql
INSERT INTO vendors (id, user_id, company_name, registration_number, gst_number, 
                     bank_details, average_rating, status, is_verified, 
                     verification_status, created_at, updated_at)
VALUES
-- Paste vendor CSV data here converted to SQL format
ON CONFLICT (id) DO NOTHING;
```

#### Step 6B - Drivers:
```sql
INSERT INTO drivers (id, user_id, license_number, license_expiry, average_rating, 
                     is_verified, verification_status, status, created_at, updated_at)
VALUES
-- Paste driver CSV data here
ON CONFLICT (id) DO NOTHING;
```

#### Step 6C - Trips:
```sql
INSERT INTO trips (id, vendor_id, driver_id, customer_phone, customer_name,
                   pickup_location, dropoff_location, trip_status,
                   base_fare, distance_km, duration_minutes, commission,
                   car_type_id, fuel_type_id, is_published, created_at, updated_at)
VALUES
-- Paste trips CSV data here
ON CONFLICT (id) DO NOTHING;
```

#### Step 6D - Wallets:
```sql
INSERT INTO wallets (id, user_id, user_type, balance, total_earned, total_spent,
                     minimum_balance, created_at, updated_at)
VALUES
-- Paste wallets CSV data here
ON CONFLICT (id) DO NOTHING;
```

#### Step 6E - Transactions:
```sql
INSERT INTO transactions (id, wallet_id, transaction_type, amount, description,
                          reference_id, created_at)
VALUES
-- Paste transactions CSV data here
ON CONFLICT (id) DO NOTHING;
```

#### Step 6F - Payment Orders:
```sql
INSERT INTO payment_orders (id, user_id, amount, payment_gateway, payment_status,
                            transaction_id, created_at, updated_at)
VALUES
-- Paste payment orders CSV data here
ON CONFLICT (id) DO NOTHING;
```

---

## STEP 7: Verify Import Success

### Still in NEW Account SQL Editor:

Run this to verify all data imported:
```sql
SELECT 'Users: ' || COUNT(*)::TEXT FROM users UNION ALL
SELECT 'Vendors: ' || COUNT(*)::TEXT FROM vendors UNION ALL
SELECT 'Drivers: ' || COUNT(*)::TEXT FROM drivers UNION ALL
SELECT 'Trips: ' || COUNT(*)::TEXT FROM trips UNION ALL
SELECT 'Wallets: ' || COUNT(*)::TEXT FROM wallets UNION ALL
SELECT 'Transactions: ' || COUNT(*)::TEXT FROM transactions UNION ALL
SELECT 'Payment Orders: ' || COUNT(*)::TEXT FROM payment_orders;
```

**IMPORTANT:** These counts should match what you noted in STEP 1!

---

## STEP 8: Verify Data Integrity

### Check for broken relationships:

```sql
-- Check if all vendors have valid users
SELECT COUNT(*) as vendors_without_users FROM vendors WHERE user_id NOT IN (SELECT id FROM users);

-- Check if all drivers have valid users
SELECT COUNT(*) as drivers_without_users FROM drivers WHERE user_id NOT IN (SELECT id FROM users);

-- Check if all trips have valid vendors/drivers
SELECT COUNT(*) as trips_without_vendor FROM trips WHERE vendor_id IS NOT NULL AND vendor_id NOT IN (SELECT id FROM vendors);
SELECT COUNT(*) as trips_without_driver FROM trips WHERE driver_id IS NOT NULL AND driver_id NOT IN (SELECT id FROM drivers);

-- Check if all wallets have valid users
SELECT COUNT(*) as wallets_without_users FROM wallets WHERE user_id NOT IN (SELECT id FROM users);
```

**Expected Result:** All counts should be **0**

If any count > 0, you have broken relationships:
- Go back to OLD account and export those records
- Make sure all parent records (users) exist before child records
- Reimport in correct order

---

## STEP 9: Test App Connection

### Update your app to use NEW account:

The `.env` file is already updated with NEW account:
```
EXPO_PUBLIC_SUPABASE_URL='https://cqfsirfjwfxvwggjkrvd.supabase.co'
EXPO_PUBLIC_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

1. Start your app
2. Try to login with a user from migrated data
3. Verify you can see all data (trips, wallets, vendors, etc)
4. Run through key features:
   - ✅ View profile
   - ✅ View trips
   - ✅ View wallet
   - ✅ View transactions

---

## STEP 10: Archive OLD Account

### Final step - keep OLD as backup:

1. **BEFORE DELETING:**
   - Take screenshots of key data
   - Export final backup SQL from OLD account
   - Document any custom settings
   - Save all passwords/access info

2. **DO NOT DELETE** for at least 30 days

3. Once confident NEW account is stable:
   - Disable OLD account (don't delete)
   - Update all backups to use NEW account
   - Update any scripts/configs

---

## ✅ Migration Complete!

Your data is now in the NEW Supabase account:
- ✅ All tables migrated
- ✅ All data verified
- ✅ All relationships intact
- ✅ App connected and working
- ✅ OLD account backed up

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Error: relation does not exist" | Table doesn't exist - all migrations not applied. Run migrations first. |
| "Foreign key violation" | Import tables in wrong order. Follow Step 6 order exactly. |
| "Duplicate key value" | Data already exists. Use `ON CONFLICT DO NOTHING` or `DO UPDATE`. |
| "Count mismatch" | Some data didn't import. Check for error messages and reimport failed tables. |
| "App connection error" | Check `.env` file has NEW account URL. Restart app. |

---

## Quick Reference - SQL Commands

**Count all data:**
```sql
SELECT count(*) FROM users;
SELECT count(*) FROM vendors;
SELECT count(*) FROM drivers;
```

**Clear a table (CAREFUL!):**
```sql
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
```

**Check table structure:**
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name='users';
```

**List all tables:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public';
```

