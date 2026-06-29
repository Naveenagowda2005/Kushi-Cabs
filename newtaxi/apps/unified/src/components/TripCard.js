import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function TripCard({ trip, onPress, onAccept, onCancel }) {
  const [carType, setCarType] = useState(null);
  const [seaterType, setSeaterType] = useState(null);
  const [fuelType, setFuelType] = useState(null);
  const [segmentName, setSegmentName] = useState(null);
  const [packageName, setPackageName] = useState(null);
  
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
        <Text style={styles.tripType}>{(segmentName || trip.segment_name)?.toUpperCase() || 'ONE WAY TRIP'}</Text>
        <View style={styles.paymentBadge}>
          <Text style={styles.paymentText}>Paid by Cash</Text>
        </View>
      </View>

      {/* Fare & Fixed KM in one badge box */}
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

      {/* Pickup and Dropoff in one row */}
      <View style={styles.locationsRow}>
        {/* Pickup */}
        <View style={styles.locationSide}>
          <View style={styles.locationRowContent}>
            <Ionicons name="location" size={16} color="#4caf50" />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.location} numberOfLines={1}>{trip.pickup_location}</Text>
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
              <Text style={styles.location} numberOfLines={1}>{trip.dropoff_location}</Text>
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
        <View style={styles.inclusionBox}>
          <Text style={styles.inclusionLabel}>Toll - Tax - Hills</Text>
          <Text style={[styles.inclusionStatus, trip.toll_included ? styles.includedText : styles.excludedText]}>
            {trip.toll_included ? '✓ Included' : '✗ Excluded'}
          </Text>
        </View>
        <Text style={styles.inclusionDivider}>-</Text>
        <View style={styles.inclusionBox}>
          <Text style={styles.inclusionLabel}>Pet</Text>
          <Text style={[styles.inclusionStatus, trip.pet_travelling ? styles.includedText : styles.excludedText]}>
            {trip.pet_travelling ? '✓ Allowed' : '✗ Not Allowed'}
          </Text>
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

      {/* Carrier Note */}
      <View style={styles.noteItem}>
        <Ionicons name="alert-circle-outline" size={12} color="#ff9800" />
        <Text style={styles.noteText}>
          Carrier must be CNG vehicles
        </Text>
      </View>

      {/* Additional Info Note */}
      <View style={styles.noteItem}>
        <Ionicons name="information-circle-outline" size={12} color="#ff9800" />
        <Text style={styles.noteText}>
          You must accept all charges conditions before accepting trip
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
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripType: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentBadge: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  paymentText: {
    color: '#333',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
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
  fareText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  kmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kmText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
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
    marginBottom: 8,
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
    color: '#666',
    fontSize: 10,
    marginBottom: 1,
  },
  location: { 
    color: '#333', 
    fontSize: 15,
    flex: 1,
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 6,
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
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  carDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  carDetailText: {
    color: '#2196f3',
    fontSize: 10,
    fontWeight: '500',
  },
  inclusionsRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 8,
    flexWrap: 'nowrap',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inclusionBox: {
    flex: 1,
    alignItems: 'center',
  },
  inclusionLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#333',
  },
  inclusionStatus: {
    fontSize: 8,
    fontWeight: '600',
  },
  inclusionDivider: {
    fontSize: 10,
    color: '#333',
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
    marginBottom: 6,
  },
  lockText: { color: '#ff9800', fontSize: 10, flex: 1 },
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
    paddingBottom: 2,
    marginBottom: 4,
  },
  departureLabel: {
    color: '#333',
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
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesTitle: {
    color: '#333',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  noteText: {
    color: '#ff9800',
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
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
    borderTopColor: '#0f3460',
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
    borderColor: '#0f3460',
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
    borderTopColor: '#0f3460',
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
