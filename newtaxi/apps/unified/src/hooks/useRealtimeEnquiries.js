import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TRIP_STATUS } from '../constants';

/**
 * Subscribes to realtime trip events for vendors.
 * Uses stable refs for callbacks so the subscription is only created once per mount.
 */
export function useRealtimeEnquiries({ onNewEnquiry, onEnquiryTaken, onTripUpdated, userId }) {
  const onNewEnquiryRef   = useRef(onNewEnquiry);
  const onEnquiryTakenRef = useRef(onEnquiryTaken);
  const onTripUpdatedRef  = useRef(onTripUpdated);
  const userIdRef         = useRef(userId);

  useEffect(() => { onNewEnquiryRef.current   = onNewEnquiry;   }, [onNewEnquiry]);
  useEffect(() => { onEnquiryTakenRef.current = onEnquiryTaken; }, [onEnquiryTaken]);
  useEffect(() => { onTripUpdatedRef.current  = onTripUpdated;  }, [onTripUpdated]);
  useEffect(() => { userIdRef.current         = userId;         }, [userId]);

  useEffect(() => {
    // Unique channel name prevents "already subscribed" errors on re-mount
    const channelName = `vendor-trips-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trips' },
        (payload) => {
          const trip = payload.new;
          // Show if pending AND (within vendor window OR no window set)
          const withinWindow =
            !trip.vendor_visible_until ||
            new Date(trip.vendor_visible_until) > new Date();
          if (trip.status === TRIP_STATUS.PENDING && withinWindow) {
            onNewEnquiryRef.current?.(trip);
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

          // Enquiry taken by someone ELSE — remove from available list
          // Only trigger if:
          // 1. Status changed from pending to non-pending
          // 2. AND this vendor didn't accept it
          // 3. BUT if this vendor DID accept it, keep it in "My Trips"
          if (
            old.status === TRIP_STATUS.PENDING &&
            trip.status !== TRIP_STATUS.PENDING &&
            trip.accepted_by !== uid
          ) {
            console.log('📤 Trip accepted by another vendor, removing from available list:', trip.id);
            onEnquiryTakenRef.current?.(trip.id);
          }

          // Trip was cancelled/released back to pending — re-add to available list
          if (
            old.status !== TRIP_STATUS.PENDING &&
            trip.status === TRIP_STATUS.PENDING
          ) {
            const withinWindow =
              !trip.vendor_visible_until ||
              new Date(trip.vendor_visible_until) > new Date();
            if (withinWindow) {
              onNewEnquiryRef.current?.(trip);
            }
          }

          // Vendor's own trip updated
          if (trip.accepted_by === uid) {
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
 * Realtime wallet balance updates for the vendor.
 */
export function useRealtimeWallet({ userId, onBalanceChange }) {
  const onBalanceChangeRef = useRef(onBalanceChange);
  useEffect(() => { onBalanceChangeRef.current = onBalanceChange; }, [onBalanceChange]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`vendor-wallet-${userId}-${Date.now()}`)
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
