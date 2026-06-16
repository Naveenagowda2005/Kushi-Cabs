import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator, Modal, ScrollView,
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
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Simple fetch without loading state
  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📋 Fetched trips:', data?.length);
      setTrips(data || []);
    } catch (err) {
      console.error('❌ Fetch error:', err);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchTrips().then(() => setLoading(false));
    }
  }, [user?.id]);

  // Publish handler - direct state update
  const publish = async (tripId) => {
    try {
      // Update state immediately
      setTrips(trips.map(t => t.id === tripId ? { ...t, is_published: true } : t));

      // Update database
      const { error } = await supabase
        .from('trips')
        .update({ is_published: true })
        .eq('id', tripId);

      if (error) {
        // Revert on error
        setTrips(trips.map(t => t.id === tripId ? { ...t, is_published: false } : t));
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('✅ Published', 'Trip is now visible to drivers');
      }
    } catch (err) {
      console.error('Publish error:', err);
      Alert.alert('Error', 'Failed to publish trip');
    }
  };

  // Unpublish handler - direct state update
  const unpublish = async (tripId) => {
    try {
      // Update state immediately
      setTrips(trips.map(t => t.id === tripId ? { ...t, is_published: false } : t));

      // Update database
      const { error } = await supabase
        .from('trips')
        .update({ is_published: false })
        .eq('id', tripId);

      if (error) {
        // Revert on error
        setTrips(trips.map(t => t.id === tripId ? { ...t, is_published: true } : t));
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('✅ Unpublished', 'Trip is no longer visible to drivers');
      }
    } catch (err) {
      console.error('Unpublish error:', err);
      Alert.alert('Error', 'Failed to unpublish trip');
    }
  };

  const TripItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedTrip(item);
        setShowModal(true);
      }}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.locations} numberOfLines={1}>
            {item.pickup_location} → {item.dropoff_location}
          </Text>
          <Text style={styles.fare}>₹{item.fare_amount}</Text>
        </View>
        <View style={[
          styles.badge,
          item.is_published ? styles.publishedBadge : styles.draftBadge
        ]}>
          <Text style={styles.badgeText}>
            {item.is_published ? '✓ Published' : '○ Draft'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.editBtn]}
          onPress={() => navigation.navigate('CreateTrip', { trip: item, editMode: true })}
        >
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        {item.is_published ? (
          <TouchableOpacity
            style={[styles.btn, styles.unpublishBtn]}
            onPress={() => unpublish(item.id)}
          >
            <Text style={styles.btnText}>Unpublish</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btn, styles.publishBtn]}
            onPress={() => publish(item.id)}
          >
            <Text style={styles.btnText}>Publish</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TripItem item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              fetchTrips().then(() => setLoading(false));
            }}
          />
        }
        ListEmptyComponent={
          !loading && <Text style={styles.empty}>No trips created</Text>
        }
        contentContainerStyle={{ padding: 16 }}
      />

      <Modal visible={showModal} onRequestClose={() => setShowModal(false)}>
        <View style={styles.modal}>
          <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>
          {selectedTrip && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>Trip Details</Text>
              <Text style={styles.label}>From: {selectedTrip.pickup_location}</Text>
              <Text style={styles.label}>To: {selectedTrip.dropoff_location}</Text>
              <Text style={styles.label}>Fare: ₹{selectedTrip.fare_amount}</Text>
              <Text style={styles.label}>
                Status: {selectedTrip.is_published ? 'Published' : 'Draft'}
              </Text>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  card: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  info: { flex: 1 },
  locations: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  fare: { color: '#4caf50', fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  publishedBadge: { backgroundColor: '#4caf50' },
  draftBadge: { backgroundColor: '#ff9800' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center' },
  editBtn: { backgroundColor: '#2196f3' },
  publishBtn: { backgroundColor: '#4caf50' },
  unpublishBtn: { backgroundColor: '#ff9800' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 16 },
  modal: { flex: 1, backgroundColor: '#16213e', padding: 20, paddingTop: 40 },
  closeBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  closeText: { color: '#4caf50', fontSize: 14, fontWeight: '600' },
  modalContent: { flex: 1 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { color: '#aaa', fontSize: 14, marginBottom: 10 },
});
