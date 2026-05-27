import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Vendor screens - we'll create these next
import VendorEnquiriesScreen from '../screens/vendor/EnquiriesScreen';
import VendorEnquiryDetailScreen from '../screens/vendor/EnquiryDetailScreen';
import VendorCreateTripScreen from '../screens/vendor/CreateTripScreen';
import VendorEarningsScreen from '../screens/vendor/EarningsScreen';
import VendorTripHistoryScreen from '../screens/vendor/TripHistoryScreen';
import VendorWalletScreen from '../screens/vendor/WalletScreen';
import VendorProfileScreen from '../screens/vendor/ProfileScreen';
import VendorSettingsScreen from '../screens/vendor/SettingsScreen';
import CompletedTripDetailScreen from '../screens/driver/CompletedTripDetailScreen';
import PolicyScreen from '../screens/common/PolicyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function EnquiriesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.vendor.primary },
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
        headerStyle: { backgroundColor: COLORS.vendor.primary },
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
    </Stack.Navigator>
  );
}

export default function VendorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: COLORS.vendor.primary, 
          borderTopColor: '#16213e',
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