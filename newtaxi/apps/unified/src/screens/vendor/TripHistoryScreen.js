import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import TripStatusBadge from '../../components/TripStatusBadge';

const { width: screenWidth } = Dimensions.get('window');
const TABS = ['All', 'Active', 'Completed', 'Pending'];

export default function VendorTripHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const fetchTrips = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get vendor row id
      const { data: vendorRow } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let query = supabase
        .from('trips')
        .select('*, accepted_by_user:accepted_by(full_name, phone), driver:driver_id(vehicle_number, license_number, users(full_name, phone))')
        .order('created_at', { ascending: false });

      if (vendorRow?.id) {
        query = query.or(`accepted_by.eq.${user.id},vendor_id.eq.${vendorRow.id},created_by.eq.${user.id}`);
      } else {
        query = query.or(`accepted_by.eq.${user.id},created_by.eq.${user.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTrips(data || []);
    } catch (err) {
      console.error('TripHistory fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { fetchTrips(); }, [fetchTrips]));

  const filteredTrips = trips.filter(t => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return t.status === 'accepted' || t.status === 'in_progress';
    if (activeTab === 2) return t.status === 'completed';
    if (activeTab === 3) return t.status === 'pending';
    return true;
  });

  const stats = {
    total:     trips.length,
    active:    trips.filter(t => t.status === 'accepted' || t.status === 'in_progress').length,
    completed: trips.filter(t => t.status === 'completed').length,
    pending:   trips.filter(t => t.status === 'pending').length,
  };

  function TripCard({ item, navigation }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TripStatusBadge status={item.status} />
          <Text style={styles.fare}>₹{item.fare_amount}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="location" size={16} color="#4caf50" />
          <Text style={styles.location} numberOfLines={1}>{item.pickup_location}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="flag" size={16} color="#e94560" />
          <Text style={styles.location} numberOfLines={1}>{item.dropoff_location}</Text>
        </View>

        {item.passenger_name && (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={16} color="#888" />
            <Text style={styles.meta}>{item.passenger_name}</Text>
          </View>
        )}

        <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>

        {/* View Details Button */}
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={() => {
            if (item.status === 'completed') {
              navigation.navigate('CompletedTripDetail', { trip: item });
            } else {
              navigation.navigate('EnquiryDetail', { trip: item, readOnly: true });
            }
          }}
        >
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text style={styles.viewDetailsBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>{stats.total} total trips</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#2196f3' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4caf50' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ff9800' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
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
        renderItem={({ item }) => <TripCard item={item} navigation={navigation} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTrips} tintColor="#e94560" colors={['#e94560']} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={56} color="#333" />
              <Text style={styles.emptyText}>No trips found</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#ffffff', padding: 6, paddingTop: 12 },
  title: { color: '#333', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 14, marginTop: 2, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: '#f5f5f5', paddingVertical: 16, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0', gap: 8 },
  statItem: { flex: 1, alignItems: 'center', borderWidth: 2, borderColor: '#ff9800', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 8, backgroundColor: '#ffffff' },
  statValue: { color: '#333', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: '#ffffff', paddingHorizontal: 4, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 2, borderColor: '#e0e0e0', marginHorizontal: 4 },
  tabActive: { backgroundColor: '#f0f0f0', borderColor: '#ff9800' },
  tabText: { color: '#888', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#e94560' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 3, borderColor: '#ff9800' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  fare: { color: '#4caf50', fontWeight: 'bold', fontSize: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, paddingVertical: 4 },
  location: { color: '#333', fontSize: 15, flex: 1, fontWeight: '500' },
  meta: { color: '#666', fontSize: 14, flex: 1, fontWeight: '500' },
  commission: { color: '#4caf50', fontSize: 12 },
  driverSection: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  driverDetailsTitle: {
    color: '#2196f3',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  date: { color: '#888', fontSize: 12, marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  viewDetailsBtn: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  viewDetailsBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
});
