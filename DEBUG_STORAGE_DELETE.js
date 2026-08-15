const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cqfsirfjwfxvwggjkrvd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I';

const userId = 'b166772a-0af6-44cb-9620-98641f35fe39';

async function testStorageDelete() {
  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    console.log('\n=== DEBUGGING STORAGE DELETION ===\n');
    console.log(`Testing deletion for user: ${userId}\n`);

    // Step 1: List files in driver-documents
    console.log('📂 Step 1: Listing files in driver-documents bucket...');
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('driver-documents')
      .list(userId, { limit: 1000 });

    console.log('List error:', listError);
    console.log('Files found:', files?.length || 0);
    
    if (files && files.length > 0) {
      console.log('\nFiles in bucket:');
      files.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.name} (id: ${f.id}, type: ${f.id ? 'file' : 'folder'})`);
      });

      // Step 2: Filter actual files
      console.log('\n📋 Step 2: Filtering actual files...');
      const actualFiles = files.filter(f => f.id && !f.name.endsWith('/'));
      console.log(`Actual files: ${actualFiles.length}`);
      actualFiles.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.name}`);
      });

      // Step 3: Build paths
      console.log('\n🔗 Step 3: Building full paths...');
      const filePaths = actualFiles.map(f => `${userId}/${f.name}`);
      console.log('Paths to delete:');
      filePaths.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p}`);
      });

      // Step 4: Attempt deletion
      console.log('\n🗑️  Step 4: Attempting to delete files...');
      console.log(`Calling .remove() with ${filePaths.length} files`);
      
      const { error: deleteError, data: deleteData } = await supabaseAdmin.storage
        .from('driver-documents')
        .remove(filePaths);

      console.log('Delete error:', deleteError);
      console.log('Delete data:', deleteData);

      if (deleteError) {
        console.log('\n❌ DELETION FAILED!');
        console.log('Error message:', deleteError.message);
        console.log('Error details:', deleteError);
      } else {
        console.log('\n✅ Deletion succeeded (according to response)');
      }

      // Step 5: Verify deletion
      console.log('\n🔍 Step 5: Verifying deletion...');
      const { data: verifyFiles, error: verifyError } = await supabaseAdmin.storage
        .from('driver-documents')
        .list(userId, { limit: 1000 });

      console.log('Verify error:', verifyError);
      console.log('Files remaining:', verifyFiles?.length || 0);
      
      if (verifyFiles && verifyFiles.length > 0) {
        console.log('\n❌ FILES STILL EXIST AFTER DELETION!');
        verifyFiles.forEach((f, i) => {
          console.log(`  ${i + 1}. ${f.name}`);
        });
      } else {
        console.log('\n✅ All files deleted successfully!');
      }
    } else {
      console.log('No files found for this user');
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
  }
}

testStorageDelete();
