#!/usr/bin/env node

/**
 * Create Super Admin User
 * 
 * This script creates a super admin user using the Supabase Admin API
 * 
 * USAGE:
 * 1. Get your Supabase Service Role Key from: https://supabase.com/dashboard
 *    → Settings → API → Service Role Key
 * 2. Set environment variables:
 *    export SUPABASE_URL="https://your-project.supabase.co"
 *    export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 * 3. Run: node create-super-admin.js
 */

const https = require('https');
const url = require('url');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PHONE = '9686314982';
const EMAIL = '9686314982@kushicabs.phone';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('Please set:');
  console.error('  SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Helper to make HTTPS requests
function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(SUPABASE_URL);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin User...\n');

    // Step 1: Create auth user with phone
    console.log('Step 1: Creating auth user with phone...');
    const authResponse = await makeRequest('POST', '/auth/v1/admin/users', {
      phone: PHONE,
      email: EMAIL,
      user_metadata: {
        full_name: 'Super Admin',
      },
      autoconfirm: true,
    });

    if (authResponse.status !== 201) {
      console.error('❌ Failed to create auth user:');
      console.error(JSON.stringify(authResponse.data, null, 2));
      process.exit(1);
    }

    const authUser = authResponse.data;
    const userId = authUser.id;

    console.log(`✓ Auth user created: ${userId}`);
    console.log(`  Email: ${authUser.email}`);
    console.log(`  Phone: ${authUser.phone}\n`);

    // Step 2: Create user profile in public.users table
    console.log('Step 2: Creating user profile...');
    
    // First, get the super_admin role ID
    const rolesResponse = await makeRequest('GET', '/rest/v1/roles?name=eq.super_admin', null);
    
    if (rolesResponse.status !== 200 || rolesResponse.data.length === 0) {
      console.error('❌ Super admin role not found in database');
      console.error('Make sure migrations have been run');
      process.exit(1);
    }

    const roleId = rolesResponse.data[0].id;
    console.log(`  Role ID: ${roleId}`);

    // Create the user profile
    const userResponse = await makeRequest('POST', '/rest/v1/users', {
      id: userId,
      email: EMAIL,
      phone: PHONE,
      full_name: 'Super Admin',
      role_id: roleId,
      is_active: true,
    });

    if (userResponse.status !== 201) {
      console.error('❌ Failed to create user profile:');
      console.error(JSON.stringify(userResponse.data, null, 2));
      process.exit(1);
    }

    console.log(`✓ User profile created\n`);

    // Success!
    console.log('✅ Super Admin Created Successfully!\n');
    console.log('📱 Login Credentials:');
    console.log(`  Phone: ${PHONE}`);
    console.log(`  Email: ${EMAIL}`);
    console.log(`  User ID: ${userId}\n`);
    console.log('🎮 Next Steps:');
    console.log('  1. Open the app');
    console.log('  2. Select role: Super Admin');
    console.log(`  3. Enter phone: ${PHONE}`);
    console.log('  4. Wait for OTP');
    console.log('  5. Enter the OTP and login\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
