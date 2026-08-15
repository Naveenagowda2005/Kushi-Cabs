-- ============================================================
-- BULK EXPORT ALL TABLES FROM OLD ACCOUNT
-- ============================================================
-- Run each SELECT statement one at a time in OLD account
-- Copy the results from each query
-- Paste each result in corresponding INSERT in NEW account
-- ============================================================

-- TABLE 1: USERS (CRITICAL - Run this first)
SELECT * FROM users ORDER BY created_at;

-- TABLE 2: ROLES (Reference data)
SELECT * FROM roles;

-- TABLE 3: CAR_TYPES (Reference data)
SELECT * FROM car_types;

-- TABLE 4: SEATER_TYPES (Reference data)
SELECT * FROM seater_types;

-- TABLE 5: FUEL_TYPES (Reference data)
SELECT * FROM fuel_types;

-- TABLE 6: TRIP_PACKAGES (Reference data)
SELECT * FROM trip_packages;

-- TABLE 7: APP_SETTINGS (Settings)
SELECT * FROM app_settings;

-- TABLE 8: APP_POLICIES (Settings)
SELECT * FROM app_policies;

-- TABLE 9: VENDORS (Depends on users)
SELECT * FROM vendors ORDER BY created_at;

-- TABLE 10: DRIVERS (Depends on users)
SELECT * FROM drivers ORDER BY created_at;

-- TABLE 11: DRIVER_VERIFICATION_STATUS (Depends on drivers)
SELECT * FROM driver_verification_status;

-- TABLE 12: VENDOR_VERIFICATION_STATUS (Depends on vendors)
SELECT * FROM vendor_verification_status;

-- TABLE 13: TRIPS (Depends on vendors, drivers, car_types, etc)
SELECT * FROM trips ORDER BY created_at;

-- TABLE 14: TRIP_SEGMENTS (Depends on trips)
SELECT * FROM trip_segments;

-- TABLE 15: WALLETS (Depends on users/vendors/drivers)
SELECT * FROM wallets ORDER BY created_at;

-- TABLE 16: TRANSACTIONS (Depends on wallets)
SELECT * FROM transactions;

-- TABLE 17: PAYMENT_ORDERS (Depends on transactions)
SELECT * FROM payment_orders;

-- TABLE 18: DOCUMENTS (Reference data)
SELECT * FROM documents;

-- TABLE 19: DRIVER_DOCUMENTS (Depends on drivers, documents)
SELECT * FROM driver_documents;

-- TABLE 20: VENDOR_DOCUMENTS (Depends on vendors, documents)
SELECT * FROM vendor_documents;

-- TABLE 21: ACTIVE_SESSIONS (Depends on users)
SELECT * FROM active_sessions;

-- TABLE 22: COMMISSION_SETTINGS (Settings)
SELECT * FROM commission_settings;

-- ============================================================
-- TOTAL: 22 tables to export
-- ============================================================
