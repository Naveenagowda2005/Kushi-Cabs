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
