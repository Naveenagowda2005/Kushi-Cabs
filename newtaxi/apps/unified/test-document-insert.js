const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  console.log('🧪 Testing Document Insert...\n');

  try {
    // Get a driver ID
    console.log('1️⃣ Getting a driver...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, full_name, phone')
      .limit(1);

    if (userError || !users?.[0]) {
      console.error('❌ No driver found');
      return;
    }

    const driverId = users[0].id;
    console.log(`✅ Found driver: ${users[0].full_name} (${users[0].phone})`);
    console.log(`   ID: ${driverId}`);

    // Try to insert a test document
    console.log('\n2️⃣ Attempting to insert document...');
    const testBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDA=='; // Tiny test image
    
    const { data, error } = await supabase
      .from('driver_documents')
      .insert({
        driver_id: driverId,
        document_type: 'DL',
        document_data: testBase64,
        document_name: 'test.jpg',
        document_mime_type: 'image/jpeg',
        status: 'pending'
      })
      .select();

    if (error) {
      console.error('❌ Insert failed:', error.message);
      console.error('Details:', error);
    } else {
      console.log('✅ Insert successful!');
      console.log('Data:', JSON.stringify(data, null, 2));
    }

    // Check if it was stored
    console.log('\n3️⃣ Verifying insert...');
    const { data: checkData, error: checkError } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId);

    if (checkError) {
      console.error('❌ Check failed:', checkError.message);
    } else {
      console.log(`✅ Found ${checkData?.length || 0} documents for this driver`);
      checkData?.forEach(doc => {
        console.log(`   - ${doc.document_type}: ${doc.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testInsert();
