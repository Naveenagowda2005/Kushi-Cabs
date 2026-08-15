const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function debugAuth() {
  console.log('🔍 Debugging authentication...\n');

  try {
    // Sign in and get the auth user
    console.log('1️⃣ Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@newtaxi.com',
      password: 'admin123'
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Auth successful');
    console.log('Auth User ID:', authData.user.id);
    console.log('Auth User Email:', authData.user.email);

    // Check what users exist in the database
    console.log('\n2️⃣ Checking users in database...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        roles (
          name
        )
      `);

    if (usersError) {
      console.error('❌ Users error:', usersError.message);
    } else {
      console.log('✅ Users in database:');
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.roles?.name}`);
      });
    }

    // Try to find the user profile for the authenticated user
    console.log('\n3️⃣ Looking for user profile...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          name
        )
      `)
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
    } else if (userProfile) {
      console.log('✅ User profile found:', userProfile);
    } else {
      console.log('❌ No user profile found for auth user ID:', authData.user.id);
    }

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAuth();