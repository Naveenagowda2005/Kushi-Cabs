const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUsersTable() {
  console.log('🔍 Checking users table structure...\n');

  try {
    // Get a sample user to see the structure
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying users table:', error.message);
    } else {
      console.log('✅ Users table structure (sample):', users);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkUsersTable();