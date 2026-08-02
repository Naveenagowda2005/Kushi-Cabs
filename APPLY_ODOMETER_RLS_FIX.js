#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cqfsirfjwfxvwggjkrvd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SQL = `
-- Drop ALL existing odometer policies (broken ones)
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;

-- Create correct RLS policies with UUID comparison
CREATE POLICY "Authenticated users can upload odometer images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
  );

CREATE POLICY "Anyone can view odometer images"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
  );

CREATE POLICY "Users can update their own odometer images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
    AND owner_id = auth.uid()
  );

CREATE POLICY "Users can delete their own odometer images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
    AND owner_id = auth.uid()
  );

SELECT 'Odometer RLS policies fixed' AS status;
`;

async function applyFix() {
  try {
    console.log('Applying odometer RLS fix...');
    
    // Use rpc to execute raw SQL (if available) or admin API
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: SQL });
    
    if (error) {
      // If rpc doesn't work, try exec directly
      console.log('RPC method not available, trying direct query...');
      const result = await supabase.from('storage.objects').select('*').limit(0); // dummy query to test connection
      console.log('Connection test:', result);
      
      // For direct SQL execution, we'd need to use the REST API with authentication
      console.error('Could not execute SQL through Supabase. Please run manually in Supabase SQL editor:');
      console.error(SQL);
      process.exit(1);
    }
    
    console.log('✅ Odometer RLS policies fixed successfully!');
    console.log(data);
  } catch (err) {
    console.error('Error applying fix:', err.message);
    console.error('Please apply manually in Supabase SQL editor');
    process.exit(1);
  }
}

applyFix();
