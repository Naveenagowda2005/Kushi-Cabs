import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TRIP_STATUS } from '../constants';

/**
 * Subscribes to realtime INSERT/UPDATE events on the trips table for drivers.
 * CRITICAL: This hook MUST be called with stable callbacks to work properly.
 */
export function useRealtimeTrips({ onNewTrip, onTripTaken, onTripUpdated, userId }) {
  const subscriptionRef = useRef(null);
  const userIdRef = useRef(userId);

  // Keep userId updated but don't trigger re-subscribe
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    // Only subscribe if we have userId
    if (!userId) {
      console.log('⏭️ useRealtimeTrips: userId not ready, skipping subscription');
      return;
    }

    console.log('🔄 Setting up realtime trip subscription for driver:', userId);

    // Create unique channel name
    const channelName = `driver-trips-${userId}-${Date.now()}`;
    
    // Create the channel with all handlers
    const channel = supabase
      .channel(channelName, { config: { broadcast: { self: true } } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trips',
        },
        (payload) => {
          console.log('📨 Realtime INSERT received:', payload.new.id);
          const trip = payload.new;
          
          // Show trips past the vendor window OR with no window set
          const vendorWindowPassed =
            !trip.vendor_visible_until ||
            new Date(trip.vendor_visible_until) <= new Date();
          
          if (trip.status === TRIP_STATUS.PENDING && vendorWindowPassed) {
            console.log('✅ Calling onNewTrip for:', trip.id);
            onNewTrip?.(trip);
          } else {
            console.log('⏭️ Trip filtered out - status:', trip.status, 'vendor_window_passed:', vendorWindowPassed);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
        },
        (payload) => {
          console.log('📨 Realtime UPDATE received:', payload.new.id, 'status:', payload.old.status, '→', payload.new.status);
          const trip = payload.new;
          const old = payload.old;
          const uid = userIdRef.current;

          // Trip accepted by someone else — remove from available list
          if (
            old.status === TRIP_STATUS.PENDING &&
            trip.status === TRIP_STATUS.ACCEPTED &&
            trip.accepted_by !== uid
          ) {
            console.log('✅ Calling onTripTaken for:', trip.id);
            onTripTaken?.(trip.id);
          }

          // Trip was cancelled/released back to pending — re-add to available list
          if (
            old.status !== TRIP_STATUS.PENDING &&
            trip.status === TRIP_STATUS.PENDING
          ) {
            const vendorWindowPassed =
              !trip.vendor_visible_until ||
              new Date(trip.vendor_visible_until) <= new Date();
            if (vendorWindowPassed) {
              console.log('✅ Calling onNewTrip for released trip:', trip.id);
              onNewTrip?.(trip);
            }
          }

          // Driver's own trip changed status
          if (trip.accepted_by === uid || trip.driver_id === uid) {
            console.log('✅ Calling onTripUpdated for driver trip:', trip.id);
            onTripUpdated?.(trip);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Subscription status:', status, err ? 'Error: ' + err.message : '');
        if (err) {
          console.error('❌ Realtime subscription error:', err);
        }
      });

    subscriptionRef.current = channel;

    // Cleanup: unsubscribe on unmount or userId change
    return () => {
      console.log('🛑 Cleaning up realtime subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userId, onNewTrip, onTripTaken, onTripUpdated]); // Re-subscribe if callbacks change
}

/**
 * Realtime wallet balance updates for the driver.
 */
export function useRealtimeDriverWallet({ userId, onBalanceChange }) {
  const onBalanceChangeRef = useRef(onBalanceChange);
  useEffect(() => { onBalanceChangeRef.current = onBalanceChange; }, [onBalanceChange]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`driver-wallet-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onBalanceChangeRef.current?.(payload.new.balance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]); // re-subscribe only if userId changes
}
