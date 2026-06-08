import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, API_CONFIG } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

export default function SuperAdminSettingsScreen({ navigation }) {
  const { user, refreshUserProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Dummy driver state
  const [dummyPhone, setDummyPhone] = useState('');
  const [dummyName, setDummyName] = useState('');
  const [creatingDummy, setCreatingDummy] = useState(false);
  const [dummyDrivers, setDummyDrivers] = useState([]);
  const [loadingDummy, setLoadingDummy] = useState(false);
  const [showDummyForm, setShowDummyForm] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const fetchDummyDrivers = useCallback(async () => {
    try {
      setLoadingDummy(true);
      const response = await fetch(`${API_CONFIG.ADMIN_API_URL}/admin/dummy-drivers`);
      const result = await response.json();
      if (result.success) setDummyDrivers(result.drivers || []);
    } catch (e) {
      console.error('Error fetching dummy drivers:', e);
    } finally {
      setLoadingDummy(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchDummyDrivers(); }, [fetchDummyDrivers]));

  const handleCreateDummyDriver = async () => {
    const digits = dummyPhone.replace(/[^0-9]/g, '');
    if (digits.length !== 10) {
      Alert.alert('Invalid Phone', 'Enter a valid 10-digit phone number');
      return;
    }
    try {
      setCreatingDummy(true);
      const response = await fetch(`${API_CONFIG.ADMIN_API_URL}/admin/create-dummy-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, fullName: dummyName.trim() || undefined }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed');

      Alert.alert(
        '✅ Dummy Driver Created',
        `Name: ${result.driver.name}\nPhone: ${result.driver.phone}\n\nThis driver can log in immediately with OTP and take trips without document verification.`
      );
      setDummyPhone('');
      setDummyName('');
      setShowDummyForm(false);
      await fetchDummyDrivers();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCreatingDummy(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name cannot be empty');
      return;
    }

    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setSaving(true);
    try {
      // Update users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          phone: phoneDigits,
          email: `${phoneDigits}@kushicabs.phone`, // Update email to match new phone
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // If phone number changed, also update auth.users email
      if (user.phone !== phoneDigits) {
        console.log('Phone number changed, updating auth email');
        const newEmail = `${phoneDigits}@kushicabs.phone`;
        
        // Call backend to update auth account with new phone
        const response = await fetch(`${API_CONFIG.ADMIN_API_URL}/admin/update-admin-phone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id,
            oldPhone: user.phone,
            newPhone: phoneDigits,
            newEmail: newEmail,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          console.warn('Could not update auth account:', result.error);
        }

        // Phone changed — sign out and ask to re-login with new number
        await refreshUserProfile();
        setIsEditing(false);
        Alert.alert(
          '✅ Phone Updated',
          `Your phone number has been changed to ${phoneDigits}.\n\nPlease log in again with the new number.`,
          [{ text: 'OK', onPress: () => signOut() }]
        );
        return;
      }

      await refreshUserProfile();
      setIsEditing(false);
      Alert.alert('✅ Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and app settings</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={24} color={COLORS.warning} />
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={20} color={COLORS.superAdmin.primary} />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textTertiary}
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
                editable={!saving}
                maxLength={13}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setFullName(user.full_name || '');
                  setPhone(user.phone || '');
                  setIsEditing(false);
                }}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.full_name || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.phone ? `${user.phone}@kushicabs.phone` : 'Not set'}</Text>
            </View>
          </>
        )}
      </View>

      {/* Policy Management Card */}
      <TouchableOpacity
        style={[styles.card, { borderLeftWidth: 4, borderLeftColor: COLORS.warning }]}
        onPress={() => navigation.navigate('PolicyManagement')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.warning + '20' }]}>
            <Ionicons name="document-text-outline" size={24} color={COLORS.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>App Policies</Text>
            <Text style={styles.cardDesc}>
              Manage privacy, terms, cancellation, refund policies and safety guidelines for drivers and vendors.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* Dummy Driver Accounts */}
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#ff9800' }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBox, { backgroundColor: '#ff980020' }]}>
            <Ionicons name="person-add-outline" size={24} color="#ff9800" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Emergency Dummy Drivers</Text>
            <Text style={styles.cardDesc}>Create pre-approved driver accounts for emergency use. No document verification required.</Text>
          </View>
          <TouchableOpacity onPress={() => setShowDummyForm(p => !p)}>
            <Ionicons name={showDummyForm ? 'chevron-up' : 'add-circle-outline'} size={24} color="#ff9800" />
          </TouchableOpacity>
        </View>

        {showDummyForm && (
          <View style={styles.dummyForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={dummyPhone}
                onChangeText={setDummyPhone}
                placeholder="10-digit phone number"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!creatingDummy}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={dummyName}
                onChangeText={setDummyName}
                placeholder="e.g. Dummy Driver 1"
                placeholderTextColor={COLORS.textTertiary}
                editable={!creatingDummy}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, styles.dummyCreateBtn, creatingDummy && styles.buttonDisabled]}
              onPress={handleCreateDummyDriver}
              disabled={creatingDummy}
            >
              {creatingDummy
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="flash-outline" size={18} color="#fff" />
                    <Text style={styles.saveButtonText}>Create Dummy Driver</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* List of existing dummy drivers */}
        <View style={styles.dummyList}>
          <Text style={styles.dummyListTitle}>
            {loadingDummy ? 'Loading...' : `${dummyDrivers.length} dummy driver(s)`}
          </Text>
          {dummyDrivers.map((d) => (
            <View key={d.id} style={styles.dummyRow}>
              <Ionicons name="person-circle-outline" size={18} color="#ff9800" />
              <View style={{ flex: 1 }}>
                <Text style={styles.dummyName}>{d.full_name}</Text>
                <Text style={styles.dummyPhone}>{d.phone}</Text>
              </View>
              <View style={[styles.dummyBadge, { backgroundColor: d.verification_status === 'approved' ? '#4caf5020' : '#ff980020' }]}>
                <Text style={[styles.dummyBadgeText, { color: d.verification_status === 'approved' ? '#4caf50' : '#ff9800' }]}>
                  {d.verification_status}
                </Text>
              </View>
            </View>
          ))}
          {!loadingDummy && dummyDrivers.length === 0 && (
            <Text style={styles.emptyText}>No dummy drivers yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: getResponsivePadding(20), paddingTop: hp(6), paddingBottom: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: getResponsiveFontSize(26), fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginTop: 4 },
  
  // Card styles
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: getResponsiveFontSize(16), fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardDesc: { fontSize: getResponsiveFontSize(13), color: COLORS.textSecondary, lineHeight: 18 },

  // Profile section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionTitle: { fontSize: getResponsiveFontSize(16), fontWeight: '700', color: COLORS.text, flex: 1 },

  // Input styles
  inputGroup: { marginBottom: 14 },
  label: { fontSize: getResponsiveFontSize(13), fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: getResponsiveFontSize(14),
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Info display styles
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: getResponsiveFontSize(13), color: COLORS.textSecondary, fontWeight: '600' },
  infoValue: { fontSize: getResponsiveFontSize(14), color: COLORS.text, fontWeight: '500' },

  // Button styles
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  cancelButton: { borderWidth: 1, borderColor: COLORS.border },
  cancelButtonText: { fontSize: getResponsiveFontSize(15), fontWeight: '600', color: COLORS.text },
  saveButton: { backgroundColor: COLORS.superAdmin.primary },
  saveButtonText: { fontSize: getResponsiveFontSize(15), fontWeight: '600', color: '#fff' },
  buttonDisabled: { opacity: 0.6 },

  // Dummy driver styles
  dummyForm: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  dummyCreateBtn: { backgroundColor: '#ff9800', marginTop: 4 },
  dummyList: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  dummyListTitle: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary, marginBottom: 10, fontWeight: '600' },
  dummyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dummyName: { fontSize: getResponsiveFontSize(13), color: COLORS.text, fontWeight: '600' },
  dummyPhone: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary },
  dummyBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dummyBadgeText: { fontSize: getResponsiveFontSize(11), fontWeight: '600' },
  emptyText: { color: COLORS.textSecondary, fontSize: getResponsiveFontSize(12), textAlign: 'center', paddingVertical: 12 },
});
