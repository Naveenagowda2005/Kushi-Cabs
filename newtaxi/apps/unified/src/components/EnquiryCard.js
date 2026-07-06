import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

// Suppress the text strings warning for React Native compatibility
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

const { width: screenWidth } = Dimensions.get('window');

export default function EnquiryCard({ trip, onPress, onAccept, onCancel }) {
  const [carType, setCarType] = useState(null);
  const [seaterType, setSeaterType] = useState(null);
  const [fuelType, setFuelType] = useState(null);
  const [packageName, setPackageName] = useState(null);

  // Get segment name directly from enriched data (already fetched by hook)
  const segmentName = trip.segment_name || 'ONE WAY';

  const commissionAmount = trip.commission_amount || 0;

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
  }, [trip.car_type, trip.seater_type, trip.fuel_type, trip.package_id, trip.created_by]);

  return (
    <Animated.View
      style={[styles.card]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <View style={styles.tripTypeContainer}>
              <Ionicons name="car-outline" size={16} color="#ff9800" />
              <Text style={styles.tripType}>{segmentName ? segmentName.toUpperCase() : 'TRIP'}</Text>
              {/* ✅ NEW Badge - shows if trip hasn't been read yet */}
              {!trip.vendor_read_at && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentText}>Paid by Cash</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.fareKmBox}>
              <View style={styles.fareBadge}>
                <Ionicons name="cash-outline" size={16} color="#333" />
                <Text style={styles.fareText}>₹{(trip.fare_amount - commissionAmount).toFixed(2)}</Text>
              </View>
              {trip.fixed_km && (
                <View style={styles.kmBadge}>
                  <Ionicons name="swap-horizontal-outline" size={16} color="#333" />
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

          {/* Locations in one row */}
          <View style={styles.enquiryLocationsRow}>
            <View style={styles.enquiryLocationItem}>
              <Ionicons name="location" size={12} color="#4caf50" />
              <Text style={styles.enquiryLocationLabel}>Pickup</Text>
              <Text style={styles.enquiryLocationText} numberOfLines={1}>{trip.pickup_location}</Text>
            </View>
            <View style={styles.enquiryLocationDividerContainer}>
              <Text style={styles.enquiryLocationDivider}>→</Text>
            </View>
            <View style={styles.enquiryLocationItem}>
              <Ionicons name="flag" size={12} color="#e94560" />
              <Text style={styles.enquiryLocationLabel}>Drop</Text>
              <Text style={styles.enquiryLocationText} numberOfLines={1}>{trip.dropoff_location}</Text>
            </View>
            {trip.return_location && (
              <>
                <View style={styles.enquiryLocationDividerContainer}>
                  <Text style={styles.enquiryLocationDivider}>→</Text>
                </View>
                <View style={styles.enquiryLocationItem}>
                  <Ionicons name="location-outline" size={12} color="#2196f3" />
                  <Text style={styles.enquiryLocationLabel}>Return</Text>
                  <Text style={[styles.enquiryLocationText, { color: '#2196f3' }]} numberOfLines={1}>{trip.return_location}</Text>
                </View>
              </>
            )}
          </View>

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
              <Ionicons name="calendar-outline" size={14} color="#ff9800" />
              <Text style={styles.scheduledText} numberOfLines={1}>
                Departure: {new Date(trip.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
              </Text>
            </View>
          )}

          {/* Return Date - for Round trips - directly under departure */}
          {trip.return_date && (
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={14} color="#ff9800" />
              <Text style={styles.scheduledText} numberOfLines={1}>
                Return: {new Date(trip.return_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
              </Text>
            </View>
          )}

          {/* Extra Charges Display - Toll Tax Hills + Pet in Single Row */}
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

          {/* Notes Section */}
          <View style={styles.notesHeader}>
            <Text style={styles.notesTitle}>Notes:</Text>
          </View>

          {/* User Notes */}
          {trip.notes && trip.notes.trim() && (
            <View style={styles.noteItem}>
              <Ionicons name="document-text-outline" size={12} color="#2196f3" />
              <Text style={[styles.noteText, { color: '#2196f3' }]}>
                {trip.notes}
              </Text>
            </View>
          )}

          {/* Carrier Note - Always show */}
          {(carType || seaterType) && (
            <View style={styles.noteItem}>
              <Ionicons name="alert-circle-outline" size={12} color="#ff9800" />
              <Text style={styles.noteText}>
                Carrier must be CNG vehicles
              </Text>
            </View>
          )}

          {/* Trip Creator Details - if pre-advance exceeds commission */}
          {/* REMOVED: Collect from Trip Creator box to reduce clutter */}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {trip.status === 'pending' ? (
              <>
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
              </>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.viewDetailsButton]}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onPress?.();
                }}
              >
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: screenWidth * 0.04,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#4caf50',
    minHeight: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newBadge: {
    backgroundColor: '#e94560',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: Math.max(10, screenWidth * 0.026),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tripType: {
    color: '#ff9800',
    fontSize: Math.max(18, screenWidth * 0.045),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentBadge: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paymentText: {
    color: '#333',
    fontSize: Math.max(11, screenWidth * 0.028),
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  fareKmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: Math.max(14, screenWidth * 0.038),
  },
  kmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kmText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: Math.max(14, screenWidth * 0.038),
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
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '600',
    flex: 1,
  },
  extraKmChargeValue: {
    color: '#ff9800',
    fontSize: Math.max(14, screenWidth * 0.038),
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
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
    color: '#333',
    fontSize: Math.max(15, screenWidth * 0.042),
    flex: 1,
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 6,
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
    marginVertical: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#4caf50',
    borderBottomWidth: 1,
    borderBottomColor: '#4caf50',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chargeBadgeText: {
    color: '#fff',
    fontSize: Math.max(18, screenWidth * 0.048),
    fontWeight: '700',
  },
  inclusionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
    flexWrap: 'nowrap',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '700',
    color: '#333',
  },
  inclusionStatus: {
    fontSize: Math.max(11, screenWidth * 0.028),
    fontWeight: '700',
  },
  inclusionDivider: {
    fontSize: Math.max(14, screenWidth * 0.035),
    color: '#555',
    marginHorizontal: 4,
  },
  enquiryLocationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  enquiryLocationItem: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    gap: 2,
  },
  enquiryLocationDividerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  enquiryLocationLabel: {
    color: '#888',
    fontSize: Math.max(8, screenWidth * 0.02),
    fontWeight: '600',
  },
  enquiryLocationText: {
    color: '#333',
    fontSize: Math.max(11, screenWidth * 0.032),
    fontWeight: '600',
    textAlign: 'center',
  },
  enquiryLocationDivider: {
    color: '#555',
    fontSize: Math.max(12, screenWidth * 0.03),
    marginHorizontal: 2,
  },
  includedText: {
    color: '#4caf50',
  },
  excludedText: {
    color: '#ff9800',
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
    color: '#ff9800',
    fontSize: Math.max(14, screenWidth * 0.038),
    fontWeight: '700',
  },
  notesHeader: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#4caf50',
  },
  notesTitle: {
    color: '#333',
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '600',
    marginBottom: 6,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  noteText: {
    color: '#333',
    fontSize: Math.max(12, screenWidth * 0.032),
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
    borderTopColor: '#4caf50',
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
    borderTopColor: '#4caf50',
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
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    borderTopColor: '#4caf50',
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#4caf50',
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
  viewDetailsButton: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
