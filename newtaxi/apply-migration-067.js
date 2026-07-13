#!/usr/bin/env node

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://cqfsirfjwfxvwggjkrvd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZnNpcmZqd2Z4dndnZ2prcnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI1MjI0MCwiZXhwIjoyMDk4ODI4MjQwfQ.lqDE4vRbJylPAjQCwUChlxMdICjjoYrm73QpuAJtF5I';

const migrationSQL = `
-- Add minimum_wallet_balance_for_drivers setting to app_settings table

ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS minimum_wallet_balance_for_drivers NUMERIC DEFAULT 500 NOT NULL;

-- Update existing row with default minimum wallet balance
UPDATE public.app_settings 
SET minimum_wallet_balance_for_drivers = 500 
WHERE id = 'global';

-- Ensure RLS is enabled
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read app settings
CREATE POLICY IF NOT EXISTS "Anyone can read app settings" ON public.app_settings
  FOR SELECT USING (true);

-- Allow only super admins to update app settings
CREATE POLICY IF NOT EXISTS "Only super admins can update app settings" ON public.app_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role_id = (SELECT id FROM roles WHERE name = 'super_admin')
    )
  );
`;

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode, data });
        } else {
          reject({ statusCode: res.statusCode, error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function runMigration() {
  console.log('🚀 Applying Migration 067: Add minimum_wallet_balance_for_drivers...\n');
  
  try {
    const result = await executeSQL(migrationSQL);
    console.log('✅ Migration 067 applied successfully!');
    console.log('Status Code:', result.statusCode);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying migration:');
    if (error.statusCode) {
      console.error(`Status: ${error.statusCode}`);
      console.error(`Error: ${error.error}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

runMigration();
