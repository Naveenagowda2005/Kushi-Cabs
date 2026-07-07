import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TRIP_STATUS } from '../constants';

/**
 * Fetches pending trips created by super admin (enquiries).
 * Shows all pending trips to vendors so they can accept them.
 */
export function useAvailableEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      // Show all pending trips to vendors (both created by admin and other vendors)
      // But exclude trips that have already been accepted (accepted_by IS NULL means not yet accepted)
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('status', TRIP_STATUS.PENDING)
        .is('accepted_by', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch all segment names to enrich trips with segment_name
      const { data: segments } = await supabase.from('trip_segments').select('id, name');
      const segmentMap = {};
      segments?.forEach(seg => { segmentMap[seg.id] = seg.name; });
      
      // Enrich enquiries with segment names
      const enrichedEnquiries = (data || []).map(trip => ({
        ...trip,
        segment_name: trip.segment_id ? segmentMap[trip.segment_id] : 'One-way'
      }));
      
      setEnquiries(enrichedEnquiries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { enquiries, loading, error, refetch: fetch };
}

/**
 * Fetches all trips belonging to this vendor (accepted/in_progress/completed).
 */
/**
 * Fetches all trips belonging to this vendor.
 * Shows trips created by this vendor OR accepted by this vendor.
 */
export function useVendorTrips(userId) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      // Get the vendor row id for this user
      const { data: vendorRow } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('🔍 Fetching trips for vendor:', { userId, vendorId: vendorRow?.id });

      // Run queries in parallel instead of complex OR
      const queries = [
        // Trips created by this user (active trips)
        supabase
          .from('trips')
          .select('*, driver:driver_id(vehicle_number, license_number, users(full_name, phone))')
          .eq('created_by', userId)
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Trips accepted by this user (active trips)
        supabase
          .from('trips')
          .select('*, driver:driver_id(vehicle_number, license_number, users(full_name, phone))')
          .eq('accepted_by', userId)
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Trips assigned to this vendor (active trips)
        vendorRow?.id ? supabase
          .from('trips')
          .select('*, driver:driver_id(vehicle_number, license_number, users(full_name, phone))')
          .eq('vendor_id', vendorRow.id)
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(100) : null,
      ].filter(Boolean);

      const results = await Promise.all(queries);
      
      // Log results for debugging
      results.forEach((result, i) => {
        if (result.data) {
          console.log(`📊 Query ${i}: ${result.data.length} trips`);
        }
        if (result.error) {
          console.error(`❌ Query ${i} error:`, result.error);
        }
      });
      
      // Combine and deduplicate trips by ID
      const tripMap = new Map();
      results.forEach(result => {
        if (result.data) {
          result.data.forEach(trip => {
            if (!tripMap.has(trip.id)) {
              tripMap.set(trip.id, trip);
            }
          });
        }
      });

      let allTrips = Array.from(tripMap.values());
      
      // Fetch all segment names
      const { data: segments } = await supabase.from('trip_segments').select('id, name');
      const segmentMap = {};
      segments?.forEach(seg => { segmentMap[seg.id] = seg.name; });
      
      // Enrich trips with segment names and sort
      const enrichedTrips = allTrips.map(trip => ({
        ...trip,
        segment_name: trip.segment_id ? segmentMap[trip.segment_id] : 'One-way'
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setTrips(enrichedTrips);
      const completedCount = enrichedTrips.filter(t => t.status === 'completed').length;
      console.log(`✅ useVendorTrips: Loaded ${enrichedTrips.length} total trips (${completedCount} completed)`);
    } catch (err) {
      console.error('useVendorTrips:', err.message);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { trips, loading, refetch: fetch };
}

/**
 * Combined hook that provides both available enquiries and vendor trips.
 */
export function useEnquiries(userId) {
  const { enquiries, loading: enquiriesLoading, error: enquiriesError, refetch: refetchEnquiries } = useAvailableEnquiries();
  const { trips: myTrips, loading: tripsLoading, refetch: refetchTrips } = useVendorTrips(userId);

  const loading = enquiriesLoading || tripsLoading;
  const error = enquiriesError;

  const refetch = useCallback(() => {
    refetchEnquiries();
    refetchTrips();
  }, [refetchEnquiries, refetchTrips]);

  return { 
    enquiries, 
    myTrips, 
    loading, 
    error, 
    refetch 
  };
}
