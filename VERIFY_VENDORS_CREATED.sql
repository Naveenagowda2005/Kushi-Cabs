-- Verify dummy vendors are actually in the database

-- 1. Count ALL vendors
SELECT COUNT(*) as total_vendors FROM vendors;

-- 2. Show ALL vendors (check if they exist)
SELECT id, user_id, company_name, commission_pct FROM vendors LIMIT 20;

-- 3. Check vendors with DUMMY in name
SELECT id, user_id, company_name FROM vendors WHERE company_name ILIKE 'DUMMY%';

-- 4. Check users with vendor role
SELECT u.id, u.phone, u.full_name, u.role_id, r.name 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
WHERE r.name = 'vendor' 
LIMIT 20;

-- 5. Check if super admin can read vendors
SELECT v.id, v.company_name, u.full_name, u.phone 
FROM vendors v 
LEFT JOIN users u ON v.user_id = u.id 
WHERE v.company_name ILIKE 'DUMMY%';

-- 6. Test simple ILIKE query
SELECT * FROM vendors WHERE company_name ILIKE '%DUMMY%' LIMIT 5;
