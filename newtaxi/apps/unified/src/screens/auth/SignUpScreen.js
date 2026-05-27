import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, ROLES } from '../../constants';
import { wp, hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

export default function SignUpScreen({ navigation }) {
  const { signUp, loading, selectedRole } = useAuth();
  const [form, setForm] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSignUp = async () => {
    if (!form.phone.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate phone number - must be exactly 10 digits
    if (form.phone.length !== 10 || !/^\d{10}$/.test(form.phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!agreed) {
      Alert.alert('Terms Required', 'Please accept the Terms & Conditions and Cancellation Policy to continue.');
      return;
    }

    // For vendor and driver, use phone-based signup
    const { data, error } = await signUp(form.phone, form.password);
    
    if (error) {
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    // Navigate to registration screen with selected role and phone
    navigation.navigate('Register', { role: selectedRole, phone: form.phone.replace(/\s/g, '') });
  };

  const handleLogin = () => {
    navigation.navigate('Login');
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
          <View style={[styles.iconContainer, { backgroundColor: roleConfig.color + '15' }]}>
            <Ionicons name={roleConfig.icon} size={40} color={roleConfig.color} />
          </View>
          <Text style={[styles.title, { color: roleConfig.color }]}>{roleConfig.title}</Text>
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
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={COLORS.textSecondary}
              value={form.password}
              onChangeText={(text) => setForm(prev => ({ ...prev, password: text }))}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.textSecondary}
              value={form.confirmPassword}
              onChangeText={(text) => setForm(prev => ({ ...prev, confirmPassword: text }))}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.signUpButton, 
              { backgroundColor: roleConfig.color },
              loading && styles.signUpButtonDisabled
            ]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textLight} />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.termsRow}>
            <TouchableOpacity style={styles.checkbox} onPress={() => setAgreed(prev => !prev)}>
              <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={20} color={agreed ? roleConfig.color : COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={[styles.link, { color: roleConfig.color }]} onPress={() => navigation.navigate('Terms')}>Terms & Conditions</Text>
              {' '}and{' '}
              <Text style={[styles.link, { color: roleConfig.color }]} onPress={() => navigation.navigate('CancellationPolicy')}>Cancellation Policy</Text>
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
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
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    padding: getResponsivePadding(24),
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(3),
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
  signUpButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    color: COLORS.textLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    marginRight: 8,
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