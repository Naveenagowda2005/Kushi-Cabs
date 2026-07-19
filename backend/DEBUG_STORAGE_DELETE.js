const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cqfsirfjwfxvwggjkrvd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I';

const userId = 'b166772a-0af6-44cb-9620-98641f35fe39';

async function testCorrectDeletion() {
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    console.log('\n=== TESTING CORRECTED DELETION ===\n');

    // CORRECT path: drivers/userId
    const driverFolder = `drivers/${userId}`;
    console.log(`🗑️  Deleting files from: ${driverFolder}\n`);

    // Step 1: List files
    console.log('📂 Step 1: Listing files...');
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('driver-documents')
      .list(driverFolder, { limit: 1000 });

    if (listError) {
      console.log(`❌ List error: ${listError.message}`);
      return;
    }

    console.log(`Found: ${files?.length || 0} items\n`);
    
    if (files && files.length > 0) {
      console.log('Files to delete:');
      files.forEach((f) => {
        console.log(`  - ${f.name}`);
      });

      // Step 2: Filter actual files
      const actualFiles = files.filter(f => f.id && !f.name.endsWith('/'));
      if (actualFiles.length === 0) {
        console.log('\n⚠️  No actual files found (only directories)');
        return;
      }

      // Step 3: Build paths
      const filePaths = actualFiles.map(f => `${driverFolder}/${f.name}`);
      
      // Step 4: Delete
      console.log(`\n🗑️  Attempting to delete ${filePaths.length} files...`);
      const { error: deleteError } = await supabaseAdmin.storage
        .from('driver-documents')
        .remove(filePaths);

      if (deleteError) {
        console.log(`❌ Delete failed: ${deleteError.message}`);
        return;
      }

      console.log('✅ Delete succeeded!\n');

      // Step 5: Verify
      console.log('🔍 Verifying deletion...');
      const { data: verifyFiles } = await supabaseAdmin.storage
        .from('driver-documents')
        .list(driverFolder, { limit: 1000 });

      if (verifyFiles && verifyFiles.length > 0) {
        console.log(`\n❌ STILL ${verifyFiles.length} ITEMS IN BUCKET!`);
        verifyFiles.forEach((f) => {
          console.log(`  - ${f.name}`);
        });
      } else {
        console.log('\n✅ ALL FILES DELETED SUCCESSFULLY!');
      }
    } else {
      console.log('No files found');
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
  }
}

testCorrectDeletion();
