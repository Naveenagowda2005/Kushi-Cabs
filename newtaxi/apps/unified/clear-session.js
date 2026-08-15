const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function clearSession() {
  console.log('🧹 Clearing all sessions...\n');

  try {
    // Sign out to clear any existing session
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Error signing out:', error.message);
    } else {
      console.log('✅ Successfully cleared session');
    }

    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session ? 'EXISTS' : 'NONE');

  } catch (error) {
    console.error('❌ Clear session failed:', error.message);
  }
}

clearSession();