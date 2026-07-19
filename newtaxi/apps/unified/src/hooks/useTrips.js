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
      
      // Get vendor-published trips (pending only - not yet accepted)
      const { data: vendorTrips, error: vendorError } = await supabase
        .from('trips')
        .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, extra_km_charge, notes, is_admin_trip, driver_id, accepted_at, accepted_by, booking_id_seq')
        .eq('status', TRIP_STATUS.PENDING)
        .eq('is_published', true)
        .eq('is_admin_trip', false)
        .order('created_at', { ascending: false });

      if (vendorError) throw vendorError;
      
      // Filter vendor trips: include all pending trips PLUS in_progress trips within 5-minute window
      const now = new Date();
      const FIVE_MIN_MS = 5 * 60 * 1000;
      const filteredVendorTrips = (vendorTrips || []).filter(trip => {
        if (trip.status === TRIP_STATUS.PENDING) {
          return true; // All pending trips are visible
        }
        if (trip.status === TRIP_STATUS.IN_PROGRESS && trip.accepted_at) {
          // Include in_progress trips that were accepted within last 5 minutes
          const acceptedTime = new Date(trip.accepted_at).getTime();
          const elapsedMs = now.getTime() - acceptedTime;
          return elapsedMs < FIVE_MIN_MS;
        }
        return false;
      });

      // Get admin-assigned trips for this driver (via admin_assigned_drivers array)
      // AND get admin-published trips (admin_assigned_drivers is empty/null = published to all)
      let adminTrips = [];
      // Get admin-reassigned trips for this driver (trip reassigned specifically to this driver)
      let adminReassignedTrips = [];
      if (user?.id) {
        // First: Get admin trips where this driver is in the admin_assigned_drivers array
        const { data: adminTripData, error: adminError } = await supabase
          .from('trips')
          .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, notes, is_admin_trip, admin_assigned_drivers, driver_id, booking_id_seq')
          .eq('status', TRIP_STATUS.PENDING)
          .eq('is_admin_trip', true)
          .contains('admin_assigned_drivers', [user.id])
          .order('created_at', { ascending: false });

        if (adminError && adminError.code !== 'PGRST116') {
          console.warn('⚠️ Could not fetch admin-assigned trips:', adminError.message);
        } else {
          // Filter to only show trips where this driver is the LAST (current) assignment
          adminTrips = (adminTripData || []).filter(trip => {
            if (!trip.admin_assigned_drivers || !Array.isArray(trip.admin_assigned_drivers) || trip.admin_assigned_drivers.length === 0) {
              return false;
            }
            // Only include if user.id is the LAST element (most recent assignment)
            return trip.admin_assigned_drivers[trip.admin_assigned_drivers.length - 1] === user.id;
          });
        }

        // Second: Get admin-published trips (where admin_assigned_drivers is empty/null = published to ALL drivers)
        const { data: adminPublishedTripData, error: adminPublishedError } = await supabase
          .from('trips')
          .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, notes, is_admin_trip, admin_assigned_drivers, driver_id, booking_id_seq')
          .eq('status', TRIP_STATUS.PENDING)
          .eq('is_admin_trip', true)
          .or('admin_assigned_drivers.is.null,admin_assigned_drivers.eq.{}')
          .order('created_at', { ascending: false });

        if (adminPublishedError && adminPublishedError.code !== 'PGRST116') {
          console.warn('⚠️ Could not fetch admin-published trips:', adminPublishedError.message);
        } else {
          // These are already published to all, so include them all
          adminTrips = [...adminTrips, ...(adminPublishedTripData || [])];
        }

        // Also fetch admin-reassigned trips (where admin reassigned to this driver specifically)
        const { data: reassignedTripData, error: reassignError } = await supabase
          .from('trips')
          .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, notes, is_admin_trip, admin_assigned_drivers, driver_id, accepted_by, booking_id_seq')
          .eq('status', TRIP_STATUS.PENDING)
          .eq('is_admin_trip', true)
          .eq('accepted_by', user.id)
          .order('created_at', { ascending: false });

        if (reassignError && reassignError.code !== 'PGRST116') {
          console.warn('⚠️ Could not fetch admin-reassigned trips:', reassignError.message);
        } else {
          adminReassignedTrips = reassignedTripData || [];
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
              .select('id, pickup_location, dropoff_location, fare_amount, commission_amount, commission_paid, customer_pre_advance, scheduled_at, created_at, status, car_type, car_model, seater_type, fuel_type, segment_id, package_id, return_location, return_date, created_by, passenger_name, passenger_phone, toll_included, state_tax_included, pet_travelling, hills_included, fixed_km, notes, is_admin_trip, driver_id, booking_id_seq')
              .eq('driver_id', driverProfile.id)
              .in('status', [TRIP_STATUS.PENDING, TRIP_STATUS.ACCEPTED])
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

      // Combine all trips and DEDUPLICATE by trip ID
      const allTripsArray = [...filteredVendorTrips, ...adminTrips, ...adminReassignedTrips, ...vendorAssignedTrips];
      
      console.log('📊 Trip sources:', {
        vendorTrips: filteredVendorTrips.length || 0,
        adminTrips: adminTrips.length,
        adminReassignedTrips: adminReassignedTrips.length,
        vendorAssignedTrips: vendorAssignedTrips.length,
        total: allTripsArray.length,
      });
      
      // Use a Map to deduplicate by ID
      const tripMap = new Map();
      allTripsArray.forEach(trip => {
        if (!tripMap.has(trip.id)) {
          tripMap.set(trip.id, trip);
        }
      });
      const allTrips = Array.from(tripMap.values());
      
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
      
      // Mark only the first (most recent) trip as NEW
      const tripsWithNewBadge = enrichedTrips.map((trip, index) => ({
        ...trip,
        isNew: index === 0, // Only the first trip is "New"
      }));
      
      console.log('🎫 Trips with NEW badge:', tripsWithNewBadge.map(t => ({ id: t.id, isNew: t.isNew, created_at: t.created_at })));
      
      setTrips(tripsWithNewBadge);
      console.log('✅ Available trips fetched:', tripsWithNewBadge.length, 'trips');
      console.log('   Breakdown: ', filteredVendorTrips.length || 0, 'vendor +', adminTrips.length, 'admin-assigned +', adminReassignedTrips.length, 'admin-reassigned +', vendorAssignedTrips.length, 'vendor-assigned');

      // Set up real-time listener for new trips
      const channelName = `available-trips-${Date.now()}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'trips',
            filter: 'is_published=eq.true,is_admin_trip=eq.false,status=eq.pending',
          },
          (payload) => {
            console.log('🔔 New trip added via real-time:', payload.new.id);
            setTrips(prevTrips => {
              // Add new trip to front with isNew=true
              const newTrip = { ...payload.new, isNew: true };
              // Remove isNew from all other trips
              const updatedPrevTrips = prevTrips.map(t => ({ ...t, isNew: false }));
              return [newTrip, ...updatedPrevTrips];
            });
          }
        )
        .subscribe((status) => {
          console.log('📡 Real-time subscription status:', status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTrips();
    
    // Auto-refetch every 30 seconds to keep the 5-minute seal stamp window accurate
    const interval = setInterval(() => {
      console.log('🔄 Auto-refetching trips to update 5-minute seal window');
      fetchTrips();
    }, 30000); // Refetch every 30 seconds
    
    return () => clearInterval(interval);
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
        .in('status', [TRIP_STATUS.ACCEPTED, TRIP_STATUS.IN_PROGRESS]) // Show trips that are ACCEPTED or IN_PROGRESS
        .or(`driver_id.eq.${driverId},accepted_by.eq.${userId}`) // Check BOTH driver_id and accepted_by
        .maybeSingle();

      if (error) {
        console.error('❌ useActiveTrip query error:', error);
      }

      console.log(`✅ useActiveTrip result: ${data ? `Trip ${data.id} (${data.status})` : 'No active trip found'}`);
      
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
