const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testSignupFlow() {
  console.log('🧪 Testing signup and registration flow...\n');

  const testEmail = `testvendor${Date.now()}@example.com`; // Unique email
  const testPassword = 'test123456';
  const testPhone = `+123456${Date.now().toString().slice(-4)}`; // Unique phone number

  try {
    // Step 1: Clean up any existing test user
    console.log('1️⃣ Cleaning up existing test user...');
    await supabase.auth.signOut();
    
    // Try to sign in and delete if exists
    const { data: existingAuth } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (existingAuth?.user) {
      console.log('Found existing test user, cleaning up...');
      // Delete from users table
      await supabase.from('users').delete().eq('id', existingAuth.user.id);
      // Delete from vendors table
      await supabase.from('vendors').delete().eq('user_id', existingAuth.user.id);
      await supabase.auth.signOut();
    }

    // Step 2: Test signup
    console.log('2️⃣ Testing signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
      return;
    }

    console.log('✅ Signup successful, user ID:', signupData.user.id);

    // Step 3: Test profile creation
    console.log('3️⃣ Testing profile creation...');
    
    // Get vendor role ID
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'vendor')
      .single();

    // Create user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: signupData.user.id,
        email: signupData.user.email,
        role_id: roleData.id,
        full_name: 'Test Vendor',
        phone: testPhone
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      return;
    }

    console.log('✅ User profile created:', userProfile);

    // Create vendor profile
    const { error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: signupData.user.id,
        company_name: 'Test Business',
        commission_pct: 10
      });

    if (vendorError) {
      console.error('❌ Vendor profile creation failed:', vendorError.message);
      return;
    }

    console.log('✅ Vendor profile created');

    // Step 4: Test login with complete profile
    console.log('4️⃣ Testing login with complete profile...');
    await supabase.auth.signOut();
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful');

    // Test profile fetch
    const { data: fetchedProfile, error: fetchError } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          name
        )
      `)
      .eq('id', loginData.user.id)
      .single();

    if (fetchError) {
      console.error('❌ Profile fetch failed:', fetchError.message);
      return;
    }

    console.log('✅ Profile fetched successfully:', fetchedProfile);

    console.log('\n🎉 All tests passed! Signup and registration flow is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSignupFlow();