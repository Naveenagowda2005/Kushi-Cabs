const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkVendorsTable() {
  console.log('🔍 Checking vendors table structure...\n');

  try {
    // Try to get existing vendors to see the structure
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying vendors table:', error.message);
    } else {
      console.log('✅ Vendors table structure (sample):', vendors);
    }

    // Also check drivers table
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .limit(1);

    if (driversError) {
      console.error('❌ Error querying drivers table:', driversError.message);
    } else {
      console.log('✅ Drivers table structure (sample):', drivers);
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkVendorsTable();