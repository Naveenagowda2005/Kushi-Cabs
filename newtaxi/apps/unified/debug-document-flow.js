const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function debugDocumentFlow() {
  console.log('🔍 Debugging Document Upload Flow...\n');

  try {
    // Get all records from driver_documents
    console.log('1️⃣ All driver documents:');
    const { data: allDocs, error: docsError } = await supabase
      .from('driver_documents')
      .select('*');

    if (docsError) {
      console.error('❌ Error fetching documents:', docsError.message);
    } else {
      console.log(`✅ Found ${allDocs?.length || 0} document records`);
      allDocs?.forEach(doc => {
        console.log(`   - Driver: ${doc.driver_id}`);
        console.log(`     Type: ${doc.document_type}, Status: ${doc.status}`);
        console.log(`     Has data: ${!!doc.document_data}`);
      });
    }

    // Get all verification status records
    console.log('\n2️⃣ All verification status records:');
    const { data: allVerif, error: verifError } = await supabase
      .from('driver_verification_status')
      .select('*');

    if (verifError) {
      console.error('❌ Error fetching verifications:', verifError.message);
    } else {
      console.log(`✅ Found ${allVerif?.length || 0} verification records`);
      allVerif?.forEach(v => {
        console.log(`   - Driver: ${v.driver_id}`);
        console.log(`     Status: ${v.overall_status}`);
        console.log(`     Submitted: ${v.submitted_at}`);
        console.log(`     All docs submitted: ${v.all_documents_submitted}`);
      });
    }

    // Try the actual getPendingVerifications query
    console.log('\n3️⃣ getPendingVerifications query result:');
    const { data: pending, error: pendError } = await supabase
      .from('driver_verification_status')
      .select(`
        *,
        driver:driver_id(
          id,
          phone,
          full_name,
          email
        )
      `)
      .eq('overall_status', 'pending_review')
      .order('submitted_at', { ascending: true });

    if (pendError) {
      console.error('❌ Error:', pendError.message);
    } else {
      console.log(`✅ Found ${pending?.length || 0} pending reviews`);
      pending?.forEach(p => {
        console.log(`   - ${p.driver?.full_name || 'Unknown'} (${p.driver?.phone})`);
        console.log(`     Status: ${p.overall_status}`);
      });
    }

    // Check if documents table is empty or if issue is with status value
    console.log('\n4️⃣ Document statuses (all unique values):');
    const { data: statuses, error: statusError } = await supabase
      .from('driver_documents')
      .select('status')
      .distinct();

    if (statusError) {
      console.error('❌ Error:', statusError.message);
    } else {
      console.log('✅ Unique statuses found:');
      statuses?.forEach(s => console.log(`   - ${s.status}`));
    }

    // Check verification status values
    console.log('\n5️⃣ Verification overall_status (all unique values):');
    const { data: verifStatuses, error: verifStatusError } = await supabase
      .from('driver_verification_status')
      .select('overall_status')
      .distinct();

    if (verifStatusError) {
      console.error('❌ Error:', verifStatusError.message);
    } else {
      console.log('✅ Unique verification statuses found:');
      verifStatuses?.forEach(s => console.log(`   - ${s.overall_status}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugDocumentFlow();
