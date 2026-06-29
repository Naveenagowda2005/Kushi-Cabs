import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TRIP_STATUS } from '../constants';

export function useAvailableTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('trips')
        .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km')
        .eq('status', TRIP_STATUS.PENDING)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enrich trips with segment names
      const enrichedTrips = await Promise.all(
        (data || []).map(async (trip) => {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
