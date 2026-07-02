import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const { settings, refetch: refetchSettings } = useSystemSettings();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Wallet balance setting
  const [minWalletBalance, setMinWalletBalance] = useState('500');
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);

  // Dummy Drivers
  const [showDummyForm, setShowDummyForm] = useState(false);
  const [dummyPhone, setDummyPhone] = useState('');
  const [dummyName, setDummyName] = useState('');
  const [dummyDrivers, setDummyDrivers] = useState([]);
  const [loadingDummy, setLoadingDummy] = useState(false);
  const [creatingDummy, setCreatingDummy] = useState(false);

  // Dummy Vendors
  const [showDummyVendorForm, setShowDummyVendorForm] = useState(false);
  const [dummyVendorPhone, setDummyVendorPhone] = useState('');
  const [dummyVendorName, setDummyVendorName] = useState('');
  const [dummyVendors, setDummyVendors] = useState([]);
  const [loadingDummyVendor, setLoadingDummyVendor] = useState(false);
  const [creatingDummyVendor, setCreatingDummyVendor] = useState(false);

  // Admin Trip Creation
  const [showCreateAdminTrip, setShowCreateAdminTrip] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [creatingAdminTrip, setCreatingAdminTrip] = useState(false);
  const [adminTripForm, setAdminTripForm] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    returnLocation: '',
    returnDate: null,
    passengerName: '',
    passengerPhone: '',
    fareAmount: '',
    commissionAmount: '',
    customerPreAdvance: '',
    scheduledAt: new Date(),
    carType: '',
    carModel: '',
    seaterType: '',
    fuelType: '',
    segment: '',
    package: '',
    tollIncluded: false,
    stateTaxIncluded: false,
    petTravelling: false,
    hillsIncluded: false,
    fixedKm: '',
    notes: '',
  });
  const [adminTripOptions, setAdminTripOptions] = useState({
    segments: [],
    packages: [],
    carTypes: [],
    carModels: [],
    seaterTypes: [],
    fuelTypes: [],
  });
  const [showScheduledDatePicker, setShowScheduledDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);

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
      console.log('📊 Current settings object:', settings);
      setMinWalletBalance(settings.minimumWalletBalance.toString());
    } else {
      console.warn('⚠️ minimumWalletBalance is undefined or null, using default 500');
      setMinWalletBalance('500');
    }
  }, [settings.minimumWalletBalance]);

  const fetchAvailableDrivers = useCallback(async () => {
    try {
      console.log('Fetching available drivers for admin trip assignment');
      
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

      // Fetch active drivers
      const { data: drivers, error } = await supabase
        .from('users')
        .select('id, full_name, phone, drivers!inner(license_number, vehicle_number)')
        .eq('role_id', roleData.id)
        .eq('is_active', true)
        .order('full_name');

      if (error) {
        console.error('Error fetching drivers:', error);
        return;
      }

      if (drivers) {
        setAvailableDrivers(drivers);
        console.log(`✅ Fetched ${drivers.length} available drivers`);
      }
    } catch (e) {
      console.error('Error in fetchAvailableDrivers:', e);
    }
  }, []);

  // Fetch drivers when screen mounts
  useEffect(() => {
    fetchAvailableDrivers();
    fetchAdminTripOptions();
  }, [fetchAvailableDrivers]);

  const fetchAdminTripOptions = useCallback(async () => {
    try {
      console.log('Fetching trip options for admin trip creation');
      
      const [carTypesRes, seaterRes, fuelRes, segmentsRes] = await Promise.all([
        supabase.from('car_types').select('id, name').order('name'),
        supabase.from('seater_types').select('id, name').order('name'),
        supabase.from('fuel_types').select('id, name').order('name'),
        supabase.from('trip_segments').select('id, name, display_order').order('display_order', { ascending: true }),
      ]);

      setAdminTripOptions({
        carTypes: carTypesRes.data || [],
        seaterTypes: seaterRes.data || [],
        fuelTypes: fuelRes.data || [],
        segments: segmentsRes.data || [],
        packages: [],
        carModels: [],
      });

      console.log('✅ Trip options fetched');
    } catch (error) {
      console.error('Error fetching trip options:', error);
    }
  }, []);

  const updateAdminTripForm = useCallback((field, value) => {
    setAdminTripForm((prev) => ({ ...prev, [field]: value }));

    // Fetch car models when car type changes
    if (field === 'carType' && value) {
      fetchCarModelsForAdminTrip(value);
    }

    // Handle segment changes
    if (field === 'segment' && value) {
      fetchPackagesForAdminTrip(value);
      // Reset package selection
      setAdminTripForm((prev) => ({ ...prev, package: '' }));
      
      // If not Round trip, clear return fields
      const selectedSegment = adminTripOptions.segments.find(s => s.id === value);
      if (selectedSegment?.name !== 'Round trips') {
        setAdminTripForm((prev) => ({ 
          ...prev, 
          returnLocation: '',
          returnDate: null 
        }));
      }
    }
  }, [adminTripOptions.segments]);

  const fetchCarModelsForAdminTrip = async (carTypeId) => {
    try {
      const { data } = await supabase
        .from('car_models')
        .select('id, name')
        .eq('car_type_id', carTypeId)
        .order('name');
      
      if (data) {
        setAdminTripOptions((prev) => ({ ...prev, carModels: data }));
      }
    } catch (error) {
      console.error('Error fetching car models:', error);
    }
  };

  const fetchPackagesForAdminTrip = async (segmentId) => {
    try {
      const { data } = await supabase
        .from('trip_packages')
        .select('id, name')
        .eq('segment_id', segmentId)
        .order('name');
      
      if (data) {
        setAdminTripOptions((prev) => ({ ...prev, packages: data }));
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

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
      
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, user_id, company_name, commission_pct');

      if (vendorError) {
        console.error('⚠️ Vendors table query failed:', vendorError.message);
        setDummyVendors([]);
        setLoadingDummyVendor(false);
        return;
      }

      if (!vendorData || vendorData.length === 0) {
        console.log('⚠️ No vendors found in database');
        setDummyVendors([]);
        setLoadingDummyVendor(false);
        return;
      }

      // Filter to only DUMMY vendors (company_name starts with DUMMY)
      const dummyVendorsList = vendorData.filter(v => 
        v.company_name && v.company_name.trim().toUpperCase().startsWith('DUMMY')
      );

      console.log(`✅ Found ${dummyVendorsList.length} dummy vendors out of ${vendorData.length} total vendors`);
      
      if (dummyVendorsList.length === 0) {
        console.log('⚠️ No dummy vendors found');
        setDummyVendors([]);
        setLoadingDummyVendor(false);
        return;
      }

      // Get user data for dummy vendors only
      const userIds = dummyVendorsList.map(v => v.user_id).filter(id => id);
      
      console.log(`📊 Fetching user data for ${userIds.length} dummy vendors`);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, phone, is_active, verification_status')
        .in('id', userIds);

      if (userError) {
        console.warn('⚠️ Could not fetch user data:', userError.message);
      }

      // Create user map
      const userMap = {};
      (userData || []).forEach(user => {
        if (user && user.id) userMap[user.id] = user;
      });

      // Transform dummy vendor data
      const transformedData = dummyVendorsList.map(vendor => {
        const user = userMap[vendor.user_id];
        return {
          id: vendor.user_id || vendor.id,
          full_name: user?.full_name || vendor.company_name || 'Unknown',
          phone: user?.phone,
          is_active: user?.is_active,
          verification_status: user?.verification_status || 'pending',
          company_name: vendor.company_name?.trim() || 'Unknown Vendor',
          commission_pct: vendor.commission_pct
        };
      }).filter(v => v.full_name); // Filter out empty entries

      console.log(`✅ Loaded ${transformedData.length} dummy vendors`);
      setDummyVendors(transformedData);
    } catch (e) {
      console.error('❌ Vendor fetch error:', e.message);
      setDummyVendors([]);
    } finally {
      setLoadingDummyVendor(false);
    }
  }, []);

  // Fetch on mount only
  useEffect(() => {
    console.log('Settings screen mounted - fetching data once');
    fetchDummyDrivers();
    fetchDummyVendors();
  }, []); // Empty dependency array - run only once on mount

  useFocusEffect(useCallback(() => { 
    console.log('Settings screen focused - refreshing lists');
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

  const handleScheduledDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setAdminTripForm({...adminTripForm, scheduledAt: selectedDate});
    }
    setShowScheduledDatePicker(false);
  };

  const handleReturnDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setAdminTripForm({...adminTripForm, returnDate: selectedDate});
    }
    setShowReturnDatePicker(false);
  };

  const validateAdminTripForm = () => {
    if (!adminTripForm.segment) return 'Please select a trip segment.';
    if (!adminTripForm.pickupLocation.trim()) return 'Pickup location is required.';
    if (!adminTripForm.dropoffLocation.trim()) return 'Drop-off location is required.';
    const selectedSegment = adminTripOptions.segments.find(s => s.id === adminTripForm.segment);
    if (selectedSegment?.name === 'Round trips') {
      if (!adminTripForm.returnLocation.trim()) return 'Return location is required for round trips.';
      if (!adminTripForm.returnDate) return 'Return date is required for round trips.';
    }
    if (!adminTripForm.passengerName.trim()) return 'Passenger name is required.';
    if (!adminTripForm.passengerPhone.trim()) return 'Passenger phone is required.';
    const fixedKm = parseFloat(adminTripForm.fixedKm);
    if (!fixedKm || fixedKm <= 0) return 'Enter a valid fixed KM.';
    const fare = parseFloat(adminTripForm.fareAmount);
    if (!fare || fare <= 0) return 'Enter a valid trip amount.';
    const commission = parseFloat(adminTripForm.commissionAmount);
    if (!commission || commission <= 0) return 'Enter a valid commission amount.';
    if (!adminTripForm.carType) return 'Please select a car type.';
    if (!adminTripForm.seaterType) return 'Please select seater type.';
    if (!adminTripForm.fuelType) return 'Please select fuel type.';
    if (selectedDrivers.length === 0) return 'Please select at least one driver to assign this trip.';
    return null;
  };

  const handleCreateAdminTrip = async () => {
    const err = validateAdminTripForm();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    setCreatingAdminTrip(true);
    try {
      console.log('📝 Creating admin trip and assigning to drivers:', selectedDrivers);

      const selectedSegment = adminTripOptions.segments.find(s => s.id === adminTripForm.segment);
      const isRoundTrip = selectedSegment?.name === 'Round trips';

      const tripData = {
        pickupLocation: adminTripForm.pickupLocation.trim(),
        dropoffLocation: adminTripForm.dropoffLocation.trim(),
        returnLocation: isRoundTrip ? (adminTripForm.returnLocation.trim() || null) : null,
        returnDate: isRoundTrip ? (adminTripForm.returnDate ? adminTripForm.returnDate.toISOString() : null) : null,
        fixedKm: parseFloat(adminTripForm.fixedKm),
        fareAmount: parseFloat(adminTripForm.fareAmount),
        commissionAmount: parseFloat(adminTripForm.commissionAmount),
        customerPreAdvance: parseFloat(adminTripForm.customerPreAdvance) || 0,
        scheduledAt: adminTripForm.scheduledAt ? adminTripForm.scheduledAt.toISOString() : new Date().toISOString(),
        passengerName: adminTripForm.passengerName.trim(),
        passengerPhone: adminTripForm.passengerPhone.trim(),
        carType: adminTripForm.carType,
        carModel: adminTripForm.carModel,
        seaterType: adminTripForm.seaterType,
        fuelType: adminTripForm.fuelType,
        segmentId: adminTripForm.segment,
        packageId: adminTripForm.package || null,
        tollIncluded: adminTripForm.tollIncluded,
        stateTaxIncluded: adminTripForm.stateTaxIncluded,
        petTravelling: adminTripForm.petTravelling,
        hillsIncluded: adminTripForm.hillsIncluded,
        notes: adminTripForm.notes.trim() || null,
        createdBy: user.id,
        assignedDriverIds: selectedDrivers,
      };

      const endpoint = `${API_CONFIG.ADMIN_API_URL}/admin/create-admin-trip`;
      console.log('🌐 Calling endpoint:', endpoint);
      console.log('📦 Payload:', JSON.stringify(tripData, null, 2));

      // Call backend endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData),
      });

      console.log('📨 Response status:', response.status);
      const result = await response.json();
      console.log('📨 Response data:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to create trip');
      }

      console.log('✅ Admin trip created:', result.trip.id);

      const commission = parseFloat(adminTripForm.commissionAmount) || 0;
      const customerPreAdvance = parseFloat(adminTripForm.customerPreAdvance) || 0;
      const commissionToPay = Math.max(0, commission - customerPreAdvance);

      Alert.alert(
        '✅ Admin Trip Created',
        `Trip has been created and assigned to ${selectedDrivers.length} driver(s).\n\nThey will see this trip in their available trips list.\n\n${commissionToPay > 0 ? `Commission to pay: ₹${commissionToPay.toFixed(2)}` : 'No commission required.'}`,
        [{
          text: 'OK',
          onPress: () => {
            // Reset form
            setShowCreateAdminTrip(false);
            setAdminTripForm({
              pickupLocation: '',
              dropoffLocation: '',
              returnLocation: '',
              returnDate: null,
              passengerName: '',
              passengerPhone: '',
              fareAmount: '',
              commissionAmount: '',
              customerPreAdvance: '',
              scheduledAt: new Date(),
              carType: '',
              carModel: '',
              seaterType: '',
              fuelType: '',
              segment: '',
              package: '',
              tollIncluded: false,
              stateTaxIncluded: false,
              petTravelling: false,
              hillsIncluded: false,
              fixedKm: '',
              notes: '',
            });
            setSelectedDrivers([]);
          }
        }]
      );
    } catch (err) {
      console.error('CreateAdminTrip error:', err);
      console.error('Error type:', typeof err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Error details:', {
        message: err.message,
        apiUrl: API_CONFIG.ADMIN_API_URL,
        isNetworkError: err.message?.includes('Network'),
        isCorsError: err.message?.includes('CORS'),
      });
      Alert.alert('Network Error', 'Failed to reach backend. Make sure:\n1. Backend is running\n2. Both devices are on same network\n3. IP address is correct: ' + API_CONFIG.ADMIN_API_URL);
    } finally {
      setCreatingAdminTrip(false);
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

      {/* Admin Trip Creation Section */}
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#9c27b0' }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconBox, { backgroundColor: '#9c27b020' }]}>
            <Ionicons name="add-circle-outline" size={24} color="#9c27b0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Create Admin Trip</Text>
            <Text style={styles.cardDesc}>Create and assign trips directly to specific drivers. Drivers will see assigned trips in their available list.</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreateAdminTrip(p => !p)}>
            <Ionicons name={showCreateAdminTrip ? 'chevron-up' : 'add-circle-outline'} size={24} color="#9c27b0" />
          </TouchableOpacity>
        </View>

        {showCreateAdminTrip && (
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 }}>
            {/* Trip Segment Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trip Segment *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                <Picker
                  selectedValue={adminTripForm.segment}
                  onValueChange={(value) => updateAdminTripForm('segment', value)}
                >
                  <Picker.Item label="Select Trip Segment" value="" />
                  {adminTripOptions.segments.map((seg) => (
                    <Picker.Item key={seg.id} label={seg.name} value={seg.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Pickup Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pickup Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mumbai Airport, Terminal 2"
                placeholderTextColor={COLORS.textTertiary}
                value={adminTripForm.pickupLocation}
                onChangeText={(v) => updateAdminTripForm('pickupLocation', v)}
                editable={!creatingAdminTrip}
              />
            </View>

            {/* Dropoff Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Drop-off Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bandra Kurla Complex"
                placeholderTextColor={COLORS.textTertiary}
                value={adminTripForm.dropoffLocation}
                onChangeText={(v) => updateAdminTripForm('dropoffLocation', v)}
                editable={!creatingAdminTrip}
              />
            </View>

            {/* Return Location - Only for Round Trips */}
            {adminTripOptions.segments.find(s => s.id === adminTripForm.segment)?.name === 'Round trips' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Return Location *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Return pickup point"
                    placeholderTextColor={COLORS.textTertiary}
                    value={adminTripForm.returnLocation}
                    onChangeText={(v) => updateAdminTripForm('returnLocation', v)}
                    editable={!creatingAdminTrip}
                  />
                </View>
              </>
            )}

            {/* Scheduled Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Scheduled Date *</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowScheduledDatePicker(true)}
                disabled={creatingAdminTrip}
              >
                <Ionicons name="calendar-outline" size={18} color={COLORS.info} style={{ marginRight: 8 }} />
                <Text style={{ color: adminTripForm.scheduledAt ? COLORS.text : COLORS.textTertiary, flex: 1 }}>
                  {adminTripForm.scheduledAt ? adminTripForm.scheduledAt.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'Select scheduled date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Return Date - Only for Round Trips */}
            {adminTripOptions.segments.find(s => s.id === adminTripForm.segment)?.name === 'Round trips' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Return Date *</Text>
                <TouchableOpacity 
                  style={styles.input}
                  onPress={() => setShowReturnDatePicker(true)}
                  disabled={creatingAdminTrip}
                >
                  <Ionicons name="calendar-outline" size={18} color={COLORS.info} style={{ marginRight: 8 }} />
                  <Text style={{ color: adminTripForm.returnDate ? COLORS.text : COLORS.textTertiary, flex: 1 }}>
                    {adminTripForm.returnDate ? adminTripForm.returnDate.toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'Select return date'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Fixed KM */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fixed KM *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50"
                placeholderTextColor={COLORS.textTertiary}
                value={adminTripForm.fixedKm}
                onChangeText={(v) => updateAdminTripForm('fixedKm', v)}
                keyboardType="decimal-pad"
                editable={!creatingAdminTrip}
              />
            </View>

            {/* Trip Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trip Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                placeholderTextColor={COLORS.textTertiary}
                value={adminTripForm.fareAmount}
                onChangeText={(v) => updateAdminTripForm('fareAmount', v)}
                keyboardType="decimal-pad"
                editable={!creatingAdminTrip}
              />
            </View>

            {/* Customer Pre-Advance */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Pre-Advance (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 100 (optional)"
                placeholderTextColor={COLORS.textTertiary}
                value={adminTripForm.customerPreAdvance}
                onChangeText={(v) => updateAdminTripForm('customerPreAdvance', v)}
                keyboardType="decimal-pad"
                editable={!creatingAdminTrip}
              />
            </View>

            {/* Commission Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Driver Commission (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Commission driver pays to unlock customer details"
                placeholderTextColor={COLORS.textTertiary}
                value={adminTripForm.commissionAmount}
                onChangeText={(v) => updateAdminTripForm('commissionAmount', v)}
                keyboardType="decimal-pad"
                editable={!creatingAdminTrip}
              />
            </View>

            {/* Passenger Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Passenger Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={COLORS.textTertiary}
                value={adminTripForm.passengerName}
                onChangeText={(v) => updateAdminTripForm('passengerName', v)}
                editable={!creatingAdminTrip}
              />
            </View>

            {/* Passenger Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Passenger Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210"
                placeholderTextColor={COLORS.textTertiary}
                value={adminTripForm.passengerPhone}
                onChangeText={(v) => updateAdminTripForm('passengerPhone', v)}
                keyboardType="phone-pad"
                editable={!creatingAdminTrip}
              />
            </View>

            {/* Car Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Car Type *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                <Picker
                  selectedValue={adminTripForm.carType}
                  onValueChange={(value) => updateAdminTripForm('carType', value)}
                >
                  <Picker.Item label="Select Car Type" value="" />
                  {adminTripOptions.carTypes.map((type) => (
                    <Picker.Item key={type.id} label={type.name} value={type.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Seater Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Seater Type *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                <Picker
                  selectedValue={adminTripForm.seaterType}
                  onValueChange={(value) => updateAdminTripForm('seaterType', value)}
                >
                  <Picker.Item label="Select Seater Type" value="" />
                  {adminTripOptions.seaterTypes.map((seater) => (
                    <Picker.Item key={seater.id} label={seater.name} value={seater.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Fuel Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fuel Type *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                <Picker
                  selectedValue={adminTripForm.fuelType}
                  onValueChange={(value) => updateAdminTripForm('fuelType', value)}
                >
                  <Picker.Item label="Select Fuel Type" value="" />
                  {adminTripOptions.fuelTypes.map((fuel) => (
                    <Picker.Item key={fuel.id} label={fuel.name} value={fuel.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Driver Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assign Drivers * ({selectedDrivers.length} selected)</Text>
              <View style={{ maxHeight: 200 }}>
                <ScrollView nestedScrollEnabled>
                  {availableDrivers.map((driver) => (
                    <TouchableOpacity
                      key={driver.id}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 10, 
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: COLORS.border
                      }}
                      onPress={() => {
                        if (selectedDrivers.includes(driver.id)) {
                          setSelectedDrivers(selectedDrivers.filter(id => id !== driver.id));
                        } else {
                          setSelectedDrivers([...selectedDrivers, driver.id]);
                        }
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: '#9c27b0',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: selectedDrivers.includes(driver.id) ? '#9c27b0' : 'transparent'
                      }}>
                        {selectedDrivers.includes(driver.id) && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 13 }}>{driver.full_name}</Text>
                        <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>{driver.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Special Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="e.g. Avoid traffic, special customer requests, etc."
                placeholderTextColor={COLORS.textTertiary}
                value={adminTripForm.notes}
                onChangeText={(v) => updateAdminTripForm('notes', v)}
                multiline
                editable={!creatingAdminTrip}
              />
            </View>

            {/* Toggle Options */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Extra Charges</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
                onPress={() => updateAdminTripForm('tollIncluded', !adminTripForm.tollIncluded)}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: '#9c27b0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: adminTripForm.tollIncluded ? '#9c27b0' : 'transparent'
                }}>
                  {adminTripForm.tollIncluded && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={{ color: COLORS.text, fontSize: 13 }}>Toll - Tax - Hills Included</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
                onPress={() => updateAdminTripForm('petTravelling', !adminTripForm.petTravelling)}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: '#9c27b0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: adminTripForm.petTravelling ? '#9c27b0' : 'transparent'
                }}>
                  {adminTripForm.petTravelling && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={{ color: COLORS.text, fontSize: 13 }}>Pet Travelling Allowed</Text>
              </TouchableOpacity>
            </View>

            {/* Scheduled Date Picker */}
            {showScheduledDatePicker && (
              <DateTimePicker
                value={adminTripForm.scheduledAt}
                mode="date"
                display="default"
                onChange={handleScheduledDateChange}
              />
            )}

            {/* Return Date Picker */}
            {showReturnDatePicker && (
              <DateTimePicker
                value={adminTripForm.returnDate || new Date()}
                mode="date"
                display="default"
                onChange={handleReturnDateChange}
              />
            )}

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#9c27b0', marginTop: 16 }, creatingAdminTrip && styles.buttonDisabled]}
              onPress={handleCreateAdminTrip}
              disabled={creatingAdminTrip}
            >
              {creatingAdminTrip ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Create & Assign Trip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
