import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, ROLES, API_CONFIG } from '../../constants';
import { wp, hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

export default function LoginScreen({ navigation }) {
  const { signIn, signOut, loading, selectedRole, resetRoleSelection, hasSession } = useAuth();
  const colorAnim = React.useRef(new Animated.Value(0)).current;
  const heartbeat = React.useRef(new Animated.Value(0)).current;
  
  // Initialize form based on role
  const getInitialForm = () => {
    if (selectedRole === ROLES.SUPER_ADMIN) {
      return {
        identifier: 'admin@newtaxi.com', // email for super admin
      };
    } else {
      return {
        identifier: '', // phone for vendor/driver
      };
    }
  };

  // Start animations on mount
  React.useEffect(() => {
    // Color animation
    Animated.loop(
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

    // Heartbeat animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeat, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(heartbeat, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(heartbeat, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(heartbeat, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#FF6B6B', '#FFA500', '#FFD700', '#FFA500', '#FF6B6B'],
  });

  const shadowOpacity = heartbeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const shadowRadius = heartbeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  // Reset form when role changes
  React.useEffect(() => {
    setForm(getInitialForm());
  }, [selectedRole]);
  
  const [form, setForm] = useState(getInitialForm());
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleLogin = async () => {
    if (!form.identifier.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // For Super Admin - show OTP field after email verification
    if (selectedRole === ROLES.SUPER_ADMIN) {
      if (!showOtpField) {
        // Request OTP for admin
        try {
          console.log('Requesting OTP for admin:', form.identifier);
          
          // Admin phone number
          const adminPhone = '9686314982';
          
          const response = await fetch(`${API_CONFIG.SMS_API_URL}/sms/otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: adminPhone,
              purpose: 'admin_login'
            }),
            timeout: 10000
          });
          
          console.log('Admin OTP Response status:', response.status);
          const data = await response.json();
          console.log('Admin OTP Response data:', data);
          
          if (data.success || data.otpSent) {
            setShowOtpField(true);
            setOtpSent(true);
            Alert.alert('OTP Sent', `OTP has been sent to your registered phone number`);
          } else {
            Alert.alert('Error', 'Failed to send OTP. Please try again.');
          }
        } catch (error) {
          console.error('Admin OTP Request Error:', error);
          Alert.alert('Network Error', 'Unable to connect to SMS service: ' + error.message);
        }
        return;
      }
      
      // Verify OTP for admin
      if (!otp.trim()) {
        Alert.alert('Error', 'Please enter the OTP');
        return;
      }
      
      try {
        console.log('Verifying admin OTP');
        const adminPhone = '9686314982';
        const response = await fetch(`${API_CONFIG.SMS_API_URL}/sms/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: adminPhone,
            otp: otp
          }),
          timeout: 10000
        });
        
        const data = await response.json();
        console.log('Admin OTP Verify Response:', data);
        
        if (!data.verified) {
          Alert.alert('Error', 'Invalid OTP. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Admin OTP Verify Error:', error);
        Alert.alert('Network Error', 'Unable to verify OTP: ' + error.message);
        return;
      }
    }

    // Validate phone for vendor/driver (must be 10 digits)
    if (selectedRole !== ROLES.SUPER_ADMIN) {
      if (form.identifier.length !== 10 || !/^\d{10}$/.test(form.identifier)) {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number');
        return;
      }
      
      // For vendor/driver, show OTP field instead of direct login
      if (!showOtpField) {
        // Request OTP
        try {
          console.log('Requesting OTP for:', form.identifier);
          console.log('Using API URL:', API_CONFIG.SMS_API_URL);
          
          const response = await fetch(`${API_CONFIG.SMS_API_URL}/sms/otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: form.identifier,
              purpose: 'login'
            }),
            timeout: 10000
          });
          
          console.log('OTP Response status:', response.status);
          const data = await response.json();
          console.log('OTP Response data:', data);
          
          if (data.success || data.otpSent) {
            setShowOtpField(true);
            setOtpSent(true);
            Alert.alert('OTP Sent', `OTP has been sent to ${form.identifier}`);
          } else {
            Alert.alert('Error', 'Failed to send OTP. Please try again.');
          }
        } catch (error) {
          console.error('OTP Request Error:', error);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          Alert.alert('Network Error', 'Unable to connect to SMS service. Make sure the backend is running.\n\nError: ' + error.message);
        }
        return;
      }
      
      // Verify OTP
      if (!otp.trim()) {
        Alert.alert('Error', 'Please enter the OTP');
        return;
      }
      
      try {
        console.log('Verifying OTP for:', form.identifier);
        const response = await fetch(`${API_CONFIG.SMS_API_URL}/sms/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: form.identifier,
            otp: otp
          }),
          timeout: 10000
        });
        
        const data = await response.json();
        console.log('OTP Verify Response:', data);
        
        if (!data.verified) {
          Alert.alert('Error', 'Invalid OTP. Please try again.');
          return;
        }
      } catch (error) {
        console.error('OTP Verify Error:', error);
        Alert.alert('Network Error', 'Unable to verify OTP: ' + error.message);
        return;
      }
    }

    console.log('Unified LoginScreen: Attempting login with role:', selectedRole, 'identifier:', form.identifier);

    const { data, error } = await signIn(form.identifier, '', selectedRole);
    
    if (error) {
      console.error('Unified LoginScreen: Login failed:', error.message);
      Alert.alert('Login Failed', error.message);
    } else {
      console.log('Unified LoginScreen: Login successful');
      // Reset OTP fields on successful login
      setShowOtpField(false);
      setOtp('');
      setOtpSent(false);
    }
    // Success is handled by AuthContext and navigation
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleBackToRoleSelection = () => {
    console.log('Unified LoginScreen: Going back to role selection');
    resetRoleSelection();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getRoleConfig = () => {
    switch (selectedRole) {
      case ROLES.SUPER_ADMIN:
        return {
          title: 'Super Admin Login',
          subtitle: 'System Administrator Access',
          icon: 'shield-checkmark',
          color: COLORS.superAdmin.primary,
          showCredentials: true,
          showSignUp: false,
          inputLabel: 'Email Address',
        };
      case ROLES.VENDOR:
        return {
          title: 'Vendor Login',
          subtitle: 'Business Owner Access',
          icon: 'business',
          color: COLORS.vendor.primary,
          showCredentials: false,
          showSignUp: true,
          inputLabel: 'Phone Number',
        };
      case ROLES.DRIVER:
        return {
          title: 'Driver Login',
          subtitle: 'Service Provider Access',
          icon: 'car',
          color: COLORS.driver.primary,
          showCredentials: false,
          showSignUp: true,
          inputLabel: 'Phone Number',
        };
      default:
        return {
          title: 'Login',
          subtitle: 'Welcome to Kushi Cabs',
          icon: 'car',
          color: COLORS.primary,
          showCredentials: false,
          showSignUp: true,
          inputLabel: 'Phone Number',
        };
    }
  };

  const roleConfig = getRoleConfig();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={roleConfig.color} />
        <Text style={styles.loadingText}>Signing in...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackToRoleSelection}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          {hasSession() && (
            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
          
          <View style={[styles.iconContainer, { backgroundColor: roleConfig.color + '15' }]}>
            <Animated.View 
              style={[
                {
                  backgroundColor: backgroundColor,
                  borderRadius: 40,
                  width: 80,
                  height: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowOpacity: shadowOpacity,
                  shadowColor: '#FF6B6B',
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: shadowRadius,
                  elevation: 12,
                }
              ]}
            >
              <Image
                source={require('../../../logo.jpeg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
          <Text style={[styles.title, { color: roleConfig.color }]}>{roleConfig.title}</Text>
          <Text style={styles.subtitle}>{roleConfig.subtitle}</Text>
        </View>

        {hasSession() && (
          <View style={styles.sessionInfo}>
            <Ionicons name="information-circle" size={16} color={COLORS.warning} />
            <Text style={styles.sessionInfoText}>
              You're already signed in. Sign out to switch roles or continue with current credentials.
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons 
              name={selectedRole === ROLES.SUPER_ADMIN ? "mail-outline" : "call-outline"} 
              size={20} 
              color={COLORS.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder={roleConfig.inputLabel}
              placeholderTextColor={COLORS.textSecondary}
              value={form.identifier}
              onChangeText={(text) => {
                if (selectedRole === ROLES.SUPER_ADMIN) {
                  // Email for super admin - no restriction
                  setForm(prev => ({ ...prev, identifier: text }));
                } else {
                  // Phone for vendor/driver - only 10 digits
                  const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
                  setForm(prev => ({ ...prev, identifier: digitsOnly }));
                }
              }}
              keyboardType={selectedRole === ROLES.SUPER_ADMIN ? "email-address" : "phone-pad"}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={selectedRole === ROLES.SUPER_ADMIN ? 100 : 10}
              editable={!showOtpField}
            />
          </View>

          {showOtpField && (
            <View style={[styles.otpContainer, { borderColor: roleConfig.color }]}>
              <View style={styles.otpHeader}>
                <Ionicons name="shield-checkmark-outline" size={20} color={roleConfig.color} />
                <Text style={[styles.otpTitle, { color: roleConfig.color }]}>Verify with OTP</Text>
              </View>
              <Text style={styles.otpSubtitle}>
                {selectedRole === ROLES.SUPER_ADMIN 
                  ? 'Enter the 6-digit code sent to your registered phone'
                  : `Enter the 6-digit code sent to ${form.identifier}`
                }
              </Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={COLORS.textSecondary}
                  value={otp}
                  onChangeText={(text) => {
                    const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtp(digitsOnly);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  autoFocus
                />
              </View>

              {otpSent && (
                <TouchableOpacity style={styles.resendOtpButton}>
                  <Text style={[styles.resendOtpText, { color: roleConfig.color }]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: roleConfig.color }, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textLight} />
            ) : (
              <Text style={styles.loginButtonText}>
                {showOtpField ? 'Verify & Sign In' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {showOtpField && (
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => {
                setShowOtpField(false);
                setOtp('');
                setOtpSent(false);
              }}
            >
              <Text style={[styles.backToLoginText, { color: roleConfig.color }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          )}

          {!showOtpField && roleConfig.showSignUp && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.signUpButton, { borderColor: roleConfig.color }]}
                onPress={handleSignUp}
              >
                <Text style={[styles.signUpButtonText, { color: roleConfig.color }]}>
                  Create New Account
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selectedRole === ROLES.SUPER_ADMIN 
              ? 'Secure Admin Access' 
              : `Welcome to Kushi Cabs ${roleConfig.title.split(' ')[0]}`
            }
          </Text>
          <Text style={styles.footerSubtext}>
            {selectedRole === ROLES.SUPER_ADMIN 
              ? 'Complete control over your cab business'
              : 'Connect with passengers and grow your business'
            }
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    padding: getResponsivePadding(24),
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(4),
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: -20,
    left: 0,
    padding: 8,
    zIndex: 1,
  },
  signOutButton: {
    position: 'absolute',
    top: -20,
    right: 0,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  signOutText: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.error,
    marginLeft: 4,
    fontWeight: '500',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sessionInfo: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  sessionInfoText: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.warning,
    marginLeft: 8,
    flex: 1,
  },
  credentialsInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: hp(4),
    borderLeftWidth: 4,
    borderLeftColor: COLORS.superAdmin.primary,
  },
  credentialsTitle: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    marginBottom: 8,
  },
  credentialsText: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.text,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  credentialsNote: {
    fontSize: getResponsiveFontSize(11),
    color: COLORS.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  form: {
    marginBottom: hp(4),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: getResponsiveFontSize(16),
    color: COLORS.text,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 8,
  },
  otpContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 16,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    marginLeft: 8,
  },
  otpSubtitle: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  resendOtpButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 12,
  },
  resendOtpText: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backToLoginText: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    color: COLORS.textLight,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: getResponsiveFontSize(14),
    color: COLORS.textSecondary,
  },
  signUpButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
  },
  signUpButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: getResponsiveFontSize(14),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.textSecondary,
    marginTop: 4,
    opacity: 0.7,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: getResponsiveFontSize(16),
    color: COLORS.textSecondary,
    marginTop: 16,
  },
});