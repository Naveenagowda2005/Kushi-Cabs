/**
 * Test script to verify driver photo loading from driver_documents
 * Run with: npx cross-env NODE_PATH=. node test-driver-photo-loading.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDriverPhotos() {
  console.log('🔍 Testing driver photo loading...\n');

  try {
    // Step 1: Fetch approved drivers
    console.log('1️⃣ Fetching approved drivers...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, phone, verification_status')
      .eq('verification_status', 'approved')
      .eq('is_active', true)
      .not('full_name', 'ilike', '%dummy%')
      .limit(3);

    if (usersError) throw usersError;
    console.log(`✅ Found ${users?.length || 0} approved drivers\n`);

    if (!users || users.length === 0) {
      console.log('⚠️ No approved drivers found');
      return;
    }

    // Step 2: For each driver, fetch their driver_documents
    for (const user of users) {
      console.log(`👤 Checking driver: ${user.full_name} (${user.id})`);

      // Fetch driver documents
      const { data: driverDocs, error: docsError } = await supabase
        .from('driver_documents')
        .select('document_data, document_mime_type, document_type')
        .eq('driver_id', user.id)
        .eq('document_type', 'DRIVER_SELFIE')
        .maybeSingle();

      if (docsError) {
        console.log(`   ❌ Error: ${docsError.message}`);
        continue;
      }

      if (driverDocs?.document_data) {
        const isDataUrl = driverDocs.document_data.startsWith('data:');
        const dataLength = driverDocs.document_data.length;
        const mimeType = driverDocs.document_mime_type || 'image/jpeg';
        
        console.log(`   ✅ DRIVER_SELFIE found`);
        console.log(`      - Format: ${isDataUrl ? 'Data URL' : 'Base64'}`);
        console.log(`      - MIME Type: ${mimeType}`);
        console.log(`      - Size: ${dataLength} bytes`);
        console.log(`      - Data preview: ${driverDocs.document_data.substring(0, 50)}...`);
      } else {
        console.log(`   ⚠️  No DRIVER_SELFIE document found`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDriverPhotos();
