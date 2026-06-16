import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

export default function EnquiryCard({ trip, onPress, onAccept, onCancel }) {
  const [carType, setCarType] = useState(null);
  const [seaterType, setSeaterType] = useState(null);
  const [fuelType, setFuelType] = useState(null);
  const [segmentName, setSegmentName] = useState(null);
  const [packageName, setPackageName] = useState(null);
  const [creatorName, setCreatorName] = useState(null);
  const [creatorPhone, setCreatorPhone] = useState(null);

  const commissionAmount = trip.commission_amount || 0;
  const customerPreAdvance = trip.customer_pre_advance || 0;
  
  // Commission to pay by driver = Commission - Customer Pre-Advance (minimum 0)
  const commissionToPay = Math.max(0, commissionAmount - customerPreAdvance);

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        if (trip.car_type) {
          const { data: carTypeData } = await supabase
            .from('car_types')
            .select('name')
            .eq('id', trip.car_type)
            .maybeSingle();
          if (carTypeData) setCarType(carTypeData.name);
        }

        if (trip.seater_type) {
          const { data: seaterData } = await supabase
            .from('seater_types')
            .select('name')
            .eq('id', trip.seater_type)
            .maybeSingle();
          if (seaterData) setSeaterType(seaterData.name);
        }

        if (trip.fuel_type) {
          const { data: fuelData } = await supabase
            .from('fuel_types')
            .select('name')
            .eq('id', trip.fuel_type)
            .maybeSingle();
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

    const fetchCreatorDetails = async () => {
      try {
        if (trip.created_by) {
          const { data: creator } = await supabase
            .from('users')
            .select('full_name, phone')
            .eq('id', trip.created_by)
            .maybeSingle();
          if (creator) {
            setCreatorName(creator.full_name);
            setCreatorPhone(creator.phone);
          }
        }
      } catch (error) {
        console.error('Error fetching creator details:', error);
      }
    };

    fetchCarDetails();
    fetchCreatorDetails();
  }, [trip.car_type, trip.seater_type, trip.fuel_type, trip.segment_id, trip.package_id, trip.created_by]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.tripTypeContainer}>
          <Ionicons name="car-outline" size={16} color="#888" />
          <Text style={styles.tripType}>{segmentName?.toUpperCase() || 'ONE WAY TRIP'}</Text>
        </View>
        <View style={styles.paymentBadge}>
          <Text style={styles.paymentText}>Paid by Cash</Text>
        </View>
      </View>

      <View style={styles.fareBadge}>
        <Ionicons name="cash-outline" size={16} color="#fff" />
        <Text style={styles.fareText}>₹{trip.fare_amount}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="location" size={16} color="#4caf50" />
        <View style={styles.locationContent}>
          <Text style={styles.locationLabel}>Pickup</Text>
          <Text style={styles.location} numberOfLines={2}>{trip.pickup_location}</Text>
        </View>
      </View>

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

      {/* Return Date - for Round trips */}
      {trip.return_date && (
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={16} color="#2196f3" />
          <View style={styles.locationContent}>
            <Text style={styles.locationLabel}>Return Date</Text>
            <Text style={styles.location}>
              {new Date(trip.return_date).toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
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

      {(carType || seaterType || fuelType) && (
        <>
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
        </>
      )}

      {trip.scheduled_at && (
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.scheduledText}>
            Departure: {new Date(trip.scheduled_at).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Extra Charges Display */}
      <View style={styles.extraChargesContainer}>
        <View style={styles.extraChargesRow}>
          <View style={styles.chargeBadge}>
            <Ionicons name="cash-outline" size={12} color="#fff" />
            <Text style={styles.chargeBadgeText}>
              Toll: {trip.toll_included ? 'Included' : 'Excluded'}
            </Text>
          </View>
        </View>
        <View style={styles.extraChargesRow}>
          <View style={styles.chargeBadge}>
            <Ionicons name="document-text-outline" size={12} color="#fff" />
            <Text style={styles.chargeBadgeText}>
              Tax: {trip.state_tax_included ? 'Included' : 'Excluded'}
            </Text>
          </View>
        </View>
        <View style={styles.extraChargesRow}>
          <View style={styles.chargeBadge}>
            <Ionicons name="paw-outline" size={12} color="#fff" />
            <Text style={styles.chargeBadgeText}>
              Pet: {trip.pet_travelling ? 'Allowed' : 'Not Allowed'}
            </Text>
          </View>
        </View>
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

      {/* Note 2: Additional Info */}
      <View style={styles.noteItem}>
        <Ionicons name="information-circle-outline" size={12} color="#ff9800" />
        <Text style={styles.noteText}>
          Driver must accept all charges conditions before accepting trip
        </Text>
      </View>

      {/* Trip Creator Details - if pre-advance exceeds commission */}
      {customerPreAdvance > commissionAmount && (
        <View style={styles.creatorDetailsBox}>
          <View style={styles.creatorDetailsHeader}>
            <Ionicons name="alert-circle-outline" size={14} color="#ff9800" />
            <Text style={styles.creatorDetailsTitle}>Collect from Trip Creator</Text>
          </View>
          <Text style={styles.creatorDetailsNote}>
            Customer pre-advance (₹{customerPreAdvance.toFixed(2)}) exceeds commission (₹{commissionAmount.toFixed(2)})
          </Text>
          <View style={styles.creatorDetailRow}>
            <Ionicons name="person-outline" size={12} color="#ff9800" />
            <Text style={styles.creatorDetailLabel}>Trip Creator:</Text>
            <Text style={styles.creatorDetailValue}>{creatorName || 'N/A'}</Text>
          </View>
          {creatorPhone && (
            <View style={styles.creatorDetailRow}>
              <Ionicons name="call-outline" size={12} color="#ff9800" />
              <Text style={styles.creatorDetailLabel}>Phone:</Text>
              <Text style={styles.creatorDetailValue}>{creatorPhone}</Text>
            </View>
          )}
          <View style={styles.creatorDetailRow}>
            <Ionicons name="wallet-outline" size={12} color="#ff9800" />
            <Text style={styles.creatorDetailLabel}>Collect:</Text>
            <Text style={styles.creatorDetailValue}>₹{(customerPreAdvance - commissionAmount).toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation?.();
            onAccept?.(trip);
          }}
        >
          <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation?.();
            onCancel?.();
          }}
        >
          <Ionicons name="close-circle" size={18} color="#f44336" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: screenWidth * 0.04,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
    minHeight: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripType: {
    color: '#ff9800',
    fontSize: Math.max(18, screenWidth * 0.045),
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
    fontSize: Math.max(11, screenWidth * 0.028),
    fontWeight: '600',
  },
  fareBadge: {
    position: 'absolute',
    top: screenWidth * 0.04,
    right: screenWidth * 0.04,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Math.max(14, screenWidth * 0.038),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    paddingRight: screenWidth * 0.25,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    color: '#888',
    fontSize: Math.max(11, screenWidth * 0.028),
    marginBottom: 2,
  },
  location: {
    color: '#fff',
    fontSize: Math.max(13, screenWidth * 0.035),
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
    fontSize: Math.max(11, screenWidth * 0.028),
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
    fontSize: Math.max(11, screenWidth * 0.028),
    fontWeight: '500',
  },
  extraChargesContainer: {
    gap: 8,
    marginVertical: 10,
  },
  extraChargesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chargeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ff9800',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chargeBadgeText: {
    color: '#fff',
    fontSize: Math.max(10, screenWidth * 0.028),
    fontWeight: '600',
  },
  carrierNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2a1a00',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 8,
  },
  carrierNoteText: {
    color: '#ff9800',
    fontSize: Math.max(10, screenWidth * 0.028),
    fontWeight: '500',
    flex: 1,
  },
  scheduledText: {
    color: '#888',
    fontSize: Math.max(11, screenWidth * 0.028),
  },
  notesHeader: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  notesTitle: {
    color: '#fff',
    fontSize: Math.max(12, screenWidth * 0.032),
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
    fontSize: Math.max(10, screenWidth * 0.027),
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
    fontSize: Math.max(10, screenWidth * 0.027),
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
    fontSize: Math.max(11, screenWidth * 0.028),
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
    fontSize: Math.max(11, screenWidth * 0.028),
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
    fontSize: Math.max(12, screenWidth * 0.032),
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
    fontSize: Math.max(11, screenWidth * 0.028),
    fontWeight: '500',
  },
  breakdownValue: {
    color: '#fff',
    fontSize: Math.max(11, screenWidth * 0.028),
    fontWeight: '600',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    marginTop: 8,
    paddingTop: 8,
  },
  breakdownTotalLabel: {
    color: '#4caf50',
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '600',
  },
  breakdownTotalValue: {
    color: '#4caf50',
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '700',
  },
  creatorDetailsBox: {
    backgroundColor: '#2a1a00',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  creatorDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  creatorDetailsTitle: {
    color: '#ff9800',
    fontSize: Math.max(11, screenWidth * 0.028),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  creatorDetailsNote: {
    color: '#888',
    fontSize: Math.max(10, screenWidth * 0.027),
    fontWeight: '400',
    marginBottom: 8,
  },
  creatorDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  creatorDetailLabel: {
    color: '#888',
    fontSize: Math.max(10, screenWidth * 0.027),
    fontWeight: '600',
    minWidth: 60,
  },
  creatorDetailValue: {
    color: '#ff9800',
    fontSize: Math.max(10, screenWidth * 0.027),
    fontWeight: '600',
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
  },
  acceptButton: {
    backgroundColor: '#4caf5011',
    borderColor: '#4caf50',
  },
  acceptButtonText: {
    color: '#4caf50',
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f4433611',
    borderColor: '#f44336',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '600',
  },
});
