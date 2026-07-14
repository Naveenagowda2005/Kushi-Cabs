import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, FlatList, Dimensions, TextInput, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { TRIP_STATUS } from '../../constants';

const { width: screenWidth } = Dimensions.get('window');

export default function AssignDriverScreen({ route, navigation }) {
  const { trip } = route.params;
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [filterTab, setFilterTab] = useState('approved'); // 'approved' or 'dummy'

  useEffect(() => {
    fetchAvailableDrivers();
  }, []);

  // Filter drivers based on search query and filter tab
  useEffect(() => {
    let filtered = drivers;

    // Apply filter tab
    if (filterTab === 'approved') {
      filtered = filtered.filter(d => !d.users?.full_name?.toLowerCase().includes('dummy'));
    } else if (filterTab === 'dummy') {
      filtered = filtered.filter(d => d.users?.full_name?.toLowerCase().includes('dummy'));
    }

    // Apply search query
    if (searchQuery.trim() === '') {
      setFilteredDrivers(filtered);
    } else {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(driver =>
        (driver.users?.full_name || '').toLowerCase().includes(query) ||
        (driver.users?.phone || '').includes(query) ||
        (driver.vehicle_number || '').toLowerCase().includes(query)
      );
      setFilteredDrivers(filtered);
    }
  }, [searchQuery, drivers, filterTab]);

  async function fetchAvailableDrivers() {
    try {
      setLoading(true);
      // Fetch all drivers including dummy drivers
      const { data: usersData, error: usersError } = await supabase
        .from('drivers')
        .select('id, user_id, vehicle_number, is_online, license_number, users!inner(id, full_name, phone, verification_status)')
        .eq('users.verification_status', 'approved')
        .eq('users.is_active', true);
        // Removed: filter to exclude dummy drivers - now allowing them

      if (usersError) throw usersError;
      
      // Transform the data to match expected format
      const transformedUsers = (usersData || []).map(driver => ({
        id: driver.id, // Now driver.id is the actual driver ID from drivers table
        ...driver,
        user: driver.users
      }));

      // For each driver, fetch their driver profile and photo
      const driversWithDetails = await Promise.all(
        transformedUsers.map(async (driverRecord) => {
          const user = driverRecord.user;
          const driverProfile = driverRecord;

          // Skip if no driver profile
          if (driverProfile) {
            // Fetch driver SELFIE photo from driver_documents
            let photoUrl = null;
            try {
              // Query driver documents using user.id (driver_id in driver_documents)
              const { data: driverDocs, error: docsError } = await supabase
                .from('driver_documents')
                .select('document_data, document_mime_type, document_type')
                .eq('driver_id', user.id)
                .eq('document_type', 'DRIVER_SELFIE')
                .maybeSingle();

              if (docsError) {
                console.warn('❌ Error fetching docs for', user.full_name, ':', docsError.message);
              }

              if (driverDocs?.document_data) {
                // Convert base64 or data URL to proper format
                if (driverDocs.document_data.startsWith('data:')) {
                  photoUrl = driverDocs.document_data;
                  console.log('✅ Found data URL photo for:', user.full_name);
                } else {
                  // Convert base64 to data URL
                  const mimeType = driverDocs.document_mime_type || 'image/jpeg';
                  photoUrl = `data:${mimeType};base64,${driverDocs.document_data}`;
                  console.log('✅ Found base64 photo for:', user.full_name, 'converted to data URL');
                }
              } else {
                console.log('⚠️ No DRIVER_SELFIE document found for', user.full_name);
              }
            } catch (err) {
              console.warn('❌ Exception fetching driver photo for', user.full_name, ':', err.message);
            }

            return {
              id: driverProfile.id, // Ensure id is at top level
              ...driverProfile,
              photo_url: photoUrl,
              user_id: user.id,
              users: {
                id: user.id,
                full_name: user.full_name,
                phone: user.phone,
                verification_status: user.verification_status
              }
            };
          }
          return null;
        })
      );

      // Filter out null values and sort by name (now includes dummy drivers)
      const validDrivers = driversWithDetails
        .filter(d => d !== null)
        .sort((a, b) => (a.users?.full_name || '').localeCompare(b.users?.full_name || ''));

      console.log(`✅ Loaded ${validDrivers.length} drivers (including dummy drivers)`);
      setDrivers(validDrivers);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignDriver() {
    if (!selectedDriver) {
      Alert.alert('Error', 'Please select a driver');
      return;
    }

    const actionText = trip.driver_id ? 'Reassign' : 'Assign';
    const driverName = selectedDriver.users?.full_name || 'Unknown';
    const previousDriver = trip.driver_id ? 'current driver' : '';

    Alert.alert(
      `${actionText} Trip`,
      trip.driver_id 
        ? `Reassign this trip from the ${previousDriver} to ${driverName}?`
        : `Assign this trip to ${driverName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          style: 'default',
          onPress: async () => {
            setAssigning(true);
            try {
              console.log(`📤 ${actionText.toUpperCase()} TRIP:`);
              console.log('  Trip ID:', trip.id);
              console.log('  Driver ID (from drivers table):', selectedDriver.id);
              console.log('  Driver User ID (auth.uid):', selectedDriver.user_id);
              console.log('  Previous Driver ID:', trip.driver_id || 'None');
              console.log('  Status before:', trip.status);
              console.log('  Status after:', TRIP_STATUS.PENDING);

              const { data, error } = await supabase
                .from('trips')
                .update({
                  driver_id: selectedDriver.id, // Assign to this driver
                  status: TRIP_STATUS.PENDING, // Keep as PENDING until driver accepts
                })
                .eq('id', trip.id)
                .select();

              if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
              }

              console.log('✅ Trip updated in database:', data);

              Alert.alert('Success', `Trip ${actionText.toLowerCase()}ed to driver successfully!`, [
                { 
                  text: 'OK', 
                  onPress: () => {
                    // Force refresh by navigating back and letting parent refresh
                    navigation.goBack();
                  }
                },
              ]);
            } catch (err) {
              console.error(`❌ Error ${actionText.toLowerCase()}ing trip:`, err);
              Alert.alert('Error', err.message || `Failed to ${actionText.toLowerCase()} trip`);
            } finally {
              setAssigning(false);
            }
          },
        },
      ]
    );
  }

  function renderDriverItem({ item }) {
    // Compare by driver ID (item.id should be the driver's UUID)
    const isSelected = selectedDriver && selectedDriver.id === item.id;
    const isApproved = item.users?.verification_status === 'approved';
    const hasImageError = imageErrors[item.id];
    
    return (
      <TouchableOpacity
        style={[styles.driverCard, isSelected && styles.driverCardSelected]}
        onPress={() => setSelectedDriver(item)}
        activeOpacity={0.7}
      >
        <View style={styles.driverCardContent}>
          {/* Driver Photo */}
          {item.photo_url && !hasImageError ? (
            <Image
              source={{ uri: item.photo_url }}
              style={styles.driverPhoto}
              onError={(error) => {
                console.warn('❌ Failed to load photo for:', item.users?.full_name);
                console.warn('Photo URL:', item.photo_url);
                console.warn('Error:', error.nativeEvent?.error);
                setImageErrors(prev => ({ ...prev, [item.id]: true }));
              }}
              onLoad={() => {
                console.log('✅ Photo loaded successfully for:', item.users?.full_name);
              }}
            />
          ) : (
            <View style={styles.driverPhotoPlaceholder}>
              <Ionicons name="person" size={32} color="#fff" />
              {hasImageError && (
                <Text style={{ fontSize: 10, color: '#fff', marginTop: 4 }}>No photo</Text>
              )}
            </View>
          )}

          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{item.users?.full_name || 'Unknown'}</Text>
            <Text style={styles.driverPhone}>{item.users?.phone || 'N/A'}</Text>
            <View style={styles.vehicleInfo}>
              <Ionicons name="car-outline" size={14} color="#888" />
              <Text style={styles.vehicleText}>{item.vehicle_number || 'No vehicle'}</Text>
            </View>
          </View>
          
          {/* Status Badges */}
          <View style={styles.statusColumn}>
            {/* Online Status */}
            <View style={[styles.statusBadge, item.is_online ? styles.onlineBadge : styles.offlineBadge]}>
              <Text style={styles.statusText}>
                {item.is_online ? 'Online' : 'Offline'}
              </Text>
            </View>
            
            {/* Approval Status */}
            <View style={[styles.statusBadge, isApproved ? styles.approvedBadge : styles.pendingBadge]}>
              <Text style={styles.statusText}>
                {isApproved ? 'Approved' : 'Pending'}
              </Text>
            </View>
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color="#e94560" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Loading drivers...</Text>
        </View>
      </View>
    );
  }

  if (drivers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={56} color="#ccc" />
          <Text style={styles.emptyText}>No drivers available</Text>
          <Text style={styles.emptySubtext}>Add drivers to your fleet first</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Trip Details Header */}
      <View style={styles.tripHeader}>
        <View>
          <Text style={styles.tripRoute}>
            {trip.pickup_location} → {trip.dropoff_location}
          </Text>
          <Text style={styles.tripFare}>₹{trip.fare_amount}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{trip.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filterTab === 'approved' && styles.filterTabActive]}
          onPress={() => setFilterTab('approved')}
        >
          <Text style={[styles.filterTabText, filterTab === 'approved' && styles.filterTabTextActive]}>
            Approved Drivers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterTab === 'dummy' && styles.filterTabActive]}
          onPress={() => setFilterTab('dummy')}
        >
          <Text style={[styles.filterTabText, filterTab === 'dummy' && styles.filterTabTextActive]}>
            Dummy Drivers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone, or vehicle..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Drivers List */}
      <FlatList
        data={filteredDrivers}
        keyExtractor={(item) => item.id}
        renderItem={renderDriverItem}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={56} color="#ccc" />
              <Text style={styles.emptyText}>
                {drivers.length === 0 ? 'No drivers available' : 'No drivers match your search'}
              </Text>
            </View>
          )
        }
      />

      {/* Assign/Reassign Button */}
      {selectedDriver && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.assignBtn, assigning && styles.btnDisabled]}
            onPress={handleAssignDriver}
            disabled={assigning}
          >
            {assigning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={trip.driver_id ? "swap-horizontal-outline" : "checkmark-circle-outline"} size={20} color="#fff" />
                <Text style={styles.assignBtnText}>
                  {trip.driver_id ? 'Reassign to' : 'Assign to'} {selectedDriver.users?.full_name}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  tripHeader: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#e94560',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  filterTabTextActive: {
    color: '#e94560',
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tripFare: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4caf50',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  listContent: {
    padding: 12,
    paddingBottom: 300,
  },
  driverCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  driverCardSelected: {
    borderColor: '#e94560',
    backgroundColor: '#fff5f7',
  },
  driverCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: '#e0e0e0',
  },
  driverPhotoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  driverPhone: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  vehicleText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  statusColumn: {
    flexDirection: 'column',
    gap: 6,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  onlineBadge: {
    backgroundColor: '#4caf5020',
  },
  offlineBadge: {
    backgroundColor: '#f4433620',
  },
  approvedBadge: {
    backgroundColor: '#4caf5020',
  },
  pendingBadge: {
    backgroundColor: '#ff980020',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  assignBtn: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  assignBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
