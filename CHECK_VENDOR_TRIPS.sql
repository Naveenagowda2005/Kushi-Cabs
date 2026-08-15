-- Check how many trips this vendor should see
-- Run in Supabase SQL Editor

-- Vendor user_id
-- 1c0c8ff0-83d4-4507-8b34-2160821e9a76

-- Get vendor row id
SELECT id, user_id
FROM vendors 
WHERE user_id = '1c0c8ff0-83d4-4507-8b34-2160821e9a76';

-- Check trips created_by this user
SELECT COUNT(*) as created_by_count
FROM trips 
WHERE created_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76';

-- Check trips accepted_by this user
SELECT COUNT(*) as accepted_by_count
FROM trips 
WHERE accepted_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76';

-- Check trips with this vendor_id (replace with actual vendor id from first query)
SELECT COUNT(*) as vendor_id_count
FROM trips 
WHERE vendor_id = '806bf958-5991-4c64-b3a5-dbab849f0e01';

-- Show all trips for this vendor
SELECT id, booking_id_seq, status, created_by, accepted_by, vendor_id, created_at
FROM trips 
WHERE created_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR accepted_by = '1c0c8ff0-83d4-4507-8b34-2160821e9a76'
   OR vendor_id = '806bf958-5991-4c64-b3a5-dbab849f0e01'
ORDER BY created_at DESC;
