const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase with service role (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`📋 Trips Route Init:`);
console.log(`   SUPABASE_URL: ${supabaseUrl ? `✓ (${supabaseUrl.substring(0, 30)}...)` : '✗ undefined'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? `✓ (${supabaseServiceKey.substring(0, 20)}...)` : '✗ undefined'}`);

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Get paginated trips with optional filters
router.get('/list', async (req, res) => {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return res.status(500).json({
        status: 'error',
        message: 'Backend not configured',
        error: 'Supabase credentials missing'
      });
    }

    const { status = null, is_admin_trip = null, page = 0, limit = 50 } = req.query;
    const pageNum = parseInt(page) || 0;
    const limitNum = parseInt(limit) || 50;
    const offset = pageNum * limitNum;

    console.log(`📄 Fetching trips: status=${status}, admin=${is_admin_trip}, page=${pageNum}, limit=${limitNum}`);

    // Build query
    let query = supabase
      .from('trips')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status !== 'null') {
      query = query.eq('status', status);
    }

    if (is_admin_trip && is_admin_trip !== 'null') {
      const isAdmin = is_admin_trip === 'true';
      query = query.eq('is_admin_trip', isAdmin);
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('❌ Database error:', error.message);
      throw error;
    }

    // Fetch segment names to enrich trips
    const { data: segments, error: segmentError } = await supabase
      .from('trip_segments')
      .select('id, name');

    console.log('🔍 Segments fetched:', segments?.length || 0, 'Error:', segmentError?.message);

    const segmentMap = {};
    if (!segmentError && segments) {
      segments.forEach(seg => {
        segmentMap[seg.id] = seg;
      });
      console.log('📊 Segment Map:', segmentMap);
    }

    // Log sample trips to debug
    if (data && data.length > 0) {
      console.log('📋 Sample trip data (first 2):');
      data.slice(0, 2).forEach(t => {
        console.log(`   Trip ${t.id}: segment_id=${t.segment_id}, segment_data=${JSON.stringify(segmentMap[t.segment_id])}`);
      });
    }

    // Enrich trips with segment names
    const enrichedData = data?.map(trip => {
      const segment = segmentMap[trip.segment_id];
      return {
        ...trip,
        trip_segments: segment || { id: trip.segment_id, name: 'Trip' }
      };
    }) || [];

    console.log(`✅ Returned ${enrichedData?.length || 0} trips (total: ${count})`);

    return res.status(200).json({
      status: 'success',
      data: enrichedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        hasMore: offset + limitNum < count
      }
    });

  } catch (error) {
    console.error('❌ Error fetching trips:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch trips',
      error: error.message
    });
  }
});

// Get trips count by status
router.get('/count-by-status', async (req, res) => {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return res.status(500).json({
        status: 'error',
        message: 'Backend not configured',
        error: 'Supabase credentials missing'
      });
    }

    console.log('📊 Getting trip counts by status...');

    const statuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    const counts = {};

    for (const status of statuses) {
      const { count, error } = await supabase
        .from('trips')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);

      if (error) {
        console.warn(`⚠️ Error counting ${status}:`, error.message);
        counts[status] = 0;
      } else {
        counts[status] = count;
      }
    }

    console.log('✅ Trip counts:', counts);

    return res.status(200).json({
      status: 'success',
      counts
    });

  } catch (error) {
    console.error('❌ Error getting counts:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get trip counts',
      error: error.message
    });
  }
});

// Quick health check - just count total trips
router.get('/quick-count', async (req, res) => {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return res.status(500).json({
        status: 'error',
        message: 'Backend not configured',
        error: 'Supabase credentials missing'
      });
    }

    const { count, error } = await supabase
      .from('trips')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return res.status(200).json({
      status: 'success',
      total_trips: count
    });

  } catch (error) {
    console.error('❌ Error in quick count:', error.message);
    return res.status(500).json({
      status: 'error',
      total_trips: null,
      error: error.message
    });
  }
});

module.exports = router;
