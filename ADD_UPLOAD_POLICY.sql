-- bucket_id is TEXT (confirmed), so direct comparison works fine
-- Add one simple policy to allow all uploads to odometer-images

CREATE POLICY "allow_odometer_upload"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'odometer-images');
