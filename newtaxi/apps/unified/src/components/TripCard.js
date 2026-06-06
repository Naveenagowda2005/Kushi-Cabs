import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function TripCard({ trip, onPress }) {
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
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Header: Trip type and Payment method */}
      <View style={styles.header}>
        <Text style={styles.tripType}>{segmentName?.toUpperCase() || 'ONE WAY TRIP'}</Text>
        <View style={styles.paymentBadge}>
          <Text style={styles.paymentText}>Paid by Cash</Text>
        </View>
      </View>

      {/* Fare + commission badges */}
      <View style={styles.badgeRow}>
        <View style={styles.fareBadge}>
          <Ionicons name="cash-outline" size={14} color="#fff" />
          <Text style={styles.fareText}>₹{trip.fare_amount}</Text>
        </View>
        {commissionToPay > 0 && (
          <View style={styles.commissionBadge}>
            <Ionicons name="trending-up-outline" size={12} color="#fff" />
            <Text style={styles.commissionText}>₹{commissionToPay.toFixed(2)}</Text>
          </View>
        )}
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
        <Ionicons name="flag" size={16} color="#1a1a2e" />
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

      {/* Note 1: Carrier */}
      {(carType || seaterType) && (
        <View style={styles.noteItem}>
          <Ionicons name="alert-circle-outline" size={12} color="#ff9800" />
          <Text style={styles.noteText}>
            Carrier must have {carType || 'required'} with {seaterType || 'required'} seating
          </Text>
        </View>
      )}

      {/* Note 2: Tax */}
      <View style={styles.noteItem}>
        <Ionicons name="information-circle-outline" size={12} color="#ff9800" />
        <Text style={styles.noteText}>State tax, toll & parking extra if applicable</Text>
      </View>

      {/* Note 3: Pets */}
      <View style={styles.noteItem}>
        <Ionicons name="paw-outline" size={12} color="#ff9800" />
        <Text style={styles.noteText}>Pets travelling - additional charges apply</Text>
      </View>
    </TouchableOpacity>
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
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
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
});
