import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, ROLES, API_CONFIG } from '../../constants';
import { wp, hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';
import { glassStyles } from '../../styles/glassomorphism';
import { useAnimatedBorder } from '../../hooks/useAnimatedBorder';

export default function SignUpScreen({ navigation }) {
  const { signUp, loading, selectedRole, setIncompleteSignupPhone } = useAuth();
  const [form, setForm] = useState({
    phone: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSignUp = async () => {
    if (!form.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Validate phone number - must be exactly 10 digits
    if (form.phone.length !== 10 || !/^\d{10}$/.test(form.phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (!agreed) {
      Alert.alert('Terms Required', 'Please accept the Terms & Conditions and Cancellation Policy to continue.');
      return;
    }

    // Show OTP field
    if (!showOtpField) {
      // Request OTP
      try {
        console.log('Requesting OTP for new signup:', form.phone);
        
        // Create abort controller for timeout (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(`${API_CONFIG.SMS_API_URL}/sms/otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: form.phone,
            purpose: 'signup'
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        console.log('OTP Response:', data);
        
        if (data.success || data.otpSent) {
          setShowOtpField(true);
          setOtpSent(true);
          Alert.alert('OTP Sent', `OTP has been sent to ${form.phone}`);
        } else {
          Alert.alert('Error', 'Failed to send OTP. Please try again.');
        }
      } catch (error) {
        console.error('OTP Request Error:', error);
        
        if (error.name === 'AbortError') {
          Alert.alert('Timeout', 'Request timed out. Please check your connection and try again.');
        } else {
          Alert.alert('Network Error', 'Unable to connect to SMS service.\n\nError: ' + error.message);
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
      console.log('Verifying OTP for signup:', form.phone);
      
      // Create abort controller for timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(`${API_CONFIG.SMS_API_URL}/sms/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: form.phone,
          otp: otp
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      console.log('OTP Verify Response:', data);
      
      if (!data.verified) {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
        return;
      }
    } catch (error) {
      console.error('OTP Verify Error:', error);
      
      if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'Verification request timed out. Please try again.');
      } else {
        Alert.alert('Network Error', 'Unable to verify OTP: ' + error.message);
      }
      return;
    }

    // OTP verified - create account
    console.log('OTP verified, creating account for:', form.phone);
    
    // For vendor and driver, use phone-based signup with temporary password
    const tempPassword = 'OTP-' + form.phone + '-' + Math.random().toString(36).substring(7);
    const { data, error } = await signUp(form.phone, tempPassword, selectedRole);
    
    if (error) {
      console.error('SignUp returned error:', error);
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    console.log('✅ SignUp successful');
    console.log('Setting incomplete signup phone and navigating to Register...');
    
    // Store phone for Register screen to use
    setIncompleteSignupPhone(form.phone);
    
    // Navigate directly to Register
    console.log('📍 Navigating to Register screen');
    navigation.navigate('Register', { 
      role: selectedRole, 
      phone: form.phone.replace(/\s/g, '') 
    });
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleResendOtp = async () => {
    if (!form.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    try {
      console.log('Resending OTP for signup:', form.phone);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${API_CONFIG.SMS_API_URL}/sms/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: form.phone,
          purpose: 'signup'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      console.log('Resend OTP Response:', data);
      
      if (data.success || data.otpSent) {
        setOtp(''); // Clear previous OTP
        Alert.alert('OTP Resent', `New OTP has been sent to ${form.phone}`);
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
      case ROLES.VENDOR:
        return {
          title: 'Create Vendor Account',
          subtitle: 'Join as a Business Owner',
          icon: 'business',
          color: COLORS.vendor.primary,
          description: 'Create trip enquiries and manage your cab business',
          inputLabel: 'Phone Number',
        };
      case ROLES.DRIVER:
        return {
          title: 'Create Driver Account',
          subtitle: 'Join as a Service Provider',
          icon: 'car',
          color: COLORS.driver.primary,
          description: 'Accept trips and earn money by providing cab services',
          inputLabel: 'Phone Number',
        };
      default:
        return {
          title: 'Create Account',
          subtitle: 'Join Kushi Cabs',
          icon: 'person-add',
          color: COLORS.primary,
          description: 'Get started with Kushi Cabs',
          inputLabel: 'Phone Number',
        };
    }
  };

  const roleConfig = getRoleConfig();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: '#1a1a2e' }]}>
            <Ionicons name={roleConfig.icon} size={40} color={roleConfig.color} />
          </View>
          <Text style={[styles.title, { color: '#ffffff' }]}>{roleConfig.title}</Text>
          <Text style={styles.subtitle}>{roleConfig.subtitle}</Text>
          <Text style={styles.description}>{roleConfig.description}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={roleConfig.inputLabel}
              placeholderTextColor={COLORS.textSecondary}
              value={form.phone}
              onChangeText={(text) => {
                // Allow only digits and limit to 10 digits
                const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
                setForm(prev => ({ ...prev, phone: digitsOnly }));
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
                Enter the 6-digit code sent to {form.phone}
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
              style={[
                styles.signUpButton, 
                loading && styles.signUpButtonDisabled
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textLight} />
              ) : (
                <Text style={styles.signUpButtonText}>
                  {showOtpField ? 'Verify & Create Account' : 'Send OTP'}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {showOtpField && (
            <TouchableOpacity
              style={styles.backToPhoneButton}
              onPress={() => {
                setShowOtpField(false);
                setOtp('');
                setOtpSent(false);
              }}
            >
              <Text style={[styles.backToPhoneText, { color: roleConfig.color }]}>
                Back to Phone Number
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.termsRow}>
            <TouchableOpacity style={styles.checkbox} onPress={() => setAgreed(prev => !prev)}>
              <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={20} color={agreed ? roleConfig.color : COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.policiesListContainer}>
              <Text style={styles.termsLabel}>I agree to all policies:</Text>
              <View style={styles.policiesList}>
                <TouchableOpacity 
                  style={[styles.policyLink, { backgroundColor: roleConfig.color + '15', borderColor: roleConfig.color + '40' }]}
                  onPress={() => navigation.navigate('Terms', { policyType: 'terms_conditions' })}
                >
                  <Ionicons name="document-text-outline" size={14} color={roleConfig.color} />
                  <Text style={[styles.policyLinkText, { color: roleConfig.color }]}>Terms</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.policyLink, { backgroundColor: roleConfig.color + '15', borderColor: roleConfig.color + '40' }]}
                  onPress={() => navigation.navigate('CancellationPolicy', { policyType: 'cancellation_policy' })}
                >
                  <Ionicons name="close-circle-outline" size={14} color={roleConfig.color} />
                  <Text style={[styles.policyLinkText, { color: roleConfig.color }]}>Cancellation</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.policyLink, { backgroundColor: roleConfig.color + '15', borderColor: roleConfig.color + '40' }]}
                  onPress={() => navigation.navigate('PrivacyPolicy', { policyType: 'privacy_policy' })}
                >
                  <Ionicons name="shield-outline" size={14} color={roleConfig.color} />
                  <Text style={[styles.policyLinkText, { color: roleConfig.color }]}>Privacy</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.policyLink, { backgroundColor: roleConfig.color + '15', borderColor: roleConfig.color + '40' }]}
                  onPress={() => navigation.navigate('RefundPolicy', { policyType: 'refund_policy' })}
                >
                  <Ionicons name="cash-outline" size={14} color={roleConfig.color} />
                  <Text style={[styles.policyLinkText, { color: roleConfig.color }]}>Refund</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.policyLink, { backgroundColor: roleConfig.color + '15', borderColor: roleConfig.color + '40' }]}
                  onPress={() => navigation.navigate('SafetyGuidelines', { policyType: 'safety_guidelines' })}
                >
                  <Ionicons name="warning-outline" size={14} color={roleConfig.color} />
                  <Text style={[styles.policyLinkText, { color: roleConfig.color }]}>Safety</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={[styles.loginLink, { color: roleConfig.color }]}>Sign In</Text>
          </TouchableOpacity>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(3),
    backgroundColor: '#001a33',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  description: {
    fontSize: getResponsiveFontSize(14),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  form: {
    marginBottom: hp(3),
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
  backToPhoneButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backToPhoneText: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
  signUpButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 0,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  checkbox: {
    marginTop: 2,
    marginRight: 4,
  },
  policiesListContainer: {
    flex: 1,
  },
  termsLabel: {
    color: COLORS.textSecondary,
    fontSize: getResponsiveFontSize(11),
    fontWeight: '600',
    marginBottom: 6,
  },
  policiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  policyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  policyLinkText: {
    fontSize: getResponsiveFontSize(11),
    fontWeight: '600',
  },
  termsText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: getResponsiveFontSize(13),
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footerText: {
    fontSize: getResponsiveFontSize(14),
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
});
