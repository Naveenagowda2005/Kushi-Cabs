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
import { glassStyles } from '../../styles/glassomorphism';
import { useAnimatedBorder } from '../../hooks/useAnimatedBorder';

export default function LoginScreen({ navigation }) {
  const { signIn, signOut, loading, selectedRole, resetRoleSelection, hasSession } = useAuth();
  const colorAnim = React.useRef(new Animated.Value(0)).current;
  const heartbeat = React.useRef(new Animated.Value(0)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  const pulse1 = React.useRef(new Animated.Value(0)).current;
  const pulse2 = React.useRef(new Animated.Value(0)).current;
  const pulse3 = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const borderGlowAnim = React.useRef(new Animated.Value(0)).current;
  const gpsRing1 = React.useRef(new Animated.Value(0)).current;
  const gpsRing2 = React.useRef(new Animated.Value(0)).current;
  const gpsRing3 = React.useRef(new Animated.Value(0)).current;
  
  // Initialize form based on role
  const getInitialForm = () => {
    return {
      identifier: '', // phone for all roles
    };
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

    // Glow animation for Super Admin
    if (selectedRole === ROLES.SUPER_ADMIN) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Pulse rings
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(pulse1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(pulse2, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(pulse2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(pulse3, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(pulse3, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Scale animation for logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Border glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(borderGlowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(borderGlowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // GPS Ring animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(gpsRing1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(gpsRing1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(gpsRing2, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(gpsRing2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(gpsRing3, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(gpsRing3, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      // For Vendor and Driver - same animations but different colors
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Pulse rings
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(pulse1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(pulse2, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(pulse2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(pulse3, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(pulse3, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Scale animation for logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Border glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(borderGlowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(borderGlowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // GPS Ring animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(gpsRing1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(gpsRing1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(gpsRing2, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(gpsRing2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1200),
          Animated.timing(gpsRing3, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(gpsRing3, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [selectedRole]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#ffffff', '#f0f0f0', '#e8e8e8', '#f0f0f0', '#ffffff'],
  });

  const shadowOpacity = heartbeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const shadowRadius = heartbeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const glowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 60],
  });

  // Pulse ring animations
  const pulse1Scale = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const pulse1Opacity = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  const pulse2Scale = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const pulse2Opacity = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  const pulse3Scale = pulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const pulse3Opacity = pulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  // Logo rotation and scale
  const logoRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const logoScale = scaleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  // Border glow animation
  const borderWidth = borderGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 5],
  });

  const borderGlowOpacity = borderGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const borderShadowRadius = borderGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 30],
  });

  // GPS Ring animations
  const gpsRing1Scale = gpsRing1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2.5],
  });

  const gpsRing1Opacity = gpsRing1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const gpsRing2Scale = gpsRing2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2.5],
  });

  const gpsRing2Opacity = gpsRing2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const gpsRing3Scale = gpsRing3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2.5],
  });

  const gpsRing3Opacity = gpsRing3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
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

    // Validate phone for all roles (must be 10 digits)
    if (form.identifier.length !== 10 || !/^\d{10}$/.test(form.identifier)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    // Show OTP field
    if (!showOtpField) {
      // Request OTP
      try {
        console.log('Requesting OTP for:', form.identifier);
        console.log('Using API URL:', API_CONFIG.SMS_API_URL);
        
        // Create abort controller for timeout (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(`${API_CONFIG.SMS_API_URL}/sms/otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: form.identifier,
            purpose: 'login'
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
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
        
        if (error.name === 'AbortError') {
          Alert.alert('Timeout', 'Request timed out. Please check your connection and try again.');
        } else {
          Alert.alert('Network Error', 'Unable to connect to SMS service. Make sure the backend is running at ' + API_CONFIG.SMS_API_URL + '\n\nError: ' + error.message);
        }
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
      console.log('OTP value:', otp);
      console.log('Using API URL:', API_CONFIG.SMS_API_URL);
      
      // Create abort controller for timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const verifyUrl = `${API_CONFIG.SMS_API_URL}/sms/verify`;
      console.log('Verify endpoint:', verifyUrl);
      
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          to: form.identifier,
          otp: otp
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Verify Response status:', response.status);
      console.log('Verify Response headers:', response.headers);
      
      const data = await response.json();
      console.log('OTP Verify Response data:', data);
      console.log('OTP Verify Response verified field:', data.verified);
      
      if (!data.verified) {
        Alert.alert('Error', data.message || 'Invalid OTP. Please try again.');
        return;
      }
    } catch (error) {
      console.error('OTP Verify Error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'Verification request timed out. Please try again.');
      } else {
        Alert.alert('Unable to verify OTP', 'Network request failed: ' + error.message);
      }
      return;
    }

    console.log('Unified LoginScreen: Attempting login with role:', selectedRole, 'phone:', form.identifier);

    const phoneDigits = form.identifier.replace(/[^0-9]/g, '');
    const { data, error } = await signIn(phoneDigits, '', selectedRole);
    
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

  const handleResendOtp = async () => {
    if (!form.identifier.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    try {
      console.log('Resending OTP for:', form.identifier);
      
      // Create abort controller for timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${API_CONFIG.SMS_API_URL}/sms/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: form.identifier,
          purpose: 'login'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      console.log('Resend OTP Response:', data);
      
      if (data.success || data.otpSent) {
        setOtp(''); // Clear previous OTP
        Alert.alert('OTP Resent', `New OTP has been sent to ${form.identifier}`);
      } else {
        Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      
      if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'Request timed out. Please check your connection and try again.');
      } else {
        Alert.alert('Network Error', 'Unable to resend OTP: ' + error.message);
      }
    }
  };

  const getRoleConfig = () => {
    switch (selectedRole) {
      case ROLES.SUPER_ADMIN:
        return {
          title: 'Admin Login',
          subtitle: 'System Administrator Access',
          icon: 'shield-checkmark',
          color: COLORS.superAdmin.primary,
          showCredentials: false,
          showSignUp: false,
          inputLabel: 'Phone Number',
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
          
          <View style={[styles.iconContainer, { backgroundColor: '#1a1a2e' }]}>
            {/* Pulse rings */}
            {selectedRole === ROLES.SUPER_ADMIN && (
              <>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 2,
                      borderColor: '#ffffff',
                      transform: [{ scale: pulse1Scale }],
                      opacity: pulse1Opacity,
                    }
                  ]}
                />
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 2,
                      borderColor: '#ffffff',
                      transform: [{ scale: pulse2Scale }],
                      opacity: pulse2Opacity,
                    }
                  ]}
                />
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 2,
                      borderColor: '#ffffff',
                      transform: [{ scale: pulse3Scale }],
                      opacity: pulse3Opacity,
                    }
                  ]}
                />
              </>
            )}
            {selectedRole !== ROLES.SUPER_ADMIN && (
              <>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 2,
                      borderColor: roleConfig.color,
                      transform: [{ scale: pulse1Scale }],
                      opacity: pulse1Opacity,
                    }
                  ]}
                />
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 2,
                      borderColor: roleConfig.color,
                      transform: [{ scale: pulse2Scale }],
                      opacity: pulse2Opacity,
                    }
                  ]}
                />
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 2,
                      borderColor: roleConfig.color,
                      transform: [{ scale: pulse3Scale }],
                      opacity: pulse3Opacity,
                    }
                  ]}
                />
              </>
            )}
            
            {/* Logo */}
            <Animated.View 
              style={[
                {
                  backgroundColor: backgroundColor,
                  borderRadius: 40,
                  width: 80,
                  height: 80,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: borderWidth,
                  borderColor: selectedRole === ROLES.SUPER_ADMIN ? '#ffffff' : roleConfig.color,
                  shadowOpacity: borderGlowOpacity,
                  shadowColor: selectedRole === ROLES.SUPER_ADMIN ? '#ffffff' : roleConfig.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: borderShadowRadius,
                  elevation: 12,
                  transform: [
                    { scale: logoScale }
                  ],
                }
              ]}
            >
              <Image
                source={require('../../../app.icon.jpeg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
          <Text style={[styles.title, { color: '#ffffff' }]}>{roleConfig.title}</Text>
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
              name="call-outline" 
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
                // Phone for all roles - only 10 digits
                const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
                setForm(prev => ({ ...prev, identifier: digitsOnly }));
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={10}
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
                <TouchableOpacity style={styles.resendOtpButton} onPress={handleResendOtp}>
                  <Text style={[styles.resendOtpText, { color: roleConfig.color }]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Animated.View
            style={{
              borderColor: useAnimatedBorder('#9333ea', '#00d4ff', 2000),
              borderWidth: 2,
              borderRadius: 12,
              backgroundColor: roleConfig.color + 'da',
              shadowColor: roleConfig.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 6,
              marginTop: 8,
            }}
          >
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
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
          </Animated.View>

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
    backgroundColor: '#001a33',
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
    backgroundColor: '#001a33',
    paddingVertical: 20,
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
    ...glassStyles.banner,
    borderLeftColor: COLORS.warning,
    marginBottom: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
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
    ...glassStyles.input,
    flexDirection: 'row',
    alignItems: 'center',
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
    ...glassStyles.cardActive,
    borderLeftWidth: 4,
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
    paddingVertical: 18,
    alignItems: 'center',
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
    ...glassStyles.buttonSecondary,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
  },
  signUpButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: COLORS.text,
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
