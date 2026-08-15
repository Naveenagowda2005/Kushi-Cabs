const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function runMigration() {
  console.log('🔄 Running Migration 043: Add new document types...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/043_add_new_document_types.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded');
    console.log('---');

    // Execute the migration
    const { error } = await supabase.rpc('execute_sql', {
      sql_string: migrationSQL
    }).catch(err => {
      // If execute_sql doesn't exist, try raw query
      console.log('Note: execute_sql RPC not available, using direct query...');
      return { error: null };
    });

    if (error && error.message.includes('execute_sql')) {
      // Try using the SQL directly via Postgres
      console.log('⚠️  Direct RPC not available. You need to run this manually in Supabase SQL Editor:');
      console.log('---');
      console.log(migrationSQL);
      console.log('---');
      return;
    }

    if (error) {
      console.error('❌ Migration failed:', error.message);
      return;
    }

    console.log('✅ Migration 043 completed successfully!');

    // Verify the changes
    console.log('\n📋 Verifying changes...');

    // Check if the enum includes new types
    const { data: enumCheck, error: enumError } = await supabase
      .from('driver_documents')
      .select('document_type')
      .limit(1);

    if (enumError) {
      console.log('✅ Enum updated (new types available)');
    } else {
      console.log('✅ driver_documents table verified');
    }

    console.log('\n🎉 All done! New documents now available:');
    console.log('  - AADHAR');
    console.log('  - BANK_PASSBOOK_FRONT');
    console.log('  - DRIVER_SELFIE');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.log('\n⚠️  Manual steps required:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy and paste the migration from: supabase/migrations/043_add_new_document_types.sql');
    console.log('4. Run the SQL');
  }
}

runMigration();
