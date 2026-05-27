import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Driver screens - we'll create these next
import DriverDashboardScreen from '../screens/driver/DashboardScreen';
import DriverTripDetailScreen from '../screens/driver/TripDetailScreen';
import DriverActiveTripScreen from '../screens/driver/ActiveTripScreen';
import DriverTripHistoryScreen from '../screens/driver/TripHistoryScreen';
import DriverCompletedTripDetailScreen from '../screens/driver/CompletedTripDetailScreen';
import DriverWalletScreen from '../screens/driver/WalletScreen';
import DriverProfileScreen from '../screens/driver/ProfileScreen';
import PolicyScreen from '../screens/common/PolicyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TripsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.driver.primary },
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
        headerStyle: { backgroundColor: COLORS.driver.primary },
        headerTintColor: COLORS.textLight,
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={DriverProfileScreen}
        options={{ title: 'Profile' }}
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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: COLORS.driver.primary, 
          borderTopColor: '#16213e',
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