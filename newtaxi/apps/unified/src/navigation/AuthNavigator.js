import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS, ROLES } from '../constants';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import PolicyScreen from '../screens/common/PolicyScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { selectedRole, hasSession, hasUser } = useAuth();

  const getRoleColor = () => {
    switch (selectedRole) {
      case ROLES.SUPER_ADMIN:
        return COLORS.superAdmin.primary;
      case ROLES.VENDOR:
        return COLORS.vendor.primary;
      case ROLES.DRIVER:
        return COLORS.driver.primary;
      default:
        return COLORS.primary;
    }
  };

  const getRoleTitle = () => {
    switch (selectedRole) {
      case ROLES.SUPER_ADMIN:
        return 'Super Admin';
      case ROLES.VENDOR:
        return 'Vendor';
      case ROLES.DRIVER:
        return 'Driver';
      default:
        return 'Kushi Cabs';
    }
  };

  // Determine initial route based on auth state
  const getInitialRouteName = () => {
    // If user has session but no profile, go directly to Register
    if (hasSession() && !hasUser() && selectedRole) {
      console.log('AuthNavigator: User has session but no profile, starting with Register');
      return 'Register';
    }
    // Otherwise start with Login
    return 'Login';
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerStyle: {
          backgroundColor: getRoleColor(),
        },
        headerTintColor: COLORS.textLight,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ 
          title: `${getRoleTitle()} Login`,
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen} 
        options={{ 
          title: `${getRoleTitle()} Sign Up` 
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
        name="Register" 
        component={RegisterScreen} 
        options={{ 
          title: `Complete ${getRoleTitle()} Registration`,
          headerLeft: hasSession() && !hasUser() ? null : undefined, // Hide back button if completing registration
        }} 
        initialParams={{ role: selectedRole }}
      />
      <Stack.Screen 
        name="Otp" 
        component={OtpScreen} 
        options={{ 
          title: 'Verify Phone' 
        }} 
      />
    </Stack.Navigator>
  );
}