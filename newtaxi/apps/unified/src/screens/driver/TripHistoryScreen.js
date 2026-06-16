import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Linking, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import TripStatusBadge from '../../components/TripStatusBadge';

const TABS = ['All', 'Completed', 'Active', 'Cancelled'];

export default function DriverTripHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const fetchTrips = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, creator:created_by(full_name, phone, roles(name)), segment:segment_id(name)')
        .or(`accepted_by.eq.${user.id},driver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📋 TripHistory fetched trips:', {
        total: data?.length,
        completed: data?.filter(t => t.status === 'completed').length,
        trips: data?.map(t => ({ id: t.id, status: t.status, fare: t.fare_amount }))
      });
      setTrips(data || []);
    } catch (err) {
      console.error('TripHistory error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { fetchTrips(); }, [fetchTrips]));

  const filteredTrips = trips.filter(t => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return t.status === 'completed';
    if (activeTab === 2) return t.status === 'accepted' || t.status === 'in_progress';
    if (activeTab === 3) return t.status === 'cancelled' || t.status === 'pending';
    return true;
  });

  const stats = {
    total:     trips.length,
    completed: trips.filter(t => t.status === 'completed').length,
    active:    trips.filter(t => t.status === 'accepted' || t.status === 'in_progress').length,
  };

  function handleCallCreator(trip) {
    const creator = trip.creator;
    const phone = creator?.phone;
    const name = creator?.full_name || 'Trip Creator';
    const role = creator?.roles?.name;

    if (!phone) {
      Alert.alert('No Contact', 'Contact information is not available for this trip.');
      return;
    }

    Alert.alert(
      'Contact Trip Creator',
      `👤 ${name}\n📞 ${phone}\nRole: ${role === 'super_admin' ? 'Super Admin' : 'Vendor'}`,
      [
        { text: `Call ${name}`, onPress: () => Linking.openURL(`tel:${phone}`) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  function TripCard({ item }) {
    const isCompleted = item.status === 'completed';
    const hasIssue = item.status === 'completed'; // show contact option for completed trips

    console.log('🎫 TripCard rendering:', { id: item.id, status: item.status, isCompleted });

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => {
          if (isCompleted) {
            navigation.navigate('CompletedTripDetail', { trip: item });
          }
        }}
        activeOpacity={isCompleted ? 0.7 : 1}
      >
        <View style={styles.cardHeader}>
          <TripStatusBadge status={item.status} />
          <View style={styles.tripTypeBadge}>
            <Text style={styles.tripTypeText}>
              {item.segment?.name?.toUpperCase() || 'ONE WAY'}
            </Text>
          </View>
          <Text style={styles.fare}>₹{(item.fare_amount - (item.commission_amount || 0)).toFixed(2)}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="location" size={14} color="#4caf50" />
          <Text style={styles.location} numberOfLines={1}>{item.pickup_location}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="flag" size={14} color="#888" />
          <Text style={styles.location} numberOfLines={1}>{item.dropoff_location}</Text>
        </View>
        {item.return_location && (
          <View style={styles.row}>
            <Ionicons name="return-up-back-outline" size={14} color="#ff9800" />
            <Text style={styles.location} numberOfLines={1}>{item.return_location}</Text>
          </View>
        )}

        {/* Show passenger info only for completed trips (commission was paid) */}
        {isCompleted && item.passenger_name && (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={14} color="#888" />
            <Text style={styles.meta}>{item.passenger_name}</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Ionicons name="calendar-outline" size={12} color="#555" />
          <Text style={styles.date}>Created: {new Date(item.created_at).toLocaleString()}</Text>
        </View>
        {isCompleted && item.completed_at && (
          <View style={styles.cardFooter}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#4caf50" />
            <Text style={[styles.date, { color: '#4caf50' }]}>
              Completed: {new Date(item.completed_at).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Action buttons row */}
        <View style={styles.actionButtonsRow}>
          {/* View Details button for completed trips */}
          {isCompleted && (
            <TouchableOpacity 
              style={styles.viewDetailsBtn} 
              onPress={() => {
                console.log('🔍 View Details clicked for trip:', item.id);
                navigation.navigate('CompletedTripDetail', { trip: item });
              }}
            >
              <Ionicons name="eye-outline" size={14} color="#fff" />
              <Text style={styles.viewDetailsBtnText}>View Details</Text>
            </TouchableOpacity>
          )}

          {/* Contact creator button */}
          {hasIssue && (
            <TouchableOpacity style={styles.contactBtn} onPress={() => handleCallCreator(item)}>
              <Ionicons name="call-outline" size={14} color="#ff9800" />
              <Text style={styles.contactBtnText}>Contact Creator</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>{stats.total} trips · {stats.completed} completed</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4caf50' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#2196f3' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TripCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTrips} tintColor="#4caf50" colors={['#4caf50']} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={56} color="#333" />
              <Text style={styles.emptyText}>No trips found</Text>
              <Text style={styles.emptySubtext}>Your completed trips will appear here</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { backgroundColor: '#001a33', padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: '#16213e', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#0f3460' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: '#16213e', paddingHorizontal: 4, paddingBottom: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1a1a2e' },
  tabText: { color: '#888', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#16213e', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a1a2e' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 6 },
  fare: { color: '#4caf50', fontWeight: 'bold', fontSize: 16 },
  tripTypeBadge: { backgroundColor: '#0f3460', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flex: 1 },
  tripTypeText: { color: '#ff9800', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  location: { color: '#ccc', fontSize: 13, flex: 1 },
  meta: { color: '#aaa', fontSize: 12, flex: 1 },
  commission: { color: '#4caf50', fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 },
  date: { color: '#aaa', fontSize: 11, flex: 1 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: 12, gap: 8, flexWrap: 'wrap' },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2196f3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  viewDetailsBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2a1a00', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  contactBtnText: { color: '#ff9800', fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#aaa', fontSize: 16, marginTop: 12 },
  emptySubtext: { color: '#aaa', fontSize: 13, marginTop: 4 },
});
