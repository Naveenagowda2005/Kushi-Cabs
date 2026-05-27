import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TRIP_STATUS } from '../constants';

/**
 * Subscribes to realtime INSERT/UPDATE events on the trips table for drivers.
 * Uses stable refs for callbacks so the subscription is only created once per mount.
 */
export function useRealtimeTrips({ onNewTrip, onTripTaken, onTripUpdated, userId }) {
  // Keep callbacks in refs so we never need to re-subscribe when they change
  const onNewTripRef     = useRef(onNewTrip);
  const onTripTakenRef   = useRef(onTripTaken);
  const onTripUpdatedRef = useRef(onTripUpdated);
  const userIdRef        = useRef(userId);

  useEffect(() => { onNewTripRef.current     = onNewTrip;     }, [onNewTrip]);
  useEffect(() => { onTripTakenRef.current   = onTripTaken;   }, [onTripTaken]);
  useEffect(() => { onTripUpdatedRef.current = onTripUpdated; }, [onTripUpdated]);
  useEffect(() => { userIdRef.current        = userId;        }, [userId]);

  useEffect(() => {
    // Unique channel name prevents "already subscribed" errors on re-mount
    const channelName = `driver-trips-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trips' },
        (payload) => {
          const trip = payload.new;
          // Show trips past the vendor window OR with no window set
          const vendorWindowPassed =
            !trip.vendor_visible_until ||
            new Date(trip.vendor_visible_until) <= new Date();
          if (trip.status === TRIP_STATUS.PENDING && vendorWindowPassed) {
            onNewTripRef.current?.(trip);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips' },
        (payload) => {
          const trip = payload.new;
          const old  = payload.old;
          const uid  = userIdRef.current;

          // Trip accepted by someone else — remove from available list
          if (
            old.status === TRIP_STATUS.PENDING &&
            trip.status === TRIP_STATUS.ACCEPTED &&
            trip.accepted_by !== uid
          ) {
            onTripTakenRef.current?.(trip.id);
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
              onNewTripRef.current?.(trip);
            }
          }

          // Driver's own trip changed status
          if (trip.accepted_by === uid || trip.driver_id === uid) {
            onTripUpdatedRef.current?.(trip);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // empty deps — subscribe once on mount, unsubscribe on unmount
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
