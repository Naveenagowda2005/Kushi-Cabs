import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants';
import * as documentService from '../services/documentService';
import { supabase } from '../lib/supabase';

// Driver screens
import DriverDashboardScreen from '../screens/driver/DashboardScreen';
import DriverTripDetailScreen from '../screens/driver/TripDetailScreen';
import DriverActiveTripScreen from '../screens/driver/ActiveTripScreen';
import DriverTripHistoryScreen from '../screens/driver/TripHistoryScreen';
import DriverCompletedTripDetailScreen from '../screens/driver/CompletedTripDetailScreen';
import DriverWalletScreen from '../screens/driver/WalletScreen';
import DriverProfileScreen from '../screens/driver/ProfileScreen';
import PolicyScreen from '../screens/common/PolicyScreen';
import ViewPolicyScreen from '../screens/common/ViewPolicyScreen';
import DriverDocumentUploadScreen from '../screens/driver/DriverDocumentUploadScreen';
import DriverVerificationStatusScreen from '../screens/driver/DriverVerificationStatusScreen';
import WaitingForApprovalScreen from '../screens/driver/WaitingForApprovalScreen';

const Stack = createNativeStackNavigator();

const TABS = [
  { key: 'Trips', label: 'Trips', icon: 'car-outline' },
  { key: 'Wallet', label: 'Wallet', icon: 'wallet-outline' },
  { key: 'History', label: 'History', icon: 'time-outline' },
  { key: 'Profile', label: 'Profile', icon: 'person-outline' },
];

// Custom header with tabs (driver uses blue/green color scheme)
function TabHeader({ activeTab, onTabPress }) {
  return (
    <View style={styles.tabBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarContent}
        bounces={false}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? COLORS.driver.secondary : '#888'}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Wrapper component to use hooks in the stack screen
function DashboardWithTabs({ route, navigation }) {
  const screenNavigation = useNavigation();
  const [activeTab, setActiveTab] = useState(route?.params?.activeTab || 'Trips');

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    screenNavigation.setParams({ activeTab: tab });
  };

  // Update header when tab changes
  useEffect(() => {
    screenNavigation.setOptions({
      headerRight: () => <TabHeader activeTab={activeTab} onTabPress={handleTabPress} />,
    });
  }, [activeTab, screenNavigation]);

  // Pass navigation to child screens
  const screenProps = { 
    navigation: screenNavigation,
    onSwitchTab: handleTabPress,
  };

  if (activeTab === 'Trips') {
    return <DriverDashboardScreen {...screenProps} />;
  } else if (activeTab === 'Wallet') {
    return <DriverWalletScreen {...screenProps} />;
  } else if (activeTab === 'History') {
    return <DriverTripHistoryScreen {...screenProps} />;
  } else if (activeTab === 'Profile') {
    return <DriverProfileScreen {...screenProps} />;
  }
  return <DriverDashboardScreen {...screenProps} />;
}

function TripsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#333',
      }}
    >
      <Stack.Screen 
        name="Dashboard"   
        component={DriverDashboardScreen}   
        options={{ title: 'Available Trips' }} 
      />
      <Stack.Screen 
        name="TripDetail"  
        component={DriverTripDetailScreen}  
        options={{ title: 'Trip Details' }} 
      />
      <Stack.Screen 
        name="ActiveTrip"  
        component={DriverActiveTripScreen}  
        options={{ title: 'Active Trip' }} 
      />
      <Stack.Screen 
        name="TripHistory" 
        component={DriverTripHistoryScreen} 
        options={{ title: 'Trip History' }} 
      />
      <Stack.Screen 
        name="CompletedTripDetail" 
        component={DriverCompletedTripDetailScreen} 
        options={{ title: 'Trip Details' }} 
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#001a33' },
        headerTintColor: COLORS.textLight,
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={DriverProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="DriverDocumentUpload"
        component={DriverDocumentUploadScreen}
        options={{ title: 'Upload Documents' }}
      />
      <Stack.Screen
        name="DriverVerificationStatus"
        component={DriverVerificationStatusScreen}
        options={{ title: 'Verification Status' }}
      />
      <Stack.Screen
        name="Terms"
        component={PolicyScreen}
        options={{ title: 'Terms & Conditions' }}
      />
      <Stack.Screen
        name="CancellationPolicy"
        component={PolicyScreen}
        options={{ title: 'Cancellation Policy' }}
      />
      <Stack.Screen
        name="ViewPolicy"
        component={ViewPolicyScreen}
        options={({ route }) => ({
          title: route.params?.policyType === 'privacy_policy' ? 'Privacy Policy'
            : route.params?.policyType === 'terms_conditions' ? 'Terms & Conditions'
            : route.params?.policyType === 'cancellation_policy' ? 'Cancellation Policy'
            : route.params?.policyType === 'refund_policy' ? 'Refund Policy'
            : route.params?.policyType === 'safety_guidelines' ? 'Safety Guidelines'
            : 'Policy',
        })}
      />
    </Stack.Navigator>
  );
}

export default function DriverNavigator() {
  const [showWaitingScreen, setShowWaitingScreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Dashboard');

  const checkVerificationStatus = React.useCallback(async () => {
    try {
      // Get driver ID from OTP session in AsyncStorage or from Supabase auth
      let userId = null;

      // Try to get from AsyncStorage first (OTP-based login)
      try {
        const otpSessionStr = await AsyncStorage.getItem('otpUserSession');
        if (otpSessionStr) {
          const otpSession = JSON.parse(otpSessionStr);
          userId = otpSession?.user?.id;
          console.log('DriverNavigator: Got userId from OTP session:', userId);
        }
      } catch (e) {
        console.log('DriverNavigator: Could not get OTP session from AsyncStorage');
      }

      // If not found in AsyncStorage, try Supabase auth
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
        console.log('DriverNavigator: Got userId from Supabase auth:', userId);
      }

      if (!userId) {
        console.log('DriverNavigator: No user found');
        setShowWaitingScreen(true);
        return;
      }

      console.log('DriverNavigator: Checking verification for user:', userId);

      // First check driver_verification_status table
      const { data: verificationStatus, error } = await supabase
        .from('driver_verification_status')
        .select('overall_status')
        .eq('driver_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('DriverNavigator: Error checking verification status:', error);
        setShowWaitingScreen(true);
        return;
      }

      console.log('DriverNavigator: Verification status found:', verificationStatus?.overall_status);

      // Decision logic:
      // - If overall_status === 'approved' → show dashboard
      // - If overall_status === 'pending_review' or 'pending' → show waiting screen
      // - If no verification record → check users table for legacy verification_status
      if (verificationStatus?.overall_status === 'approved') {
        console.log('DriverNavigator: Driver approved - showing dashboard');
        setShowWaitingScreen(false);
      } else if (verificationStatus?.overall_status === 'pending_review' || verificationStatus?.overall_status === 'pending') {
        console.log('DriverNavigator: Documents pending review - showing waiting screen');
        setShowWaitingScreen(true);
      } else if (!verificationStatus) {
        // No verification record — check users.verification_status directly (for dummy drivers or old data)
        const { data: userData } = await supabase
          .from('users')
          .select('verification_status')
          .eq('id', userId)
          .single();

        console.log('DriverNavigator: No DVS record, checking users table. verification_status:', userData?.verification_status);

        if (userData?.verification_status === 'approved') {
          // Approved at user level — also create the missing dvs record so future checks work
          console.log('DriverNavigator: User verified in users table, creating DVS record');
          await supabase
            .from('driver_verification_status')
            .upsert({
              driver_id: userId,
              overall_status: 'approved',
              all_documents_submitted: true,
              submitted_at: new Date().toISOString(),
              approved_at: new Date().toISOString(),
            }, { onConflict: 'driver_id' });

          setShowWaitingScreen(false);
        } else {
          console.log('DriverNavigator: User not verified, showing waiting screen');
          setShowWaitingScreen(true);
        }
      } else {
        // Record exists but status is something else (rejected, etc.) → show waiting screen
        console.log('DriverNavigator: Unknown verification status, showing waiting screen:', verificationStatus?.overall_status);
        setShowWaitingScreen(true);
      }
    } catch (err) {
      console.error('DriverNavigator: Error in verification check:', err);
      // On error, show waiting screen to be safe
      setShowWaitingScreen(true);
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    setLoading(true);
    checkVerificationStatus().finally(() => setLoading(false));
  }, [checkVerificationStatus]);

  useEffect(() => {
    // Initial check on mount
    setLoading(true);
    checkVerificationStatus().finally(() => setLoading(false));
  }, [checkVerificationStatus]);

  useEffect(() => {
    // Subscribe to auth changes to re-check verification when user logs in/out
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('DriverNavigator: Auth state changed:', event, 'user:', session?.user?.id);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        checkVerificationStatus();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [checkVerificationStatus]);

  // Real-time subscription to watch for approval status changes (e.g., when admin approves)
  useEffect(() => {
    let userId = null;

    // Get user ID synchronously
    const getAndSubscribe = async () => {
      try {
        // Try to get from AsyncStorage first (OTP-based login)
        try {
          const otpSessionStr = await AsyncStorage.getItem('otpUserSession');
          if (otpSessionStr) {
            const otpSession = JSON.parse(otpSessionStr);
            userId = otpSession?.user?.id;
          }
        } catch (e) {
          console.log('DriverNavigator: Could not get OTP session');
        }

        // If not found in AsyncStorage, try Supabase auth
        if (!userId) {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id;
        }

        if (!userId) {
          console.log('DriverNavigator: No user ID for real-time subscription');
          return;
        }

        console.log('DriverNavigator: Setting up real-time subscription for:', userId);

        const subscription = supabase
          .channel(`driver-verification:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'driver_verification_status',
              filter: `driver_id=eq.${userId}`,
            },
            (payload) => {
              console.log('🔔 DriverNavigator: Real-time approval status changed:', payload.new?.overall_status);
              // Re-check status when it changes
              checkVerificationStatus();
            }
          )
          .subscribe();

        // Cleanup subscription on unmount
        return () => {
          console.log('DriverNavigator: Unsubscribing from real-time updates');
          supabase.removeChannel(subscription);
        };
      } catch (error) {
        console.error('DriverNavigator: Error setting up real-time subscription:', error);
      }
    };

    const cleanup = getAndSubscribe();
    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, [checkVerificationStatus]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.driver.primary} />
      </View>
    );
  }

  // If not approved, show WaitingForApprovalScreen with access to document upload
  if (showWaitingScreen) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#333',
        }}
      >
        <Stack.Screen
          name="WaitingForApproval"
          component={WaitingForApprovalScreen}
          options={{
            title: 'Waiting for Approval',
            headerBackVisible: false,
            headerLeft: () => null, // Disable back button on main screen
          }}
        />
        {/* Allow access to document upload even while waiting */}
        <Stack.Screen
          name="UploadDocuments"
          component={DriverDocumentUploadScreen}
          options={{
            title: 'Upload Documents',
            headerBackVisible: true,
          }}
        />
      </Stack.Navigator>
    );
  }

  // If approved, show full dashboard with header tabs
  console.log('DriverNavigator: Driver approved - showing dashboard with header tabs');
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#333',
      }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardWithTabs}
        initialParams={{ activeTab: 'Trips' }}
        options={{
          title: 'Dashboard',
        }}
      />
      <Stack.Screen 
        name="ActiveTrip"  
        component={DriverActiveTripScreen}  
        options={{ 
          title: 'Active Trip',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#333',
          headerTitleStyle: { color: '#333', fontWeight: '600' },
          headerBackVisible: false,
        }} 
      />
      <Stack.Screen 
        name="TripDetail"  
        component={DriverTripDetailScreen}  
        options={{ 
          title: 'Trip Details',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#333',
          headerTitleStyle: { color: '#333', fontWeight: '600' },
        }} 
      />
      <Stack.Screen 
        name="CompletedTripDetail" 
        component={DriverCompletedTripDetailScreen} 
        options={{ title: 'Trip Details' }} 
      />
      <Stack.Screen
        name="UploadDocuments"
        component={DriverDocumentUploadScreen}
        options={{
          title: 'Upload Documents',
        }}
      />
      <Stack.Screen
        name="VerificationStatus"
        component={DriverVerificationStatusScreen}
        options={{
          title: 'Verification Status',
        }}
      />
      <Stack.Screen
        name="Terms"
        component={PolicyScreen}
        options={{ title: 'Terms & Conditions' }}
      />
      <Stack.Screen
        name="CancellationPolicy"
        component={PolicyScreen}
        options={{ title: 'Cancellation Policy' }}
      />
      <Stack.Screen
        name="ViewPolicy"
        component={ViewPolicyScreen}
        options={({ route }) => ({
          title: route.params?.policyType === 'privacy_policy' ? 'Privacy Policy'
            : route.params?.policyType === 'terms_conditions' ? 'Terms & Conditions'
            : route.params?.policyType === 'cancellation_policy' ? 'Cancellation Policy'
            : route.params?.policyType === 'refund_policy' ? 'Refund Policy'
            : route.params?.policyType === 'safety_guidelines' ? 'Safety Guidelines'
            : 'Policy',
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabBarContent: {
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: `${COLORS.driver.secondary}20`,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  tabLabelActive: {
    color: COLORS.driver.secondary,
    fontWeight: '600',
  },
});
