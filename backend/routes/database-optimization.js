const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase with service role (has admin privileges)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`📋 Database Optimization Route Init:`);
console.log(`   SUPABASE_URL: ${supabaseUrl ? `✓ (${supabaseUrl.substring(0, 30)}...)` : '✗ undefined'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? `✓ (${supabaseServiceKey.substring(0, 20)}...)` : '✗ undefined'}`);

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Endpoint to apply trips table indexes
router.post('/apply-trips-indexes', async (req, res) => {
  try {
    console.log('🔧 Starting trips table index optimization...');

    // Execute comprehensive index creation SQL
    const indexSQL = `
      -- Drop old indexes if they exist
      DROP INDEX IF EXISTS idx_trips_created_by_status;
      DROP INDEX IF EXISTS idx_trips_accepted_by_status;
      DROP INDEX IF EXISTS idx_trips_vendor_id_status;
      DROP INDEX IF EXISTS idx_trips_status_created_at;

      -- Create optimized indexes
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_created_at_desc 
      ON trips(status, created_at DESC);

      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_is_admin_trip_status 
      ON trips(is_admin_trip, status);

      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_created_at_desc 
      ON trips(created_at DESC);

      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status 
      ON trips(status);

      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_is_admin_trip 
      ON trips(is_admin_trip);

      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_is_admin 
      ON trips(status, is_admin_trip);

      -- Update query planner statistics
      ANALYZE trips;

      -- Return success
      SELECT 'indexes_created' as status;
    `;

    // Execute using RPC or raw SQL through Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql: indexSQL });

    if (error) {
      console.error('❌ RPC error (trying direct SQL):', error.message);
      
      // Try direct approach by executing individual statements
      const statements = [
        'DROP INDEX IF EXISTS idx_trips_created_by_status',
        'DROP INDEX IF EXISTS idx_trips_accepted_by_status',
        'DROP INDEX IF EXISTS idx_trips_vendor_id_status',
        'DROP INDEX IF EXISTS idx_trips_status_created_at',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_created_at_desc ON trips(status, created_at DESC)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_is_admin_trip_status ON trips(is_admin_trip, status)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_created_at_desc ON trips(created_at DESC)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status ON trips(status)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_is_admin_trip ON trips(is_admin_trip)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trips_status_is_admin ON trips(status, is_admin_trip)',
        'ANALYZE trips'
      ];

      let successCount = 0;
      for (const stmt of statements) {
        try {
          await supabase.rpc('exec_sql_simple', { sql: stmt });
          successCount++;
          console.log(`✅ Executed: ${stmt.substring(0, 50)}...`);
        } catch (e) {
          console.warn(`⚠️ Skipped (may already exist): ${stmt.substring(0, 50)}...`);
        }
      }

      return res.status(200).json({
        status: 'partial_success',
        message: `Applied ${successCount}/${statements.length} index operations`,
        note: 'Some indexes may already exist. Check Supabase console to verify.'
      });
    }

    console.log('✅ Indexes applied successfully');
    return res.status(200).json({
      status: 'success',
      message: 'All trips table indexes have been optimized',
      data: data
    });

  } catch (error) {
    console.error('❌ Error applying indexes:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to apply indexes',
      error: error.message,
      instruction: 'Please manually run the SQL in Supabase SQL Editor: see TRIPS_TIMEOUT_FIX_INSTRUCTIONS.md'
    });
  }
});

// Endpoint to verify indexes exist
router.get('/verify-trips-indexes', async (req, res) => {
  try {
    console.log('🔍 Verifying trips table indexes...');

    const { data, error } = await supabase
      .rpc('get_table_indexes', { p_table_name: 'trips' });

    if (error) {
      console.warn('⚠️ Could not verify using RPC, querying directly...');
      
      // Try direct query
      const { data: indexData, error: indexError } = await supabase
        .from('pg_indexes')
        .select('indexname, indexdef')
        .eq('tablename', 'trips');

      if (indexError) throw indexError;

      const expectedIndexes = [
        'idx_trips_status_created_at_desc',
        'idx_trips_is_admin_trip_status',
        'idx_trips_created_at_desc',
        'idx_trips_status',
        'idx_trips_is_admin_trip',
        'idx_trips_status_is_admin'
      ];

      const foundIndexes = indexData?.filter(idx => 
        expectedIndexes.includes(idx.indexname)
      ) || [];

      return res.status(200).json({
        status: 'verified',
        total_trips_indexes: indexData?.length || 0,
        optimization_indexes_found: foundIndexes.length,
        expected_indexes: expectedIndexes.length,
        found_indexes: foundIndexes.map(idx => idx.indexname),
        missing_indexes: expectedIndexes.filter(exp => 
          !foundIndexes.find(f => f.indexname === exp)
        ),
        all_indexes: indexData || []
      });
    }

    return res.status(200).json({
      status: 'verified',
      indexes: data
    });

  } catch (error) {
    console.error('❌ Error verifying indexes:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to verify indexes',
      error: error.message
    });
  }
});

// Endpoint to check trips table statistics
router.get('/trips-table-stats', async (req, res) => {
  try {
    console.log('📊 Fetching trips table statistics...');

    const { count } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      status: 'success',
      trips_count: count,
      message: count > 0 
        ? `Table has ${count} trips. Indexes are critical for performance with this volume.`
        : 'Table is empty. Indexes will help when data grows.'
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get table statistics',
      error: error.message
    });
  }
});

module.exports = router;
