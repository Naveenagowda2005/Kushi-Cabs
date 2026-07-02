-- Check if "Test -7483777071" is a dummy driver or original driver
-- Dummy drivers are identified by:
-- 1. License number starting with "DUMMY-" 
-- 2. Full name containing "dummy" (case-insensitive)

SELECT 
  u.id,
  u.full_name,
  u.phone,
  u.email,
  u.role,
  u.verification_status,
  u.is_active,
  d.license_number,
  d.vehicle_number,
  CASE 
    WHEN d.license_number ILIKE 'DUMMY-%' THEN '❌ DUMMY DRIVER (License: DUMMY-*)'
    WHEN u.full_name ILIKE '%dummy%' THEN '❌ DUMMY DRIVER (Name contains: dummy)'
    ELSE '✅ ORIGINAL DRIVER'
  END as driver_type,
  u.created_at
FROM users u
LEFT JOIN drivers d ON u.id = d.user_id
WHERE u.phone = '7483777071' 
   OR u.full_name ILIKE '%Test%7483777071%'
   OR u.full_name ILIKE '%7483777071%'
ORDER BY u.created_at DESC;

-- Count total drivers and dummy drivers for reference
SELECT 
  COUNT(*) as total_drivers,
  COUNT(CASE WHEN d.license_number ILIKE 'DUMMY-%' THEN 1 END) as dummy_by_license,
  COUNT(CASE WHEN u.full_name ILIKE '%dummy%' THEN 1 END) as dummy_by_name
FROM users u
LEFT JOIN drivers d ON u.id = d.user_id
WHERE u.role = 'driver' AND u.is_active = true;
