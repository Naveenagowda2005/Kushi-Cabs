import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { supabase } from '../../lib/supabase';
import { COLORS, API_CONFIG } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';
import { useSystemSettings, updateMinimumWalletBalance } from '../../hooks/useSystemSettings';

export default function SuperAdminSettingsScreen({ navigation }) {
  const { user, refreshUserProfile, signOut } = useAuth();
  const { isDarkMode, toggleTheme, forceUpdate } = useTheme();
  const { settings, loading: settingsLoading, refetch: refetchSettings } = useSystemSettings();
  
  // Force re-render when theme changes
  const [themeRefresh, setThemeRefresh] = useState(0);
  useEffect(() => {
    setThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Wallet balance setting
  const [minWalletBalance, setMinWalletBalance] = useState('500');
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);

  // Dummy driver state
  const [dummyPhone, setDummyPhone] = useState('');
  const [dummyName, setDummyName] = useState('');
  const [creatingDummy, setCreatingDummy] = useState(false);
  const [dummyDrivers, setDummyDrivers] = useState([]);
  const [loadingDummy, setLoadingDummy] = useState(false);
  const [showDummyForm, setShowDummyForm] = useState(false);

  // Dummy vendor state
  const [dummyVendorPhone, setDummyVendorPhone] = useState('');
  const [dummyVendorName, setDummyVendorName] = useState('');
  const [creatingDummyVendor, setCreatingDummyVendor] = useState(false);
  const [dummyVendors, setDummyVendors] = useState([]);
  const [loadingDummyVendor, setLoadingDummyVendor] = useState(false);
  const [showDummyVendorForm, setShowDummyVendorForm] = useState(false);

  // Refs to manage subscriptions and polling
  const driversSubscriptionRef = useRef(null);
  const vendorsSubscriptionRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Initialize wallet balance from settings
  useEffect(() => {
    if (settings.minimumWalletBalance !== undefined && settings.minimumWalletBalance !== null) {
      console.log('✅ Updated minWalletBalance display to:', settings.minimumWalletBalance);
      setMinWalletBalance(settings.minimumWalletBalance.toString());
    }
  }, [settings.minimumWalletBalance]);

  const fetchDummyDrivers = useCallback(async () => {
    try {
      setLoadingDummy(true);
      console.log('Fetching dummy drivers from Supabase');
      
      // Get driver role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'driver')
        .single();

      if (!roleData) {
        console.error('Driver role not found');
        return;
      }

      // Fetch drivers with DUMMY- license numbers
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          phone,
          is_active,
          verification_status,
          created_at,
          drivers!inner(license_number)
        `)
        .eq('role_id', roleData.id)
        .ilike('drivers.license_number', 'DUMMY-%')
        .order('created_at', { ascending: false });

      console.log('Dummy drivers from Supabase:', data);
      
      if (error) {
        console.error('Error fetching from Supabase:', error);
        return;
      }

      if (data) {
        setDummyDrivers(data);
      }
    } catch (e) {
      console.error('Error fetching dummy drivers:', e);
    } finally {
      setLoadingDummy(false);
    }
  }, []);

  const fetchDummyVendors = useCallback(async () => {
    try {
      setLoadingDummyVendor(true);
      console.log('🔄 Fetching dummy vendors from Supabase');
      
      // Step 1: Get all vendors first (without nested join)
      const { data: allVendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, user_id, company_name, commission_pct');

      console.log('📊 Raw vendors query result:', allVendors);
      console.log('❌ Vendors query error:', vendorError);
      
      if (vendorError) {
        console.error('⚠️ Error fetching vendors from Supabase:', vendorError);
        return;
      }

      if (!allVendors || allVendors.length === 0) {
        console.log('⚠️ No vendors found in database');
        setDummyVendors([]);
        return;
      }

      console.log(`✅ Found ${allVendors.length} total vendors in database`);
      
      // Filter for dummy vendors (company_name starts with DUMMY or Test)
      const dummyVendorsList = allVendors.filter(vendor => {
        const companyName = vendor.company_name || '';
        const matches = companyName.toUpperCase().startsWith('DUMMY') || 
                       companyName.toUpperCase().startsWith('TEST');
        console.log(`  - Vendor: "${companyName}" → ${matches ? '✅ MATCHED' : '❌ NO MATCH'}`);
        return matches;
      });
      
      console.log(`📊 Filtered to ${dummyVendorsList.length} dummy vendors`);
      
      if (dummyVendorsList.length === 0) {
        console.log('⚠️ No dummy vendors found (all vendors do not match DUMMY/Test pattern)');
        setDummyVendors([]);
        return;
      }

      // Step 2: Get user data for each vendor
      const userIds = dummyVendorsList.map(v => v.user_id);
      console.log(`📊 Fetching user data for ${userIds.length} vendors...`);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, phone, is_active, verification_status, created_at')
        .in('id', userIds);

      if (userError) {
        console.warn('⚠️ Warning: Could not fetch user data:', userError);
        // Continue anyway - we have vendor data
      } else {
        console.log(`📊 Fetched user data for ${userData?.length || 0} users`);
      }

      // Step 3: Combine vendor and user data
      const userMap = {};
      (userData || []).forEach(user => {
        userMap[user.id] = user;
      });

      const transformedData = dummyVendorsList.map(vendor => {
        const user = userMap[vendor.user_id];
        return {
          id: vendor.user_id,
          full_name: user?.full_name || vendor.company_name || 'Unknown',
          phone: user?.phone,
          is_active: user?.is_active,
          verification_status: user?.verification_status || 'unknown',
          created_at: user?.created_at,
          company_name: vendor.company_name,
          commission_pct: vendor.commission_pct
        };
      });

      console.log(`✅ Transformed ${transformedData.length} vendors:`, transformedData);
      setDummyVendors(transformedData);
    } catch (e) {
      console.error('❌ Error fetching dummy vendors:', e);
    } finally {
      setLoadingDummyVendor(false);
    }
  }, []);

  // Fetch on mount and when screen is focused
  useEffect(() => {
    fetchDummyDrivers();
    fetchDummyVendors();

    return () => {
      // Cleanup if needed
    };
  }, [fetchDummyDrivers, fetchDummyVendors]);

  useFocusEffect(useCallback(() => { 
    console.log('Settings screen focused - refreshing lists once');
    fetchDummyDrivers();
    fetchDummyVendors();

    return () => {
      // No cleanup needed
    };
  }, [fetchDummyDrivers, fetchDummyVendors]));

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

  const handleCreateDummyVendor = async () => {
    const digits = dummyVendorPhone.replace(/[^0-9]/g, '');
    if (digits.length !== 10) {
      Alert.alert('Invalid Phone', 'Enter a valid 10-digit phone number');
      return;
    }
    try {
      setCreatingDummyVendor(true);
      const response = await fetch(`${API_CONFIG.ADMIN_API_URL}/admin/create-dummy-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, companyName: dummyVendorName.trim() || undefined }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed');

      Alert.alert(
        '✅ Dummy Vendor Created',
        `Company: ${result.vendor.name}\nPhone: ${result.vendor.phone}\n\nThis vendor can log in immediately with OTP and accept trips without document verification.`
      );
      setDummyVendorPhone('');
      setDummyVendorName('');
      setShowDummyVendorForm(false);
      await fetchDummyVendors();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setCreatingDummyVendor(false);
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

    const phoneChanged = user.phone !== phoneDigits;

    setSaving(true);
    try {
      if (phoneChanged) {
        // Check if the new phone is already taken by another user
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('phone', phoneDigits)
          .neq('id', user.id)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
          Alert.alert(
            'Phone Already Registered',
            'This phone number is already linked to another account. Please use a different number.'
          );
          return;
        }
      }

      // Build update payload — only include phone/email if changed
      const updatePayload = { full_name: fullName.trim() };
      if (phoneChanged) {
        updatePayload.phone = phoneDigits;
        updatePayload.email = `${phoneDigits}@kushicabs.phone`;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', user.id);

      if (updateError) {
        // Handle unique constraint violation gracefully
        if (updateError.code === '23505') {
          Alert.alert(
            'Phone Already Registered',
            'This phone number is already linked to another account. Please use a different number.'
          );
          return;
        }
        throw updateError;
      }

      // If phone changed, update auth.users email via backend
      if (phoneChanged) {
        console.log('Phone number changed, updating auth email');
        const newEmail = `${phoneDigits}@kushicabs.phone`;

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
          // Non-fatal — users table already updated
        } else {
          console.log('✅ Auth account updated, old phone freed:', result.oldPhoneFreed);
        }

        await refreshUserProfile();
        setIsEditing(false);
        Alert.alert(
          '✅ Phone Updated',
          `Your phone number has been changed to ${phoneDigits}.\n\nThe old number (${user.phone}) is now free and can be used for other accounts.\n\nPlease log in again with the new number.`,
          [{ text: 'OK', onPress: () => signOut() }]
        );
        return;
      }

      // Only name changed
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

  const handleSaveWalletBalance = async () => {
    const newBalance = parseFloat(minWalletBalance);
    
    if (isNaN(newBalance) || newBalance < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid minimum balance amount');
      return;
    }

    setSavingWallet(true);
    try {
      const result = await updateMinimumWalletBalance(newBalance);
      
      if (result.success) {
        Alert.alert(
          '✅ Success',
          `Minimum wallet balance updated to ₹${newBalance.toFixed(2)} for all drivers`
        );
        // Wait for settings to refetch and update
        await refetchSettings();
        // Small delay to ensure state updates
        await new Promise(r => setTimeout(r, 500));
        setMinWalletBalance(newBalance.toString());
        setIsEditingWallet(false);
      } else {
        throw new Error(result.error || 'Failed to update');
      }
    } catch (err) {
      console.error('Error saving wallet balance:', err);
      Alert.alert('Error', err.message || 'Failed to update wallet balance');
    } finally {
      setSavingWallet(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: COLORS.background }]} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: COLORS.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>Manage your account and app settings</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {/* Refresh Button */}
          <TouchableOpacity
            onPress={() => {
              console.log('🔄 Manual refresh all dummy lists');
              fetchDummyDrivers();
              fetchDummyVendors();
            }}
            disabled={loadingDummy || loadingDummyVendor}
            style={{ justifyContent: 'center', alignItems: 'center', width: 40, height: 40 }}
          >
            {loadingDummy || loadingDummyVendor ? (
              <ActivityIndicator color={COLORS.warning} size="small" />
            ) : (
              <Ionicons name="refresh" size={24} color={COLORS.warning} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Section */}
      <View style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={24} color={COLORS.warning} />
          <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Profile Information</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={20} color={COLORS.superAdmin.primary} />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: COLORS.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: COLORS.background, 
                  color: COLORS.text,
                  borderColor: COLORS.border
                }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textTertiary}
                editable={!saving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: COLORS.text }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: COLORS.background, 
                  color: COLORS.text,
                  borderColor: COLORS.border
                }]}
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
            <View style={[styles.infoRow, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.infoLabel, { color: COLORS.textSecondary }]}>Full Name</Text>
              <Text style={[styles.infoValue, { color: COLORS.text }]}>{user?.full_name || 'Not set'}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.infoLabel, { color: COLORS.textSecondary }]}>Phone Number</Text>
              <Text style={[styles.infoValue, { color: COLORS.text }]}>{user?.phone || 'Not set'}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles.infoLabel, { color: COLORS.textSecondary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: COLORS.text }]}>{user?.phone ? `${user.phone}@kushicabs.phone` : 'Not set'}</Text>
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

      {/* Minimum Wallet Balance Setting Card */}
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#4caf50' }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBox, { backgroundColor: '#4caf5020' }]}>
            <Ionicons name="wallet-outline" size={24} color="#4caf50" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Minimum Wallet Balance</Text>
            <Text style={styles.cardDesc}>Set minimum wallet balance required for drivers</Text>
          </View>
          {!isEditingWallet && (
            <TouchableOpacity onPress={() => setIsEditingWallet(true)}>
              <Ionicons name="pencil" size={20} color={COLORS.superAdmin.primary} />
            </TouchableOpacity>
          )}
        </View>

        {isEditingWallet ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Minimum Balance (₹)</Text>
              <TextInput
                style={styles.input}
                value={minWalletBalance}
                onChangeText={setMinWalletBalance}
                placeholder="Enter amount"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
                editable={!savingWallet}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setMinWalletBalance((settings.minimumWalletBalance !== undefined && settings.minimumWalletBalance !== null) ? settings.minimumWalletBalance.toString() : '500');
                  setIsEditingWallet(false);
                }}
                disabled={savingWallet}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, savingWallet && styles.buttonDisabled]}
                onPress={handleSaveWalletBalance}
                disabled={savingWallet}
              >
                {savingWallet ? (
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Minimum Balance</Text>
            <Text style={[styles.infoValue, { color: '#4caf50', fontWeight: 'bold', fontSize: 18 }]}>
              ₹{(settings.minimumWalletBalance !== undefined && settings.minimumWalletBalance !== null) ? settings.minimumWalletBalance : 500}
            </Text>
          </View>
        )}
      </View>
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

      {/* Dummy Vendors Section */}
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#2196F3' }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBox, { backgroundColor: '#2196F320' }]}>
            <Ionicons name="business-outline" size={24} color="#2196F3" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Emergency Dummy Vendors</Text>
            <Text style={styles.cardDesc}>Create pre-approved vendor accounts for emergency use. No document verification required.</Text>
          </View>
          <TouchableOpacity onPress={() => setShowDummyVendorForm(p => !p)}>
            <Ionicons name={showDummyVendorForm ? 'chevron-up' : 'add-circle-outline'} size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {showDummyVendorForm && (
          <View style={styles.dummyForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={dummyVendorPhone}
                onChangeText={setDummyVendorPhone}
                placeholder="10-digit phone number"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!creatingDummyVendor}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={dummyVendorName}
                onChangeText={setDummyVendorName}
                placeholder="e.g. Dummy Vendor Inc"
                placeholderTextColor={COLORS.textTertiary}
                editable={!creatingDummyVendor}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, styles.vendorCreateBtn, creatingDummyVendor && styles.buttonDisabled]}
              onPress={handleCreateDummyVendor}
              disabled={creatingDummyVendor}
            >
              {creatingDummyVendor
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="flash-outline" size={18} color="#fff" />
                    <Text style={styles.saveButtonText}>Create Dummy Vendor</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* List of existing dummy vendors */}
        <View style={styles.dummyList}>
          <Text style={styles.dummyListTitle}>
            {loadingDummyVendor ? 'Loading...' : `${dummyVendors.length} dummy vendor(s)`}
          </Text>
          {dummyVendors.map((v) => (
            <View key={v.id} style={styles.dummyRow}>
              <Ionicons name="business-outline" size={18} color="#2196F3" />
              <View style={{ flex: 1 }}>
                <Text style={styles.dummyName}>{v.full_name}</Text>
                <Text style={styles.dummyPhone}>{v.phone}</Text>
              </View>
              <View style={[styles.dummyBadge, { backgroundColor: v.verification_status === 'approved' ? '#4caf5020' : '#2196F320' }]}>
                <Text style={[styles.dummyBadgeText, { color: v.verification_status === 'approved' ? '#4caf50' : '#2196F3' }]}>
                  {v.verification_status}
                </Text>
              </View>
            </View>
          ))}
          {!loadingDummyVendor && dummyVendors.length === 0 && (
            <Text style={styles.emptyText}>No dummy vendors yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: getResponsivePadding(20), paddingTop: hp(6), paddingBottom: 60 },
  header: { marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
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
  infoLabel: { fontSize: getResponsiveFontSize(13), fontWeight: '600' },
  infoValue: { fontSize: getResponsiveFontSize(14), fontWeight: '500' },

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
  vendorCreateBtn: { backgroundColor: '#2196F3', marginTop: 4 },
  dummyList: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  dummyListTitle: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary, marginBottom: 10, fontWeight: '600' },
  dummyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dummyName: { fontSize: getResponsiveFontSize(13), color: COLORS.text, fontWeight: '600' },
  dummyPhone: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary },
  dummyBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dummyBadgeText: { fontSize: getResponsiveFontSize(11), fontWeight: '600' },
  emptyText: { color: COLORS.textSecondary, fontSize: getResponsiveFontSize(12), textAlign: 'center', paddingVertical: 12 },
});
