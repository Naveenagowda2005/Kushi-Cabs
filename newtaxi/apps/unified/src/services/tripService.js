import { supabase } from '../lib/supabase';
import { MIN_WALLET_BALANCE, ROLES, TRANSACTION_TYPES } from '../constants';

/**
 * Vendor accepts a pending enquiry (within 5-min window).
 */
export async function acceptEnquiry(tripId, userId) {
  try {
    const { data, error } = await supabase.rpc('accept_trip', {
      p_trip_id:     tripId,
      p_user_id:     userId,
      p_role:        ROLES.VENDOR,
      p_min_balance: 0,
    });

    if (error) throw error;
    if (!data.success) return { success: false, error: data.error };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Vendor creates a new trip directly.
 * vendorId is the vendors.id (not user_id).
 */
export async function createTrip({ vendorId, userId, tripData }) {
  const { data, error } = await supabase.rpc('create_vendor_trip', {
    p_created_by:   userId,
    p_vendor_id:    vendorId,
    p_pickup:       tripData.pickupLocation,
    p_dropoff:      tripData.dropoffLocation,
    p_fare:         tripData.fareAmount,
    p_scheduled_at: tripData.scheduledAt || null,
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error);
  return data;
}

/**
 * Accepts a trip atomically via the Supabase RPC function.
 * Handles: duplicate acceptance, insufficient balance, expired window.
 */
export async function acceptTrip(tripId, userId) {
  try {
    const { data, error } = await supabase.rpc('accept_trip', {
      p_trip_id:     tripId,
      p_user_id:     userId,
      p_role:        ROLES.DRIVER,
      p_min_balance: 0, // Balance check already done before this call
    });

    if (error) throw error;
    if (!data.success) return { success: false, error: data.error };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Starts a trip — sets status to in_progress, saves start odometer.
 */
export async function startTrip({ tripId, startOdometerUrl, startKm, userId }) {
  const { error } = await supabase
    .from('trips')
    .update({
      status:             'in_progress',
      started_at:         new Date().toISOString(),
      start_odometer_url: startOdometerUrl,
      start_km:           startKm,
    })
    .eq('id', tripId);

  if (error) throw error;
}

/**
 * Completes a trip — saves end odometer and marks completed.
 * Fare is collected offline from the customer — wallet is NOT credited.
 * Wallet is only used for paying commission to accept trips.
 */
export async function completeTrip({ tripId, endOdometerUrl, endKm, userId }) {
  // 1. Mark trip completed
  const { error: tripError } = await supabase
    .from('trips')
    .update({
      status:           'completed',
      completed_at:     new Date().toISOString(),
      end_odometer_url: endOdometerUrl,
      end_km:           endKm,
    })
    .eq('id', tripId);

  if (tripError) throw tripError;

  // 2. Free the driver
  const { error: driverError } = await supabase
    .from('drivers')
    .update({ is_available: true, current_trip_id: null })
    .eq('user_id', userId);

  if (driverError) throw driverError;

  // NOTE: Fare is collected offline from the customer.
  // No wallet credit on trip completion.
}
