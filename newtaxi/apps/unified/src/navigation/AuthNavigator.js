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
import ViewPolicyScreen from '../screens/common/ViewPolicyScreen';
import DriverDocumentUploadScreen from '../screens/driver/DriverDocumentUploadScreen';
import DriverOnboardingTimelineScreen from '../screens/driver/DriverOnboardingTimelineScreen';
import WaitingForApprovalScreen from '../screens/driver/WaitingForApprovalScreen';
import VendorDocumentUploadScreen from '../screens/vendor/VendorDocumentUploadScreen';
import VendorWaitingForApprovalScreen from '../screens/vendor/VendorWaitingForApprovalScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { selectedRole, hasSession, hasUser, session, incompleteSignupPhone, incompleteDriverDocuments } = useAuth();

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

  // Extract phone from auth user's email (format: {phone}@kushicabs.phone)
  const getPhoneFromEmail = () => {
    const email = session?.user?.email;
    if (email && email.endsWith('@kushicabs.phone')) {
      return email.replace('@kushicabs.phone', '');
    }
    return '';
  };

  // Determine initial route based on auth state
  const getInitialRouteName = () => {
    // If driver has incomplete documents (logging in), go directly to document upload
    if (hasSession() && hasUser() && incompleteDriverDocuments && selectedRole === ROLES.DRIVER) {
      console.log('AuthNavigator: Driver with incomplete documents detected, starting with DriverDocumentUpload');
      return 'DriverDocumentUpload';
    }
    
    // If we have incomplete signup phone, user just completed signup - show Register
    if (incompleteSignupPhone && selectedRole) {
      console.log('AuthNavigator: Incomplete signup detected, starting with Register');
      return 'Register';
    }
    
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
        component={ViewPolicyScreen}
        options={{ title: 'Terms & Conditions' }}
        initialParams={{ policyType: 'terms_conditions' }}
      />
      <Stack.Screen
        name="CancellationPolicy"
        component={ViewPolicyScreen}
        options={{ title: 'Cancellation Policy' }}
        initialParams={{ policyType: 'cancellation_policy' }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={ViewPolicyScreen}
        options={{ title: 'Privacy Policy' }}
        initialParams={{ policyType: 'privacy_policy' }}
      />
      <Stack.Screen
        name="RefundPolicy"
        component={ViewPolicyScreen}
        options={{ title: 'Refund Policy' }}
        initialParams={{ policyType: 'refund_policy' }}
      />
      <Stack.Screen
        name="SafetyGuidelines"
        component={ViewPolicyScreen}
        options={{ title: 'Safety Guidelines' }}
        initialParams={{ policyType: 'safety_guidelines' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ 
          title: `Complete ${getRoleTitle()} Registration`,
          headerLeft: hasSession() && !hasUser() ? null : undefined, // Hide back button if completing registration
        }} 
        initialParams={{ role: selectedRole, phone: incompleteSignupPhone || getPhoneFromEmail() }}
      />
      <Stack.Screen 
        name="Otp" 
        component={OtpScreen} 
        options={{ 
          title: 'Verify Phone' 
        }} 
      />
      <Stack.Screen 
        name="DriverDocumentUpload" 
        component={DriverDocumentUploadScreen} 
        options={{ 
          title: 'Upload Documents',
          headerLeft: () => null, // Hide back button - must complete document upload
        }} 
      />
      <Stack.Screen 
        name="DriverOnboardingTimeline" 
        component={DriverOnboardingTimelineScreen} 
        options={{ 
          title: 'Your Onboarding Journey',
          headerLeft: () => null, // Hide back button during onboarding
        }} 
      />
      <Stack.Screen 
        name="WaitingForApproval" 
        component={WaitingForApprovalScreen} 
        options={{ 
          title: 'Waiting for Approval',
          headerLeft: () => null, // Hide back button - must wait for approval
        }} 
      />
      <Stack.Screen 
        name="VendorDocumentUpload" 
        component={VendorDocumentUploadScreen} 
        options={{ 
          title: 'Upload Documents',
          headerLeft: () => null, // Hide back button - must complete document upload
        }} 
      />
      <Stack.Screen 
        name="VendorWaitingForApproval" 
        component={VendorWaitingForApprovalScreen} 
        options={{ 
          title: 'Waiting for Approval',
          headerLeft: () => null, // Hide back button - must wait for approval
        }} 
      />
    </Stack.Navigator>
  );
}
