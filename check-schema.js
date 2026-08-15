const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('🔍 Checking Database Schema...\n');

  try {
    // Check users table
    console.log('1️⃣ Users table:');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (userError) {
      console.error('❌ Error:', userError.message);
    } else {
      console.log('✅ Sample user:');
      console.log(JSON.stringify(users?.[0], null, 2));
    }

    // Check driver_verification_status table
    console.log('\n2️⃣ Driver verification status table:');
    const { data: verif, error: verifError } = await supabase
      .from('driver_verification_status')
      .select('*')
      .limit(1);

    if (verifError) {
      console.error('❌ Error:', verifError.message);
    } else {
      console.log('✅ Sample verification record:');
      console.log(JSON.stringify(verif?.[0], null, 2));
    }

    // Check driver_documents table
    console.log('\n3️⃣ Driver documents table:');
    const { data: docs, error: docsError } = await supabase
      .from('driver_documents')
      .select('*')
      .limit(1);

    if (docsError) {
      console.error('❌ Error:', docsError.message);
    } else {
      console.log('✅ Sample document:');
      console.log(JSON.stringify(docs?.[0], null, 2));
    }

    // Count records
    console.log('\n4️⃣ Record counts:');
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    console.log(`✅ Users: ${userCount}`);

    const { count: verifCount } = await supabase
      .from('driver_verification_status')
      .select('*', { count: 'exact', head: true });
    console.log(`✅ Verification records: ${verifCount}`);

    const { count: docCount } = await supabase
      .from('driver_documents')
      .select('*', { count: 'exact', head: true });
    console.log(`✅ Documents: ${docCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
