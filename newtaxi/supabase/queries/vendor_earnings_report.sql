-- ============================================================
-- UNIFIED VENDOR EARNINGS REPORT
-- Shows all earnings, commissions, and wallet data
-- ============================================================

-- 1. VENDOR WALLET BALANCE
SELECT 
  'VENDOR WALLET' as section,
  u.id as vendor_id,
  u.full_name as vendor_name,
  u.email,
  w.balance as current_balance,
  w.updated_at as last_updated
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.roles->0->>'name' = 'vendor'
ORDER BY u.created_at DESC;

-- 2. VENDOR TRANSACTIONS (ALL)
SELECT 
  'VENDOR TRANSACTIONS' as section,
  u.full_name as vendor_name,
  t.type as transaction_type,
  t.amount,
  t.description,
  t.created_at,
  tr.id as trip_id,
  tr.fare_amount,
  tr.status as trip_status
FROM transactions t
LEFT JOIN wallets w ON t.wallet_id = w.id
LEFT JOIN users u ON w.user_id = u.id
LEFT JOIN trips tr ON t.trip_id = tr.id
WHERE u.roles->0->>'name' = 'vendor'
ORDER BY t.created_at DESC;

-- 3. COMMISSION TRANSACTIONS ONLY
SELECT 
  'COMMISSION TRANSACTIONS' as section,
  u.full_name as vendor_name,
  t.amount as commission_amount,
  tr.fare_amount,
  tr.pickup_location,
  tr.dropoff_location,
  tr.status as trip_status,
  t.created_at,
  t.description
FROM transactions t
LEFT JOIN wallets w ON t.wallet_id = w.id
LEFT JOIN users u ON w.user_id = u.id
LEFT JOIN trips tr ON t.trip_id = tr.id
WHERE u.roles->0->>'name' = 'vendor'
  AND t.type = 'commission'
ORDER BY t.created_at DESC;

-- 4. VENDOR EARNINGS SUMMARY
SELECT 
  'EARNINGS SUMMARY' as section,
  u.full_name as vendor_name,
  COUNT(DISTINCT tr.id) as total_trips,
  COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.id END) as completed_trips,
  COALESCE(SUM(CASE WHEN tr.status = 'completed' THEN tr.fare_amount ELSE 0 END), 0) as total_fare,
  COALESCE(SUM(CASE WHEN t.type = 'commission' THEN t.amount ELSE 0 END), 0) as total_commission,
  COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) as total_credits,
  COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END), 0) as total_debits,
  w.balance as current_wallet_balance
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
LEFT JOIN trips tr ON u.id = tr.created_by
LEFT JOIN transactions t ON w.id = t.wallet_id
WHERE u.roles->0->>'name' = 'vendor'
GROUP BY u.id, u.full_name, w.balance
ORDER BY u.created_at DESC;

-- 5. COMMISSION SETTINGS
SELECT 
  'COMMISSION SETTINGS' as section,
  id,
  vendor_commission_type,
  vendor_commission_value,
  updated_at
FROM app_settings
WHERE id = 'global';

-- 6. TRIPS CREATED BY VENDOR (WITH COMMISSION CALCULATION)
SELECT 
  'VENDOR TRIPS' as section,
  u.full_name as vendor_name,
  tr.id as trip_id,
  tr.pickup_location,
  tr.dropoff_location,
  tr.fare_amount,
  tr.status,
  CASE 
    WHEN s.vendor_commission_type = 'percentage' 
    THEN (tr.fare_amount * s.vendor_commission_value / 100)
    ELSE s.vendor_commission_value
  END as expected_commission,
  tr.created_at,
  tr.completed_at
FROM trips tr
LEFT JOIN users u ON tr.created_by = u.id
LEFT JOIN app_settings s ON s.id = 'global'
WHERE u.roles->0->>'name' = 'vendor'
ORDER BY tr.created_at DESC;
