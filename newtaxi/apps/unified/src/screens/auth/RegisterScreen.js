import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, ROLES } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

export default function RegisterScreen({ route, navigation }) {
  const { createUserProfile, loading, selectedRole, session, incompleteSignupPhone } = useAuth();

  const role = route.params?.role || selectedRole;
  // Phone can come from: route params -> context state -> extracted from auth email
  let phone = route.params?.phone || incompleteSignupPhone || '';
  
  // If phone not in params or context, extract from auth email (format: {phone}@kushicabs.phone)
  if (!phone && session?.user?.email?.endsWith('@kushicabs.phone')) {
    phone = session.user.email.replace('@kushicabs.phone', '');
  }

  console.log('RegisterScreen: Role for registration:', role, 'Phone:', phone);

  const [form, setForm] = useState({
    full_name: '',
    // Vendor specific
    business_name: '',
    // Driver specific
    license_number: '',
    vehicle_number: '',
  });

  const handleRegister = async () => {
    if (!form.full_name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (role === ROLES.VENDOR && !form.business_name.trim()) {
      Alert.alert('Error', 'Please enter your business name');
      return;
    }

    if (role === ROLES.DRIVER) {
      if (!form.license_number.trim() || !form.vehicle_number.trim()) {
        Alert.alert('Error', 'Please fill in license and vehicle number');
        return;
      }
    }

    const userData = {
      full_name: form.full_name,
      phone,                        // use the phone from SignUp screen
    };

    if (role === ROLES.VENDOR) {
      userData.business_name = form.business_name;
    } else if (role === ROLES.DRIVER) {
      userData.license_number = form.license_number;
      userData.vehicle_number = form.vehicle_number;
    }

    const { data, error } = await createUserProfile(userData, role);

    if (error) {
      console.error('RegisterScreen: Registration failed:', error.message);
      Alert.alert('Registration Failed', error.message);
    } else {
      console.log('RegisterScreen: Registration successful');
      
      // For drivers, redirect to document upload screen
      if (role === ROLES.DRIVER) {
        console.log('RegisterScreen: Redirecting driver to document upload');
        // Navigate directly to document upload screen
        navigation.navigate('DriverDocumentUpload');
      } else {
        // For vendors, show success and they can proceed to dashboard
        Alert.alert('Success', 'Registration completed successfully!', [
          { text: 'OK' }
        ]);
      }
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case ROLES.VENDOR: return 'Vendor Registration';
      case ROLES.DRIVER: return 'Driver Registration';
      default: return 'Complete Registration';
    }
  };

  const getButtonText = () => {
    switch (role) {
      case ROLES.DRIVER: return 'Next Step';
      default: return 'Complete Registration';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case ROLES.VENDOR: return 'business-outline';
      case ROLES.DRIVER: return 'car-outline';
      default: return 'person-outline';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case ROLES.VENDOR: return COLORS.vendor.primary;
      case ROLES.DRIVER: return COLORS.driver.primary;
      default: return COLORS.primary;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: getRoleColor() + '20' }]}>
            <Ionicons name={getRoleIcon()} size={32} color={getRoleColor()} />
          </View>
          <Text style={styles.title}>{getRoleTitle()}</Text>
          <Text style={styles.subtitle}>Complete your profile to get started</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* Phone — read-only, already entered on previous screen */}
          <View style={[styles.inputContainer, styles.readOnlyContainer]}>
            <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <Text style={styles.readOnlyText}>{phone || 'Phone number'}</Text>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success || '#22c55e'} />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={COLORS.textSecondary}
              value={form.full_name}
              onChangeText={(text) => setForm(prev => ({ ...prev, full_name: text }))}
            />
          </View>

          {role === ROLES.VENDOR && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Business Information</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Business Name"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.business_name}
                  onChangeText={(text) => setForm(prev => ({ ...prev, business_name: text }))}
                />
              </View>
            </>
          )}

          {role === ROLES.DRIVER && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Driver Information</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="License Number"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.license_number}
                  onChangeText={(text) => setForm(prev => ({ ...prev, license_number: text }))}
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="car-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Vehicle Number"
                  placeholderTextColor={COLORS.textSecondary}
                  value={form.vehicle_number}
                  onChangeText={(text) => setForm(prev => ({ ...prev, vehicle_number: text }))}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.registerButton,
              { backgroundColor: getRoleColor() },
              loading && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textLight} />
            ) : (
              <Text style={styles.registerButtonText}>{getButtonText()}</Text>
            )}
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: getResponsiveFontSize(14),
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
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
  readOnlyContainer: {
    borderColor: COLORS.success || '#22c55e',
    backgroundColor: (COLORS.success || '#22c55e') + '10',
  },
  readOnlyText: {
    flex: 1,
    fontSize: getResponsiveFontSize(16),
    color: COLORS.textSecondary,
    paddingVertical: 16,
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
  registerButton: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    color: COLORS.textLight,
  },
});
