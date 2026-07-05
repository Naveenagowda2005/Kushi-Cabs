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
  
  // Debug logging
  useEffect(() => {
    console.log('🎫 TripCard received:', {
      trip_id: trip.id,
      has_notes: !!trip.notes,
      notes_value: trip.notes,
      notes_length: trip.notes?.length || 0,
    });
  }, [trip.id, trip.notes]);
  
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
      {/* Header: Trip type and Payment method */}
      <View style={styles.header}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.tripType}>{(segmentName || trip.segment_name)?.toUpperCase() || 'ONE WAY TRIP'}</Text>
          {trip.isNew && (
            <View style={styles.newTripBadge}>
              <Ionicons name="spark" size={12} color="#fff" />
              <Text style={styles.newTripBadgeText}>New</Text>
            </View>
          )}
        </View>
        <View style={styles.paymentBadge}>
          <Text style={styles.paymentText}>Paid by Cash</Text>
        </View>
      </View>

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
          {trip.fixed_km && (
            <View style={styles.kmBadge}>
              <Ionicons name="swap-horizontal-outline" size={14} color="#333" />
              <Text style={styles.kmText}>{trip.fixed_km} km</Text>
            </View>
          )}
        </View>
      </View>

      {/* Extra KM Charge - Clear Separate Line */}
      {trip.extra_km_charge && trip.extra_km_charge > 0 && (
        <View style={styles.extraKmChargeRow}>
          <Ionicons name="trending-up-outline" size={14} color="#ff9800" />
          <Text style={styles.extraKmChargeLabel}>For Extra KM:</Text>
          <Text style={styles.extraKmChargeValue}>₹{trip.extra_km_charge}/km</Text>
        </View>
      )}

      {/* Pickup and Dropoff in one row */}
      <View style={styles.locationsRow}>
        {/* Pickup */}
        <View style={styles.locationSide}>
          <View style={styles.locationRowContent}>
            <Ionicons name="location" size={16} color="#4caf50" />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.location}>{trip.pickup_location}</Text>
            </View>
          </View>
        </View>
        
        {/* Arrow Divider */}
        <View style={styles.arrowDivider}>
          <Ionicons name="arrow-forward-outline" size={16} color="#333" />
        </View>
        
        {/* Dropoff */}
        <View style={styles.locationSide}>
          <View style={styles.locationRowContent}>
            <Ionicons name="flag" size={16} color="#e94560" />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.location}>{trip.dropoff_location}</Text>
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

      {/* Lock indicator — customer details hidden */}
      <View style={styles.lockRow}>
        <Ionicons name="lock-closed-outline" size={13} color="#ff9800" />
        <Text style={styles.lockText}>Pay commission to unlock customer details</Text>
      </View>

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

      {/* Action Buttons */}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tripType: {
    color: '#ff9800',
    fontSize: 18,
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
  newTripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ff4081',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newTripBadgeText: {
    color: '#fff',
    fontSize: 10,
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
    marginBottom: 4,
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
    marginBottom: 4,
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
    marginBottom: 4,
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
  },
  fareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fareText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  kmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kmText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
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
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  locationSide: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  locationRowContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  locationDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 6,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    color: '#000',
    fontSize: 10,
    marginBottom: 1,
  },
  location: { 
    color: '#000', 
    fontSize: 15,
    flex: 1,
    flexWrap: 'wrap',
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 4,
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
    marginVertical: 6,
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
    paddingTop: 2,
    paddingBottom: 2,
    marginBottom: 2,
  },
  departureLabel: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  departureTime: {
    color: '#ff9800',
    fontSize: 14,
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
    marginTop: 2,
    paddingTop: 3,
    borderTopWidth: 1,
    borderTopColor: '#ff9800',
  },
  notesTitle: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1,
  },
  noteText: {
    color: '#000',
    fontSize: 11,
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
    marginTop: 6,
    paddingTop: 6,
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
});
