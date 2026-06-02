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

export default function VendorTripHistoryScreen() {
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
        .select('*')
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

  function TripCard({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TripStatusBadge status={item.status} />
          <Text style={styles.fare}>₹{item.fare_amount}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="location" size={14} color="#4caf50" />
          <Text style={styles.location} numberOfLines={1}>{item.pickup_location}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="flag" size={14} color="#1a1a2e" />
          <Text style={styles.location} numberOfLines={1}>{item.dropoff_location}</Text>
        </View>

        {item.passenger_name && (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={14} color="#888" />
            <Text style={styles.meta}>{item.passenger_name}</Text>
          </View>
        )}

        <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
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
        renderItem={({ item }) => <TripCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTrips} tintColor="#1a1a2e" colors={['#1a1a2e']} />
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
  container: { flex: 1, backgroundColor: '#0f3460' },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fare: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  location: { color: '#ccc', fontSize: 13, flex: 1 },
  meta: { color: '#888', fontSize: 12, flex: 1 },
  commission: { color: '#4caf50', fontSize: 12 },
  date: { color: '#555', fontSize: 11, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#555', fontSize: 16, marginTop: 12 },
});
