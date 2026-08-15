-- DELETE ALL ODOMETER POLICIES - RUN THIS NOW

DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete odometer images" ON storage.objects;

SELECT 'All odometer policies deleted' AS status;
