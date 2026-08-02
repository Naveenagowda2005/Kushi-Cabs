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

    const { status = null, is_admin_trip = null, page = 0, limit = 50, start_date = null, end_date = null } = req.query;
    const pageNum = parseInt(page) || 0;
    const limitNum = Math.min(parseInt(limit) || 50, 100); // cap at 100
    const offset = pageNum * limitNum;

    console.log(`📄 Fetching trips: status=${status}, admin=${is_admin_trip}, page=${pageNum}, limit=${limitNum}, start_date=${start_date}, end_date=${end_date}`);

    // Only fetch columns the list card displays — avoids large odometer URL fields
    const TRIP_LIST_COLUMNS = [
      'id', 'booking_id_seq', 'status', 'fare_amount', 'commission_amount',
      'pickup_location', 'dropoff_location', 'return_location',
      'scheduled_at', 'return_date', 'created_at',
      'created_by', 'accepted_by', 'driver_id',
      'is_admin_trip', 'segment_id', 'package_id',
      'car_type', 'seater_type', 'fuel_type',
      'fixed_km', 'extra_km_charge', 'toll_included', 'pet_travelling',
      'notes', 'customer_pre_advance',
      'admin_assigned_drivers', 'vendor_read_at',
      'start_km', 'end_km',
    ].join(', ');

    // Build query — use minimal columns, no heavy odometer URL fields
    let query = supabase
      .from('trips')
      .select(TRIP_LIST_COLUMNS, { count: 'exact' });

    // Apply filters
    if (status && status !== 'null') {
      query = query.eq('status', status);
    }

    if (is_admin_trip && is_admin_trip !== 'null') {
      const isAdmin = is_admin_trip === 'true';
      query = query.eq('is_admin_trip', isAdmin);
    }

    // For completed/cancelled trips, apply date filter if specified
    if (status === 'completed' || status === 'cancelled') {
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }
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

// Get vendor trips (bypasses RLS timeout)
router.get('/vendor-history', async (req, res) => {
  try {
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return res.status(500).json({
        status: 'error',
        message: 'Backend not configured',
        error: 'Supabase credentials missing'
      });
    }

    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id is required'
      });
    }

    console.log(`📄 Fetching vendor trips for user_id=${user_id}`);

    // Get vendor row id
    const { data: vendorRow } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    console.log(`📄 Vendor row: ${vendorRow ? vendorRow.id : 'not found'}`);

    const trips = [];
    
    // Select only essential columns WITHOUT odometer URLs to avoid timeout
    const cols = 'id,booking_id_seq,status,fare_amount,commission_amount,pickup_location,dropoff_location,return_location,scheduled_at,return_date,created_at,completed_at,created_by,accepted_by,driver_id,passenger_name,passenger_phone,car_type,seater_type,fuel_type,segment_id,package_id,fixed_km,extra_km_charge,toll_included,pet_travelling,state_tax_included,hills_included,notes,customer_pre_advance,start_km,end_km';
    
    // Query 1: created_by
    const { data: d1, error: e1 } = await supabase
      .from('trips')
      .select(cols)
      .eq('created_by', user_id)
      .order('created_at', { ascending: false });
    
    if (d1) {
      console.log(`📄 Query 1 (created_by): ${d1.length} trips`);
      trips.push(...d1);
    }
    if (e1) console.error('❌ Query 1 error:', e1.message);

    // Query 2: accepted_by
    const { data: d2, error: e2 } = await supabase
      .from('trips')
      .select(cols)
      .eq('accepted_by', user_id)
      .order('created_at', { ascending: false });
    
    if (d2) {
      console.log(`📄 Query 2 (accepted_by): ${d2.length} trips`);
      trips.push(...d2);
    }
    if (e2) console.error('❌ Query 2 error:', e2.message);

    // Query 3: vendor_id
    let d3 = null;
    let e3 = null;
    if (vendorRow?.id) {
      const result = await supabase
        .from('trips')
        .select(cols)
        .eq('vendor_id', vendorRow.id)
        .order('created_at', { ascending: false });
      
      d3 = result.data;
      e3 = result.error;
      
      if (d3) {
        console.log(`📄 Query 3 (vendor_id): ${d3.length} trips`);
        trips.push(...d3);
      }
      if (e3) console.error('❌ Query 3 error:', e3.message);
    }

    // Deduplicate
    const seenIds = new Set();
    const uniqueTrips = [];
    trips.forEach(trip => {
      if (!seenIds.has(trip.id)) {
        seenIds.add(trip.id);
        uniqueTrips.push(trip);
      }
    });

    uniqueTrips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    console.log(`✅ Total ${uniqueTrips.length} vendor trips collected`);
    console.log(`📊 Breakdown: created_by=${d1?.length || 0}, accepted_by=${d2?.length || 0}, vendor_id=${d3?.length || 0}`);

    return res.status(200).json({
      status: 'success',
      data: uniqueTrips,
      count: uniqueTrips.length
    });

  } catch (error) {
    console.error('❌ Error fetching vendor trips:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch vendor trips',
      error: error.message
    });
  }
});

// Get odometer URLs for multiple trips by IDs (with batching to avoid timeout)
router.get('/odometer-urls', async (req, res) => {
  try {
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return res.status(500).json({
        status: 'error',
        message: 'Backend not configured',
        error: 'Supabase credentials missing'
      });
    }

    const { trip_ids } = req.query;
    console.log(`📸 Odometer endpoint called with trip_ids=${trip_ids}`);
    
    if (!trip_ids) {
      return res.status(400).json({
        status: 'error',
        message: 'trip_ids parameter is required (comma-separated)'
      });
    }

    const idArray = trip_ids.split(',').filter(id => id.trim());
    console.log(`📸 Fetching odometer URLs for ${idArray.length} trips`);

    if (idArray.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }

    // Batch queries in groups of 10 to avoid statement timeout
    const BATCH_SIZE = 10;
    const allResults = [];
    
    for (let i = 0; i < idArray.length; i += BATCH_SIZE) {
      const batch = idArray.slice(i, i + BATCH_SIZE);
      console.log(`📸 Batch ${Math.floor(i / BATCH_SIZE) + 1}: Fetching ${batch.length} trips`);
      
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('id, start_odometer_url, end_odometer_url')
          .in('id', batch);

        if (error) {
          console.error(`❌ Batch error:`, error.message);
          continue; // Skip this batch, continue with next
        }

        if (data && data.length > 0) {
          console.log(`✅ Batch returned ${data.length} records`);
          data.forEach(t => {
            if (t.start_odometer_url) {
              console.log(`   Trip ${t.id} START: ${t.start_odometer_url.substring(0, 120)}...`);
            }
            if (t.end_odometer_url) {
              console.log(`   Trip ${t.id} END: ${t.end_odometer_url.substring(0, 120)}...`);
            }
          });
          allResults.push(...data);
        }
      } catch (batchError) {
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, batchError.message);
        continue;
      }
    }

    console.log(`✅ Total fetched ${allResults.length} odometer records across all batches`);
    
    return res.status(200).json({
      status: 'success',
      data: allResults
    });

  } catch (error) {
    console.error('❌ Error in odometer-urls endpoint:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch odometer URLs',
      error: error.message
    });
  }
});

module.exports = router;
