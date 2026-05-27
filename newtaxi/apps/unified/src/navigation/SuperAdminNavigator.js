import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

import SuperAdminDashboardScreen  from '../screens/superadmin/DashboardScreen';
import SuperAdminDriversScreen    from '../screens/superadmin/DriversScreen';
import SuperAdminVendorsScreen    from '../screens/superadmin/VendorsScreen';
import SuperAdminTripsScreen      from '../screens/superadmin/TripsScreen';
import SuperAdminCommissionScreen from '../screens/superadmin/CommissionScreen';
import SuperAdminWalletsScreen    from '../screens/superadmin/WalletsScreen';
import SuperAdminSettingsScreen   from '../screens/superadmin/SettingsScreen';

const Stack = createNativeStackNavigator();
const { width: SCREEN_W } = Dimensions.get('window');

const TABS = [
  { key: 'Dashboard',  label: 'Dashboard',  icon: 'grid-outline',         component: SuperAdminDashboardScreen },
  { key: 'Trips',      label: 'Trips',      icon: 'list-outline',          component: SuperAdminTripsScreen },
  { key: 'Drivers',    label: 'Drivers',    icon: 'people-outline',        component: SuperAdminDriversScreen },
  { key: 'Vendors',    label: 'Vendors',    icon: 'business-outline',      component: SuperAdminVendorsScreen },
  { key: 'Commission', label: 'Commission', icon: 'trending-up-outline',   component: SuperAdminCommissionScreen },
  { key: 'Wallets',    label: 'Wallets',    icon: 'wallet-outline',        component: SuperAdminWalletsScreen },
  { key: 'Settings',   label: 'Settings',   icon: 'settings-outline',      component: SuperAdminSettingsScreen },
];

// Wrap each screen in its own stack so internal navigation works
function ScreenWrapper({ component: Screen, navigation: parentNav }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {(props) => <Screen {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function SuperAdminNavigator() {
  const [activeTab, setActiveTab] = useState(0);
  const tabScrollRef = useRef(null);

  function handleTabPress(index) {
    setActiveTab(index);
    // Auto-scroll tab bar to keep selected tab visible
    const tabWidth = 90;
    const scrollX = Math.max(0, index * tabWidth - SCREEN_W / 2 + tabWidth / 2);
    tabScrollRef.current?.scrollTo({ x: scrollX, animated: true });
  }

  return (
    <View style={styles.container}>
      {/* Screens — all mounted, only active one visible */}
      {TABS.map((tab, index) => (
        <View
          key={tab.key}
          style={[styles.screen, index !== activeTab && styles.screenHidden]}
          pointerEvents={index === activeTab ? 'auto' : 'none'}
        >
          <tab.component navigation={{ navigate: (tabName) => {
            const tabIndex = TABS.findIndex(t => t.key === tabName);
            if (tabIndex !== -1) handleTabPress(tabIndex);
          }}} />
        </View>
      ))}

      {/* Scrollable bottom tab bar */}
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
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
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
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 10,
    paddingTop: 0,          // remove top padding — line sits at the very top
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
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
    paddingHorizontal: 10,
    minWidth: 72,
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
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: COLORS.superAdmin.primary,
    fontWeight: '700',
  },
});
