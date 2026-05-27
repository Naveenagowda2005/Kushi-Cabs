const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testPhoneAuth() {
  console.log('🧪 Testing phone-based authentication...\n');

  const testPhone = '+919876543210';
  const testPassword = 'test123456';
  
  try {
    // Step 1: Test phone-based signup
    console.log('1️⃣ Testing phone-based signup...');
    
    // Convert phone to email format
    const phoneDigits = testPhone.replace(/[^0-9]/g, '');
    const email = `${phoneDigits}@kushicabs.phone`;
    
    console.log('Phone:', testPhone);
    console.log('Generated email:', email);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password: testPassword,
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message);
      return;
    }

    console.log('✅ Phone-based signup successful, user ID:', signupData.user.id);

    // Step 2: Test phone-based login
    console.log('2️⃣ Testing phone-based login...');
    
    await supabase.auth.signOut();
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: testPassword,
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      return;
    }

    console.log('✅ Phone-based login successful');
    console.log('User email in auth:', loginData.user.email);
    console.log('Original phone:', testPhone);

    console.log('\n🎉 Phone-based authentication working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPhoneAuth();