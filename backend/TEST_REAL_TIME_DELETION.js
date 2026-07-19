const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://cqfsirfjwfxvwggjkrvd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I';

async function testRealTimeDeletion() {
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  REAL-TIME DRIVER DELETION TEST            ║');
    console.log('║  Simulating Super Admin Delete Flow        ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // Step 1: Create a test driver
    console.log('📝 Step 1: Creating test driver...\n');
    
    const testPhone = `999${Math.random().toString().slice(2, 9)}`;
    console.log(`   Phone: ${testPhone}`);

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `test${Date.now()}@taxi.local`,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    const userId = authData.user.id;
    console.log(`   ✅ Auth user created: ${userId}`);

    // Create user record
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        phone: testPhone,
        full_name: 'Test Driver For Delete',
        role_id: 3, // driver role
        is_active: true,
      });

    if (userError) {
      throw new Error(`User creation failed: ${userError.message}`);
    }
    console.log(`   ✅ User record created`);

    // Create driver record
    const { error: driverError } = await supabaseAdmin
      .from('drivers')
      .insert({
        user_id: userId,
        license_number: 'TEST_LICENSE_001',
        vehicle_number: 'TEST_VEHICLE_001',
      });

    if (driverError) {
      throw new Error(`Driver creation failed: ${driverError.message}`);
    }
    console.log(`   ✅ Driver record created\n`);

    // Step 2: Upload test documents
    console.log('📤 Step 2: Uploading test documents...\n');
    
    const testDocs = ['DL', 'VEHICLE_FRONT', 'INSURANCE'];
    const testContent = Buffer.from('TEST_DOCUMENT_CONTENT');

    for (const docType of testDocs) {
      const path = `drivers/${userId}/${docType}.jpg`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('driver-documents')
        .upload(path, testContent, { upsert: true });

      if (uploadError) {
        console.log(`   ⚠️  Could not upload ${docType}: ${uploadError.message}`);
      } else {
        console.log(`   ✅ Uploaded: ${docType}.jpg`);
      }
    }

    // Verify documents exist
    console.log(`\n🔍 Step 3: Verifying documents in bucket...\n`);
    const { data: beforeDelete } = await supabaseAdmin.storage
      .from('driver-documents')
      .list(`drivers/${userId}`);

    console.log(`   📊 Documents before deletion: ${beforeDelete?.length || 0} files`);
    beforeDelete?.forEach(f => {
      console.log(`      - ${f.name}`);
    });

    // Step 4: DELETE THE DRIVER (Real flow like super admin would do)
    console.log(`\n🗑️  Step 4: DELETING DRIVER (Real super admin flow)...\n`);
    console.log(`   Calling: DELETE /admin/users/${userId}\n`);

    const deleteResponse = await fetch(`http://localhost:5000/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const deleteResult = await deleteResponse.json();
    
    console.log('   ✅ Delete API Response:');
    console.log(`      Success: ${deleteResult.success}`);
    console.log(`      Message: ${deleteResult.message}`);
    console.log(`      Storage files deleted: ${deleteResult.deleted?.storageFilesDeleted || 0}`);
    console.log(`      Avatar files deleted: ${deleteResult.deleted?.avatarFilesDeleted || 0}`);
    console.log(`      Total files deleted: ${deleteResult.deleted?.totalFilesDeleted || 0}`);

    // Step 5: Verify documents are deleted
    console.log(`\n🔍 Step 5: VERIFYING DELETE from bucket...\n`);
    
    const { data: afterDelete, error: verifyError } = await supabaseAdmin.storage
      .from('driver-documents')
      .list(`drivers/${userId}`);

    if (verifyError && verifyError.message.includes('not found')) {
      console.log('   ✅ Folder no longer exists (deleted!)');
    } else if (afterDelete && afterDelete.length === 0) {
      console.log('   ✅ Folder exists but is EMPTY (all files deleted!)');
    } else if (afterDelete && afterDelete.length > 0) {
      console.log(`   ❌ STILL ${afterDelete.length} FILES IN BUCKET!`);
      afterDelete.forEach(f => {
        console.log(`      - ${f.name}`);
      });
    }

    // Step 6: Verify database records deleted
    console.log(`\n🔍 Step 6: VERIFYING DELETE from database...\n`);
    
    const { data: userExists, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    const { data: driverExists, error: driverCheckError } = await supabaseAdmin
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (userCheckError?.code === 'PGRST116') {
      console.log('   ✅ User record deleted from database');
    } else {
      console.log('   ❌ User record still exists in database!');
    }

    if (driverCheckError?.code === 'PGRST116') {
      console.log('   ✅ Driver record deleted from database');
    } else {
      console.log('   ❌ Driver record still exists in database!');
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  ✅ DELETION TEST COMPLETE                 ║');
    console.log('╚════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRealTimeDeletion();
