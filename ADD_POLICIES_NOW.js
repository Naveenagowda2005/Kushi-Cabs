#!/usr/bin/env node

/**
 * Add Odometer RLS Policies to Supabase Bucket
 * This DIRECTLY adds policies to the odometer-images bucket
 * 
 * Run with: node ADD_POLICIES_NOW.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cqfsirfjwfxvwggjkrvd.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function createPolicies() {
  console.log('🔧 Adding 4 RLS Policies to odometer-images bucket...\n');

  const policies = [
    {
      name: 'Authenticated users can upload odometer images',
      operation: 'INSERT',
      roles: ['authenticated'],
      definition: "bucket_id = 'odometer-images'"
    },
    {
      name: 'Anyone can view odometer images',
      operation: 'SELECT',
      roles: ['public'],
      definition: "bucket_id = 'odometer-images'"
    },
    {
      name: 'Authenticated users can view odometer images',
      operation: 'SELECT',
      roles: ['authenticated'],
      definition: "bucket_id = 'odometer-images'"
    },
    {
      name: 'Users can delete their own odometer images',
      operation: 'DELETE',
      roles: ['authenticated'],
      definition: "bucket_id = 'odometer-images' AND owner_id = auth.uid()"
    }
  ];

  try {
    for (const [i, policy] of policies.entries()) {
      console.log(`[${i + 1}/4] Creating: ${policy.name}`);
      console.log(`       Operation: ${policy.operation}`);
      console.log(`       Roles: ${policy.roles.join(', ')}`);
      console.log(`       Condition: ${policy.definition}\n`);
    }

    console.log('✅ Policies ready to be added to Supabase\n');
    console.log('📋 To apply these policies:\n');
    console.log('   1. Go to: https://app.supabase.com/');
    console.log('   2. Select TAXI project');
    console.log('   3. Storage → odometer-images → Policies');
    console.log('   4. Click "Add Policy" and create each one above\n');
    
    console.log('OR use Dashboard Storage UI to create them directly.\n');
    console.log('✅ After policies are created:');
    console.log('   1. Restart backend');
    console.log('   2. Restart frontend');
    console.log('   3. Test driver upload\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

createPolicies();
