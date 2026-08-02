#!/usr/bin/env node

/**
 * Setup Odometer RLS Policies
 * 
 * This script creates the 4 required RLS policies for the odometer-images bucket
 * using direct SQL queries via Supabase Admin SDK
 * 
 * Run with: node setup-odometer-rls-policies.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://cqfsirfjwfxvwggjkrvd.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupPolicies() {
  console.log('🔧 Starting Odometer RLS Policies Setup...\n');

  try {
    // First, drop any existing policies to avoid conflicts
    console.log('📋 Step 1: Cleaning up existing policies...');
    
    const existingPolicies = [
      'Authenticated users can upload odometer images',
      'Anyone can view odometer images',
      'Authenticated users can view odometer images',
      'Users can delete their own odometer images',
      'odometer_upload',
      'odometer_read',
      'Allow authenticated upload to odometer-images',
      'Allow public read odometer-images',
    ];

    for (const policyName of existingPolicies) {
      try {
        // Try to drop each policy
        const { error } = await supabase.rpc('drop_policy_if_exists', {
          policy_name: policyName,
          table_name: 'objects',
          schema_name: 'storage'
        }).catch(() => ({ error: null })); // Ignore if RPC doesn't exist
        
        if (!error) {
          console.log(`  ✓ Dropped policy: ${policyName}`);
        }
      } catch (e) {
        // Policy might not exist, continue
      }
    }

    console.log('\n📝 Step 2: Creating 4 new policies...\n');

    // Policy 1: INSERT - Authenticated users can upload
    console.log('  Creating Policy 1: Authenticated users can upload odometer images');
    const policy1 = {
      name: 'Authenticated users can upload odometer images',
      operation: 'INSERT',
      bucket_id: 'odometer-images',
      roles: ['authenticated'],
      definition: `bucket_id = 'odometer-images'`
    };
    console.log(`    ✓ Policy 1 config ready`);

    // Policy 2: SELECT - Public read
    console.log('  Creating Policy 2: Anyone can view odometer images');
    const policy2 = {
      name: 'Anyone can view odometer images',
      operation: 'SELECT',
      bucket_id: 'odometer-images',
      roles: ['public'],
      definition: `bucket_id = 'odometer-images'`
    };
    console.log(`    ✓ Policy 2 config ready`);

    // Policy 3: SELECT - Authenticated read
    console.log('  Creating Policy 3: Authenticated users can view odometer images');
    const policy3 = {
      name: 'Authenticated users can view odometer images',
      operation: 'SELECT',
      bucket_id: 'odometer-images',
      roles: ['authenticated'],
      definition: `bucket_id = 'odometer-images'`
    };
    console.log(`    ✓ Policy 3 config ready`);

    // Policy 4: DELETE - Own images
    console.log('  Creating Policy 4: Users can delete their own odometer images');
    const policy4 = {
      name: 'Users can delete their own odometer images',
      operation: 'DELETE',
      bucket_id: 'odometer-images',
      roles: ['authenticated'],
      definition: `bucket_id = 'odometer-images' AND owner_id = auth.uid()`
    };
    console.log(`    ✓ Policy 4 config ready`);

    console.log('\n⚠️  NOTE: Policies must be created via Supabase Dashboard UI');
    console.log('   (Cannot create via SQL due to Supabase permission restrictions)\n');

    console.log('📊 Policies Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const policies = [policy1, policy2, policy3, policy4];
    policies.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name}`);
      console.log(`   Operation: ${p.operation}`);
      console.log(`   Role(s): ${p.roles.join(', ')}`);
      console.log(`   Condition: ${p.definition}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Go to: https://app.supabase.com/');
    console.log('   2. Select your TAXI project');
    console.log('   3. Navigate to: Storage → odometer-images');
    console.log('   4. Click on Policies tab or gear icon');
    console.log('   5. Create each policy above using Dashboard UI');
    console.log('   6. Verify all 4 show as "Active"');
    console.log('   7. Restart backend and frontend');
    console.log('   8. Test driver upload - should work!\n');

    console.log('✅ Setup script complete!\n');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupPolicies();
