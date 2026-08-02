-- Check the actual data type of bucket_id in storage.objects
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'storage' 
AND table_name = 'objects'
AND column_name = 'bucket_id';

-- Also check what value is actually stored for our bucket
SELECT id, name FROM storage.buckets WHERE name = 'odometer-images';
