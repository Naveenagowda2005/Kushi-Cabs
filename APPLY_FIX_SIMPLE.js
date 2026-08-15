#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the .env file manually
const envPath = path.join(__dirname, 'newtaxi/apps/unified/.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse .env manually
const env = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^['"]|['"]$/g, '');
    env[key.trim()] = value;
  }
});

const SUPABASE_URL = env['EXPO_PUBLIC_SUPABASE_URL'];
const SUPABASE_ANON_KEY = env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

// Extract project ID from URL
const url = new URL(SUPABASE_URL);
const projectId = url.hostname.split('.')[0];

console.log('\n');
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║        ODOMETER RLS FIX - DIRECT APPLICATION          ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('\n');

console.log(`📍 Project ID: ${projectId}`);
console.log(`🔗 URL: ${SUPABASE_URL}\n`);

const SQL = `-- Odometer RLS Fix
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
  );`;

const outputFile = path.join(__dirname, 'ODOMETER_FIX_SQL.sql');
fs.writeFileSync(outputFile, SQL);

console.log('✅ SQL saved to: ODOMETER_FIX_SQL.sql\n');
console.log('📋 TO APPLY THE FIX:\n');
console.log('   1. Go to Supabase Dashboard: https://supabase.co');
console.log(`   2. Select project: ${projectId}`);
console.log('   3. Navigate to: SQL Editor → New Query');
console.log('   4. Open ODOMETER_FIX_SQL.sql and copy all SQL');
console.log('   5. Paste into Supabase SQL Editor');
console.log('   6. Click "Run" (or Ctrl+Enter)');
console.log('   7. Wait for success message');
console.log('   8. Restart your app\n');
console.log('⏱️  Time needed: 1 minute\n');
console.log('✨ After applying, driver upload will work!\n');
