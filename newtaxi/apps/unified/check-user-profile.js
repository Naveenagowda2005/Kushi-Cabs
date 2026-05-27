const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUserProfile() {
  console.log('🔍 Checking user profile...\n');

  try {
    const userId = '7a709d4b-5375-4ff4-8482-3cb9d9d1fc44';

    // Check if user exists in users table
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        roles (
          name
        )
      `)
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('❌ Error checking user profile:', userError.message);
    } else if (userProfile) {
      console.log('✅ User profile exists:', userProfile);
    } else {
      console.log('❌ No user profile found');
    }

    // Check if vendor profile exists
    const { data: vendorProfile, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (vendorError) {
      console.error('❌ Error checking vendor profile:', vendorError.message);
    } else if (vendorProfile) {
      console.log('✅ Vendor profile exists:', vendorProfile);
    } else {
      console.log('❌ No vendor profile found');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkUserProfile();