const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testDriverSignup() {
  console.log('🧪 Testing complete driver signup flow...\n');

  const testEmail = `testdriver${Date.now()}@example.com`;
  const testPassword = 'test123456';
  const testPhone = `+123456${Date.now().toString().slice(-4)}`;

  try {
    // Step 1: Sign up
    console.log('1️⃣ Testing driver signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
      return;
    }

    console.log('✅ Signup successful, user ID:', signupData.user.id);

    // Step 2: Create complete profile
    console.log('2️⃣ Creating driver profile...');
    
    // Get driver role ID
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'driver')
      .single();

    // Create user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: signupData.user.id,
        email: signupData.user.email,
        role_id: roleData.id,
        full_name: 'Test Driver',
        phone: testPhone,
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ User profile creation failed:', profileError.message);
      return;
    }

    console.log('✅ User profile created');

    // Create driver profile
    const { error: driverError } = await supabase
      .from('drivers')
      .insert({
        user_id: signupData.user.id,
        license_number: 'DL123456789',
        vehicle_number: 'KA01AB1234',
        is_available: true,
        is_online: false
      });

    if (driverError) {
      console.error('❌ Driver profile creation failed:', driverError.message);
      return;
    }

    console.log('✅ Driver profile created');

    // Step 3: Test login
    console.log('3️⃣ Testing login...');
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

    // Test complete profile fetch
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

    console.log('✅ Complete driver profile:', completeProfile);
    console.log('\n🎉 Driver signup flow completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDriverSignup();