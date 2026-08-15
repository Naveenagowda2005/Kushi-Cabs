import React, { useEffect, useState, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { playTripAlert, initializeAudio } from '../services/soundService';

// Vendor screens
import VendorEnquiriesScreen from '../screens/vendor/EnquiriesScreen';
import VendorEnquiryDetailScreen from '../screens/vendor/EnquiryDetailScreen';
import VendorCreateTripScreen from '../screens/vendor/CreateTripScreen';
import VendorEarningsScreen from '../screens/vendor/EarningsScreen';
import VendorTripHistoryScreen from '../screens/vendor/TripHistoryScreen';
import VendorWalletScreen from '../screens/vendor/WalletScreen';
import VendorProfileScreen from '../screens/vendor/ProfileScreen';
import VendorSettingsScreen from '../screens/vendor/SettingsScreen';
import VendorDocumentUploadScreen from '../screens/vendor/VendorDocumentUploadScreen';
import VendorWaitingForApprovalScreen from '../screens/vendor/VendorWaitingForApprovalScreen';
import AssignDriverScreen from '../screens/vendor/AssignDriverScreen';
import CompletedTripDetailScreen from '../screens/driver/CompletedTripDetailScreen';
import PolicyScreen from '../screens/common/PolicyScreen';
import ViewPolicyScreen from '../screens/common/ViewPolicyScreen';

const Stack = createNativeStackNavigator();

const TABS = [
  { key: 'Enquiries', label: 'Enquiries', icon: 'list-outline' },
  { key: 'History', label: 'History', icon: 'time-outline' },
  { key: 'Profile', label: 'Profile', icon: 'person-outline' },
];

// Custom header with tabs
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
                color={isActive ? '#FF9800' : '#888'}
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
  const [activeTab, setActiveTab] = useState(route?.params?.activeTab || 'Enquiries');

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
  const screenProps = { navigation: screenNavigation };

  if (activeTab === 'Enquiries') {
    return <VendorEnquiriesScreen {...screenProps} />;
  } else if (activeTab === 'History') {
    return <VendorTripHistoryScreen {...screenProps} />;
  } else if (activeTab === 'Profile') {
    return <VendorProfileScreen {...screenProps} />;
  }
  return <VendorEnquiriesScreen {...screenProps} />;
}

export default function VendorNavigator() {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Enquiries');
  const soundPlayedRef = useRef(false); // Use ref instead of state to persist across reconnections

  // IMMEDIATE CHECK: If user verification_status is already approved, skip to dashboard immediately
  // This handles dummy vendors and any pre-approved vendors
  if (user?.verification_status === 'approved') {
    console.log('VendorNavigator: ✅ User verification_status is APPROVED - going straight to dashboard (bypassing all checks)');
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#001a33' },
          headerTintColor: '#FF9800',
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardWithTabs}
          initialParams={{ activeTab: 'Enquiries' }}
          options={{
            title: '',
            headerTitleStyle: { color: '#FF9800', fontWeight: '700' }
          }}
        />
        <Stack.Screen 
          name="EnquiryDetail" 
          component={VendorEnquiryDetailScreen} 
          options={{ title: 'Enquiry Details', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }} 
        />
        <Stack.Screen 
          name="AssignDriver"
          component={AssignDriverScreen}
          options={{ title: 'Assign Driver', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }}
        />
        <Stack.Screen 
          name="CreateTrip"    
          component={VendorCreateTripScreen}    
          options={{ 
            title: 'Create Trip',
            headerTitleStyle: { color: '#FF9800', fontWeight: '700' }
          }} 
        />
        <Stack.Screen 
          name="CompletedTripDetail" 
          component={CompletedTripDetailScreen} 
          options={{ title: 'Trip Details', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }} 
        />
        <Stack.Screen 
          name="Earnings"    
          component={VendorEarningsScreen} 
          options={{ title: 'Earnings & Reports', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }} 
        />
        <Stack.Screen 
          name="Settings"    
          component={VendorSettingsScreen} 
          options={{ title: 'Business Settings', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }} 
        />
        <Stack.Screen
          name="Terms"
          component={PolicyScreen}
          options={{ title: 'Terms & Conditions', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }}
        />
        <Stack.Screen
          name="CancellationPolicy"
          component={PolicyScreen}
          options={{ title: 'Cancellation Policy', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }}
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
            headerTitleStyle: { color: '#FF9800', fontWeight: '700' }
          })}
        />
      </Stack.Navigator>
    );
  }

  // Play welcome sound when vendor app fully loads (only once per app load)
  useEffect(() => {
    if (verificationStatus === 'approved' && !soundPlayedRef.current && user?.id) {
      console.log('🎵 Vendor app loaded - Playing welcome sound (3 rings)');
      soundPlayedRef.current = true; // Set ref so it never plays again during this session
      
      // Initialize audio and play welcome sound
      (async () => {
        try {
          await initializeAudio();
          await playTripAlert(3); // 3 rings for vendor
        } catch (error) {
          console.error('❌ Error playing welcome sound:', error);
        }
      })();
    }
  }, [verificationStatus, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const checkVerificationStatus = async () => {
      try {
        console.log('VendorNavigator: ✅ Starting verification check for user:', user.id);

        // FIRST: Check vendor_verification_status table
        const { data: verificationStatus, error } = await supabase
          .from('vendor_verification_status')
          .select('overall_status, is_re_verification')
          .eq('user_id', user.id)
          .single();

        if (!isMounted) return;

        console.log('VendorNavigator: vendor_verification_status query result:', { 
          hasData: !!verificationStatus, 
          error: error?.code,
          status: verificationStatus?.overall_status
        });

        // If found, use it
        if (verificationStatus) {
          const newStatus = verificationStatus?.overall_status || 'not_started';
          const isReVerification = verificationStatus?.is_re_verification === true;
          
          console.log('VendorNavigator: ✅ Status from vendor_verification_status table:', newStatus, '| re-verification:', isReVerification);
          
          if (newStatus === 'pending' && isReVerification) {
            console.log('VendorNavigator: Re-verification pending — keeping dashboard access');
            setVerificationStatus('approved');
            setLoading(false);
            return;
          }
          
          setVerificationStatus(newStatus);
          setLoading(false);
          return;
        }

        // If no vendor_verification_status record, check users.verification_status (for dummy vendors)
        // This is the key fallback for dummy vendors — they're created with verification_status='approved'
        if (error?.code === 'PGRST116') {
          console.log('VendorNavigator: No vendor_verification_status record found, checking users.verification_status...');
          
          const { data: userData } = await supabase
            .from('users')
            .select('verification_status')
            .eq('id', user.id)
            .single();

          console.log('VendorNavigator: users.verification_status:', userData?.verification_status);

          if (userData?.verification_status === 'approved') {
            // Approved at user level — create the missing vendor_verification_status record
            // so future checks work properly (same pattern as DriverNavigator)
            console.log('VendorNavigator: ✅ User approved at users table level, creating vendor_verification_status record...');
            
            try {
              await supabase
                .from('vendor_verification_status')
                .upsert({
                  user_id: user.id,
                  overall_status: 'approved',
                  all_documents_submitted: true,
                  submitted_at: new Date().toISOString(),
                  approved_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

              console.log('VendorNavigator: ✅ vendor_verification_status record created');
            } catch (upsertError) {
              console.warn('VendorNavigator: Could not create vendor_verification_status record (non-fatal):', upsertError.message);
              // Non-fatal — we can still approve the user
            }
            
            if (isMounted) {
              setVerificationStatus('approved');
              setLoading(false);
            }
            return;
          } else {
            // Not approved at user level — needs documents
            console.log('VendorNavigator: Not approved, user needs to upload documents');
            if (isMounted) {
              setVerificationStatus('not_started');
              setLoading(false);
            }
            return;
          }
        }

        if (error) {
          console.error('VendorNavigator: Error checking vendor verification status:', error);
          if (isMounted) {
            setVerificationStatus('not_started');
            setLoading(false);
          }
          return;
        }
      } catch (error) {
        console.error('VendorNavigator: Exception in verification check:', error);
        if (isMounted) {
          setVerificationStatus('not_started');
          setLoading(false);
        }
      }
    };

    checkVerificationStatus();

    // Setup real-time subscriptions for updates (not polling)
    let channel;
    const setupSubscription = () => {
      try {
        channel = supabase
          .channel(`vendor_navigator_vvs_${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'vendor_verification_status',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (isMounted) {
                const newStatus = payload.new?.overall_status || 'not_started';
                console.log('VendorNavigator: 🔔 Real-time update received - status:', newStatus);
                setVerificationStatus(newStatus);
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('VendorNavigator: ✅ Real-time listener ACTIVE');
            }
          });
      } catch (error) {
        console.error('VendorNavigator: Real-time setup error:', error);
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.vendor.primary} />
      </View>
    );
  }

  if (verificationStatus === 'pending' || verificationStatus === 'rejected' || verificationStatus === 'not_started') {
    console.log('VendorNavigator: Vendor not approved (status:', verificationStatus, ') - showing upload documents screen');
    
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerTitleStyle: { color: COLORS.text },
        }}
        initialRouteName="UploadDocuments"
      >
        <Stack.Screen
          name="UploadDocuments"
          component={VendorDocumentUploadScreen}
          options={{
            title: 'Upload Documents',
            headerBackVisible: false,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="WaitingForApproval"
          component={VendorWaitingForApprovalScreen}
          options={{
            title: 'Waiting for Approval',
            headerBackVisible: true,
          }}
        />
      </Stack.Navigator>
    );
  }

  console.log('VendorNavigator: Vendor approved - showing dashboard with header tabs');
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#001a33' },
        headerTintColor: '#FF9800',
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardWithTabs}
        initialParams={{ activeTab: 'Enquiries' }}
        options={{
          title: '',
          headerTitleStyle: { color: '#FF9800', fontWeight: '700' }
        }}
      />
      <Stack.Screen 
        name="EnquiryDetail" 
        component={VendorEnquiryDetailScreen} 
        options={{ title: 'Enquiry Details', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }} 
      />
      <Stack.Screen 
        name="AssignDriver"
        component={AssignDriverScreen}
        options={{ title: 'Assign Driver', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }}
      />
      <Stack.Screen 
        name="CreateTrip"    
        component={VendorCreateTripScreen}    
        options={{ 
          title: 'Create Trip',
          headerTitleStyle: { color: '#FF9800', fontWeight: '700' }
        }} 
      />
      <Stack.Screen 
        name="CompletedTripDetail" 
        component={CompletedTripDetailScreen} 
        options={{ title: 'Trip Details', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }} 
      />
      <Stack.Screen 
        name="Earnings"    
        component={VendorEarningsScreen} 
        options={{ title: 'Earnings & Reports', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }} 
      />
      <Stack.Screen 
        name="Settings"    
        component={VendorSettingsScreen} 
        options={{ title: 'Business Settings', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }} 
      />
      <Stack.Screen
        name="Terms"
        component={PolicyScreen}
        options={{ title: 'Terms & Conditions', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }}
      />
      <Stack.Screen
        name="CancellationPolicy"
        component={PolicyScreen}
        options={{ title: 'Cancellation Policy', headerTitleStyle: { color: '#FF9800', fontWeight: '700' } }}
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
          headerTitleStyle: { color: '#FF9800', fontWeight: '700' }
        })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#001a33',
    borderBottomWidth: 1,
    borderBottomColor: '#0d0f1a',
    paddingVertical: 12,
    paddingHorizontal: 0,
    minHeight: 60,
  },
  tabBarContent: {
    gap: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 0,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FF980025',
    borderBottomWidth: 3,
    borderBottomColor: '#FF9800',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  tabLabelActive: {
    color: '#FF9800',
    fontWeight: '700',
  },
});
