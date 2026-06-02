import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useVendorProfile } from '../../hooks/useVendorProfile';
import { supabase } from '../../lib/supabase';
import { TRIP_STATUS } from '../../constants';
import { useAppSettings } from '../../hooks/useAppSettings';
import CustomDateTimePicker from '../../components/DateTimePicker';

export default function VendorCreateTripScreen({ navigation }) {
  const { user } = useAuth();
  const { vendor } = useVendorProfile(user?.id);
  const { settings, refetch: refetchSettings } = useAppSettings();

  const [form, setForm] = useState({
    pickupLocation:   '',
    dropoffLocation:  '',
    returnLocation:   '',
    fareAmount:       '',
    commissionAmount: '',
    customerPreAdvance: '',
    passengerName:    '',
    passengerPhone:   '',
    scheduledAt:      new Date(),
    carType:          '',
    carModel:         '',
    seaterType:       '',
    fuelType:         '',
    segment:          '',
    package:          '',
    tollIncluded:     false,
  });
  const [loading, setLoading] = useState(false);
  const [carTypes, setCarTypes] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [seaterTypes, setSeaterTypes] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [segments, setSegments] = useState([]);
  const [packages, setPackages] = useState([]);

  // Refetch settings when screen mounts to ensure we have the latest values
  useEffect(() => {
    console.log('VendorCreateTripScreen mounted - refetching settings');
    refetchSettings();
    fetchCarOptions();
    fetchSegments();
  }, [refetchSettings]);

  const fetchCarOptions = async () => {
    try {
      const [carTypesRes, seaterRes, fuelRes] = await Promise.all([
        supabase.from('car_types').select('id, name').order('name'),
        supabase.from('seater_types').select('id, name').order('name'),
        supabase.from('fuel_types').select('id, name').order('name'),
      ]);

      if (carTypesRes.data) setCarTypes(carTypesRes.data);
      if (seaterRes.data) setSeaterTypes(seaterRes.data);
      if (fuelRes.data) setFuelTypes(fuelRes.data);
    } catch (error) {
      console.error('Error fetching car options:', error);
    }
  };

  const fetchSegments = async () => {
    try {
      const { data } = await supabase
        .from('trip_segments')
        .select('id, name')
        .order('name');
      
      if (data) setSegments(data);
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  const fetchPackagesForSegment = async (segmentId) => {
    try {
      const { data } = await supabase
        .from('trip_packages')
        .select('id, name')
        .eq('segment_id', segmentId)
        .order('name');
      
      if (data) setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchCarModelsForType = async (carTypeId) => {
    try {
      const { data } = await supabase
        .from('car_models')
        .select('id, name')
        .eq('car_type_id', carTypeId)
        .order('name');
      
      if (data) setCarModels(data);
    } catch (error) {
      console.error('Error fetching car models:', error);
    }
  };

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    // Fetch car models when car type changes
    if (field === 'carType' && value) {
      fetchCarModelsForType(value);
    }

    // Fetch packages when segment changes
    if (field === 'segment' && value) {
      fetchPackagesForSegment(value);
      // Reset package selection when segment changes
      setForm((prev) => ({ ...prev, package: '' }));
    }
  }

  function validate() {
    if (!form.segment)                  return 'Please select a trip segment.';
    if (!form.pickupLocation.trim())    return 'Pickup location is required.';
    if (!form.dropoffLocation.trim())   return 'Drop-off location is required.';
    if (form.segment === 'Round trips' && !form.returnLocation.trim()) return 'Return location is required for round trips.';
    if (!form.passengerName.trim())     return 'Passenger name is required.';
    if (!form.passengerPhone.trim())    return 'Passenger phone is required.';
    const fare = parseFloat(form.fareAmount);
    if (!fare || fare <= 0)             return 'Enter a valid fare amount.';
    const commission = parseFloat(form.commissionAmount);
    if (!commission || commission <= 0) return 'Enter a valid commission amount for the driver.';
    if (!form.carType)                  return 'Please select a car type.';
    if (!form.seaterType)               return 'Please select seater type.';
    if (!form.fuelType)                 return 'Please select fuel type.';
    return null;
  }

  async function handleCreate() {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('trips').insert({
        pickup_location:      form.pickupLocation.trim(),
        dropoff_location:     form.dropoffLocation.trim(),
        return_location:      form.returnLocation.trim() || null,
        fare_amount:          parseFloat(form.fareAmount),
        commission_amount:    parseFloat(form.commissionAmount),
        customer_pre_advance: parseFloat(form.customerPreAdvance) || 0,
        commission_paid:      false,
        scheduled_at:         form.scheduledAt ? form.scheduledAt.toISOString() : new Date().toISOString(),
        passenger_name:       form.passengerName.trim(),
        passenger_phone:      form.passengerPhone.trim(),
        car_type:             form.carType,
        car_model:            form.carModel,
        seater_type:          form.seaterType,
        fuel_type:            form.fuelType,
        segment_id:           form.segment,
        package_id:           form.package || null,
        status:               TRIP_STATUS.PENDING,
        vendor_id:            vendor?.id || null,
        created_by:           user.id,
        is_published:         false,
        toll_included:        form.tollIncluded,
      });

      if (error) throw error;

      const commissionToPay = Math.max(0, commission - customerPreAdvance);
      
      Alert.alert(
        '✅ Trip Created',
        commissionToPay > 0
          ? `Trip created successfully!\nYou can publish it to drivers from your trips list.\nDrivers must pay ₹${commissionToPay.toFixed(2)} commission to unlock customer details.`
          : customerPreAdvance > 0
          ? `Trip created successfully!\nYou can publish it to drivers from your trips list.\nCustomer pre-advance (₹${customerPreAdvance.toFixed(2)}) covers the commission.`
          : `Trip created successfully!\nYou can publish it to drivers from your trips list.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('CreateTrip error:', err);
      Alert.alert('Error', err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  }

  const fare = parseFloat(form.fareAmount) || 0;
  const commission = parseFloat(form.commissionAmount) || 0;
  const customerPreAdvance = parseFloat(form.customerPreAdvance) || 0;
  
  // Commission to be paid by driver = Commission - Customer Pre-Advance (but minimum 0)
  const commissionToPay = Math.max(0, commission - customerPreAdvance);
  
  // Driver earning = Fare - Commission (commission is always deducted from fare)
  const driverEarning = fare - commission;
  
  const selectedSegmentName = segments.find(s => s.id === form.segment)?.name;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.sectionHeader}>
          <Ionicons name="layers-outline" size={18} color="#1a1a2e" />
          <Text style={styles.sectionTitle}>Trip Type</Text>
        </View>

        {/* Segment Dropdown */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldLabel}>
            <Ionicons name="layers-outline" size={14} color="#888" />
            <Text style={styles.fieldLabelText}>Trip Segment *</Text>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.segment}
              onValueChange={(value) => update('segment', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Trip Segment" value="" />
              {segments.map((seg) => (
                <Picker.Item key={seg.id} label={seg.name} value={seg.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Package Dropdown - Only for Local Packages */}
        {selectedSegmentName === 'Local Packages' && (
          <View style={styles.fieldWrapper}>
            <View style={styles.fieldLabel}>
              <Ionicons name="cube-outline" size={14} color="#888" />
              <Text style={styles.fieldLabelText}>Package *</Text>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.package}
                onValueChange={(value) => update('package', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Package" value="" />
                {packages.map((pkg) => (
                  <Picker.Item key={pkg.id} label={pkg.name} value={pkg.id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={18} color="#1a1a2e" />
          <Text style={styles.sectionTitle}>Trip Details</Text>
        </View>

        <Field label="Pickup Location *" icon="location-outline"
          placeholder="e.g. Mumbai Airport, Terminal 2"
          value={form.pickupLocation} onChangeText={(v) => update('pickupLocation', v)} />

        <Field label="Drop-off Location *" icon="flag-outline"
          placeholder="e.g. Bandra Kurla Complex"
          value={form.dropoffLocation} onChangeText={(v) => update('dropoffLocation', v)} />

        {/* Return Location - Only for Round Trips */}
        {selectedSegmentName === 'Round trips' && (
          <Field label="Return Location *" icon="location-outline"
            placeholder="e.g. Return pickup point"
            value={form.returnLocation} onChangeText={(v) => update('returnLocation', v)} />
        )}

        <Field label="Fare Amount (₹) *" icon="cash-outline"
          placeholder="e.g. 500"
          value={form.fareAmount} onChangeText={(v) => update('fareAmount', v)}
          keyboardType="decimal-pad" />

        <Field label="Customer Pre-Advance (₹)" icon="wallet-outline"
          placeholder="e.g. 100 (optional)"
          value={form.customerPreAdvance} onChangeText={(v) => update('customerPreAdvance', v)}
          keyboardType="decimal-pad" />

        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up-outline" size={18} color="#4caf50" />
          <Text style={styles.sectionTitle}>Commission</Text>
        </View>

        <Field label="Driver Commission Amount (₹) *" icon="trending-up-outline"
          placeholder="Amount driver pays to unlock customer details"
          value={form.commissionAmount} onChangeText={(v) => update('commissionAmount', v)}
          keyboardType="decimal-pad" />

        {/* Earning breakdown */}
        {fare > 0 && commission > 0 && (
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Fare Amount</Text>
              <Text style={styles.breakdownValue}>₹{fare.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Commission (Full)</Text>
              <Text style={[styles.breakdownValue, { color: '#ff6b6b' }]}>-₹{commission.toFixed(2)}</Text>
            </View>
            {customerPreAdvance > 0 && (
              <>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Customer Pre-Advance</Text>
                  <Text style={[styles.breakdownValue, { color: '#2196f3' }]}>₹{customerPreAdvance.toFixed(2)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Commission to Pay by Driver</Text>
                  <Text style={[styles.breakdownValue, { color: '#ff9800', fontWeight: '700' }]}>-₹{commissionToPay.toFixed(2)}</Text>
                </View>
                {commissionToPay === 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Status</Text>
                    <Text style={[styles.breakdownValue, { color: '#4caf50', fontWeight: '700' }]}>✓ Covered by Pre-Advance</Text>
                  </View>
                )}
              </>
            )}
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <Text style={styles.breakdownTotalLabel}>Driver Earning</Text>
              <Text style={[styles.breakdownTotalValue, driverEarning < 0 && { color: '#ff6b6b' }]}>₹{driverEarning.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={18} color="#888" />
          <Text style={styles.sectionTitle}>Passenger Details</Text>
        </View>

        <Field label="Passenger Name *" icon="person-outline"
          placeholder="e.g. Rahul Sharma"
          value={form.passengerName} onChangeText={(v) => update('passengerName', v)} />

        <Field label="Passenger Phone *" icon="call-outline"
          placeholder="e.g. 9876543210"
          value={form.passengerPhone} onChangeText={(v) => update('passengerPhone', v)}
          keyboardType="phone-pad" />

        <CustomDateTimePicker
          label="Scheduled At"
          value={form.scheduledAt}
          onChange={(date) => update('scheduledAt', date)}
          mode="datetime"
          placeholder="Select date and time"
        />

        <View style={styles.sectionHeader}>
          <Ionicons name="cash-outline" size={18} color="#ff9800" />
          <Text style={styles.sectionTitle}>Extra Charges</Text>
        </View>

        {/* Toll Charge Toggle */}
        <View style={styles.toggleWrapper}>
          <View style={styles.toggleLabel}>
            <Ionicons name="cash-outline" size={16} color="#ff9800" />
            <Text style={styles.toggleLabelText}>Toll Charge Included in Fare</Text>
          </View>
          <View style={styles.toggleButtonGroup}>
            <TouchableOpacity
              style={[styles.toggleButton, !form.tollIncluded && styles.toggleButtonActive]}
              onPress={() => update('tollIncluded', false)}
            >
              <Text style={[styles.toggleButtonText, !form.tollIncluded && styles.toggleButtonTextActive]}>
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, form.tollIncluded && styles.toggleButtonActive]}
              onPress={() => update('tollIncluded', true)}
            >
              <Text style={[styles.toggleButtonText, form.tollIncluded && styles.toggleButtonTextActive]}>
                Yes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="car-outline" size={18} color="#2196f3" />
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
        </View>

        {/* Car Type Dropdown */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldLabel}>
            <Ionicons name="car-outline" size={14} color="#888" />
            <Text style={styles.fieldLabelText}>Car Type *</Text>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.carType}
              onValueChange={(value) => update('carType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Car Type" value="" />
              {carTypes.map((type) => (
                <Picker.Item key={type.id} label={type.name} value={type.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Car Model Dropdown */}
        {form.carType && carModels.length > 0 && (
          <View style={styles.fieldWrapper}>
            <View style={styles.fieldLabel}>
              <Ionicons name="car-outline" size={14} color="#888" />
              <Text style={styles.fieldLabelText}>Car Model</Text>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.carModel}
                onValueChange={(value) => update('carModel', value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Car Model" value="" />
                {carModels.map((model) => (
                  <Picker.Item key={model.id} label={model.name} value={model.id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Seater Type Dropdown */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldLabel}>
            <Ionicons name="people-outline" size={14} color="#888" />
            <Text style={styles.fieldLabelText}>Seater Type *</Text>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.seaterType}
              onValueChange={(value) => update('seaterType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Seater Type" value="" />
              {seaterTypes.map((seater) => (
                <Picker.Item key={seater.id} label={seater.name} value={seater.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Fuel Type Dropdown */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldLabel}>
            <Ionicons name="flame-outline" size={14} color="#888" />
            <Text style={styles.fieldLabelText}>Fuel Type *</Text>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.fuelType}
              onValueChange={(value) => update('fuelType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Fuel Type" value="" />
              {fuelTypes.map((fuel) => (
                <Picker.Item key={fuel.id} label={fuel.name} value={fuel.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#ff9800" />
          <Text style={styles.infoText}>
            Trip created but not published yet. Publish it to make it visible to drivers.
            {commissionToPay > 0 
              ? `Drivers must pay ₹${commissionToPay.toFixed(2)} commission to see customer details.`
              : customerPreAdvance > 0
              ? `Customer pre-advance (₹${customerPreAdvance.toFixed(2)}) covers the commission.`
              : 'No commission required.'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="add-circle-outline" size={22} color="#fff" />
                <Text style={styles.createBtnText}>Post Trip</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, icon, placeholder, value, onChangeText, keyboardType }) {
  return (
    <View style={styles.fieldWrapper}>
      <View style={styles.fieldLabel}>
        <Ionicons name={icon} size={14} color="#888" />
        <Text style={styles.fieldLabelText}>{label}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#555"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  scroll: { padding: 20, paddingBottom: 60 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12 },
  sectionTitle: { color: '#ccc', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldWrapper: { marginBottom: 14 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabelText: { color: '#aaa', fontSize: 13 },
  input: { backgroundColor: '#16213e', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#1a1a2e' },
  toggleWrapper: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#16213e', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1a1a2e'
  },
  toggleLabel: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    flex: 1
  },
  toggleLabelText: { 
    color: '#aaa', 
    fontSize: 13,
    fontWeight: '500'
  },
  toggleButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#555',
    minWidth: 50,
    alignItems: 'center'
  },
  toggleButtonActive: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800'
  },
  toggleButtonText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600'
  },
  toggleButtonTextActive: {
    color: '#fff'
  },
  breakdownCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a2e' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { color: '#888', fontSize: 13 },
  breakdownValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  breakdownTotal: { borderTopWidth: 1, borderTopColor: '#0f3460', paddingTop: 8, marginTop: 4, marginBottom: 0 },
  breakdownTotalLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  breakdownTotalValue: { color: '#1a1a2e', fontSize: 16, fontWeight: '700' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#2a1a00', borderRadius: 10, padding: 12, marginBottom: 20 },
  infoText: { color: '#ff9800', fontSize: 12, flex: 1, lineHeight: 18 },
  createBtn: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8 },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  pickerWrapper: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a2e',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    backgroundColor: '#16213e',
  },
});
