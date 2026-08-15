const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkVerificationStatus() {
  console.log('🔍 Checking Driver Verification Status...\n');

  try {
    // Check all drivers
    console.log('1️⃣ All drivers:');
    const { data: drivers, error: driverError } = await supabase
      .from('users')
      .select('id, full_name, phone, role')
      .eq('role', 'driver');

    if (driverError) {
      console.error('❌ Error fetching drivers:', driverError.message);
    } else {
      console.log(`✅ Found ${drivers?.length || 0} drivers`);
      drivers?.forEach(d => console.log(`   - ${d.full_name} (${d.phone})`));
    }

    // Check verification status records
    console.log('\n2️⃣ Verification status records:');
    const { data: verifications, error: verError } = await supabase
      .from('driver_verification_status')
      .select('*');

    if (verError) {
      console.error('❌ Error fetching verifications:', verError.message);
    } else {
      console.log(`✅ Found ${verifications?.length || 0} verification records`);
      verifications?.forEach(v => {
        console.log(`   - Driver ${v.driver_id}: ${v.overall_status}`);
        console.log(`     Submitted: ${v.submitted_at}, Approved: ${v.approved_at}`);
      });
    }

    // Check driver documents
    console.log('\n3️⃣ Driver documents:');
    const { data: documents, error: docError } = await supabase
      .from('driver_documents')
      .select('driver_id, document_type, status, COUNT(*) as count')
      .group_by('driver_id, document_type, status');

    if (docError) {
      console.error('❌ Error fetching documents:', docError.message);
    } else {
      console.log(`✅ Found ${documents?.length || 0} document records`);
      documents?.forEach(d => {
        console.log(`   - Driver ${d.driver_id}: ${d.document_type} = ${d.status}`);
      });
    }

    // Check pending review specifically
    console.log('\n4️⃣ Drivers with pending_review status:');
    const { data: pending, error: pendError } = await supabase
      .from('driver_verification_status')
      .select('*')
      .eq('overall_status', 'pending_review');

    if (pendError) {
      console.error('❌ Error:', pendError.message);
    } else {
      console.log(`✅ Found ${pending?.length || 0} drivers with pending_review status`);
    }

    // Check any status different from 'approved'
    console.log('\n5️⃣ Drivers with non-approved status:');
    const { data: nonApproved, error: nonAppError } = await supabase
      .from('driver_verification_status')
      .select('*')
      .neq('overall_status', 'approved');

    if (nonAppError) {
      console.error('❌ Error:', nonAppError.message);
    } else {
      console.log(`✅ Found ${nonApproved?.length || 0} drivers with non-approved status`);
      nonApproved?.forEach(d => {
        console.log(`   - ${d.driver_id}: ${d.overall_status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkVerificationStatus();
