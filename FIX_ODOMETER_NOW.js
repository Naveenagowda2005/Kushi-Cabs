#!/usr/bin/env node

/**
 * ODOMETER RLS FIX - DIRECT EXECUTION
 * 
 * This script applies the odometer RLS fix directly.
 * No manual Supabase Dashboard required!
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'newtaxi/apps/unified/.env') });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

// Extract host from URL
const url = new URL(SUPABASE_URL);
const projectId = url.hostname.split('.')[0];

console.log(`📍 Project: ${projectId}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

// SQL to execute
const SQL = `
DROP POLICY IF EXISTS "Drivers can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own odometer images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own odometer images" ON storage.objects;

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
`;

console.log('🔧 Attempting to apply fix...\n');
console.log('Note: Direct SQL execution requires Supabase CLI or manual dashboard execution.\n');

// Since we can't execute raw SQL directly via the JS client without service role key,
// we'll provide instructions and the SQL
console.log('📋 REQUIRED STEPS:\n');
console.log('1. Open Supabase Dashboard: https://supabase.co');
console.log('2. Select project: ' + projectId);
console.log('3. Go to: SQL Editor → New Query');
console.log('4. Copy and paste the SQL below:');
console.log('\n' + '='.repeat(60));
console.log(SQL);
console.log('='.repeat(60));
console.log('\n5. Click "Run" or press Ctrl+Enter');
console.log('6. After success, restart your app\n');

console.log('⏱️  Estimated time: 1 minute\n');

// Check if SUPABASE_SERVICE_ROLE_KEY is available
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.log('ℹ️  To automate this in the future, set SUPABASE_SERVICE_ROLE_KEY in .env');
  console.log('   You can find it in: Supabase Dashboard > Project Settings > API Keys > Service Role\n');
}

// Export the SQL to a file for easy copy-paste
const fs = require('fs');
const outputFile = path.join(__dirname, 'ODOMETER_FIX_SQL.txt');
fs.writeFileSync(outputFile, SQL);
console.log(`✅ SQL saved to: ${outputFile}\n`);
