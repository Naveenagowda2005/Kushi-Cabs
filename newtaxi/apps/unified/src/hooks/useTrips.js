import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TRIP_STATUS } from '../constants';
import { useAuth } from '../context/AuthContext';

export function useAvailableTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      
      // Get vendor-published trips
      const { data: vendorTrips, error: vendorError } = await supabase
        .from('trips')
        .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, notes, is_admin_trip')
        .eq('status', TRIP_STATUS.PENDING)
        .eq('is_published', true)
        .eq('is_admin_trip', false)
        .order('created_at', { ascending: false });

      if (vendorError) throw vendorError;

      // Get admin-assigned trips for this driver
      let adminTrips = [];
      if (user?.id) {
        const { data: adminTripData, error: adminError } = await supabase
          .from('trips')
          .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, notes, is_admin_trip, admin_assigned_drivers')
          .eq('status', TRIP_STATUS.PENDING)
          .eq('is_admin_trip', true)
          .contains('admin_assigned_drivers', [user.id]) // Check if current driver is in the assigned array
          .order('created_at', { ascending: false });

        if (adminError && adminError.code !== 'PGRST116') {
          console.warn('⚠️ Could not fetch admin trips:', adminError.message);
        } else {
          adminTrips = adminTripData || [];
        }
      }

      // Combine and enrich trips
      const allTrips = [...vendorTrips || [], ...adminTrips];
      
      const enrichedTrips = await Promise.all(
        allTrips.map(async (trip) => {
          if (trip.segment_id) {
            try {
              const { data: segment } = await supabase
                .from('trip_segments')
                .select('name')
                .eq('id', trip.segment_id)
                .maybeSingle();
              return { ...trip, segment_name: segment?.name };
            } catch (err) {
              console.error('Error fetching segment:', err);
              return trip;
            }
          }
          return trip;
        })
      );
      
      setTrips(enrichedTrips);
      console.log('✅ Available trips fetched:', enrichedTrips.length, '(', vendorTrips?.length || 0, 'vendor +', adminTrips.length, 'admin)');
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return { trips, loading, error, refetch: fetchTrips };
}

export function useActiveTrip(userId) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveTrip = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from('trips')
        .select('*')
        .in('status', [TRIP_STATUS.ACCEPTED, TRIP_STATUS.IN_PROGRESS])
        .eq('accepted_by', userId)
        .maybeSingle();

      setTrip(data);
    } catch (err) {
      console.error('useActiveTrip error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActiveTrip();
  }, [fetchActiveTrip]);

  return { trip, loading, refetch: fetchActiveTrip };
}
