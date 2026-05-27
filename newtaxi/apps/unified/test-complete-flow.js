const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testCompleteFlow() {
  console.log('🧪 Testing complete phone signup and login flow...\n');

  const testPhone = '+919876543111';
  const testPassword = 'test123456';

  try {
    // Step 1: Clear any existing session
    console.log('1️⃣ Clearing existing sessions...');
    await supabase.auth.signOut();

    // Step 2: Test phone-based signup (what happens when user clicks "Create Account")
    console.log('2️⃣ Testing phone signup...');
    
    const phoneDigits = testPhone.replace(/[^0-9]/g, '');
    const email = `${phoneDigits}@kushicabs.phone`;
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password: testPassword,
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
      return;
    }

    console.log('✅ Signup successful - user should now complete registration');
    console.log('User ID:', signupData.user.id);
    console.log('Auth Email:', signupData.user.email);
    console.log('Original Phone:', testPhone);

    // Step 3: Simulate completing registration
    console.log('3️⃣ Simulating registration completion...');
    
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
        full_name: 'Test User Complete',
        phone: testPhone,
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      return;
    }

    // Create vendor profile
    const { error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: signupData.user.id,
        company_name: 'Test Complete Business',
        commission_pct: 10
      });

    if (vendorError) {
      console.error('❌ Vendor profile creation failed:', vendorError.message);
      return;
    }

    console.log('✅ Registration completed successfully');

    // Step 4: Test subsequent login
    console.log('4️⃣ Testing login after registration...');
    
    await supabase.auth.signOut();
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Login successful');

    // Verify complete profile
    const { data: completeProfile, error: fetchError } = await supabase
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

    console.log('✅ User should now be routed to vendor dashboard');
    console.log('Profile:', {
      phone: completeProfile.phone,
      role: completeProfile.roles.name,
      name: completeProfile.full_name
    });

    console.log('\n🎉 Complete flow test successful!');
    console.log('\n📋 Summary:');
    console.log('1. ✅ Phone signup works');
    console.log('2. ✅ Registration completion works');
    console.log('3. ✅ Subsequent login works');
    console.log('4. ✅ User profile is complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow();