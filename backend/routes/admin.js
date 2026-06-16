const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  WARNING: Supabase credentials not set in .env');
  console.warn('Admin endpoints will not work');
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

/**
 * POST /admin/create-driver-account
 * Atomically handles driver/vendor signup:
 * - Deletes any stale auth account for this email
 * - Creates a fresh auth account with a fixed password
 * - Returns the new user ID
 */
router.post('/create-driver-account', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    if (!supabaseAdmin) return res.status(500).json({ error: 'Admin credentials not configured' });

    const email = `${phone}@kushicabs.phone`;
    const password = `OTP-${phone}-kushicabs`;

    console.log(`🔑 Creating/resetting account for: ${email}`);

    // 1. Check if auth user already exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return res.status(500).json({ error: listError.message });

    const existing = users.find(u => u.email === email);

    if (existing) {
      console.log(`Found existing auth user: ${existing.id} - updating password`);
      // Update the password to our known value so client can sign in
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: password,
        email_confirm: true
      });
      if (updateError) return res.status(500).json({ error: updateError.message });
      console.log(`✅ Password updated for existing user`);
      return res.json({ success: true, userId: existing.id, email, isNew: false });
    }

    // 2. Create fresh auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone }
    });

    if (createError) return res.status(500).json({ error: createError.message });

    console.log(`✅ New auth user created: ${newUser.user.id}`);
    res.json({ success: true, userId: newUser.user.id, email, isNew: true });

  } catch (error) {
    console.error('create-driver-account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/get-user-by-email
 * Look up auth user ID by email - used during signup when auth account already exists
 */
router.post('/get-user-by-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!supabaseAdmin) return res.status(500).json({ error: 'Admin credentials not configured' });

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) return res.status(500).json({ error: error.message });

    const found = users.find(u => u.email === email);
    if (!found) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, userId: found.id, email: found.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /admin/delete-user
 * Delete a user from both Supabase Auth and Database
 * First checks for pending trips - user cannot be deleted if they have incomplete trips
 * 
 * Required body:
 * {
 *   userId: "user-uuid",
 *   email: "user@example.com" OR phone: "1234567890"
 * }
 */
router.post('/delete-user', async (req, res) => {
  try {
    const { userId, email, phone } = req.body;

    console.log('🗑️  DELETE USER REQUEST:', { userId, email, phone });

    // Validate input
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!email && !phone) {
      return res.status(400).json({ error: 'email or phone is required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin credentials not configured' });
    }

    // STEP 0: Check for pending trips (NEW)
    console.log(`Step 0: Checking for pending trips for user ${userId}...`);
    
    // Check for trips created by this user (as driver/vendor)
    const { data: createdTrips, error: createdError } = await supabaseAdmin
      .from('trips')
      .select('id, status, created_by')
      .eq('created_by', userId);

    if (createdError && createdError.code !== 'PGRST116') {
      console.error('⚠️  Error checking created trips:', createdError.message);
    }

    // Check for trips where user is the accepted driver
    const { data: acceptedTrips, error: acceptedError } = await supabaseAdmin
      .from('trips')
      .select('id, status, driver_id')
      .eq('driver_id', userId);

    if (acceptedError && acceptedError.code !== 'PGRST116') {
      console.error('⚠️  Error checking accepted trips:', acceptedError.message);
    }

    // Filter for pending/active trips
    const pendingTrips = [];
    const pendingStatuses = ['pending', 'accepted', 'in_progress', 'awaiting_payment'];

    if (createdTrips && createdTrips.length > 0) {
      const pending = createdTrips.filter(trip => pendingStatuses.includes(trip.status));
      pendingTrips.push(...pending);
    }

    if (acceptedTrips && acceptedTrips.length > 0) {
      const pending = acceptedTrips.filter(trip => pendingStatuses.includes(trip.status));
      pendingTrips.push(...pending);
    }

    // If there are pending trips, don't allow deletion
    if (pendingTrips.length > 0) {
      console.log(`⚠️  User has ${pendingTrips.length} pending trip(s)`);
      return res.status(400).json({
        success: false,
        error: 'Cannot delete user with pending trips',
        message: `This user has ${pendingTrips.length} incomplete trip(s). Please complete or cancel all trips before deleting this account.`,
        pendingTripsCount: pendingTrips.length,
        tripStatuses: [...new Set(pendingTrips.map(t => t.status))]
      });
    }

    console.log('✅ No pending trips found - safe to delete');

    // Step 1a: Delete all associated trips (to avoid foreign key violations)
    // Delete trips where user is either the creator OR the accepted driver
    console.log(`Step 1a: Deleting all trips related to user ${userId}...`);
    
    // First, get all trips that reference this user as driver to clear driver_id
    const { data: tripsAsDriver } = await supabaseAdmin
      .from('trips')
      .select('id')
      .eq('accepted_by', userId);
    
    // Clear driver references in trips where this user was accepted_by
    if (tripsAsDriver && tripsAsDriver.length > 0) {
      const { error: clearError } = await supabaseAdmin
        .from('trips')
        .update({ accepted_by: null, driver_id: null })
        .eq('accepted_by', userId);
      
      if (clearError) {
        console.warn('⚠️  Warning: Could not clear driver references:', clearError.message);
      } else {
        console.log(`✅ Cleared driver references from ${tripsAsDriver.length} trips`);
      }
    }
    
    // Delete trips created by user
    const { error: tripsError1 } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('created_by', userId);

    if (tripsError1) {
      console.error('⚠️  Error deleting trips (created):', tripsError1.message);
    } else {
      console.log('✅ Trips (created by user) deleted');
    }

    // Delete remaining trips where user is referenced
    const { error: tripsError2 } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('accepted_by', userId);

    if (tripsError2) {
      console.error('⚠️  Error deleting trips (accepted):', tripsError2.message);
    } else {
      console.log('✅ Trips (accepted by user) deleted');
    }

    // Step 1b: Delete from Supabase Auth
    console.log(`Step 1b: Deleting auth user ${userId}...`);
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('❌ Auth deletion error:', authError);
      // Don't fail here - user might not exist in auth but exists in DB
      console.log('⚠️  Auth user not found or already deleted');
    } else {
      console.log('✅ Auth user deleted');
    }

    // Step 2: Delete from Database
    console.log(`Step 2: Deleting database user ${userId}...`);
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      console.error('❌ Database deletion error:', dbError);
      return res.status(500).json({ 
        error: 'Database deletion failed', 
        details: dbError.message,
        code: dbError.code 
      });
    }

    console.log('✅ Database user deleted');

    // Step 3: Clean up related records (documents, verification status, etc.)
    console.log(`Step 3: Cleaning up related records...`);

    // Delete driver documents
    const { error: docsError } = await supabaseAdmin
      .from('driver_documents')
      .delete()
      .eq('driver_id', userId);

    if (docsError) {
      console.warn('⚠️  Could not delete documents:', docsError.message);
    } else {
      console.log('✅ Driver documents deleted');
    }

    // Delete driver verification status
    const { error: verifyError } = await supabaseAdmin
      .from('driver_verification_status')
      .delete()
      .eq('driver_id', userId);

    if (verifyError) {
      console.warn('⚠️  Could not delete verification status:', verifyError.message);
    } else {
      console.log('✅ Driver verification status deleted');
    }

    // Delete vendor profile
    const { error: vendorError } = await supabaseAdmin
      .from('vendors')
      .delete()
      .eq('user_id', userId);

    if (vendorError) {
      console.warn('⚠️  Could not delete vendor profile:', vendorError.message);
    } else {
      console.log('✅ Vendor profile deleted');
    }

    // Delete driver profile
    const { error: driverError } = await supabaseAdmin
      .from('drivers')
      .delete()
      .eq('user_id', userId);

    if (driverError) {
      console.warn('⚠️  Could not delete driver profile:', driverError.message);
    } else {
      console.log('✅ Driver profile deleted');
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      deleted: {
        auth: !authError,
        database: !dbError,
        related: {
          documents: !docsError,
          verification: !verifyError,
          vendor: !vendorError,
          driver: !driverError
        }
      }
    });

  } catch (error) {
    console.error('❌ DELETE USER ERROR:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

/**
 * POST /admin/create-dummy-driver
 * Creates a fully approved dummy driver account for emergency use.
 * - Creates auth account
 * - Creates users, drivers, driver_verification_status (approved) records
 * - No document upload required — driver can log in and take trips immediately
 */
router.post('/create-dummy-driver', async (req, res) => {
  try {
    const { phone, fullName } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    if (!supabaseAdmin) return res.status(500).json({ error: 'Admin credentials not configured' });

    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length !== 10) {
      return res.status(400).json({ error: 'Phone must be 10 digits' });
    }

    const email = `${phoneDigits}@kushicabs.phone`;
    const password = `OTP-${phoneDigits}-kushicabs`;
    const name = fullName?.trim() || `Dummy Driver ${phoneDigits.slice(-4)}`;

    console.log(`🤖 Creating dummy driver: ${name} (${phoneDigits})`);

    // 1. Get driver role ID
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'driver')
      .single();

    if (roleError || !roleData) {
      return res.status(500).json({ error: 'Driver role not found' });
    }

    // 2. Create or reset auth account
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return res.status(500).json({ error: listError.message });

    let authUserId;
    const existing = users.find(u => u.email === email);

    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password, email_confirm: true
      });
      authUserId = existing.id;
      console.log(`♻️  Reusing existing auth account: ${authUserId}`);
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { phone: phoneDigits }
      });
      if (createError) return res.status(500).json({ error: createError.message });
      authUserId = newUser.user.id;
      console.log(`✅ Auth account created: ${authUserId}`);
    }

    // 3. Upsert users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authUserId,
        email,
        phone: phoneDigits,
        full_name: name,
        role_id: roleData.id,
        is_active: true,
        verification_status: 'approved',
      }, { onConflict: 'id' });

    if (userError) return res.status(500).json({ error: 'Failed to create user record: ' + userError.message });

    // 4. Upsert drivers table
    const { error: driverError } = await supabaseAdmin
      .from('drivers')
      .upsert({
        user_id: authUserId,
        license_number: `DUMMY-${phoneDigits}`,
        vehicle_number: `DUMMY-${phoneDigits}`,
        is_available: true,
        is_online: false,
      }, { onConflict: 'user_id' });

    if (driverError) return res.status(500).json({ error: 'Failed to create driver record: ' + driverError.message });

    // 5. Get driver record id
    const { data: driverRow } = await supabaseAdmin
      .from('drivers')
      .select('id')
      .eq('user_id', authUserId)
      .single();

    // 6. Upsert driver_verification_status as approved (skip document check)
    const { error: dvsError } = await supabaseAdmin
      .from('driver_verification_status')
      .upsert({
        driver_id: authUserId,
        overall_status: 'approved',
        all_documents_submitted: true,
        submitted_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
      }, { onConflict: 'driver_id' });

    if (dvsError) {
      console.warn('⚠️ Could not create driver_verification_status:', dvsError.message);
      // Not fatal — DriverNavigator fallback will handle via users.verification_status
    } else {
      console.log('✅ driver_verification_status set to approved');
    }

    console.log(`🎉 Dummy driver ready: ${name} | Phone: ${phoneDigits}`);

    res.json({
      success: true,
      message: `Dummy driver created successfully`,
      driver: { name, phone: phoneDigits, userId: authUserId },
    });

  } catch (error) {
    console.error('create-dummy-driver error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/dummy-drivers
 * List all dummy driver accounts
 */
router.get('/dummy-drivers', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Admin credentials not configured' });

    // Fetch drivers with license_number starting with 'DUMMY-'
    const { data, error } = await supabaseAdmin
      .from('drivers')
      .select(`
        user_id,
        license_number,
        users!inner(id, full_name, phone, is_active, verification_status, created_at)
      `)
      .ilike('license_number', 'DUMMY-%')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    // Transform data structure - drivers joined with users
    const drivers = (data || []).map(driver => ({
      id: driver.users.id,
      full_name: driver.users.full_name,
      phone: driver.users.phone,
      is_active: driver.users.is_active,
      verification_status: driver.users.verification_status,
      created_at: driver.users.created_at,
      license_number: driver.license_number
    }));
    
    res.json({ success: true, drivers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/update-admin-phone
 * Update super admin phone number in both database and auth.users
 * Also clears the old phone/email from auth so it can be reused by other accounts
 */
router.post('/update-admin-phone', async (req, res) => {
  try {
    const { userId, oldPhone, newPhone, newEmail } = req.body;

    if (!userId || !oldPhone || !newPhone || !newEmail) {
      return res.status(400).json({ error: 'userId, oldPhone, newPhone, and newEmail are required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin credentials not configured' });
    }

    console.log(`📞 Updating admin phone: ${oldPhone} → ${newPhone}`);

    const oldEmail = `${oldPhone}@kushicabs.phone`;
    const newPassword = `OTP-${newPhone}-kushicabs`;

    // Step 1: Find auth user by userId (most reliable — avoids email lookup issues)
    const { data: { user: authUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !authUser) {
      console.log(`⚠️  Auth user not found for userId: ${userId}`, getUserError?.message);
      return res.status(404).json({ error: 'Auth user not found' });
    }

    console.log(`Found auth user: ${authUser.id}, current email: ${authUser.email}`);

    // Step 2: Check if new email/phone already in use by a DIFFERENT auth user
    const { data: { users: allUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return res.status(500).json({ error: listError.message });

    const newEmailConflict = allUsers.find(u => u.email === newEmail && u.id !== authUser.id);
    if (newEmailConflict) {
      return res.status(400).json({ error: 'New phone number is already in use by another account' });
    }

    // Step 3: Update the auth user — change email to new phone, update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      email: newEmail,
      password: newPassword,
      email_confirm: true,
      phone: '',          // clear phone field so old phone is freed in auth
    });

    if (updateError) {
      console.error('❌ Error updating auth user:', updateError.message);
      return res.status(500).json({ error: 'Failed to update auth user', details: updateError.message });
    }

    console.log(`✅ Auth user email updated: ${oldEmail} → ${newEmail}`);

    // Step 4: Check if old email exists as a SEPARATE auth record (edge case from duplicate signups)
    // and delete it so the old phone number is completely freed
    const oldAuthDuplicate = allUsers.find(u => u.email === oldEmail && u.id !== authUser.id);
    if (oldAuthDuplicate) {
      console.log(`🗑️  Found duplicate old auth record ${oldAuthDuplicate.id} — deleting to free old phone`);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(oldAuthDuplicate.id);
      if (deleteError) {
        console.warn('⚠️  Could not delete old auth duplicate:', deleteError.message);
      } else {
        console.log(`✅ Old duplicate auth record deleted — phone ${oldPhone} is now free`);
      }
    }

    // Step 5: Also clear old email from users table (in case email column still has old value)
    // The users table phone column was already updated by the settings screen
    const { error: dbEmailError } = await supabaseAdmin
      .from('users')
      .update({ email: newEmail })
      .eq('id', userId);

    if (dbEmailError) {
      console.warn('⚠️  Could not update email in users table:', dbEmailError.message);
      // Non-fatal — phone already updated by settings screen
    }

    res.json({
      success: true,
      message: 'Admin phone updated successfully. Old phone number is now free.',
      authUserId: authUser.id,
      oldEmail,
      newEmail,
      oldPhoneFreed: true,
    });

  } catch (error) {
    console.error('❌ UPDATE ADMIN PHONE ERROR:', error);
    res.status(500).json({
      error: 'Failed to update admin phone',
      message: error.message
    });
  }
});

/**
 * GET /admin/user/:userId
 * Get user details from database
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin credentials not configured' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        phone,
        full_name,
        role_id,
        roles(name),
        is_active,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);

  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user', message: error.message });
  }
});

/**
 * GET /admin/vendor-debug/:userId
 * Debug endpoint to check vendor setup and documents
 */
router.get('/vendor-debug/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!supabaseAdmin) return res.status(500).json({ error: 'Admin credentials not configured' });

    console.log(`🔍 Debugging vendor setup for user: ${userId}`);

    const debug = {};

    // Check user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, phone, full_name, verification_status')
      .eq('id', userId)
      .single();

    debug.user = user || { error: userError?.message };

    // Check vendor record
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id, company_name, user_id')
      .eq('user_id', userId)
      .single();

    debug.vendor = vendor || { error: vendorError?.message, code: vendorError?.code };

    // Check vendor_verification_status
    const { data: verifyStatus, error: verifyError } = await supabaseAdmin
      .from('vendor_verification_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    debug.vendor_verification_status = verifyStatus || { error: verifyError?.message, code: verifyError?.code };

    // Check vendor_documents
    const { data: docs, error: docsError } = await supabaseAdmin
      .from('vendor_documents')
      .select('*')
      .eq('user_id', userId)
      .single();

    debug.vendor_documents = docs || { error: docsError?.message, code: docsError?.code };

    // Check RLS policies by attempting insert with admin client
    const testDoc = {
      user_id: userId,
      vendor_id: vendor?.id || 'test-vendor-id',
      documents: { TEST: { status: 'pending', test: true } }
    };

    const { error: testInsertError } = await supabaseAdmin
      .from('vendor_documents')
      .insert(testDoc)
      .select();

    debug.rls_test_insert = testInsertError ? { error: testInsertError.message, code: testInsertError.code } : { success: true };

    // Clean up test record if it was created
    if (!testInsertError) {
      await supabaseAdmin
        .from('vendor_documents')
        .delete()
        .eq('user_id', userId)
        .eq('documents', testDoc.documents);
    }

    console.log('🔍 Debug info:', JSON.stringify(debug, null, 2));
    res.json({ success: true, userId, debug });

  } catch (error) {
    console.error('vendor-debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
