import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
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
        
        const { data, error } = await supabase
          .from('vendor_verification_status')
          .select('overall_status, approved_at, rejected_at, submitted_at, all_documents_submitted, is_re_verification')
          .eq('user_id', user.id)
          .single();

        if (!isMounted) return;

        if (error?.code === 'PGRST205') {
          console.log('VendorNavigator: vendor_verification_status table not created yet - setting to not_started');
          setVerificationStatus('not_started');
          setLoading(false);
          return;
        }

        if (error?.code === 'PGRST116') {
          console.log('VendorNavigator: No verification record found - setting to not_started');
          setVerificationStatus('not_started');
          setLoading(false);
          return;
        }

        if (error) {
          console.error('VendorNavigator: Error checking vendor verification status:', error);
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(() => checkVerificationStatus(true), 1000);
            return;
          }
          setVerificationStatus('not_started');
          setLoading(false);
          return;
        }

        const newStatus = data?.overall_status || 'not_started';
        const isReVerification = data?.is_re_verification === true;
        console.log('VendorNavigator: ✅ Status from DB:', newStatus, '| re-verification:', isReVerification);

        if (newStatus === 'pending' && isReVerification) {
          console.log('VendorNavigator: Re-verification pending — keeping dashboard access');
          setVerificationStatus('approved');
          if (isMounted) setLoading(false);
          return;
        }

        if (newStatus === 'pending' && isMounted) {
          try {
            const { data: docsData, error: docsError } = await supabase
              .from('vendor_documents')
              .select('documents')
              .eq('user_id', user.id)
              .single();

            if (!docsError && docsData?.documents) {
              const REQUIRED = ['AADHAR', 'PAN_CARD', 'BANK_PASSBOOK_FRONT', 'VENDOR_SELFIE'];
              const allApproved = REQUIRED.every(dt => docsData.documents[dt]?.status === 'approved');
              if (allApproved) {
                console.log('VendorNavigator: All docs approved but status is pending — auto-approving');
                const { data: vendorData } = await supabase
                  .from('vendors')
                  .select('id')
                  .eq('user_id', user.id)
                  .single();
                if (vendorData?.id) {
                  await supabase.rpc('update_vendor_verification', {
                    p_vendor_id: vendorData.id,
                    p_overall_status: 'approved',
                  });
                  await supabase.rpc('update_user_verification_status', {
                    p_user_id: user.id,
                    p_status: 'approved',
                  });
                  if (isMounted) {
                    setVerificationStatus('approved');
                    setLoading(false);
                  }
                  return;
                }
              }
            }
          } catch (autoApproveError) {
            console.warn('VendorNavigator: Auto-approve check failed (non-fatal):', autoApproveError.message);
          }
        }

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

    checkVerificationStatus();

    const pollInterval = setInterval(() => {
      if (isMounted) {
        checkVerificationStatus();
      }
    }, 3000);

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
      clearInterval(pollInterval);
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
            headerLeft: () => null,
          }}
        />
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

  console.log('VendorNavigator: Vendor approved - showing dashboard with header tabs');
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#001a33' },
        headerTintColor: COLORS.textLight,
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardWithTabs}
        initialParams={{ activeTab: 'Enquiries' }}
        options={{
          title: 'Dashboard',
        }}
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#001a33',
    borderBottomWidth: 1,
    borderBottomColor: '#0d0f1a',
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
    backgroundColor: '#FF980020',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  tabLabelActive: {
    color: '#FF9800',
    fontWeight: '600',
  },
});
