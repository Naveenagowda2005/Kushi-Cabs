import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions, Modal, Image, Alert,
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
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [odometerData, setOdometerData] = useState({});
  const [loadingOdometer, setLoadingOdometer] = useState({});

  const fetchTrips = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      console.log('🔍 Fetching trips directly from Supabase for vendor:', user.id);
      
      // Fetch trips created or accepted by this vendor - WITHOUT odometer URLs to avoid timeout
      const { data, error } = await supabase
        .from('trips')
        .select('id,booking_id_seq,status,fare_amount,commission_amount,pickup_location,dropoff_location,return_location,scheduled_at,return_date,created_at,completed_at,created_by,accepted_by,driver_id,passenger_name,passenger_phone,car_type,seater_type,fuel_type,segment_id,package_id,fixed_km,extra_km_charge,toll_included,pet_travelling,state_tax_included,hills_included,notes,customer_pre_advance,start_km,end_km')
        .or(`created_by.eq.${user.id},accepted_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error:', error.message);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} trips directly from Supabase`);
      setTrips(data || []);
    } catch (err) {
      console.error('❌ TripHistory fetch error:', err.message);
      Alert.alert('Error', 'Failed to fetch trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { fetchTrips(); }, [fetchTrips]));

  // Fetch odometer images for a trip directly from Supabase
  const fetchOdometerImages = useCallback(async (tripId) => {
    if (odometerData[tripId]) {
      // Already loaded
      return;
    }

    setLoadingOdometer(prev => ({ ...prev, [tripId]: true }));
    try {
      console.log('🔍 Fetching odometer URLs for trip:', tripId);
      
      // Fetch the trip's odometer URL fields directly from Supabase
      const { data: tripData, error } = await supabase
        .from('trips')
        .select('id, start_odometer_url, end_odometer_url')
        .eq('id', tripId)
        .single();

      if (error) {
        console.error('❌ Error fetching odometer data:', error.message);
        return;
      }

      if (tripData && (tripData.start_odometer_url || tripData.end_odometer_url)) {
        console.log('✅ Odometer data fetched:', {
          start: tripData.start_odometer_url ? 'YES' : 'NO',
          end: tripData.end_odometer_url ? 'YES' : 'NO'
        });
        setOdometerData(prev => ({
          ...prev,
          [tripId]: {
            start_odometer_url: tripData.start_odometer_url,
            end_odometer_url: tripData.end_odometer_url
          }
        }));
      } else {
        console.warn('❌ No odometer data found for trip');
      }
    } catch (err) {
      console.error('Error fetching odometer images:', err.message);
    } finally {
      setLoadingOdometer(prev => ({ ...prev, [tripId]: false }));
    }
  }, [odometerData]);

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
    const getFormattedBookingId = (bookingIdSeq) => {
      return `KUSH-B-${bookingIdSeq || 1}`;
    };
    const bookingId = getFormattedBookingId(item.booking_id_seq);
    const tripOdometerData = odometerData[item.id];
    const hasImages = tripOdometerData && (tripOdometerData.start_odometer_url || tripOdometerData.end_odometer_url);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TripStatusBadge status={item.status} />
          <View style={styles.bookingIdBadge}>
            <Text style={styles.bookingIdLabel}>Booking ID</Text>
            <Text style={styles.bookingIdValue}>{bookingId}</Text>
          </View>
          <Text style={styles.fare}>₹{item.fare_amount}</Text>
        </View>

        <View style={styles.locationsColumn}>
          {/* Pickup Row */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#4caf50" />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.location} numberOfLines={2}>{item.pickup_location}</Text>
            </View>
          </View>
          
          {/* Dropoff Row */}
          <View style={styles.locationRow}>
            <Ionicons name="flag" size={16} color="#e94560" />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.location} numberOfLines={2}>{item.dropoff_location}</Text>
            </View>
          </View>
        </View>

        {item.passenger_name && (
          <View style={styles.row}>
            <Ionicons name="person-outline" size={16} color="#888" />
            <Text style={styles.meta}>{item.passenger_name}</Text>
          </View>
        )}

        <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>

        {/* Odometer Images Section */}
        {hasImages && (
          <View style={styles.odometerSection}>
            <View style={styles.odometerImagesRow}>
              {tripOdometerData.start_odometer_url && (
                <TouchableOpacity
                  style={styles.odometerImageWrapper}
                  onPress={() => {
                    setSelectedImage(tripOdometerData.start_odometer_url);
                    setImageModalVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: tripOdometerData.start_odometer_url }}
                    style={styles.odometerImage}
                  />
                  <Text style={styles.odometerLabel}>Start</Text>
                </TouchableOpacity>
              )}
              {tripOdometerData.end_odometer_url && (
                <TouchableOpacity
                  style={styles.odometerImageWrapper}
                  onPress={() => {
                    setSelectedImage(tripOdometerData.end_odometer_url);
                    setImageModalVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: tripOdometerData.end_odometer_url }}
                    style={styles.odometerImage}
                  />
                  <Text style={styles.odometerLabel}>End</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.buttonRow}>
          {/* View Odometer Images Button */}
          {item.status === 'completed' && (
            <TouchableOpacity
              style={[styles.viewOdometerButton, { marginRight: 8 }]}
              onPress={() => fetchOdometerImages(item.id)}
              disabled={loadingOdometer[item.id]}
            >
              <Ionicons name="camera-outline" size={16} color="#fff" />
              <Text style={styles.viewOdometerButtonText}>
                {loadingOdometer[item.id] ? 'Loading...' : 'View Odometer'}
              </Text>
            </TouchableOpacity>
          )}

          {/* View Details Button */}
          <TouchableOpacity
            style={[styles.viewDetailsBtn, { flex: 1 }]}
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContent}>
            <TouchableOpacity
              style={styles.imageModalCloseButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>{trips.length} recent trips</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{trips.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#2196f3' }]}>{trips.filter(t => t.status === 'accepted' || t.status === 'in_progress').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4caf50' }]}>{trips.filter(t => t.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ff9800' }]}>{trips.filter(t => t.status === 'pending').length}</Text>
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
  location: { color: '#333', fontSize: 15, flex: 1, fontWeight: '500', lineHeight: 20 },
  locationsColumn: {
    flexDirection: 'column',
    marginVertical: 8,
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
    gap: 10,
  },
  locationContent: {
    flex: 1,
    minWidth: 0,
  },
  locationLabel: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
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
  bookingIdBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#2196f3',
    marginHorizontal: 8,
  },
  bookingIdLabel: {
    color: '#2196f3',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bookingIdValue: {
    color: '#2196f3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  viewOdometerButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewOdometerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  odometerSection: {
    marginVertical: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  odometerImagesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  odometerImageWrapper: {
    alignItems: 'center',
    width: 100,
  },
  odometerImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 6,
  },
  odometerLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetailsBtn: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  viewDetailsBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: '90%',
    height: '90%',
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
});
