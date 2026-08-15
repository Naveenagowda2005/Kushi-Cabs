#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cqfsirfjwfxvwggjkrvd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I';

async function verify() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  console.log('🔍 Checking if migration 067 was applied...\n');
  
  try {
    // Query app_settings to see if the column exists
    const { data, error } = await supabase
      .from('app_settings')
      .select('minimum_wallet_balance_for_drivers')
      .single();
    
    if (error) {
      if (error.message.includes('minimum_wallet_balance_for_drivers')) {
        console.error('❌ Column NOT found:', error.message);
        process.exit(1);
      } else {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    }
    
    if (data) {
      console.log('✅ Migration 067 SUCCESSFUL!');
      console.log(`✅ Column "minimum_wallet_balance_for_drivers" exists`);
      console.log(`✅ Current value: ${data.minimum_wallet_balance_for_drivers}`);
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verify();
