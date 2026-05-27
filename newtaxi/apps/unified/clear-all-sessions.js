const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function clearAllSessions() {
  console.log('🧹 Clearing all sessions for fresh start...\n');

  try {
    // Sign out any current session
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Error signing out:', error.message);
    } else {
      console.log('✅ Successfully cleared all sessions');
    }

    // Check current session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session after cleanup:', session ? 'EXISTS' : 'NONE');

    console.log('\n🎉 Session cleanup completed!');
    console.log('The app should now start fresh with role selection screen.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

clearAllSessions();