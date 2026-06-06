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
    console.log(`Step 1a: Deleting all trips created by user ${userId}...`);
    const { error: tripsError } = await supabaseAdmin
      .from('trips')
      .delete()
      .eq('created_by', userId);

    if (tripsError) {
      console.error('⚠️  Error deleting trips:', tripsError.message);
      // Continue anyway - might have no trips
    } else {
      console.log('✅ Trips deleted');
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
      return res.status(500).json({ error: 'Database deletion failed', details: dbError.message });
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

    const { data: roleData } = await supabaseAdmin
      .from('roles').select('id').eq('name', 'driver').single();

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, phone, is_active, verification_status, created_at')
      .eq('role_id', roleData.id)
      .ilike('full_name', 'Dummy%')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, drivers: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/update-admin-phone
 * Update super admin phone number in both database and auth.users
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
    const password = `OTP-${newPhone}-kushicabs`;

    // Step 1: Find auth user by old email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return res.status(500).json({ error: listError.message });

    const authUser = users.find(u => u.email === oldEmail);
    
    if (!authUser) {
      console.log(`⚠️  Auth user not found for email: ${oldEmail}`);
      return res.status(404).json({ error: 'Auth user not found' });
    }

    console.log(`Found auth user: ${authUser.id}`);

    // Step 2: Check if new email already exists
    const newEmailExists = users.find(u => u.email === newEmail && u.id !== authUser.id);
    if (newEmailExists) {
      return res.status(400).json({ error: 'New phone number already in use' });
    }

    // Step 3: Update auth user email and password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      email: newEmail,
      password: password,
      email_confirm: true
    });

    if (updateError) {
      console.error('❌ Error updating auth user:', updateError.message);
      return res.status(500).json({ error: 'Failed to update auth user', details: updateError.message });
    }

    console.log(`✅ Auth user updated with new email: ${newEmail}`);

    res.json({
      success: true,
      message: 'Admin phone updated successfully',
      authUserId: authUser.id,
      oldEmail: oldEmail,
      newEmail: newEmail
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

module.exports = router;
