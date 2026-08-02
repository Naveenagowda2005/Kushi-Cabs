import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';

// ===== TRIP ITEM COMPONENT - EXTRACTED TO PREVENT RE-CREATION =====
const TripItem = React.memo(({ item, navigation, publishing, onPublish, onUnpublish, onDelete, onSelectTrip }) => {
  const [segmentName, setSegmentName] = useState(null);

  useEffect(() => {
    const fetchSegment = async () => {
      if (item.segment_id) {
        try {
          const { data } = await supabase
            .from('trip_segments')
            .select('name')
            .eq('id', item.segment_id)
            .maybeSingle();
          if (data) {
            setSegmentName(data.name);
          }
        } catch (error) {
          console.error('Error fetching segment:', error);
        }
      }
    };
    fetchSegment();
  }, [item.segment_id]);

  // Format booking ID
  const getFormattedBookingId = (bookingIdSeq) => {
    const serial = (bookingIdSeq || 1).toString();
    return `KUSH-B-${serial}`;
  };
  const bookingId = getFormattedBookingId(item.booking_id_seq);

  return (
  <TouchableOpacity
    style={styles.tripCard}
    onPress={() => onSelectTrip(item)}
    activeOpacity={0.8}
  >
    {/* Booking ID and Trip Type Badge */}
    <View style={styles.headerBadgeRow}>
      <View style={styles.bookingIdBadge}>
        <Text style={styles.bookingIdLabel}>Booking ID:</Text>
        <Text style={styles.bookingIdValue}>{bookingId}</Text>
      </View>
    </View>

    <View style={styles.tripHeader}>
      <View style={styles.tripInfo}>
        {/* Pickup and Dropoff on separate rows */}
        <View style={styles.locationsColumn}>
          {/* Pickup Row */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={12} color="#4caf50" />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.tripLocations} numberOfLines={2}>{item.pickup_location}</Text>
            </View>
          </View>
          
          {/* Dropoff Row */}
          <View style={styles.locationRow}>
            <Ionicons name="flag" size={12} color="#e94560" />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.tripLocations} numberOfLines={2}>{item.dropoff_location}</Text>
            </View>
          </View>
        </View>
        {item.return_location && (
          <View style={styles.returnLocationRow}>
            <Ionicons name="location-outline" size={12} color="#2196f3" />
            <Text style={styles.tripReturnLocation} numberOfLines={1}>
              Return: {item.return_location}
            </Text>
          </View>
        )}
        <Text style={styles.tripDate}>
          Departure: {item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString() : 'ASAP'}
        </Text>
        {item.return_date && (
          <Text style={styles.tripReturnDate}>
            Return: {new Date(item.return_date).toLocaleDateString()}
          </Text>
        )}
      </View>
      <View style={styles.tripRight}>
        <Text style={styles.tripFare}>₹{item.fare_amount}</Text>
        <View style={[
          styles.statusBadge,
          item.is_published ? styles.publishedBadge : styles.draftBadge
        ]}>
          <Text style={styles.statusText}>
            {item.is_published ? 'Published' : 'Draft'}
          </Text>
        </View>
        {/* Extra KM Charge Badge */}
        {item.extra_km_charge && item.extra_km_charge > 0 && (
          <View style={styles.extraKmChargeBadge}>
            <Ionicons name="trending-up-outline" size={12} color="#fff" />
            <Text style={styles.extraKmChargeBadgeText}>₹{item.extra_km_charge}/km</Text>
          </View>
        )}
      </View>
    </View>

    <View style={styles.tripDetails}>
      <View style={styles.detailRow}>
        <Ionicons name="map-outline" size={14} color="#2196f3" />
        <Text style={styles.detailText}>{item.fixed_km || 'N/A'} km</Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="car-outline" size={14} color="#2196f3" />
        <Text style={styles.detailText}>{item.car_type || 'N/A'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="people-outline" size={14} color="#2196f3" />
        <Text style={styles.detailText}>{item.seater_type || 'N/A'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="flame-outline" size={14} color="#2196f3" />
        <Text style={styles.detailText}>{item.fuel_type || 'N/A'}</Text>
      </View>
    </View>

    {/* Extra Charges Display */}
    <View style={styles.extraChargesContainer}>
      <View style={styles.extraChargesRow}>
        <View style={styles.chargeBadge}>
          <Ionicons name="cash-outline" size={12} color="#fff" />
          <Text style={styles.chargeBadgeText}>
            Toll: {item.toll_included ? 'Included' : 'Excluded'}
          </Text>
        </View>
      </View>
      <View style={styles.extraChargesRow}>
        <View style={styles.chargeBadge}>
          <Ionicons name="document-text-outline" size={12} color="#fff" />
          <Text style={styles.chargeBadgeText}>
            Tax: {item.state_tax_included ? 'Included' : 'Excluded'}
          </Text>
        </View>
      </View>
      <View style={styles.extraChargesRow}>
        <View style={styles.chargeBadge}>
          <Ionicons name="paw-outline" size={12} color="#fff" />
          <Text style={styles.chargeBadgeText}>
            Pet: {item.pet_travelling ? 'Allowed' : 'Not Allowed'}
          </Text>
        </View>
      </View>
    </View>

    {/* Notes Display */}
    {item.notes && item.notes.trim() && (
      <View style={styles.notesPreview}>
        <Ionicons name="document-text-outline" size={12} color="#2196f3" />
        <Text style={styles.notesPreviewText} numberOfLines={2}>
          {item.notes}
        </Text>
      </View>
    )}

    <View style={styles.tripFooter}>
      <Text style={styles.commissionText}>
        Commission: ₹{item.commission_amount}
      </Text>
      <View style={styles.actionButtons}>
        {item.status !== 'completed' && !item.is_published && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate('CreateTrip', { trip: item, editMode: true })}
          >
            <Ionicons name="pencil-outline" size={14} color="#2196f3" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
        {item.is_published ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.unpublishBtn]}
            onPress={() => onUnpublish(item.id)}
            disabled={publishing === item.id}
          >
            {publishing === item.id ? (
              <ActivityIndicator size="small" color="#ff9800" />
            ) : (
              <>
                <Ionicons name="eye-off-outline" size={14} color="#ff9800" />
                <Text style={styles.unpublishBtnText}>Unpublish</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.publishBtn]}
            onPress={() => onPublish(item.id)}
            disabled={publishing === item.id}
          >
            {publishing === item.id ? (
              <ActivityIndicator size="small" color="#4caf50" />
            ) : (
              <>
                <Ionicons name="eye-outline" size={14} color="#4caf50" />
                <Text style={styles.publishBtnText}>Publish</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  </TouchableOpacity>
  );
});

export default function VendorMyTripsScreen({ navigation }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchMyTrips = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, booking_id_seq, is_published')
        .eq('created_by', user.id)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
      console.log('✅ Trips fetched:', data?.length);
      if (data && data.length > 0) {
        console.log('📝 First trip is_published:', data[0].is_published);
        console.log('📝 Sample trip data:', JSON.stringify(data[0], null, 2));
      }
      return true;
    } catch (err) {
      console.error('Error fetching trips:', err.message);
      Alert.alert('Error', 'Failed to load trips');
      return false;
    }
  }, [user?.id]);



  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMyTrips().then(() => setLoading(false));
    }, [fetchMyTrips])
  );

  const refreshTrips = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, booking_id_seq, is_published')
        .eq('created_by', user.id)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (err) {
      console.error('Error refreshing trips:', err.message);
    }
  };

  const handlePublish = async (tripId) => {
    console.log(`🔵 Publishing trip: ${tripId}`);
    console.log(`Current trips state:`, trips);
    setPublishing(tripId);
    try {
      // Update database first (more reliable)
      console.log(`📤 Sending update to database for trip: ${tripId}`);
      const { data, error } = await supabase
        .from('trips')
        .update({ is_published: true })
        .eq('id', tripId)
        .select();

      console.log(`✅ Update response:`, { data, error });
      
      if (error) {
        console.error(`❌ Update error:`, error);
        throw error;
      }

      // Update local state with fresh data from response
      if (data && data.length > 0) {
        const updatedTrip = data[0];
        const updatedTrips = trips.map(trip => 
          trip.id === tripId ? updatedTrip : trip
        );
        setTrips(updatedTrips);
        console.log(`✅ Local state updated with database response`);
      }

      setSuccessMessage('✅ Published - Trip is now visible to all drivers');
      setShowSuccessModal(true);
      console.log(`✅ Published trip: ${tripId} successfully`);
    } catch (err) {
      console.error('❌ Error publishing trip:', err.message);
      // Revert if error - fetch fresh data
      fetchMyTrips();
      Alert.alert('Error', 'Failed to publish trip: ' + err.message);
    } finally {
      setPublishing(null);
    }
  };

  const handleUnpublish = async (tripId) => {
    console.log(`🔵 Unpublishing trip: ${tripId}`);
    console.log(`Current trips state:`, trips);
    setPublishing(tripId);
    try {
      // Update database first (more reliable)
      console.log(`📤 Sending update to database for trip: ${tripId}`);
      const { data, error } = await supabase
        .from('trips')
        .update({ is_published: false })
        .eq('id', tripId)
        .select();

      console.log(`✅ Update response:`, { data, error });
      
      if (error) {
        console.error(`❌ Update error:`, error);
        throw error;
      }

      // Update local state with fresh data from response
      if (data && data.length > 0) {
        const updatedTrip = data[0];
        const updatedTrips = trips.map(trip => 
          trip.id === tripId ? updatedTrip : trip
        );
        setTrips(updatedTrips);
        console.log(`✅ Local state updated with database response`);
      }

      setSuccessMessage('✅ Unpublished - Trip is no longer visible to drivers');
      setShowSuccessModal(true);
      console.log(`✅ Unpublished trip: ${tripId} successfully`);
    } catch (err) {
      console.error('❌ Error unpublishing trip:', err.message);
      // Revert if error - fetch fresh data
      fetchMyTrips();
      Alert.alert('Error', 'Failed to unpublish trip: ' + err.message);
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (tripId) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('trips')
                .delete()
                .eq('id', tripId);

              if (error) throw error;

              Alert.alert('✅ Deleted', 'Trip has been deleted');
              fetchMyTrips();
            } catch (err) {
              console.error('Error deleting trip:', err.message);
              Alert.alert('Error', 'Failed to delete trip');
            }
          }
        }
      ]
    );
  };

  // Memoized callback handlers for TripItem
  const handlePublishCallback = useCallback((tripId) => handlePublish(tripId), [trips]);
  const handleUnpublishCallback = useCallback((tripId) => handleUnpublish(tripId), [trips]);
  const handleSelectTrip = useCallback((trip) => {
    setSelectedTrip(trip);
    setShowModal(true);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TripItem 
            item={item}
            navigation={navigation}
            publishing={publishing}
            onPublish={handlePublishCallback}
            onUnpublish={handleUnpublishCallback}
            onDelete={handleDelete}
            onSelectTrip={handleSelectTrip}
          />
        )}
        contentContainerStyle={styles.list}
        extraData={trips}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No trips created yet</Text>
              <Text style={styles.emptySubtitle}>
                Create a new trip to get started
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchMyTrips}
            tintColor={COLORS.vendor.secondary}
            colors={[COLORS.vendor.secondary]}
          />
        }
      />

      {/* Trip Detail Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trip Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedTrip && (
              <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Booking Details</Text>
                  <View style={styles.infoBox}>
                    <View style={styles.pricingRow}>
                      <Text style={styles.infoLabel}>Booking ID</Text>
                      <Text style={styles.infoValue}>{`KUSH-B-${selectedTrip.booking_id_seq || 1}`}</Text>
                    </View>
                    <View style={styles.pricingRow}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                        {selectedTrip.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Locations</Text>
                  <View style={styles.locationBox}>
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={16} color="#4caf50" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.locationLabelText}>Pickup</Text>
                        <Text style={styles.locationValueText}>{selectedTrip.pickup_location}</Text>
                      </View>
                    </View>
                    <View style={styles.locationRow}>
                      <Ionicons name="flag" size={16} color="#1a1a2e" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.locationLabelText}>Dropoff</Text>
                        <Text style={styles.locationValueText}>{selectedTrip.dropoff_location}</Text>
                      </View>
                    </View>
                    {selectedTrip.return_location && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={16} color="#2196f3" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.locationLabelText}>Return Location</Text>
                          <Text style={styles.locationValueText}>{selectedTrip.return_location}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {selectedTrip.return_date && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Return Date</Text>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoValue}>
                        {new Date(selectedTrip.return_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Passenger</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{selectedTrip.passenger_name}</Text>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{selectedTrip.passenger_phone}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Pricing</Text>
                  <View style={styles.infoBox}>
                    <View style={styles.pricingRow}>
                      <Text style={styles.infoLabel}>Fare</Text>
                      <Text style={styles.infoValue}>₹{selectedTrip.fare_amount}</Text>
                    </View>
                    <View style={styles.pricingRow}>
                      <Text style={styles.infoLabel}>Commission</Text>
                      <Text style={styles.infoValue}>₹{selectedTrip.commission_amount}</Text>
                    </View>
                    {selectedTrip.fixed_km && (
                      <View style={styles.pricingRow}>
                        <Text style={styles.infoLabel}>Fixed KM</Text>
                        <Text style={styles.infoValue}>{selectedTrip.fixed_km} km</Text>
                      </View>
                    )}
                    {selectedTrip.extra_km_charge && selectedTrip.extra_km_charge > 0 && (
                      <View style={styles.pricingRow}>
                        <Text style={styles.infoLabel}>Extra Charge per KM</Text>
                        <Text style={styles.infoValue}>₹{selectedTrip.extra_km_charge}/km</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Vehicle</Text>
                  <View style={styles.infoBox}>
                    <View style={styles.vehicleRow}>
                      <Ionicons name="car-outline" size={14} color="#2196f3" />
                      <Text style={styles.vehicleText}>{selectedTrip.car_type}</Text>
                    </View>
                    <View style={styles.vehicleRow}>
                      <Ionicons name="people-outline" size={14} color="#2196f3" />
                      <Text style={styles.vehicleText}>{selectedTrip.seater_type}</Text>
                    </View>
                    <View style={styles.vehicleRow}>
                      <Ionicons name="flame-outline" size={14} color="#2196f3" />
                      <Text style={styles.vehicleText}>{selectedTrip.fuel_type}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionLabel}>Extra Charges</Text>
                  <View style={styles.infoBox}>
                    <View style={styles.chargeRow}>
                      <Ionicons name="cash-outline" size={14} color="#ff9800" />
                      <Text style={styles.chargeLabel}>Toll Included</Text>
                      <Text style={[styles.chargeBadge, selectedTrip.toll_included ? styles.badgeYes : styles.badgeNo]}>
                        {selectedTrip.toll_included ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.chargeRow}>
                      <Ionicons name="document-text-outline" size={14} color="#ff9800" />
                      <Text style={styles.chargeLabel}>State Tax Included</Text>
                      <Text style={[styles.chargeBadge, selectedTrip.state_tax_included ? styles.badgeYes : styles.badgeNo]}>
                        {selectedTrip.state_tax_included ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.chargeRow}>
                      <Ionicons name="paw-outline" size={14} color="#ff9800" />
                      <Text style={styles.chargeLabel}>Pet</Text>
                      <Text style={[styles.chargeBadge, selectedTrip.pet_travelling ? styles.badgeYes : styles.badgeNo]}>
                        {selectedTrip.pet_travelling ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedTrip.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionLabel}>Special Instructions</Text>
                    <View style={styles.infoBox}>
                      <Text style={styles.notesText}>{selectedTrip.notes}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

                <View style={styles.modalActions}>
                  {selectedTrip.status !== 'completed' && !selectedTrip.is_published && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn, { flex: 1 }]}
                      onPress={() => {
                        navigation.navigate('CreateTrip', { trip: selectedTrip, editMode: true });
                        setShowModal(false);
                      }}
                    >
                      <Ionicons name="pencil-outline" size={16} color="#2196f3" />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                  {selectedTrip.is_published ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.unpublishBtn, { flex: 1 }]}
                      onPress={() => {
                        handleUnpublish(selectedTrip.id);
                        setShowModal(false);
                      }}
                    >
                      <Ionicons name="eye-off-outline" size={16} color="#ff9800" />
                      <Text style={styles.unpublishBtnText}>Unpublish</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.publishBtn, { flex: 1 }]}
                      onPress={() => {
                        handlePublish(selectedTrip.id);
                        setShowModal(false);
                      }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#4caf50" />
                      <Text style={styles.publishBtnText}>Publish</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn, { flex: 1, marginLeft: 10 }]}
                    onPress={() => {
                      handleDelete(selectedTrip.id);
                      setShowModal(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#f44336" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Success Modal with Refresh Button */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>
            <View style={styles.successButtons}>
              <TouchableOpacity
                style={[styles.successBtn, styles.cancelBtn]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.successBtnText}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.successBtn, styles.refreshBtn]}
                onPress={() => {
                  setShowSuccessModal(false);
                  refreshTrips();
                }}
              >
                <Text style={styles.successBtnText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, flexGrow: 1 },
  tripCard: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  tripTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2196f333',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  tripTypeBadgeText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerBadgeRow: {
    marginBottom: 0,
    paddingVertical: 0,
  },
  bookingIdBadge: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  bookingIdLabel: {
    color: '#856404',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bookingIdValue: {
    color: '#856404',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tripInfo: { flex: 1 },
  locationsColumn: {
    flexDirection: 'column',
    marginBottom: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'visible',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },
  locationLabel: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  returnLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  tripLocations: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  tripDate: {
    color: '#888',
    fontSize: 12,
  },
  tripReturnDate: {
    color: '#2196f3',
    fontSize: 11,
    marginTop: 4,
  },
  tripReturnLocation: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  tripRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  tripFare: {
    color: '#4caf50',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publishedBadge: {
    backgroundColor: '#4caf5033',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  draftBadge: {
    backgroundColor: '#ff980033',
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  extraKmChargeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff9800',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  extraKmChargeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tripDetails: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#4caf50',
    borderBottomWidth: 1,
    borderBottomColor: '#4caf50',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailText: {
    color: '#2196f3',
    fontSize: 9,
    fontWeight: '500',
  },
  extraChargesContainer: {
    gap: 14,
    marginBottom: 18,
  },
  extraChargesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extraChargesLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  chargeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chargeBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff9800',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chargeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commissionText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtn: {
    backgroundColor: '#2196f311',
    borderColor: '#2196f3',
  },
  editBtnText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '600',
  },
  publishBtn: {
    backgroundColor: '#4caf5011',
    borderColor: '#4caf50',
  },
  publishBtnText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
  },
  unpublishBtn: {
    backgroundColor: '#ff980011',
    borderColor: '#ff9800',
  },
  unpublishBtnText: {
    color: '#ff9800',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#f4433611',
    borderColor: '#f44336',
  },
  deleteBtnText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ff9800',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  modalBodyContent: {
    paddingBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  locationBox: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationLabelText: {
    color: '#888',
    fontSize: 11,
  },
  locationValueText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 12,
  },
  infoLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 4,
  },
  infoValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  vehicleText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '500',
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ff9800',
  },
  chargeLabel: {
    color: '#aaa',
    fontSize: 12,
    flex: 1,
  },
  chargeBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeYes: {
    backgroundColor: '#4caf5033',
    color: '#4caf50',
  },
  badgeNo: {
    backgroundColor: '#f4433633',
    color: '#f44336',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBox: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 20,
    minWidth: '70%',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  successText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  successButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  successBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#555',
  },
  refreshBtn: {
    backgroundColor: '#4caf50',
  },
  successBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  notesPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#2196f311',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  notesPreviewText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
});
