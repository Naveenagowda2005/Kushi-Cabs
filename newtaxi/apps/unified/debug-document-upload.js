/**
 * Debug script to test document upload
 * Run this in the app to diagnose upload issues
 */

import { supabase } from './src/lib/supabase';

export const debugDocumentUpload = async () => {
  try {
    console.log('=== DEBUG DOCUMENT UPLOAD ===');

    // 1. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('User error:', userError);

    if (!user) {
      console.error('No authenticated user!');
      return;
    }

    const userId = user.id;
    console.log('User ID:', userId);

    // 2. Check if user exists in users table
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('User data:', userData);
    console.log('User data error:', userDataError);

    // 3. Try to insert a test document
    console.log('\nAttempting to insert test document...');

    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 pixel PNG

    const { data: insertData, error: insertError } = await supabase
      .from('driver_documents')
      .insert([
        {
          driver_id: userId,
          document_type: 'DL',
          document_data: testBase64,
          document_name: 'test_dl.jpg',
          document_mime_type: 'image/jpeg',
          status: 'pending',
        }
      ])
      .select();

    console.log('Insert result:', insertData);
    console.log('Insert error:', insertError);

    if (insertError) {
      console.error('Insert failed!');
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error details:', insertError);
      return;
    }

    // 4. Try to read back the document
    console.log('\nAttempting to read back document...');

    const { data: readData, error: readError } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', userId)
      .eq('document_type', 'DL');

    console.log('Read result:', readData);
    console.log('Read error:', readError);

    // 5. Check RLS policies
    console.log('\n=== RLS POLICY CHECK ===');
    console.log('User ID:', userId);
    console.log('Document driver_id:', userId);
    console.log('RLS should allow: auth.uid() = driver_id');
    console.log('Match:', userId === userId);

    console.log('\n=== DEBUG COMPLETE ===');
  } catch (error) {
    console.error('Debug error:', error);
  }
};

// Export for use in app
export default debugDocumentUpload;
