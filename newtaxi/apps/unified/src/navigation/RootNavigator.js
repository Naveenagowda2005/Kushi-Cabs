import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { COLORS, ROLES } from '../constants';

// Navigation components
import AuthNavigator from './AuthNavigator';
import SuperAdminNavigator from './SuperAdminNavigator';
import VendorNavigator from './VendorNavigator';
import DriverNavigator from './DriverNavigator';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import SplashScreen from '../screens/auth/SplashScreen';

export default function RootNavigator() {
  const { loading, hasSession, hasUser, getUserRole, selectedRole, incompleteDriverDocuments } = useAuth();
  const { forceUpdate } = useTheme();
  
  // Force re-render of all child navigators when theme changes
  const [navThemeRefresh, setNavThemeRefresh] = useState(0);
  useEffect(() => {
    setNavThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for 2 seconds on app startup, but minimum 1 second
    const timer = setTimeout(() => {
      console.log('Splash screen timer done, current state:', {
        loading,
        hasSession: hasSession(),
        hasUser: hasUser(),
        incompleteDriverDocuments,
      });
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [loading]);

  console.log('RootNavigator render:', {
    loading,
    hasSession: hasSession(),
    hasUser: hasUser(),
    userRole: getUserRole(),
    selectedRole,
    incompleteDriverDocuments,
    showSplash,
  });

  // Show splash screen first
  if (showSplash) {
    console.log('Showing splash screen');
    return <SplashScreen />;
  }

  if (loading) {
    console.log('Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If driver has incomplete documents, show document upload (in auth flow)
  if (hasSession() && hasUser() && incompleteDriverDocuments && getUserRole() === ROLES.DRIVER) {
    console.log('Driver has incomplete documents, redirecting to auth navigator');
    return <AuthNavigator />;
  }

  // If user has completed profile, route to their role's app
  if (hasSession() && hasUser()) {
    const userRole = getUserRole();
    console.log('User has profile, routing to role:', userRole);

    switch (userRole) {
      case ROLES.SUPER_ADMIN:
        return <SuperAdminNavigator />;
      case ROLES.VENDOR:
        return <VendorNavigator />;
      case ROLES.DRIVER:
        return <DriverNavigator />;
      default:
        console.log('Unknown role, showing role selection');
        return <RoleSelectionScreen />;
    }
  }

  // If user has session but no profile, they need to complete registration
  if (hasSession() && !hasUser()) {
    console.log('User has session but no profile, needs to complete registration');
    // If they have a selected role, show auth navigator (which will show registration)
    if (selectedRole) {
      console.log('Showing auth navigator for registration completion, role:', selectedRole);
      return <AuthNavigator />;
    } else {
      // If no role selected, show role selection first
      console.log('No role selected for incomplete registration, showing role selection');
      return <RoleSelectionScreen />;
    }
  }

  // If no role selected yet, show role selection
  if (!selectedRole) {
    console.log('No role selected, showing role selection');
    return <RoleSelectionScreen />;
  }

  // If role selected, show auth navigator for that role
  console.log('Role selected, showing auth navigator for:', selectedRole);
  return <AuthNavigator />;
}
