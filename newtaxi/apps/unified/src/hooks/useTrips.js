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
        .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, notes, is_admin_trip, driver_id')
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
          .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, notes, is_admin_trip, admin_assigned_drivers, driver_id')
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

      // Get vendor-assigned trips for this driver (driver_id set, status = accepted)
      let vendorAssignedTrips = [];
      if (user?.id) {
        try {
          const { data: driverProfile } = await supabase
            .from('drivers')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (driverProfile) {
            const { data: assignedTripData, error: assignedError } = await supabase
              .from('trips')
              .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, notes, is_admin_trip, driver_id')
              .eq('driver_id', driverProfile.id)
              .eq('status', TRIP_STATUS.ACCEPTED) // Vendor assigned trips have status = accepted
              .order('created_at', { ascending: false });

            if (assignedError && assignedError.code !== 'PGRST116') {
              console.warn('⚠️ Could not fetch vendor-assigned trips:', assignedError.message);
            } else {
              vendorAssignedTrips = assignedTripData || [];
            }
          }
        } catch (err) {
          console.error('Error fetching vendor-assigned trips:', err);
        }
      }

      // Combine all trips
      const allTrips = [...vendorTrips || [], ...adminTrips, ...vendorAssignedTrips];
      
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
      console.log('✅ Available trips fetched:', enrichedTrips.length, '(', vendorTrips?.length || 0, 'vendor +', adminTrips.length, 'admin +', vendorAssignedTrips.length, 'assigned)');
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
    if (!userId) {
      console.log('⚠️ useActiveTrip: userId is null, skipping fetch');
      return;
    }
    try {
      console.log('🔄 useActiveTrip: Fetching active trips for user:', userId);
      
      // First get the driver profile for this user to get driver_id
      const { data: driverProfile } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!driverProfile) {
        console.log('⚠️ useActiveTrip: User is not a driver');
        setLoading(false);
        return;
      }

      const driverId = driverProfile.id;
      console.log('🔄 useActiveTrip: Driver ID:', driverId);

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('status', TRIP_STATUS.IN_PROGRESS) // Only show trips that are IN_PROGRESS (driver manually accepted)
        .or(`driver_id.eq.${driverId},accepted_by.eq.${userId}`) // Check BOTH driver_id and accepted_by
        .maybeSingle();

      if (error) {
        console.error('❌ useActiveTrip query error:', error);
      }

      console.log(`✅ useActiveTrip result: ${data ? `Trip ${data.id} (${data.status})` : 'No active trip - checking for ACCEPTED trips assigned to driver'}`);
      
      // If no IN_PROGRESS trip found, check if driver has ACCEPTED trip assigned by vendor
      if (!data) {
        const { data: acceptedTrip, error: acceptedError } = await supabase
          .from('trips')
          .select('*')
          .eq('driver_id', driverId)
          .eq('status', TRIP_STATUS.ACCEPTED)
          .eq('accepted_by', userId)
          .maybeSingle();
        
        if (acceptedTrip) {
          console.log(`✅ useActiveTrip found ACCEPTED trip: ${acceptedTrip.id} (status: accepted, driver accepted it)`);
        }
      }
      
      setTrip(data);
    } catch (err) {
      console.error('❌ useActiveTrip error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchActiveTrip();
  }, [fetchActiveTrip]);

  // Subscribe to real-time updates on active trips for this driver
  useEffect(() => {
    if (!userId) {
      console.log('⚠️ useActiveTrip subscription: userId is null, skipping');
      return;
    }

    console.log('📡 useActiveTrip: Setting up real-time subscription for user:', userId);
    const channelName = `active-trip-${userId}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `accepted_by=eq.${userId}`,
        },
        (payload) => {
          const updatedTrip = payload.new;
          console.log('🔔 Real-time trip update received:', {
            trip_id: updatedTrip.id,
            status: updatedTrip.status,
            accepted_by: updatedTrip.accepted_by,
            driver_id: updatedTrip.driver_id
          });
          
          // Only show active trip if status is IN_PROGRESS (driver manually accepted)
          // NOT on 'accepted' status (that's when vendor assigned it)
          if (updatedTrip.status === TRIP_STATUS.IN_PROGRESS) {
            console.log('✅ Trip is in_progress, updating state');
            setTrip(updatedTrip);
          } 
          // If trip completed or cancelled, clear it
          else if (
            updatedTrip.status === 'completed' ||
            updatedTrip.status === 'cancelled'
          ) {
            console.log('✅ Trip completed/cancelled, clearing state');
            setTrip(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('📡 Unsubscribing from:', channelName);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { trip, loading, refetch: fetchActiveTrip };
}
