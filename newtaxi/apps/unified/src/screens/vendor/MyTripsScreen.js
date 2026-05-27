import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';

export default function VendorMyTripsScreen({ navigation }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchMyTrips = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (err) {
      console.error('Error fetching trips:', err.message);
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchMyTrips();
    }, [fetchMyTrips])
  );

  const handlePublish = async (tripId) => {
    setPublishing(tripId);
    try {
      const { error } = await supabase
        .from('trips')
        .update({ is_published: true })
        .eq('id', tripId);

      if (error) throw error;

      Alert.alert('✅ Published', 'Trip is now visible to all drivers');
      fetchMyTrips();
    } catch (err) {
      console.error('Error publishing trip:', err.message);
      Alert.alert('Error', 'Failed to publish trip');
    } finally {
      setPublishing(null);
    }
  };

  const handleUnpublish = async (tripId) => {
    setPublishing(tripId);
    try {
      const { error } = await supabase
        .from('trips')
        .update({ is_published: false })
        .eq('id', tripId);

      if (error) throw error;

      Alert.alert('✅ Unpublished', 'Trip is no longer visible to drivers');
      fetchMyTrips();
    } catch (err) {
      console.error('Error unpublishing trip:', err.message);
      Alert.alert('Error', 'Failed to unpublish trip');
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

  const TripItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => {
        setSelectedTrip(item);
        setShowModal(true);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripLocations} numberOfLines={2}>
            {item.pickup_location} → {item.dropoff_location}
          </Text>
          <Text style={styles.tripDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
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
        </View>
      </View>

      <View style={styles.tripDetails}>
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

      <View style={styles.tripFooter}>
        <Text style={styles.commissionText}>
          Commission: ₹{item.commission_amount}
        </Text>
        <View style={styles.actionButtons}>
          {item.is_published ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.unpublishBtn]}
              onPress={() => handleUnpublish(item.id)}
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
              onPress={() => handlePublish(item.id)}
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

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TripItem item={item} />}
        contentContainerStyle={styles.list}
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
              <View style={styles.modalBody}>
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
                      <Ionicons name="flag" size={16} color="#e94560" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.locationLabelText}>Dropoff</Text>
                        <Text style={styles.locationValueText}>{selectedTrip.dropoff_location}</Text>
                      </View>
                    </View>
                  </View>
                </View>

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

                <View style={styles.modalActions}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, flexGrow: 1 },
  tripCard: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripInfo: { flex: 1 },
  tripLocations: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tripDate: {
    color: '#888',
    fontSize: 12,
  },
  tripRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  tripFare: {
    color: '#e94560',
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
  tripDetails: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    color: '#2196f3',
    fontSize: 11,
    fontWeight: '500',
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
    borderBottomColor: '#0f3460',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
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
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
});
