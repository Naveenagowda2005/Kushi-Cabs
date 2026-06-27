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
  
  // Glow animation
  const glowAnim = useRef(new Animated.Value(0)).current;

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

  // Glow animation - continuous blink
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();

    return () => glowAnimation.stop();
  }, [glowAnim]);

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

  const glowStyle = {
    backgroundColor: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#16213e', '#1a4d1a'],
    }),
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    }),
  };

  return (
    <Animated.View style={[styles.card, glowStyle]}>
      {/* Header: Trip type and Payment method */}
      <View style={styles.header}>
        <Text style={styles.tripType}>{segmentName?.toUpperCase() || 'ONE WAY TRIP'}</Text>
        <View style={styles.paymentBadge}>
          <Text style={styles.paymentText}>Paid by Cash</Text>
        </View>
      </View>

      {/* Fare badge */}
      <View style={styles.badgeRow}>
        <View style={styles.fareBadge}>
          <Ionicons name="cash-outline" size={14} color="#fff" />
          <Text style={styles.fareText}>₹{(trip.fare_amount - commissionAmount).toFixed(2)}</Text>
        </View>
      </View>

      {/* Pickup */}
      <View style={styles.row}>
        <Ionicons name="location" size={16} color="#4caf50" />
        <View style={styles.locationContent}>
          <Text style={styles.locationLabel}>Pickup</Text>
          <Text style={styles.location} numberOfLines={2}>{trip.pickup_location}</Text>
        </View>
      </View>

      {/* Dropoff */}
      <View style={styles.row}>
        <Ionicons name="flag" size={16} color="#e94560" />
        <View style={styles.locationContent}>
          <Text style={styles.locationLabel}>Dropoff</Text>
          <Text style={styles.location} numberOfLines={2}>{trip.dropoff_location}</Text>
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

      {/* Toll & Tax & Pet Indicators */}
      <View style={styles.inclusionsRow}>
        <View style={[styles.inclusionBadge, trip.toll_included ? styles.includedBadge : styles.excludedBadge]}>
          <Ionicons 
            name={trip.toll_included ? "checkmark-circle-outline" : "close-circle-outline"} 
            size={12} 
            color={trip.toll_included ? "#4caf50" : "#ff9800"}
          />
          <Text style={[styles.inclusionText, trip.toll_included ? styles.includedText : styles.excludedText]}>
            Toll {trip.toll_included ? "Included" : "Excluded"}
          </Text>
        </View>
        <View style={[styles.inclusionBadge, trip.state_tax_included ? styles.includedBadge : styles.excludedBadge]}>
          <Ionicons 
            name={trip.state_tax_included ? "checkmark-circle-outline" : "close-circle-outline"} 
            size={12} 
            color={trip.state_tax_included ? "#4caf50" : "#ff9800"}
          />
          <Text style={[styles.inclusionText, trip.state_tax_included ? styles.includedText : styles.excludedText]}>
            Tax {trip.state_tax_included ? "Included" : "Excluded"}
          </Text>
        </View>
        <View style={[styles.inclusionBadge, trip.pet_travelling === true ? styles.petAllowedBadge : styles.petNotAllowedBadge]}>
          <Ionicons 
            name={trip.pet_travelling === true ? "paw-outline" : "close-circle-outline"} 
            size={12} 
            color={trip.pet_travelling === true ? "#ff6b6b" : "#ff9800"}
          />
          <Text style={[styles.inclusionText, trip.pet_travelling === true ? styles.petAllowedText : styles.petNotAllowedText]}>
            {trip.pet_travelling === true ? "🐾 Pet Allowed" : "🚫 Pet Not Allowed"}
          </Text>
        </View>
        <View style={[styles.inclusionBadge, trip.hills_included ? styles.includedBadge : styles.excludedBadge]}>
          <Ionicons 
            name={trip.hills_included ? "checkmark-circle-outline" : "close-circle-outline"} 
            size={12} 
            color={trip.hills_included ? "#4caf50" : "#ff9800"}
          />
          <Text style={[styles.inclusionText, trip.hills_included ? styles.includedText : styles.excludedText]}>
            Hills {trip.hills_included ? "Included" : "Excluded"}
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
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripType: {
    color: '#ff9800',
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentBadge: {
    backgroundColor: '#000',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paymentText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  fareBadge: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
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
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 2,
  },
  location: { 
    color: '#fff', 
    fontSize: 13,
    flex: 1,
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0a2a4a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 10,
    alignSelf: 'flex-start',
  },
  packageText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '600',
  },
  carDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  carDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  carDetailText: {
    color: '#2196f3',
    fontSize: 11,
    fontWeight: '500',
  },
  inclusionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  inclusionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    flex: 1,
    minWidth: '45%',
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
    fontSize: 11,
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
    gap: 6,
    backgroundColor: '#2a1a00',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  lockText: { color: '#ff9800', fontSize: 11, flex: 1 },
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
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  departureLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  departureTime: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  footer: { flexDirection: 'row', alignItems: 'center' },
  footerText: { color: '#888', fontSize: 12, marginLeft: 4 },
  notesHeader: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  notesTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noteText: {
    color: '#ff9800',
    fontSize: 12,
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
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f4433622',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  cancelBtnText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
});
