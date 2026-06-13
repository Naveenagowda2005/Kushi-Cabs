import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
import CompletedTripDetailScreen from '../screens/driver/CompletedTripDetailScreen';
import PolicyScreen from '../screens/common/PolicyScreen';
import ViewPolicyScreen from '../screens/common/ViewPolicyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function EnquiriesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#001a33' },
        headerTintColor: COLORS.textLight,
      }}
    >
      <Stack.Screen 
        name="EnquiriesList" 
        component={VendorEnquiriesScreen}    
        options={{ title: 'Trip Enquiries' }} 
      />
      <Stack.Screen 
        name="EnquiryDetail" 
        component={VendorEnquiryDetailScreen} 
        options={{ title: 'Enquiry Details' }} 
      />
      <Stack.Screen 
        name="CreateTrip"    
        component={VendorCreateTripScreen}    
        options={{ title: 'Create Trip' }} 
      />
      <Stack.Screen 
        name="CompletedTripDetail" 
        component={CompletedTripDetailScreen} 
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
        component={VendorProfileScreen}  
        options={{ title: 'Profile' }} 
      />
      <Stack.Screen 
        name="Earnings"    
        component={VendorEarningsScreen} 
        options={{ title: 'Earnings & Reports' }} 
      />
      <Stack.Screen 
        name="Settings"    
        component={VendorSettingsScreen} 
        options={{ title: 'Business Settings' }} 
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

export default function VendorNavigator() {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const checkVerificationStatus = async (isRetry = false) => {
      try {
        if (!isRetry) {
          console.log('VendorNavigator: ✅ Starting verification check for user:', user.id);
        } else {
          console.log(`VendorNavigator: 🔄 Retry ${retryCount}/${MAX_RETRIES}`);
        }
        
        // Force fresh data - no caching
        const { data, error } = await supabase
          .from('vendor_verification_status')
          .select('overall_status, approved_at, rejected_at, submitted_at, all_documents_submitted')
          .eq('user_id', user.id)
          .single();

        if (!isMounted) return;

        // Handle table doesn't exist error (PGRST205)
        if (error?.code === 'PGRST205') {
          console.log('VendorNavigator: vendor_verification_status table not created yet - setting to not_started');
          setVerificationStatus('not_started');
          setLoading(false);
          return;
        }

        // Handle no record found error (PGRST116) - new vendor without documents
        if (error?.code === 'PGRST116') {
          console.log('VendorNavigator: No verification record found - setting to not_started');
          setVerificationStatus('not_started');
          setLoading(false);
          return;
        }

        // Other errors
        if (error) {
          console.error('VendorNavigator: Error checking vendor verification status:', error);
          // Retry up to 3 times
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(() => checkVerificationStatus(true), 1000);
            return;
          }
          // Default to not_started on error after retries
          setVerificationStatus('not_started');
          setLoading(false);
          return;
        }

        // Success - set the status from database
        const newStatus = data?.overall_status || 'not_started';
        console.log('VendorNavigator: ✅ Status from DB:', newStatus);
        console.log('VendorNavigator: Full record:', JSON.stringify(data));
        
        // Update state
        setVerificationStatus(newStatus);
      } catch (error) {
        console.error('VendorNavigator: Exception in verification check:', error);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(() => checkVerificationStatus(true), 1000);
        } else {
          setVerificationStatus('not_started');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Check on mount
    checkVerificationStatus();
    setLastCheckTime(Date.now());

    // Subscribe to real-time changes in vendor_verification_status using modern API
    const setupSubscription = async () => {
      const channel = supabase
        .channel(`vendor_verification_status:user_id=eq.${user.id}`)
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
              console.log('VendorNavigator: 🔔 Real-time update received - status:', newStatus, 'Full payload:', JSON.stringify(payload.new));
              
              setVerificationStatus((prevStatus) => {
                if (prevStatus !== newStatus) {
                  console.log('VendorNavigator: ✅ Status UPDATED from', prevStatus, 'to', newStatus);
                }
                return newStatus;
              });
            }
          }
        );
      
      const status = await channel.subscribe((status) => {
        console.log('VendorNavigator: Real-time channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('VendorNavigator: ✅ Real-time listener ACTIVE');
        }
      });
      
      return channel;
    };

    let channel;
    setupSubscription().then(ch => { channel = ch; });

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

  // If vendor is not approved (pending, rejected, or not_started), show waiting screen
  // They can access document upload from the waiting screen
  if (verificationStatus === 'pending' || verificationStatus === 'rejected' || verificationStatus === 'not_started') {
    console.log('VendorNavigator: Vendor not approved (status:', verificationStatus, ') - showing waiting screen');
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#001a33' },
          headerTintColor: COLORS.textLight,
        }}
      >
        <Stack.Screen
          name="WaitingForApproval"
          component={VendorWaitingForApprovalScreen}
          options={{
            title: 'Waiting for Approval',
            headerBackVisible: false,
            headerLeft: () => null, // Disable back button on main screen
          }}
        />
        {/* Allow access to document upload even while waiting */}
        <Stack.Screen
          name="UploadDocuments"
          component={VendorDocumentUploadScreen}
          options={{
            title: 'Upload Documents',
            headerBackVisible: true,
          }}
        />
      </Stack.Navigator>
    );
  }

  // If vendor is approved, show normal vendor app
  console.log('VendorNavigator: Vendor approved - showing dashboard');
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#001a33', 
          borderTopColor: '#0d0f1a',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.vendor.secondary,
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Enquiries: 'list-outline',
            History:   'time-outline',
            Profile:   'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Enquiries" component={EnquiriesStack} />
      <Tab.Screen name="History"   component={VendorTripHistoryScreen} />
      <Tab.Screen name="Profile"   component={ProfileStack} />
    </Tab.Navigator>
  );
}
