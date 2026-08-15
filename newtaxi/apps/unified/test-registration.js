const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testRegistration() {
  console.log('🧪 Testing registration for existing auth user...\n');

  try {
    // Use the existing user ID from the logs
    const userId = '7a709d4b-5375-4ff4-8482-3cb9d9d1fc44';
    const email = 'naveenagowdaan@gmail.com';

    console.log('1️⃣ Testing vendor profile creation for user:', userId);

    // Get vendor role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'vendor')
      .single();

    if (roleError) throw roleError;
    console.log('✅ Vendor role ID:', roleData.id);

    // Create user profile (only common fields)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        role_id: roleData.id,
        full_name: 'Naveena Gowda',
        phone: '+1234567890',
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ User profile creation failed:', profileError.message);
      return;
    }

    console.log('✅ User profile created:', userProfile);

    // Create vendor profile
    const { error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: userId,
        company_name: 'Naveena Transport',
        commission_pct: 10
      });

    if (vendorError) {
      console.error('❌ Vendor profile creation failed:', vendorError.message);
      return;
    }

    console.log('✅ Vendor profile created successfully');

    // Test profile fetch
    const { data: fetchedProfile, error: fetchError } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          name
        )
      `)
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Profile fetch failed:', fetchError.message);
      return;
    }

    console.log('✅ Complete profile:', fetchedProfile);
    console.log('\n🎉 Registration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegistration();