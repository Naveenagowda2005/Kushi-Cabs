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

      let query = supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (vendorRow?.id) {
        // Match trips where:
        // 1. This user created the trip (created_by)
        // 2. This user accepted the trip (accepted_by)
        // 3. This vendor was assigned (vendor_id)
        query = query.or(`created_by.eq.${userId},accepted_by.eq.${userId},vendor_id.eq.${vendorRow.id}`);
      } else {
        // Fallback: match created_by or accepted_by
        query = query.or(`created_by.eq.${userId},accepted_by.eq.${userId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch all segment names
      const { data: segments } = await supabase.from('trip_segments').select('id, name');
      const segmentMap = {};
      segments?.forEach(seg => { segmentMap[seg.id] = seg.name; });
      
      // Enrich trips with segment names
      const enrichedTrips = (data || []).map(trip => ({
        ...trip,
        segment_name: trip.segment_id ? segmentMap[trip.segment_id] : 'One-way'
      }));
      
      setTrips(enrichedTrips);
    } catch (err) {
      console.error('useVendorTrips:', err.message);
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
