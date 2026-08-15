const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('🔍 Checking database...\n');

  try {
    // Check roles
    console.log('1️⃣ Checking roles...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*');

    if (rolesError) {
      console.error('❌ Error fetching roles:', rolesError.message);
    } else {
      console.log('✅ Roles found:', roles);
    }

    // Check users
    console.log('\n2️⃣ Checking users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          name
        )
      `);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
    } else {
      console.log('✅ Users found:', users);
    }

    // Try to sign in with the credentials
    console.log('\n3️⃣ Testing login credentials...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@newtaxi.com',
      password: 'admin123'
    });

    if (authError) {
      console.error('❌ Login failed:', authError.message);
    } else {
      console.log('✅ Login successful:', authData.user.email);
      
      // Sign out after test
      await supabase.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkDatabase();