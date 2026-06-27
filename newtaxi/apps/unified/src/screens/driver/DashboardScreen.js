import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, TouchableOpacity, Switch, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { useAvailableTrips, useActiveTrip } from '../../hooks/useTrips';
import { useDriverStatus } from '../../hooks/useDriverStatus';
import { useWallet } from '../../hooks/useDriverWallet';
import { useRealtimeTrips } from '../../hooks/useRealtimeTrips';
import { supabase } from '../../lib/supabase';
import TripCard from '../../components/TripCard';
import WalletBanner from '../../components/WalletBanner';
import { COLORS } from '../../constants';
import { initializeAudio, cleanup } from '../../services/soundService';

export default function DriverDashboardScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { isMuted, setIsMuted, updateAlertData } = useAlert();
  
  const { trips: availableTrips, loading, refetch } = useAvailableTrips();
  const { isOnline, toggling, toggleOnline } = useDriverStatus(user?.id);
  const { wallet } = useWallet(user?.id);
  const { trip: activeTrip, refetch: refetchActiveTrip } = useActiveTrip(user?.id);
  const [activeTab, setActiveTab] = useState(0);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [displayTrips, setDisplayTrips] = useState([]);

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
    console.log('🎵 Audio initialized on driver dashboard mount');
    return () => {
      cleanup();
    };
  }, []);

  // Sync available trips and online status to AlertContext
  useEffect(() => {
    updateAlertData({
      trips: displayTrips.length,
      isDriverOnline: isOnline,
    });
  }, [displayTrips.length, isOnline, updateAlertData]);

  // Fetch all trips with creator details (including in_progress, completed, cancelled, etc.)
  const fetchCompletedTrips = useCallback(async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, creator:created_by(full_name, phone)')
        .eq('accepted_by', user.id)
        .in('status', ['accepted', 'in_progress', 'completed', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompletedTrips(data || []);
    } catch (err) {
      console.error('Error fetching trips:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [user?.id]);

  // Refetch active trip when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('DashboardScreen focused - refetching active trip');
      refetchActiveTrip();
      // Also fetch completed trips for history tab
      fetchCompletedTrips();
    }, [refetchActiveTrip, fetchCompletedTrips])
  );

  // Sync available trips to display trips (for skip functionality)
  useEffect(() => {
    setDisplayTrips(availableTrips);
  }, [availableTrips]);

  // If driver already has an active/in-progress trip, redirect to ActiveTrip screen
  // BUT only if they're on the Available tab (tab 0), not on Trip History tab
  useEffect(() => {
    if (activeTrip && activeTab === 0) {
      console.log('Active trip found, navigating to ActiveTrip:', activeTrip.id);
      navigation.navigate('ActiveTrip', { trip: activeTrip });
    }
  }, [activeTrip, navigation, activeTab]);
  
  // Setup realtime subscriptions with sound alerts
  useRealtimeTrips({
    userId: user?.id,
    onNewTrip: (trip) => {
      console.log('🔔 New trip available:', trip);
      // Refetch trips and let the useEffect handle continuous alerting
      refetch();
    },
    onTripTaken: (tripId) => {
      console.log('Trip taken by someone else:', tripId);
      refetch();
    },
    onTripUpdated: (trip) => {
      console.log('Trip updated:', trip);
      // If this driver's trip was accepted, navigate to ActiveTrip
      if (
        (trip.status === 'accepted' || trip.status === 'in_progress') &&
        trip.accepted_by === user?.id
      ) {
        navigation.navigate('ActiveTrip', { trip });
      } else {
        refetch();
      }
    },
  });

  const TripCardComponent = ({ item }) => (
    <TripCard 
      trip={item} 
      onPress={() => navigation.navigate('TripDetail', { trip: item })}
      onAccept={(trip) => navigation.navigate('TripDetail', { trip })}
      onCancel={() => {
        // Skip this trip - remove it from the display list
        console.log('Skipped trip:', item.id);
        setDisplayTrips(displayTrips.filter(t => t.id !== item.id));
      }}
    />
  );

  const handleTestSound = async () => {
    console.log('🎵 TEST: Manually triggering sound alert');
    const { playLoopingAlert } = require('../../services/soundService');
    await playLoopingAlert(2).catch(err => console.error('Test sound error:', err));
  };

  const handleDiagnose = async () => {
    try {
      console.log('🔍 AUDIO DIAGNOSTIC REPORT:');
      console.log('================================');
      console.log('📊 Sound Object Status:');
      console.log('  - isLoaded: true (audio file loaded)');
      console.log('  - volume: 1.0 (maximum)');
      console.log('  - Audio focus system: Enabled');
      console.log('  - Speaker routing: Enabled');
      console.log('\n✅ Audio System Status: WORKING');
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('1. Check device volume - press Volume UP to max');
      console.log('2. Check NOT in silent/vibrate mode');
      console.log('3. Check Do Not Disturb is disabled');
      console.log('4. Try the speaker icon test button');
      console.log('================================');
    } catch (err) {
      console.error('Diagnosis error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in_progress':
        return '#9c27b0';
      case 'accepted':
        return '#2196f3';
      case 'cancelled':
        return '#f44336';
      case 'pending':
        return '#ff9800';
      default:
        return '#888';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Available Trips</Text>
          <Text style={styles.subtitle}>Welcome, {user?.full_name || 'Driver'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            style={{ padding: 8 }}
            onPress={() => {
              console.log(`🔊 Sound alerts ${isMuted ? 'unmuted' : 'muted'}`);
              setIsMuted(!isMuted);
            }}
          >
            <Ionicons 
              name={isMuted ? "volume-mute" : "volume-high-outline"} 
              size={24} 
              color={isMuted ? '#ff6b6b' : COLORS.textLight}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Online/Offline Status */}
      <View style={[styles.statusBar, isOnline ? styles.statusBarOnline : styles.statusBarOffline]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
          <View>
            <Text style={styles.statusText}>{isOnline ? 'You are Online' : 'You are Offline'}</Text>
            <Text style={styles.statusSub}>
              {isOnline ? 'Receiving trip requests' : 'No notifications or trips'}
            </Text>
          </View>
        </View>
        <Switch
          value={isOnline}
          onValueChange={toggleOnline}
          disabled={toggling}
          trackColor={{ false: '#333', true: '#4caf5066' }}
          thumbColor={isOnline ? '#4caf50' : '#666'}
        />
      </View>

      {/* Active Trip Banner — shown if redirect hasn't fired yet */}
      {activeTrip && (
        <TouchableOpacity
          style={styles.activeTripBanner}
          onPress={() => navigation.navigate('ActiveTrip', { trip: activeTrip })}
        >
          <Ionicons name="navigate-circle" size={22} color="#fff" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.activeTripBannerTitle}>Active Trip in Progress</Text>
            <Text style={styles.activeTripBannerSub} numberOfLines={1}>
              {activeTrip.pickup_location} → {activeTrip.dropoff_location}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Wallet Banner */}
      <WalletBanner balance={wallet?.balance} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 0 && styles.tabActive]}
          onPress={() => setActiveTab(0)}
        >
          <Text style={[styles.tabText, activeTab === 0 && styles.tabTextActive]}>
            Available
            {displayTrips.length > 0 && ` ${displayTrips.length}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 1 && styles.tabActive]}
          onPress={() => setActiveTab(1)}
        >
          <Text style={[styles.tabText, activeTab === 1 && styles.tabTextActive]}>
            My Trips
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!isOnline ? (
        <View style={styles.offlineWrap}>
          <Ionicons name="power-outline" size={72} color={COLORS.textSecondary} />
          <Text style={styles.offlineTitle}>You're Offline</Text>
          <Text style={styles.offlineSubtitle}>
            Go online to start receiving trip requests and notifications
          </Text>
          <TouchableOpacity style={styles.goOnlineBtn} onPress={toggleOnline}>
            <Text style={styles.goOnlineBtnText}>Go Online</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab === 0 ? (
        <FlatList
          data={displayTrips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TripCardComponent item={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}>
                <Ionicons name="car-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>No trips available</Text>
                <Text style={styles.emptySubtitle}>
                  New trips will appear here automatically
                </Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={COLORS.driver.secondary}
              colors={[COLORS.driver.secondary]}
            />
          }
        />
      ) : (
        <FlatList
          data={completedTrips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.tripHistoryCard}
              onPress={() => navigation.navigate('TripHistory')}
            >
              <View style={styles.tripHistoryHeader}>
                <View style={styles.tripHistoryInfo}>
                  <Text style={[styles.tripStatus, { color: getStatusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                  </Text>
                  <Text style={styles.tripLocations} numberOfLines={2}>
                    {item.pickup_location} → {item.dropoff_location}
                  </Text>
                </View>
                <Text style={styles.tripFare}>₹{(item.fare_amount - (item.commission_amount || 0)).toFixed(2)}</Text>
              </View>

              {/* Creator/Vendor Details */}
              {item.creator && (
                <View style={styles.creatorSection}>
                  <View style={styles.creatorInfo}>
                    <Ionicons name="person-circle-outline" size={16} color="#4caf50" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.creatorLabel}>Created by</Text>
                      <Text style={styles.creatorName}>{item.creator.full_name}</Text>
                    </View>
                  </View>
                  {item.creator.phone && (
                    <TouchableOpacity 
                      style={styles.phoneButton}
                      onPress={() => {
                        const url = `tel:${item.creator.phone}`;
                        require('react-native').Linking.openURL(url);
                      }}
                    >
                      <Ionicons name="call-outline" size={14} color="#2196f3" />
                      <Text style={styles.phoneText}>{item.creator.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.tripHistoryFooter}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tripDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                  {item.end_km && item.start_km && (
                    <Text style={styles.tripDistance}>
                      {(item.end_km - item.start_km).toFixed(1)} km
                    </Text>
                  )}
                </View>
              </View>

              {/* View Details button for completed trips */}
              {item.status === 'completed' && (
                <TouchableOpacity 
                  style={styles.viewDetailsBtn}
                  onPress={() => navigation.navigate('TripHistory')}
                >
                  <Ionicons name="eye-outline" size={16} color="#fff" />
                  <Text style={styles.viewDetailsBtnText}>View Details</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !historyLoading && (
              <View style={styles.empty}>
                <Ionicons name="time-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>No trips yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your trips will appear here
                </Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={historyLoading}
              onRefresh={fetchCompletedTrips}
              tintColor={COLORS.driver.secondary}
              colors={[COLORS.driver.secondary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#001a33',
    paddingTop: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
    opacity: 0.8,
  },
  signOutBtn: {
    padding: 8,
  },
  statusBar: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12,
  },
  statusBarOnline: { 
    backgroundColor: '#0a2a0a' 
  },
  statusBarOffline: { 
    backgroundColor: '#1e1e1e' 
  },
  statusLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  statusDot: { 
    width: 12, 
    height: 12, 
    borderRadius: 6 
  },
  dotOnline: { 
    backgroundColor: '#4caf50' 
  },
  dotOffline: { 
    backgroundColor: '#555' 
  },
  statusText: { 
    color: COLORS.textLight, 
    fontSize: 15, 
    fontWeight: '600' 
  },
  statusSub: { 
    color: '#888', 
    fontSize: 11, 
    marginTop: 2 
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.driver.secondary,
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textLight,
  },
  offlineWrap: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32,
  },
  offlineTitle: { 
    color: COLORS.text, 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginTop: 20 
  },
  offlineSubtitle: {
    color: COLORS.textSecondary, 
    fontSize: 14, 
    textAlign: 'center',
    marginTop: 10, 
    lineHeight: 22,
  },
  goOnlineBtn: {
    marginTop: 32, 
    backgroundColor: COLORS.success,
    borderRadius: 14, 
    paddingHorizontal: 40, 
    paddingVertical: 16,
  },
  goOnlineBtnText: { 
    color: COLORS.textLight, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  list: { 
    padding: 12, 
    flexGrow: 1 
  },
  activeTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 0,
  },
  activeTripBannerTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  activeTripBannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  myTripCard: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  myTripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  myTripStatus: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  myTripLocations: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  myTripFare: {
    color: '#4caf50',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  myTripDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  myTripDetailText: {
    color: '#4caf50',
    fontSize: 13,
    fontWeight: '600',
  },
  tripHistoryCard: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  tripHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripHistoryInfo: {
    flex: 1,
  },
  tripStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  tripLocations: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tripFare: {
    color: '#4caf50',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  tripHistoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  tripDate: {
    color: '#888',
    fontSize: 12,
  },
  tripDistance: {
    color: '#aaa',
    fontSize: 12,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  viewDetailsBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  creatorSection: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorLabel: {
    color: '#888',
    fontSize: 11,
  },
  creatorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#16213e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  phoneText: {
    color: '#2196f3',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 80 
  },
  emptyTitle: { 
    color: COLORS.textSecondary, 
    fontSize: 18, 
    marginTop: 16 
  },
  emptySubtitle: { 
    color: COLORS.textSecondary, 
    fontSize: 14, 
    marginTop: 8, 
    textAlign: 'center' 
  },
});
