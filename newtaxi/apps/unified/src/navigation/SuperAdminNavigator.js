import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { COLORS } from '../constants';

import SuperAdminDashboardScreen  from '../screens/superadmin/DashboardScreen';
import SuperAdminDriversScreen    from '../screens/superadmin/DriversScreen';
import SuperAdminVendorsScreen    from '../screens/superadmin/VendorsScreen';
import SuperAdminTripsScreen      from '../screens/superadmin/TripsScreen';
import SuperAdminCommissionScreen from '../screens/superadmin/CommissionScreen';
import SuperAdminWalletsScreen    from '../screens/superadmin/WalletsScreen';
import SuperAdminSettingsScreen   from '../screens/superadmin/SettingsScreen';
import AdminVerificationDashboard from '../screens/superadmin/AdminVerificationDashboard';
import AdminVendorVerificationDashboard from '../screens/superadmin/AdminVendorVerificationDashboard';
import PolicyManagementScreen from '../screens/superadmin/PolicyManagementScreen';

const Stack = createNativeStackNavigator();
const { width: SCREEN_W } = Dimensions.get('window');

const TABS = [
  { key: 'Dashboard',  label: 'Dashboard',  icon: 'grid-outline',         component: SuperAdminDashboardScreen },
  { key: 'Trips',      label: 'Trips',      icon: 'list-outline',          component: SuperAdminTripsScreen },
  { key: 'Drivers',    label: 'Drivers',    icon: 'people-outline',        component: SuperAdminDriversScreen },
  { key: 'Vendors',    label: 'Vendors',    icon: 'business-outline',      component: SuperAdminVendorsScreen },
  { key: 'DriverVerif', label: 'Driver\nVerification', icon: 'checkmark-outline',  component: AdminVerificationDashboard },
  { key: 'VendorVerif', label: 'Vendor\nVerification', icon: 'checkmark-outline',  component: AdminVendorVerificationDashboard },
  { key: 'Commission', label: 'Commission', icon: 'trending-up-outline',   component: SuperAdminCommissionScreen },
  { key: 'Wallets',    label: 'Wallets',    icon: 'wallet-outline',        component: SuperAdminWalletsScreen },
  { key: 'Settings',   label: 'Settings',   icon: 'settings-outline',      component: SuperAdminSettingsScreen },
];

// Wrap each screen in its own stack so internal navigation works
function ScreenWrapper({ component: Screen, navigation: parentNav }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {(props) => <Screen {...props} navigation={props.navigation} />}
      </Stack.Screen>
      {/* Extra screens for navigation within settings */}
      <Stack.Screen 
        name="PolicyManagement" 
        component={PolicyManagementScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function SuperAdminNavigator() {
  const [activeTab, setActiveTab] = useState(0);
  const [showPolicyManagement, setShowPolicyManagement] = useState(false);
  const tabScrollRef = useRef(null);
  const [pendingDriverCount, setPendingDriverCount] = useState(0);
  const [pendingVendorCount, setPendingVendorCount] = useState(0);

  const fetchPendingCounts = async () => {
    try {
      // ALWAYS use direct query for driver count (RPC is broken)
      // The RPC returns 0 even when records exist with overall_status = 'pending_review'
      const { data: directDriverData, error: directDriverError } = await supabase
        .from('driver_verification_status')
        .select('id')
        .eq('overall_status', 'pending_review');

      if (!directDriverError) {
        const driverCount = directDriverData?.length || 0;
        console.log('✅ Driver count (direct query):', driverCount);
        setPendingDriverCount(driverCount);
      } else {
        console.error('🔴 Driver count query error:', directDriverError);
        setPendingDriverCount(0);
      }

      // Vendor count via RPC (this one works)
      const { data: vendors, error: vendorError } = await supabase
        .rpc('get_vendor_verifications', { p_status: 'pending' });

      if (vendorError) {
        console.error('🔴 Vendor count RPC error:', vendorError);
        setPendingVendorCount(0);
      } else {
        const vendorCount = vendors?.length || 0;
        console.log('✅ Vendor count from RPC:', vendorCount);
        setPendingVendorCount(vendorCount);
      }
    } catch (error) {
      console.error('❌ Error fetching pending counts:', error);
      setPendingDriverCount(0);
      setPendingVendorCount(0);
    }
  };

  // Fetch counts on mount and whenever tab changes
  useFocusEffect(
    React.useCallback(() => {
      fetchPendingCounts();
      // Refresh every 10 seconds when navigator is focused
      const interval = setInterval(fetchPendingCounts, 10000);
      return () => clearInterval(interval);
    }, [])
  );

  function handleTabPress(index) {
    setActiveTab(index);
    // Auto-scroll tab bar to keep selected tab visible
    const tabWidth = 90;
    const scrollX = Math.max(0, index * tabWidth - SCREEN_W / 2 + tabWidth / 2);
    tabScrollRef.current?.scrollTo({ x: scrollX, animated: true });
  }

  return (
    <View style={styles.container}>
      {/* Scrollable top tab bar (moved to header) */}
      <View style={styles.tabBar}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
          bounces={false}
          decelerationRate="fast"
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === index;
            // Get pending count for verification tabs
            let badgeCount = 0;
            if (tab.key === 'DriverVerif') {
              badgeCount = pendingDriverCount;
            } else if (tab.key === 'VendorVerif') {
              badgeCount = pendingVendorCount;
            }

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.7}
              >
                {/* Active indicator line at top */}
                <View style={[styles.tabLine, isActive && styles.tabLineActive]} />

                <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color={isActive ? '#fff' : COLORS.textSecondary}
                  />
                  {/* Badge with pending count */}
                  {(tab.key === 'DriverVerif' || tab.key === 'VendorVerif') && (
                    <View style={[styles.badge, badgeCount === 0 && styles.badgeZero]}>
                      <Text style={[styles.badgeText, badgeCount === 0 && styles.badgeTextZero]}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={2}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Screens — all mounted, only active one visible */}
      {!showPolicyManagement ? (
        <>
          {TABS.map((tab, index) => (
            <View
              key={tab.key}
              style={[styles.screen, index !== activeTab && styles.screenHidden]}
              pointerEvents={index === activeTab ? 'auto' : 'none'}
            >
              <tab.component navigation={{ 
                navigate: (screenName) => {
                  if (screenName === 'PolicyManagement') {
                    setShowPolicyManagement(true);
                  } else {
                    const tabIndex = TABS.findIndex(t => t.key === screenName);
                    if (tabIndex !== -1) handleTabPress(tabIndex);
                  }
                }
              }} />
            </View>
          ))}
        </>
      ) : (
        <View style={styles.screen}>
          <PolicyManagementScreen navigation={{ 
            goBack: () => setShowPolicyManagement(false)
          }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  screen: { flex: 1 },
  screenHidden: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0,
    zIndex: -1,
  },

  tabBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    paddingTop: 50,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    gap: 4,
    paddingTop: 0,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    minWidth: 80,
    paddingBottom: 4,
  },
  tabLine: {
    height: 3,
    width: '80%',
    borderRadius: 0,
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  tabLineActive: {
    backgroundColor: COLORS.superAdmin.primary,
  },
  tabIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  tabIconWrapActive: {
    backgroundColor: COLORS.superAdmin.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeZero: {
    backgroundColor: '#4caf50',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 4,
  },
  badgeTextZero: {
    color: '#fff',
  },
  tabLabel: {
    fontSize: 7.5,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 75,
    numberOfLines: 2,
    flexWrap: 'wrap',
    lineHeight: 10,
  },
  tabLabelActive: {
    color: COLORS.superAdmin.primary,
    fontWeight: '700',
  },
});
