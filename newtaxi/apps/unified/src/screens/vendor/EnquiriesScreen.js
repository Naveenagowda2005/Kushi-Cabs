import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, TouchableOpacity, Dimensions, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { useAvailableEnquiries, useVendorTrips } from '../../hooks/useEnquiries';
import { useVendorProfile } from '../../hooks/useVendorProfile';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useRealtimeEnquiries, useRealtimeWallet } from '../../hooks/useRealtimeEnquiries';
import { supabase } from '../../lib/supabase';
import { TRIP_STATUS } from '../../constants';
import {
  registerForPushNotifications,
  notifyNewEnquiry,
  notifyCommissionEarned,
} from '../../services/notificationService';
import { initializeAudio, cleanup } from '../../services/soundService';
import EnquiryCard from '../../components/EnquiryCard';
import TripStatusBadge from '../../components/TripStatusBadge';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const TABS = ['Available', 'My Trips'];

// Separate component for My Trip Card
function MyTripCard({ item, navigation, onCancel, onDelete, onPublish }) {
  const { user } = useAuth();
  const [carTypeName, setCarTypeName] = useState(null);
  const [seaterTypeName, setSeaterTypeName] = useState(null);
  const [fuelTypeName, setFuelTypeName] = useState(null);
  const [creatorName, setCreatorName] = useState(null);
  const [creatorPhone, setCreatorPhone] = useState(null);

  // Get segment name directly from enriched data
  const segmentName = item.segment_name || 'ONE WAY';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch car details
        if (item.car_type) {
          const { data: carTypeData } = await supabase
            .from('car_types')
            .select('name')
            .eq('id', item.car_type)
            .maybeSingle();
          if (carTypeData) setCarTypeName(carTypeData.name);
        }

        if (item.seater_type) {
          const { data: seaterData } = await supabase
            .from('seater_types')
            .select('name')
            .eq('id', item.seater_type)
            .maybeSingle();
          if (seaterData) setSeaterTypeName(seaterData.name);
        }

        if (item.fuel_type) {
          const { data: fuelData } = await supabase
            .from('fuel_types')
            .select('name')
            .eq('id', item.fuel_type)
            .maybeSingle();
          if (fuelData) setFuelTypeName(fuelData.name);
        }

        // Fetch creator details
        if (item.created_by) {
          const { data: creator } = await supabase
            .from('users')
            .select('full_name, phone')
            .eq('id', item.created_by)
            .maybeSingle();
          if (creator) {
            setCreatorName(creator.full_name);
            setCreatorPhone(creator.phone);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [item.car_type, item.seater_type, item.fuel_type, item.created_by, item.segment_id]);

  const canCancel = item.status === TRIP_STATUS.ACCEPTED || item.status === TRIP_STATUS.IN_PROGRESS;
  const canDelete = item.status === TRIP_STATUS.PENDING;

  const commissionAmount = item.commission_amount || 0;
  const customerPreAdvance = item.customer_pre_advance || 0;
  
  // Commission to pay by driver = Commission - Customer Pre-Advance (minimum 0)
  const commissionToPay = Math.max(0, commissionAmount - customerPreAdvance);

  return (
    <TouchableOpacity
      style={styles.myTripCard}
      onPress={() => navigation.navigate('EnquiryDetail', { trip: item, readOnly: true })}
      activeOpacity={0.8}
    >
      {/* Trip Type Badge */}
      <View style={styles.tripTypeBadgeRow}>
        <View style={styles.tripTypeBadge}>
          <Ionicons name="car-outline" size={14} color="#ff9800" />
          <Text style={styles.tripTypeBadgeText}>{segmentName ? segmentName.toUpperCase() : 'TRIP'}</Text>
        </View>
      </View>

      <View style={styles.myTripHeader}>
        <TripStatusBadge status={item.status} />
        <Text style={styles.myTripFare}>₹{item.fare_amount}</Text>
      </View>

      {/* Locations in one row */}
      <View style={styles.locationsRow}>
        <View style={styles.locationItem}>
          <Ionicons name="location" size={12} color="#4caf50" />
          <Text style={styles.locationItemLabel}>Pickup</Text>
          <Text style={styles.locationItemText} numberOfLines={1}>{item.pickup_location}</Text>
        </View>
        <Text style={styles.locationDivider}>→</Text>
        <View style={styles.locationItem}>
          <Ionicons name="flag" size={12} color="#e94560" />
          <Text style={styles.locationItemLabel}>Drop</Text>
          <Text style={styles.locationItemText} numberOfLines={1}>{item.dropoff_location}</Text>
        </View>
        {item.return_location && (
          <>
            <Text style={styles.locationDivider}>→</Text>
            <View style={styles.locationItem}>
              <Ionicons name="location-outline" size={12} color="#2196f3" />
              <Text style={styles.locationItemLabel}>Return</Text>
              <Text style={[styles.locationItemText, { color: '#2196f3' }]} numberOfLines={1}>{item.return_location}</Text>
            </View>
          </>
        )}
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={14} color="#ff9800" />
        <Text style={[styles.myTripDate, { flexDirection: 'row', flexWrap: 'nowrap' }]} numberOfLines={1}>
          Departure: {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }) : 'ASAP'}
        </Text>
      </View>
      {item.return_date && (
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={14} color="#ff9800" />
          <Text style={[styles.myTripReturnDate, { flexDirection: 'row', flexWrap: 'nowrap' }]} numberOfLines={1}>
            Return: {new Date(item.return_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
          </Text>
        </View>
      )}

      {/* Fare Breakdown */}
      {(commissionAmount > 0 || customerPreAdvance > 0) && (
        <View style={styles.breakdownBox}>
          <Text style={styles.breakdownTitle}>Fare Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Total Fare</Text>
            <Text style={styles.breakdownValue}>₹{item.fare_amount.toFixed(2)}</Text>
          </View>
          {commissionAmount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Commission Charged</Text>
              <Text style={[styles.breakdownValue, { color: '#ff6b6b' }]}>-₹{Math.abs(commissionAmount).toFixed(2)}</Text>
            </View>
          )}
          {customerPreAdvance > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Customer Pre-Advance</Text>
              <Text style={[styles.breakdownValue, { color: '#2196f3' }]}>₹{Math.abs(customerPreAdvance).toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.breakdownTotalLabel}>Driver Earning</Text>
            <Text style={styles.breakdownTotalValue}>₹{(item.fare_amount - Math.abs(commissionAmount)).toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Car Details Row */}
      {(carTypeName || seaterTypeName || fuelTypeName) && (
        <>
          <View style={styles.carDetailsRow}>
            {carTypeName && (
              <View style={styles.carDetail}>
                <Ionicons name="car-outline" size={12} color="#2196f3" />
                <Text style={styles.carDetailText}>{carTypeName}</Text>
              </View>
            )}
            {seaterTypeName && (
              <View style={styles.carDetail}>
                <Ionicons name="people-outline" size={12} color="#2196f3" />
                <Text style={styles.carDetailText}>{seaterTypeName}</Text>
              </View>
            )}
            {fuelTypeName && (
              <View style={styles.carDetail}>
                <Ionicons name="flame-outline" size={12} color="#2196f3" />
                <Text style={styles.carDetailText}>{fuelTypeName}</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Extra Charges Display - Both in one row */}
      <View style={[styles.extraChargesContainer, { flexDirection: 'row', gap: 8 }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.chargeBadge}>
            <Text style={styles.chargeBadgeText}>
              Toll - Tax - Hills: {item.toll_included ? '✓ Included' : '✗ Excluded'}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.chargeBadge}>
            <Ionicons name="paw-outline" size={12} color="#fff" />
            <Text style={styles.chargeBadgeText}>
              Pet: {item.pet_travelling ? '✓ Allowed' : '✗ Not Allowed'}
            </Text>
          </View>
        </View>
      </View>

      {/* Edit button — for trip creator and super admin */}
      {(item.created_by === user?.id || user?.role === 'super_admin') && item.status !== 'completed' && (
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('CreateTrip', { trip: item, editMode: true })}
        >
          <Ionicons name="pencil-outline" size={16} color="#2196f3" />
          <Text style={styles.editBtnText}>Edit Trip</Text>
        </TouchableOpacity>
      )}

      {/* Publish/Unpublish button — only for pending trips */}
      {canDelete && (
        <TouchableOpacity
          style={[
            styles.publishBtn,
            item.is_published && styles.publishBtnActive
          ]}
          onPress={() => {
            Alert.alert(
              item.is_published ? 'Unpublish Trip' : 'Publish Trip',
              item.is_published 
                ? 'This trip will no longer be visible to drivers. You can republish it later.'
                : 'Make this trip visible to all drivers so they can accept it.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: item.is_published ? 'Unpublish' : 'Publish',
                  onPress: async () => {
                    try {
                      const { error } = await supabase
                        .from('trips')
                        .update({ is_published: !item.is_published })
                        .eq('id', item.id);

                      if (error) throw error;
                      
                      // Show different message based on current published state
                      const successMsg = item.is_published 
                        ? 'Trip unpublished successfully' 
                        : 'Trip published to drivers';
                      Alert.alert('Success', successMsg);
                      // Refresh the list after publish/unpublish
                      onPublish?.();
                    } catch (err) {
                      Alert.alert('Error', err.message);
                    }
                  }
                }
              ]
            );
          }}
        >
          <Ionicons 
            name={item.is_published ? 'eye-outline' : 'eye-off-outline'} 
            size={16} 
            color={item.is_published ? '#4caf50' : '#ff9800'} 
          />
          <Text style={[
            styles.publishBtnText,
            item.is_published && styles.publishBtnTextActive
          ]}>
            {item.is_published ? 'Published' : 'Publish to Drivers'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Delete button — only for pending trips */}
      {canDelete && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete?.(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#f44336" />
          <Text style={styles.deleteBtnText}>Delete Trip</Text>
        </TouchableOpacity>
      )}

      {/* Cancel/Release button — only for accepted/in_progress trips */}
      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, item.driver_id && styles.releaseBtnDisabled]}
          onPress={() => !item.driver_id && onCancel?.(item.id)}
          disabled={!!item.driver_id}
        >
          <Ionicons name="close-circle-outline" size={16} color={item.driver_id ? "#ccc" : "#ff9800"} />
          <Text style={[styles.cancelBtnText, item.driver_id && styles.releaseBtnDisabledText]}>
            {item.driver_id ? 'Driver Assigned' : 'Release Trip'}
          </Text>
        </TouchableOpacity>
      )}

      {/* View Details button — for accepted/in_progress trips */}
      {(item.status === 'accepted' || item.status === 'in_progress') && (
        <>
          <TouchableOpacity
            style={styles.viewDetailsArrowBtn}
            onPress={() => navigation.navigate('EnquiryDetail', { trip: item, readOnly: true })}
          >
            <Text style={styles.viewDetailsArrowBtnText}>View Details</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          
          {/* Assign Trip button - show "Assigned" if driver already assigned */}
          {item.driver_id ? (
            <TouchableOpacity
              style={[styles.assignTripBtn, styles.assignedBtn]}
              onPress={async () => {
                // Fetch assigned driver details
                try {
                  const { data: driver } = await supabase
                    .from('drivers')
                    .select('*, users(id, full_name, phone, email)')
                    .eq('id', item.driver_id)
                    .maybeSingle();

                  if (driver) {
                    const statusText = item.status === 'accepted' ? 'Accepted' : item.status === 'in_progress' ? 'In Progress' : item.status?.charAt(0).toUpperCase() + item.status?.slice(1);
                    Alert.alert(
                      'Assigned Driver',
                      `Name: ${driver.users?.full_name || 'Unknown'}\nPhone: ${driver.users?.phone || 'N/A'}\nVehicle: ${driver.vehicle_number || 'N/A'}\nStatus: ${statusText}\n\nDriver assigned to this trip.`,
                      [{ text: 'OK' }]
                    );
                  }
                } catch (err) {
                  console.error('Error fetching driver:', err);
                  Alert.alert('Error', 'Could not fetch driver details');
                }
              }}
            >
              <Ionicons name="checkmark-done" size={16} color="#fff" />
              <Text style={styles.assignTripBtnText}>Assigned</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.assignTripBtn}
              onPress={() => navigation.navigate('AssignDriver', { trip: item })}
            >
              <Ionicons name="person-add-outline" size={16} color="#fff" />
              <Text style={styles.assignTripBtnText}>Assign Trip to Driver</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* View Details button — only for completed trips */}
      {item.status === 'completed' && (
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={() => navigation.navigate('CompletedTripDetail', { trip: item })}
        >
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text style={styles.viewDetailsBtnText}>View Details</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function VendorEnquiriesScreen({ navigation }) {
  const { user } = useAuth();
  const { isMuted, setIsMuted, updateAlertData } = useAlert();
  const { vendor } = useVendorProfile(user?.id);
  const { settings } = useAppSettings();
  const { enquiries, loading: loadingEnq, error, refetch: refetchEnq } = useAvailableEnquiries();
  const { trips, loading: loadingTrips, refetch: refetchTrips } = useVendorTrips(user?.id);
  const [activeTab, setActiveTab] = useState(0);

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
    return () => {
      cleanup();
    };
  }, []);

  // Log settings when they change
  useEffect(() => {
    console.log('VendorEnquiriesScreen - Settings updated:', settings);
  }, [settings]);

  // Live-patched enquiry list
  const [liveEnquiries, setLiveEnquiries] = useState([]);
  useEffect(() => { setLiveEnquiries(enquiries); }, [enquiries]);

  // Sync enquiries AND vendor trips to AlertContext
  useEffect(() => {
    updateAlertData({
      enquiries: liveEnquiries.length,
      vendorTrips: trips.length,
    });
  }, [liveEnquiries.length, trips.length, updateAlertData]);

  // Register push on mount
  useEffect(() => {
    if (user?.id) registerForPushNotifications(user.id);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      refetchEnq();
      refetchTrips();
    }, [refetchEnq, refetchTrips])
  );

  // Realtime: enquiries with sound alert
  useRealtimeEnquiries({
    userId: user?.id,
    onNewEnquiry: (trip) => {
      setLiveEnquiries((prev) => {
        if (prev.find((t) => t.id === trip.id)) return prev;
        // Continuous alert will handle sound playing
        console.log('🔔 New enquiry received');
        notifyNewEnquiry(trip);
        return [trip, ...prev];
      });
    },
    onEnquiryTaken: (tripId) => {
      setLiveEnquiries((prev) => prev.filter((t) => t.id !== tripId));
    },
    onTripUpdated: () => { refetchTrips(); },
  });

  // Realtime: wallet (commission alerts)
  useRealtimeWallet({
    userId: user?.id,
    onBalanceChange: (balance) => { notifyCommissionEarned(balance); },
  });

  // Refetch enquiries when switching to Available tab
  useEffect(() => {
    if (activeTab === 0) {
      // Immediately refetch fresh data
      refetchEnq();
      // Also refetch after a short delay to ensure we get the latest
      const timer = setTimeout(() => {
        refetchEnq();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, refetchEnq]);

  const isLoading = activeTab === 0 ? loadingEnq : loadingTrips;

  async function handleAcceptTrip(trip) {
    if (!vendor?.id) {
      Alert.alert('Error', 'Vendor profile not found. Please contact support.');
      return;
    }
    Alert.alert(
      'Accept Trip',
      `Accept this trip from ${trip.pickup_location} to ${trip.dropoff_location}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Accept',
          style: 'default',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('trips')
                .update({
                  status: TRIP_STATUS.ACCEPTED,
                  accepted_by: user.id,
                  vendor_id: vendor.id,
                  accepted_at: new Date().toISOString(),
                })
                .eq('id', trip.id);

              if (error) throw error;

              Alert.alert('✅ Trip Accepted', 'You have successfully accepted this trip!');
              refetchEnq();
              refetchTrips();
            } catch (err) {
              console.error('Accept trip error:', err);
              Alert.alert('Error', err.message || 'Failed to accept trip');
            }
          },
        },
      ]
    );
  }

  async function handleCancelTrip(tripId) {
    Alert.alert(
      'Cancel Trip',
      'Release this trip back to the pool so others can accept it?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Release', style: 'destructive',
          onPress: async () => {
            try {
              const updateData = {
                status: TRIP_STATUS.PENDING,
                accepted_by: null,
                vendor_id: null,
                driver_id: null,
                accepted_at: null,
                is_published: false,
              };
              
              const { error } = await supabase
                .from('trips')
                .update(updateData)
                .eq('id', tripId);
              
              if (error) throw error;
              
              refetchTrips();
              refetchEnq();
            } catch (err) {
              console.error('Cancel trip error:', err);
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  }

  async function handleDeleteTrip(tripId) {
    Alert.alert(
      'Delete Trip',
      'Permanently delete this pending trip? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              // Clear related transactions first (FK constraint)
              await supabase.from('transactions').delete().eq('trip_id', tripId);
              // Now delete the trip
              const { error } = await supabase
                .from('trips')
                .delete()
                .eq('id', tripId)
                .eq('status', TRIP_STATUS.PENDING);
              if (error) throw error;
              refetchTrips();
              refetchEnq();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  }

  function renderEnquiry({ item }) {
    return (
      <EnquiryCard
        trip={item}
        onPress={() => navigation.navigate('EnquiryDetail', { trip: item })}
        onAccept={(trip) => handleAcceptTrip(trip)}
        onCancel={() => {}}
      />
    );
  }

  function renderMyTrip({ item }) {
    return (
      <MyTripCard
        item={item}
        navigation={navigation}
        onCancel={() => {
          handleCancelTrip(item.id);
          refetchTrips();
        }}
        onDelete={() => {
          handleDeleteTrip(item.id);
          refetchTrips();
        }}
        onPublish={() => {
          refetchTrips();
        }}
      />
    );
  }

  const data = activeTab === 0 ? liveEnquiries : trips;

  return (
    <View style={styles.container}>
      {/* Tabs with Mute Control */}
      <View style={styles.tabsHeader}>
        <View style={styles.tabs}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab}
              {i === 0 && liveEnquiries.length > 0 && (
                <Text style={styles.badge}> {liveEnquiries.length}</Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
        </View>
        <TouchableOpacity 
          style={styles.muteButton}
          onPress={() => {
            console.log(`🔊 Sound alerts ${isMuted ? 'unmuted' : 'muted'}`);
            setIsMuted(!isMuted);
          }}
        >
          <Ionicons 
            name={isMuted ? "volume-mute" : "volume-high-outline"} 
            size={24} 
            color={isMuted ? '#ff6b6b' : '#e94560'}
          />
        </TouchableOpacity>
      </View>

      {error && activeTab === 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
          <TouchableOpacity onPress={refetchEnq}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 0 ? renderEnquiry : renderMyTrip}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={56} color="#333" />
              <Text style={styles.emptyText}>
                {activeTab === 0 ? 'No enquiries right now' : 'No trips yet'}
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={activeTab === 0 ? refetchEnq : refetchTrips}
            tintColor="#e94560"
            colors={['#e94560']}
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTrip')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: screenWidth * 0.02,
    paddingVertical: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabs: {
    flexDirection: 'row',
    flex: 1,
  },
  muteButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#e94560' },
  tabText: {
    color: '#000',
    fontSize: Math.max(13, screenWidth * 0.035),
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: { color: '#e94560' },
  badge: { color: '#e94560' },
  list: {
    padding: screenWidth * 0.04,
    flexGrow: 1,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: screenHeight * 0.15,
    paddingHorizontal: screenWidth * 0.1,
  },
  emptyText: {
    color: '#aaa',
    fontSize: Math.max(15, screenWidth * 0.04),
    marginTop: 12,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a0a0a',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: 10,
  },
  errorText: { color: '#ff9800', fontSize: Math.max(12, screenWidth * 0.032), flex: 1, marginRight: 8 },
  retryText: { color: '#fff', fontSize: Math.max(12, screenWidth * 0.032), fontWeight: '600' },
  myTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: screenWidth * 0.02,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  tripTypeBadgeRow: {
    marginBottom: 6,
  },
  tripTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2196f333',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  tripTypeBadgeText: {
    color: '#ff9800',
    fontSize: Math.max(14, screenWidth * 0.038),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  myTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  myTripFare: { color: '#4caf50', fontWeight: 'bold', fontSize: Math.max(18, screenWidth * 0.048) },
  locationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#0f1c2e',
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  locationItem: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    gap: 2,
  },
  locationItemLabel: {
    color: '#888',
    fontSize: Math.max(8, screenWidth * 0.02),
    fontWeight: '600',
  },
  locationItemText: {
    color: '#fff',
    fontSize: Math.max(9, screenWidth * 0.024),
    fontWeight: '600',
    textAlign: 'center',
  },
  locationDivider: {
    color: '#555',
    fontSize: Math.max(12, screenWidth * 0.03),
    marginHorizontal: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flex: 1 },
  myTripLocation: { color: '#ccc', fontSize: Math.max(14, screenWidth * 0.038), flex: 1 },
  myTripDate: { color: '#ff9800', fontSize: Math.max(12, screenWidth * 0.032), marginTop: 3, fontWeight: '700' },
  myTripReturnDate: { color: '#ff9800', fontSize: Math.max(12, screenWidth * 0.032), marginTop: 2, fontWeight: '700' },
  carDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#4caf50',
    borderBottomWidth: 1,
    borderBottomColor: '#4caf50',
  },
  carDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#1a2744',
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: '#2196f3',
  },
  carDetailText: {
    color: '#2196f3',
    fontSize: Math.max(10, screenWidth * 0.027),
    fontWeight: '600',
    textAlign: 'center',
  },
  extraChargesContainer: {
    gap: 6,
    marginVertical: 6,
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chargeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  carrierNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2a1a00',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginVertical: 4,
  },
  carrierNoteText: {
    color: '#ff9800',
    fontSize: Math.max(9, screenWidth * 0.026),
    fontWeight: '500',
    flex: 1,
  },
  taxNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
  },
  taxNoteText: {
    color: '#888',
    fontSize: Math.max(9, screenWidth * 0.026),
    fontWeight: '400',
    flex: 1,
  },
  petsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  petsNoteText: {
    color: '#888',
    fontSize: Math.max(9, screenWidth * 0.026),
    fontWeight: '400',
    flex: 1,
  },
  notesHeader: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
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
    fontSize: Math.max(10, screenWidth * 0.028),
    fontWeight: '500',
    flex: 1,
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
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
    gap: 6,
    backgroundColor: '#ff980011',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
    gap: 6,
    backgroundColor: '#2196f311',
  },
  editBtnText: {
    color: '#2196f3',
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '600',
  },
  publishBtnActive: {
    backgroundColor: '#4caf5011',
    borderColor: '#4caf50',
  },
  publishBtnText: { 
    color: '#ff9800', 
    fontSize: Math.max(12, screenWidth * 0.032), 
    fontWeight: '600' 
  },
  publishBtnTextActive: {
    color: '#4caf50',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
    gap: 6,
    backgroundColor: '#f4433610',
  },
  deleteBtnText: { color: '#f44336', fontSize: Math.max(12, screenWidth * 0.032), fontWeight: '600' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
    gap: 6,
  },
  cancelBtnText: { color: '#ff9800', fontSize: Math.max(12, screenWidth * 0.032), fontWeight: '600' },
  releaseBtnDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  releaseBtnDisabledText: {
    color: '#ccc',
  },
  viewDetailsArrowBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  viewDetailsArrowBtnText: {
    color: '#fff',
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '600',
  },
  assignTripBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  assignedBtn: {
    backgroundColor: '#2196f3',
    opacity: 0.7,
  },
  assignTripBtnText: {
    color: '#fff',
    fontSize: Math.max(12, screenWidth * 0.032),
    fontWeight: '600',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2196f3',
    gap: 6,
  },
  viewDetailsBtnText: { color: '#fff', fontSize: Math.max(12, screenWidth * 0.032), fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: Math.max(24, screenHeight * 0.03),
    right: Math.max(24, screenWidth * 0.06),
    backgroundColor: '#1a1a2e',
    width: Math.max(52, screenWidth * 0.14),
    height: Math.max(52, screenWidth * 0.14),
    borderRadius: Math.max(26, screenWidth * 0.07),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  breakdownBox: {
    backgroundColor: '#0a1929',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#1a1a2e',
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
    borderTopColor: '#1a1a2e',
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
});
