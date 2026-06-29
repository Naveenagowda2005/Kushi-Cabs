import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { seedSampleData, checkExistingData } from '../../utils/seedData';
import { COLORS, TRIP_STATUS } from '../../constants';
import { wp, hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

export default function SuperAdminDashboardScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme, forceUpdate } = useTheme();
  const colorAnim = React.useRef(new Animated.Value(0)).current;
  const heartbeat = React.useRef(new Animated.Value(0)).current;
  
  // Force re-render when theme changes
  const [themeRefresh, setThemeRefresh] = useState(0);
  useEffect(() => {
    setThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);
  
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    activeVendors: 0,
    pendingTrips: 0,
    completedTrips: 0,
    totalCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState({
    hasVendors: false,
    hasDrivers: false,
    hasTrips: false,
  });

  // Start animations on mount
  useEffect(() => {
    // Color animation
    Animated.loop(
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

    // Heartbeat animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeat, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(heartbeat, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(heartbeat, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(heartbeat, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#6c5ce7', '#a29bfe', '#74b9ff', '#a29bfe', '#6c5ce7'],
  });

  const shadowOpacity = heartbeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const shadowRadius = heartbeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  useEffect(() => {
    fetchDashboardData();
    checkDataStatus();
  }, []);

  const checkDataStatus = async () => {
    const status = await checkExistingData();
    setDataStatus(status);
  };

  const handleSeedData = async () => {
    Alert.alert(
      'Seed Sample Data',
      'This will create sample vendors, drivers, and trips for testing. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Sample Data',
          onPress: async () => {
            setLoading(true);
            const result = await seedSampleData();
            setLoading(false);
            if (result.success) {
              Alert.alert('Success', result.message);
              fetchDashboardData();
              checkDataStatus();
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [tripsResult, driversResult, vendorsResult] = await Promise.all([
        supabase.from('trips').select('*'),
        supabase.from('users').select('*').eq('role_id', 3).eq('is_active', true),
        supabase.from('users').select('*').eq('role_id', 2).eq('is_active', true),
      ]);

      const trips = tripsResult.data || [];
      const drivers = driversResult.data || [];
      const vendors = vendorsResult.data || [];

      const completedTrips = trips.filter(t => t.status === TRIP_STATUS.COMPLETED);
      const pendingTrips = trips.filter(t => t.status === TRIP_STATUS.PENDING);
      const totalRevenue = completedTrips.reduce((s, t) => s + (t.fare_amount || 0), 0);
      const totalCommission = completedTrips.reduce((s, t) => s + (t.fare_amount * 0.1 || 0), 0);

      setStats({
        totalTrips: trips.length,
        totalRevenue,
        activeDrivers: drivers.length,
        activeVendors: vendors.length,
        pendingTrips: pendingTrips.length,
        completedTrips: completedTrips.length,
        totalCommission,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = COLORS.superAdmin.primary, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardLeft}>
          <Text style={styles.statCardTitle}>{title}</Text>
          <Text style={styles.statCardValue}>{value}</Text>
        </View>
        <View style={[styles.statCardIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: COLORS.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
        <Animated.View 
          style={[
            styles.headerLogoContainer,
            {
              backgroundColor: backgroundColor,
              shadowOpacity: shadowOpacity,
              shadowRadius: shadowRadius,
            }
          ]}
        >
          <Image
            source={require('../../../app-icon.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </Animated.View>
          <View>
            <Text style={[styles.welcomeText, { color: COLORS.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: COLORS.text }]}>{user?.full_name || 'Super Admin'}</Text>
            <Text style={[styles.companyName, { color: COLORS.textTertiary }]}>Kushi Cabs Control Panel</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* Theme Toggle */}
          <TouchableOpacity
            style={styles.themeButton}
            onPress={toggleTheme}
          >
            <Ionicons 
              name={isDarkMode ? 'sunny' : 'moon'} 
              size={24} 
              color={COLORS.warning} 
            />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
              ])
            }
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.warning} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard title="Total Trips" value={stats.totalTrips.toString()} icon="car-outline" color={COLORS.superAdmin.primary} onPress={() => navigation.navigate('Trips')} />
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon="cash-outline" color={COLORS.success} onPress={() => navigation.navigate('Wallets')} />
        <StatCard title="Active Drivers" value={stats.activeDrivers.toString()} icon="people-outline" color={COLORS.info} onPress={() => navigation.navigate('Drivers')} />
        <StatCard title="Active Vendors" value={stats.activeVendors.toString()} icon="business-outline" color={COLORS.warning} onPress={() => navigation.navigate('Vendors')} />
        <StatCard title="Pending Trips" value={stats.pendingTrips.toString()} icon="time-outline" color={COLORS.error} onPress={() => navigation.navigate('Trips')} />
        <StatCard title="Commission Earned" value={`₹${stats.totalCommission.toLocaleString()}`} icon="trending-up-outline" color={COLORS.superAdmin.primary} onPress={() => navigation.navigate('Commission')} />
      </View>

      {/* Seed Data Banner */}
      {(!dataStatus.hasVendors || !dataStatus.hasDrivers) && (
        <View style={styles.seedDataContainer}>
          <View style={styles.seedDataHeader}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.warning} />
            <Text style={styles.seedDataTitle}>Database Status</Text>
          </View>
          <Text style={styles.seedDataText}>
            {!dataStatus.hasVendors && !dataStatus.hasDrivers
              ? 'No vendors or drivers found in database'
              : !dataStatus.hasVendors
              ? 'No vendors found in database'
              : 'No drivers found in database'}
          </Text>
          <TouchableOpacity style={styles.seedDataButton} onPress={handleSeedData}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.text} />
            <Text style={styles.seedDataButtonText}>Create Sample Data</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Revenue Overview */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Revenue Overview</Text>
        <View style={styles.revenueOverview}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>₹{stats.totalRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>Commission</Text>
            <Text style={styles.revenueValue}>₹{stats.totalCommission.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction title="Manage Drivers" icon="people-outline" color={COLORS.info} onPress={() => navigation.navigate('Drivers')} />
          <QuickAction title="Manage Vendors" icon="business-outline" color={COLORS.warning} onPress={() => navigation.navigate('Vendors')} />
          <QuickAction title="View Trips" icon="car-outline" color={COLORS.success} onPress={() => navigation.navigate('Trips')} />
          <QuickAction title="Commission" icon="trending-up-outline" color={COLORS.superAdmin.primary} onPress={() => navigation.navigate('Commission')} />
          <QuickAction title="Wallet Monitor" icon="wallet-outline" color={COLORS.info} onPress={() => navigation.navigate('Wallets')} />
          <QuickAction title="Settings" icon="settings-outline" color={COLORS.textSecondary} onPress={() => navigation.navigate('Settings')} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: getResponsivePadding(24), paddingTop: hp(6) },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerLogoContainer: { width: 50, height: 50, marginRight: 12, borderRadius: 25, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', shadowColor: '#6c5ce7', shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  headerLogo: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  welcomeText: { fontSize: getResponsiveFontSize(16), color: COLORS.textSecondary },
  userName: { fontSize: getResponsiveFontSize(24), fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  companyName: { fontSize: getResponsiveFontSize(14), color: COLORS.superAdmin.primary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileButton: { padding: 8, marginLeft: 'auto' },
  themeButton: { padding: 8 },
  logoutButton: { padding: 8 },
  statsContainer: { paddingHorizontal: getResponsivePadding(24) },
  statCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 2 },
  statCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statCardLeft: { flex: 1 },
  statCardTitle: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginBottom: 4 },
  statCardValue: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.text },
  statCardIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  seedDataContainer: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginHorizontal: getResponsivePadding(24), marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  seedDataHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  seedDataTitle: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginLeft: 8 },
  seedDataText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginBottom: 12 },
  seedDataButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.superAdmin.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16 },
  seedDataButtonText: { fontSize: getResponsiveFontSize(14), fontWeight: '600', color: COLORS.textLight, marginLeft: 8 },
  chartContainer: { margin: getResponsivePadding(24), backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, elevation: 2 },
  chartTitle: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  revenueOverview: { flexDirection: 'row', justifyContent: 'space-between' },
  revenueItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  revenueLabel: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginBottom: 8 },
  revenueValue: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.superAdmin.primary },
  quickActionsContainer: { padding: getResponsivePadding(24) },
  sectionTitle: { fontSize: getResponsiveFontSize(18), fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickAction: { width: '48%', backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, elevation: 2 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionText: { fontSize: getResponsiveFontSize(12), color: COLORS.text, textAlign: 'center', fontWeight: '500' },
});
