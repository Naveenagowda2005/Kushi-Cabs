import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
import DriverDocumentUploadScreen from '../screens/driver/DriverDocumentUploadScreen';
import DriverVerificationStatusScreen from '../screens/driver/DriverVerificationStatusScreen';
import WaitingForApprovalScreen from '../screens/driver/WaitingForApprovalScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TripsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#001a33' },
        headerTintColor: COLORS.textLight,
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
        options={{ title: 'Active Trip', headerBackVisible: false }} 
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
    </Stack.Navigator>
  );
}

export default function DriverNavigator() {
  const [showWaitingScreen, setShowWaitingScreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check driver's verification status on mount
    const checkVerificationStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: verificationStatus, error } = await supabase
          .from('driver_verification_status')
          .select('overall_status')
          .eq('driver_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking verification status:', error);
          // On error, assume not approved - show waiting screen
          setShowWaitingScreen(true);
          setLoading(false);
          return;
        }

        console.log('DriverNavigator: Verification status:', verificationStatus?.overall_status);

        // ONLY allow dashboard access if overall_status is 'approved'
        // Everything else: pending_review, rejected, or no record → Show WaitingForApprovalScreen
        if (verificationStatus?.overall_status === 'approved') {
          // Approved - show dashboard
          console.log('DriverNavigator: Driver approved - showing dashboard');
          setShowWaitingScreen(false);
        } else {
          // Not approved (pending_review, rejected, or no status) - show waiting screen
          console.log('DriverNavigator: Driver not approved - showing waiting screen');
          setShowWaitingScreen(true);
        }
      } catch (err) {
        console.error('Error in DriverNavigator verification check:', err);
        // On error, show waiting screen to be safe
        setShowWaitingScreen(true);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, []);

  if (loading) {
    return null; // Or show a loading screen
  }

  // If not approved, show WaitingForApprovalScreen with access to document upload
  if (showWaitingScreen) {
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

  // If approved, show full dashboard with tabs
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Group>
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Group>

      {/* Modal screens - only accessible after approval */}
      <Stack.Group
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          headerStyle: { backgroundColor: '#001a33' },
          headerTintColor: COLORS.textLight,
        }}
      >
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
      </Stack.Group>
    </Stack.Navigator>
  );
}

function MainTabNavigator() {
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
        tabBarActiveTintColor: COLORS.driver.secondary,
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
            Trips: 'car-outline',
            History: 'time-outline',
            Wallet: 'wallet-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Trips" component={TripsStack} />
      <Tab.Screen
        name="Wallet"
        component={DriverWalletScreen}
        options={{ tabBarLabel: 'Transaction History' }}
      />
      <Tab.Screen
        name="History"
        component={DriverTripHistoryScreen}
        options={{ tabBarLabel: 'Trips History' }}
      />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
