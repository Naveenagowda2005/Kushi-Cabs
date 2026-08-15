const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testVendorPhoneSignup() {
  console.log('🧪 Testing complete vendor phone signup flow...\n');

  const testPhone = '+919876543999';
  const testPassword = 'vendor123';
  const testName = 'Test Vendor Phone';
  const testBusiness = 'Phone Taxi Service';

  try {
    // Step 1: Phone-based signup
    console.log('1️⃣ Testing vendor phone signup...');
    
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

    console.log('✅ Phone signup successful, user ID:', signupData.user.id);

    // Step 2: Create vendor profile
    console.log('2️⃣ Creating vendor profile...');
    
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
        full_name: testName,
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

    // Create vendor profile
    const { error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: signupData.user.id,
        company_name: testBusiness,
        commission_pct: 10
      });

    if (vendorError) {
      console.error('❌ Vendor profile creation failed:', vendorError.message);
      return;
    }

    console.log('✅ Vendor profile created');

    // Step 3: Test phone-based login
    console.log('3️⃣ Testing phone-based login...');
    
    await supabase.auth.signOut();
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Phone login successful');

    // Step 4: Verify complete profile
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

    console.log('✅ Complete vendor profile:', {
      id: completeProfile.id,
      phone: completeProfile.phone,
      full_name: completeProfile.full_name,
      role: completeProfile.roles.name,
      auth_email: loginData.user.email
    });

    console.log('\n🎉 Vendor phone signup flow completed successfully!');
    console.log(`📱 Login credentials: Phone: ${testPhone}, Password: ${testPassword}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVendorPhoneSignup();