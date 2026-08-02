import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

// Suppress the text strings warning for React Native compatibility
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

export default function TripCard({ trip, onPress, onAccept, onCancel }) {
  const [carType, setCarType] = useState(null);
  const [seaterType, setSeaterType] = useState(null);
  const [fuelType, setFuelType] = useState(null);
  const [segmentName, setSegmentName] = useState(null);
  const [packageName, setPackageName] = useState(null);
  const [isAcceptedRecently, setIsAcceptedRecently] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Check if trip was accepted in the last 5 minutes
  useEffect(() => {
    if (!trip.accepted_at) {
      setIsAcceptedRecently(false);
      return;
    }

    const acceptedTime = new Date(trip.accepted_at).getTime();
    const now = new Date().getTime();
    const elapsedMs = now - acceptedTime;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    if (elapsedMs < FIVE_MINUTES_MS) {
      setIsAcceptedRecently(true);
      setTimeRemaining(Math.ceil((FIVE_MINUTES_MS - elapsedMs) / 1000));
    } else {
      setIsAcceptedRecently(false);
      setTimeRemaining(0);
    }
  }, [trip.accepted_at]);

  // Update timer every second
  useEffect(() => {
    if (!isAcceptedRecently || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsAcceptedRecently(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAcceptedRecently, timeRemaining]);
  
  // Generate formatted booking ID: KUSH-B-1, KUSH-B-2, etc (no padding)
  const getFormattedBookingId = (tripId, bookingIdSeq) => {
    // Use the booking_id_seq from database, fallback to 1 if not available
    return `KUSH-B-${bookingIdSeq || 1}`;
  };
  
  const bookingId = getFormattedBookingId(trip.id, trip.booking_id_seq);
  
  // Debug logging
  useEffect(() => {
    console.log('🎫 TripCard received:', {
      trip_id: trip.id,
      isNew: trip.isNew,
      has_notes: !!trip.notes,
      notes_value: trip.notes,
      notes_length: trip.notes?.length || 0,
    });
  }, [trip.id, trip.notes, trip.isNew]);
  
  // Fetch car details
  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        console.log('Fetching car details for trip:', {
          car_type: trip.car_type,
          seater_type: trip.seater_type,
          fuel_type: trip.fuel_type,
          segment_id: trip.segment_id,
          package_id: trip.package_id,
        });

        if (trip.car_type) {
          const { data: carTypeData, error: carError } = await supabase
            .from('car_types')
            .select('name')
            .eq('id', trip.car_type)
            .maybeSingle();
          console.log('Car type result:', { carTypeData, carError });
          if (carTypeData) setCarType(carTypeData.name);
        }

        if (trip.seater_type) {
          const { data: seaterData, error: seaterError } = await supabase
            .from('seater_types')
            .select('name')
            .eq('id', trip.seater_type)
            .maybeSingle();
          console.log('Seater type result:', { seaterData, seaterError });
          if (seaterData) setSeaterType(seaterData.name);
        }

        if (trip.fuel_type) {
          const { data: fuelData, error: fuelError } = await supabase
            .from('fuel_types')
            .select('name')
            .eq('id', trip.fuel_type)
            .maybeSingle();
          console.log('Fuel type result:', { fuelData, fuelError });
          if (fuelData) setFuelType(fuelData.name);
        }

        if (trip.segment_id) {
          const { data: segmentData } = await supabase
            .from('trip_segments')
            .select('name')
            .eq('id', trip.segment_id)
            .maybeSingle();
          if (segmentData) setSegmentName(segmentData.name);
        }

        if (trip.package_id) {
          const { data: packageData } = await supabase
            .from('trip_packages')
            .select('name')
            .eq('id', trip.package_id)
            .maybeSingle();
          if (packageData) setPackageName(packageData.name);
        }
      } catch (error) {
        console.error('Error fetching car details:', error);
      }
    };

    fetchCarDetails();
  }, [trip.car_type, trip.seater_type, trip.fuel_type, trip.segment_id, trip.package_id]);

  // Glow animation - continuous blink removed for cleaner UI
  
  const scheduledDate = trip.scheduled_at
    ? new Date(trip.scheduled_at).toLocaleString()
    : 'ASAP';

  const commissionAmount = trip.commission_amount || 0;
  const customerPreAdvance = trip.customer_pre_advance || 0;
  
  // Commission to pay by driver = Commission - Customer Pre-Advance (minimum 0)
  const commissionToPay = Math.max(0, commissionAmount - customerPreAdvance);
  
  console.log('TripCard - Trip data:', {
    trip_id: trip.id,
    created_by: trip.created_by,
    passenger_name: trip.passenger_name,
    passenger_phone: trip.passenger_phone,
    commissionAmount,
    customerPreAdvance,
    commissionToPay,
    toll_included: trip.toll_included,
    state_tax_included: trip.state_tax_included,
    pet_travelling: trip.pet_travelling,
  });

  const glowStyle = {};

  return (
    <Animated.View style={[styles.card]}>
      {/* SEAL STAMP for Recently Accepted Trips - Visible for 5 minutes */}
      {isAcceptedRecently && (
        <View style={styles.sealStampContainer}>
          <View style={styles.sealStamp}>
            {/* Outer ring */}
            <View style={styles.sealRingOuter}>
              <Text style={styles.sealTextTop}>KUSHI CABS</Text>
            </View>
            
            {/* Center circle */}
            <View style={styles.sealCenter}>
              <Text style={styles.sealMainText}>TRIP</Text>
              <Text style={styles.sealMainText}>ACCEPTED</Text>
              <Text style={styles.sealTimerText}>{timeRemaining}s</Text>
            </View>
            
            {/* Star decorations */}
            <Text style={styles.sealStar}>✦</Text>
            <Text style={[styles.sealStar, { bottom: 8, top: 'auto' }]}>✦</Text>
          </View>
        </View>
      )}

      {/* Booking ID - First Line at Top Right */}
      <View style={styles.topBookingIdRow}>
        <View style={styles.topBookingIdBadge}>
          <Text style={styles.topBookingIdLabel}>Booking ID</Text>
          <Text style={styles.topBookingIdValue} numberOfLines={1}>{bookingId}</Text>
        </View>
      </View>

      {/* Header: Trip type and Booking ID */}
      <View style={styles.header}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.tripType}>{(segmentName || trip.segment_name)?.toUpperCase() || 'ONE WAY TRIP'}</Text>
          {trip.isNew && (
            <View style={styles.newTripBadge}>
              <Text style={styles.newTripBadgeText}>🆕 NEW</Text>
            </View>
          )}
        </View>
      </View>

      {/* Booking ID Row - removed, now in header */}

      {/* Admin Badge - for super admin assigned trips */}
      {trip.is_admin_trip && (
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#fff" />
          <Text style={styles.adminBadgeText}>Admin Assigned</Text>
        </View>
      )}

      {/* Vendor Badge - for vendor assigned trips (driver_id set AND is_admin_trip is false) */}
      {trip.driver_id && trip.is_admin_trip === false && (
        <View style={styles.vendorBadge}>
          <Ionicons name="person-circle-outline" size={14} color="#fff" />
          <Text style={styles.vendorBadgeText}>Vendor Assigned</Text>
        </View>
      )}
      
      {/* Debug logging */}
      {console.log('🔍 TripCard badge check:', {
        trip_id: trip.id,
        pickup: trip.pickup_location,
        dropoff: trip.dropoff_location,
        driver_id: trip.driver_id,
        is_admin_trip: trip.is_admin_trip,
        shows_vendor_badge: !!(trip.driver_id && trip.is_admin_trip === false),
        shows_admin_badge: !!trip.is_admin_trip,
      })}

      {/* Fare & Fixed KM in one badge box - Left side */}
      <View style={styles.badgeRow}>
        <View style={styles.fareKmBox}>
          <View style={styles.fareBadge}>
            <Ionicons name="cash-outline" size={14} color="#333" />
            <Text style={styles.fareText}>₹{(trip.fare_amount - commissionAmount).toFixed(2)}</Text>
          </View>
          <Text style={styles.separatorText}>|</Text>
          {trip.fixed_km && (
            <View style={styles.kmBadge}>
              <Ionicons name="swap-horizontal-outline" size={14} color="#333" />
              <Text style={styles.kmText}>{trip.fixed_km} km</Text>
            </View>
          )}
          {trip.extra_km_charge && trip.extra_km_charge > 0 && (
            <>
              <Text style={styles.separatorText}>|</Text>
              <Text style={[styles.kmText, { marginLeft: 2 }]}>Ex ₹{trip.extra_km_charge}/km</Text>
            </>
          )}
        </View>
      </View>

      {/* Pickup and Dropoff on separate rows */}
      <View style={styles.locationsColumn}>
        {/* Pickup Row */}
        <View style={styles.locationRow}>
          <View style={styles.locationRowContent}>
            <Ionicons name="location" size={16} color="#4caf50" />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.location} numberOfLines={2}>{trip.pickup_location}</Text>
            </View>
          </View>
        </View>
        
        {/* Dropoff Row */}
        <View style={styles.locationRow}>
          <View style={styles.locationRowContent}>
            <Ionicons name="flag" size={16} color="#e94560" />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.location} numberOfLines={2}>{trip.dropoff_location}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Return Location - for Round trips */}
      {trip.return_location && (
        <View style={styles.row}>
          <Ionicons name="location" size={16} color="#4caf50" />
          <View style={styles.locationContent}>
            <Text style={styles.locationLabel}>Return Location</Text>
            <Text style={styles.location} numberOfLines={2}>{trip.return_location}</Text>
          </View>
        </View>
      )}

      {/* Package - for Local Packages */}
      {packageName && (
        <View style={styles.packageBadge}>
          <Ionicons name="cube-outline" size={12} color="#2196f3" />
          <Text style={styles.packageText}>{packageName}</Text>
        </View>
      )}

      {/* Car Details Row */}
      {(carType || seaterType || fuelType) && (
        <View style={styles.carDetailsRow}>
          {carType && (
            <View style={styles.carDetail}>
              <Ionicons name="car-outline" size={14} color="#2196f3" />
              <Text style={styles.carDetailText}>{carType}</Text>
            </View>
          )}
          {seaterType && (
            <View style={styles.carDetail}>
              <Ionicons name="people-outline" size={14} color="#2196f3" />
              <Text style={styles.carDetailText}>{seaterType}</Text>
            </View>
          )}
          {fuelType && (
            <View style={styles.carDetail}>
              <Ionicons name="flame-outline" size={14} color="#2196f3" />
              <Text style={styles.carDetailText}>{fuelType}</Text>
            </View>
          )}
        </View>
      )}

      {/* Toll & Tax & Hills + Pet Travelling - Single Row */}
      <View style={styles.inclusionsRow}>
        <View style={styles.inclusionItem}>
          <View style={styles.inclusionBox}>
            <Text style={styles.inclusionLabel}>Toll - Tax - Hills</Text>
            <Text style={[styles.inclusionStatus, trip.toll_included ? styles.includedText : styles.excludedText]}>
              {trip.toll_included ? '✓ Included' : '✗ Excluded'}
            </Text>
          </View>
        </View>
        <View style={styles.inclusionDividerContainer}>
          <Text style={styles.inclusionDivider}>-</Text>
        </View>
        <View style={styles.inclusionItem}>
          <View style={styles.inclusionBox}>
            <Text style={styles.inclusionLabel}>Pet</Text>
            <Text style={[styles.inclusionStatus, trip.pet_travelling ? styles.includedText : styles.excludedText]}>
              {trip.pet_travelling ? '✓ Allowed' : '✗ Not Allowed'}
            </Text>
          </View>
        </View>
      </View>

      {/* Departure Time */}
      <View style={styles.departureRow}>
        <Ionicons name="calendar-outline" size={14} color="#4caf50" />
        <Text style={styles.departureLabel}>Departure:</Text>
        <Text style={styles.departureTime}>
          {scheduledDate}
        </Text>
      </View>

      {/* Return Date - for Round trips - directly under departure */}
      {trip.return_date && (
        <View style={styles.departureRow}>
          <Ionicons name="calendar-outline" size={14} color="#ff9800" />
          <Text style={styles.departureLabel}>Return:</Text>
          <Text style={styles.departureTime}>
            {new Date(trip.return_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
          </Text>
        </View>
      )}

      {/* Notes Section */}
      <View style={styles.notesHeader}>
        <Text style={styles.notesTitle}>Notes:</Text>
      </View>

      {/* User Notes */}
      {trip.notes && trip.notes.trim() && (
        <View style={styles.noteItem}>
          <Ionicons name="document-text-outline" size={12} color="#2196f3" />
          <Text style={[styles.noteText, { color: '#2196f3' }]} numberOfLines={1}>
            {trip.notes}
          </Text>
        </View>
      )}

      {/* Carrier Note - Always show */}
      <View style={styles.noteItem}>
        <Ionicons name="alert-circle-outline" size={12} color="#ff9800" />
        <Text style={styles.noteText} numberOfLines={1}>
          Carrier must be CNG vehicles
        </Text>
      </View>

      {/* Action Buttons - Hidden when trip is recently accepted */}
      {!isAcceptedRecently && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => onCancel?.()}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={16} color="#f44336" />
            <Text style={styles.cancelBtnText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.acceptBtn} 
            onPress={() => onAccept?.(trip)}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept Trip</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ff9800',
    overflow: 'visible',
  },
  topBookingIdRow: {
    marginBottom: 0,
    paddingVertical: 0,
  },
  topBookingIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
    gap: 8,
    alignSelf: 'flex-start',
  },
  topBookingIdLabel: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topBookingIdValue: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripType: {
    color: '#000',
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paymentBadge: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  paymentText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  bookingIdBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#2196f3',
  },
  bookingIdBadgeLabel: {
    color: '#2196f3',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bookingIdBadgeValue: {
    color: '#2196f3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  bookingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookingIdLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },
  bookingIdValue: {
    color: '#2196f3',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  newTripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ff4081',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  newTripBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  vendorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  vendorBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  fareKmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 1,
    maxWidth: '100%',
  },
  fareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fareText: { color: '#000', fontWeight: 'bold', fontSize: 22 },
  kmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  kmBadgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  separatorText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  kmText: { 
    color: '#000', 
    fontWeight: 'bold', 
    fontSize: 18,
    flexShrink: 1,
  },
  extraKmChargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  extraKmChargeLabel: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  extraKmChargeValue: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '700',
  },
  extraKmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  extraKmText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  commissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4caf5033',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#4caf5066',
  },
  commissionText: { color: '#4caf50', fontSize: 12, fontWeight: '600' },
  row: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 10,
    gap: 10,
  },
  locationsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'visible',
  },
  locationsColumn: {
    flexDirection: 'column',
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'visible',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationSide: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  locationRowContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  locationDivider: {
    width: 2,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  locationContent: {
    flex: 1,
    minWidth: 0,
  },
  locationLabel: {
    color: '#000',
    fontSize: 12,
    marginBottom: 3,
    fontWeight: '600',
  },
  location: { 
    color: '#000', 
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 21,
  },
  arrowDivider: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  packageText: {
    color: '#2196f3',
    fontSize: 11,
    fontWeight: '600',
  },
  carDetailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ff9800',
    borderBottomWidth: 1,
    borderBottomColor: '#ff9800',
  },
  carDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  carDetailText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  inclusionsRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 10,
    flexWrap: 'nowrap',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inclusionBox: {
    flex: 1,
    alignItems: 'center',
  },
  inclusionItem: {
    flex: 1,
    justifyContent: 'center',
  },
  inclusionDividerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  inclusionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  inclusionStatus: {
    fontSize: 10,
    fontWeight: '700',
  },
  inclusionDivider: {
    fontSize: 10,
    color: '#000',
    marginHorizontal: 2,
  },
  inclusionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    flex: 1,
    minWidth: 'auto',
  },
  includedBadge: {
    backgroundColor: '#0a2a0a',
    borderColor: '#4caf5066',
  },
  excludedBadge: {
    backgroundColor: '#2a1a00',
    borderColor: '#ff980066',
  },
  inclusionText: {
    fontSize: 9,
    fontWeight: '500',
    flex: 1,
  },
  includedText: {
    color: '#4caf50',
  },
  excludedText: {
    color: '#ff9800',
  },
  petBadge: {
    backgroundColor: '#4a1a1a',
    borderColor: '#ff6b6b66',
  },
  petText: {
    color: '#ff6b6b',
  },
  petAllowedBadge: {
    backgroundColor: '#4a1a1a',
    borderColor: '#ff6b6b66',
  },
  petAllowedText: {
    color: '#ff6b6b',
  },
  petNotAllowedBadge: {
    backgroundColor: '#2a1a00',
    borderColor: '#ff980066',
  },
  petNotAllowedText: {
    color: '#ff9800',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff3e0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
  },
  lockText: { color: '#000', fontSize: 10, flex: 1 },
  carrierNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2a1a00',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 10,
  },
  carrierNoteText: {
    color: '#ff9800',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  departureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 4,
    marginBottom: 8,
  },
  departureLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  departureTime: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
  },
  footer: { flexDirection: 'row', alignItems: 'center' },
  footerText: { color: '#888', fontSize: 10, marginLeft: 4 },
  notesHeader: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ff9800',
  },
  notesTitle: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noteText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ff9800',
  },
  notesText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '400',
    flex: 1,
  },
  taxNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ff9800',
  },
  taxNoteText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '400',
    flex: 1,
  },
  petsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  petsNoteText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '400',
    flex: 1,
  },
  breakdownBox: {
    backgroundColor: '#0a1929',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  breakdownTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
  },
  breakdownValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#ff9800',
    paddingTopMargin: 8,
    marginTop: 8,
    paddingTop: 8,
  },
  breakdownTotalLabel: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownTotalValue: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ff9800',
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f4433622',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  cancelBtnText: {
    color: '#f44336',
    fontSize: 13,
    fontWeight: '600',
  },
  // SEAL STAMP STYLES
  sealStampContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'none',
    marginTop: -100,
    marginLeft: -100,
  },
  sealStamp: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#ff9800',
    backgroundColor: '#fff8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'solid',
    position: 'relative',
  },
  sealRingOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealTextTop: {
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    position: 'absolute',
    top: 18,
  },
  sealCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  sealMainText: {
    color: '#ff9800',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    lineHeight: 20,
  },
  sealTimerText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  sealStar: {
    position: 'absolute',
    fontSize: 12,
    color: '#ff9800',
    top: 8,
    right: 8,
  },
});
