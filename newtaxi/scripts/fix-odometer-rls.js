#!/usr/bin/env node

/**
 * Fix Odometer RLS Policies
 * 
 * This script fixes the odometer image upload RLS policy error.
 * The problem: bucket_id (UUID) was being compared with 'odometer-images' (text) causing type mismatch
 * The solution: Use subquery to join storage.buckets and get UUID before comparison
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/unified/.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SQL_QUERIES = [
  // Drop all broken policies
  'DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;',
  'DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;',
  'DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;',
  'DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;',
  'DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;',
  'DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;',
  'DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;',
  
  // Create new correct policies with UUID comparison via subquery
  `CREATE POLICY "Authenticated users can upload odometer images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
    );`,
  
  `CREATE POLICY "Anyone can view odometer images"
    ON storage.objects FOR SELECT
    TO public
    USING (
      bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
    );`,
  
  `CREATE POLICY "Users can update their own odometer images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
      AND owner_id = auth.uid()
    );`,
  
  `CREATE POLICY "Users can delete their own odometer images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id IN (SELECT id FROM storage.buckets WHERE name = 'odometer-images')
      AND owner_id = auth.uid()
    );`
];

async function applyFix() {
  try {
    console.log('🔧 Applying Odometer RLS Fix...\n');
    console.log('Note: This script uses the Supabase client library.');
    console.log('If this fails, please run the SQL manually in Supabase Dashboard > SQL Editor\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const query of SQL_QUERIES) {
      try {
        console.log(`Executing: ${query.substring(0, 60)}...`);
        
        // Attempt to execute via Supabase RPC if available
        // This is a workaround since direct SQL execution isn't available via JS client
        const { error } = await supabase.rpc('exec_sql', { sql_query: query }).catch(() => ({ error: 'RPC not available' }));
        
        if (error) {
          console.warn(`  ⚠️  Could not execute via RPC: ${error}`);
          errorCount++;
        } else {
          console.log(`  ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.warn(`  ⚠️  Error: ${err.message}`);
        errorCount++;
      }
    }
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some queries could not be executed via RPC.');
      console.log('\n📋 Please apply the following SQL manually in Supabase Dashboard:\n');
      console.log('1. Go to: https://supabase.co');
      console.log('2. Select your project');
      console.log('3. Navigate to: SQL Editor > New Query');
      console.log('4. Copy and paste the SQL below:\n');
      console.log('-------------------------------------------');
      console.log(SQL_QUERIES.join('\n'));
      console.log('-------------------------------------------\n');
    } else {
      console.log('\n✅ All Odometer RLS policies have been applied successfully!');
      console.log('   The driver should now be able to upload odometer images.\n');
    }
    
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    console.log('\nPlease apply the SQL manually in Supabase Dashboard');
    process.exit(1);
  }
}

applyFix();
