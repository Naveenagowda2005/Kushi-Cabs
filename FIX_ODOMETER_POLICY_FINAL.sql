-- Drop the wrong policy (TO public)
DROP POLICY IF EXISTS "allow_odometer_upload" ON storage.objects;

-- Create correct policy for authenticated users
CREATE POLICY "allow_odometer_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'odometer-images');
