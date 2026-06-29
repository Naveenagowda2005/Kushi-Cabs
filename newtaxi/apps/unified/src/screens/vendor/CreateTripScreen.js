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

export default function VendorCreateTripScreen({ navigation, route }) {
  const { user } = useAuth();
  const { vendor } = useVendorProfile(user?.id);
  const { settings, refetch: refetchSettings } = useAppSettings();
  
  // Get edit mode params from route
  const editingTrip = route?.params?.trip;
  const editMode = route?.params?.editMode || false;

  const [form, setForm] = useState({
    pickupLocation:   editingTrip?.pickup_location || '',
    dropoffLocation:  editingTrip?.dropoff_location || '',
    returnLocation:   editingTrip?.return_location || '',
    returnDate:       editingTrip?.return_date ? new Date(editingTrip.return_date) : null,
    fareAmount:       editingTrip?.fare_amount?.toString() || '',
    commissionAmount: editingTrip?.commission_amount?.toString() || '',
    customerPreAdvance: editingTrip?.customer_pre_advance?.toString() || '',
    passengerName:    editingTrip?.passenger_name || '',
    passengerPhone:   editingTrip?.passenger_phone || '',
    scheduledAt:      editingTrip?.scheduled_at ? new Date(editingTrip.scheduled_at) : new Date(),
    carType:          editingTrip?.car_type || '',
    carModel:         editingTrip?.car_model || '',
    seaterType:       editingTrip?.seater_type || '',
    fuelType:         editingTrip?.fuel_type || '',
    segment:          editingTrip?.segment_id || '',
    package:          editingTrip?.package_id || '',
    tollIncluded:     editingTrip?.toll_included || false,
    stateTaxIncluded: editingTrip?.state_tax_included || false,
    petTravelling:    editingTrip?.pet_travelling || false,
    hillsIncluded:    editingTrip?.hills_included || false,
    fixedKm:          editingTrip?.fixed_km?.toString() || '',
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
        .select('id, name, display_order')
        .order('display_order', { ascending: true });
      
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

    // Handle segment changes
    if (field === 'segment' && value) {
      fetchPackagesForSegment(value);
      // Reset package selection when segment changes
      setForm((prev) => ({ ...prev, package: '' }));
      
      // If changing to non-Round trip, clear return fields
      const selectedSegment = segments.find(s => s.id === value);
      if (selectedSegment?.name !== 'Round trips') {
        setForm((prev) => ({ 
          ...prev, 
          returnLocation: '',
          returnDate: null 
        }));
      }
    }
  }

  function validate() {
    if (!form.segment)                  return 'Please select a trip segment.';
    if (!form.pickupLocation.trim())    return 'Pickup location is required.';
    if (!form.dropoffLocation.trim())   return 'Drop-off location is required.';
    if (form.segment === 'Round trips' && !form.returnLocation.trim()) return 'Return location is required for round trips.';
    if (form.segment === 'Round trips' && !form.returnDate) return 'Return date is required for round trips.';
    if (!form.passengerName.trim())     return 'Passenger name is required.';
    if (!form.passengerPhone.trim())    return 'Passenger phone is required.';
    const fixedKm = parseFloat(form.fixedKm);
    if (!fixedKm || fixedKm <= 0)       return 'Enter a valid fixed KM.';
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
      // Get the selected segment
      const selectedSegment = segments.find(s => s.id === form.segment);
      const isRoundTrip = selectedSegment?.name === 'Round trips';
      
      const tripData = {
        pickup_location:      form.pickupLocation.trim(),
        dropoff_location:     form.dropoffLocation.trim(),
        return_location:      isRoundTrip ? (form.returnLocation.trim() || null) : null,
        return_date:          isRoundTrip ? (form.returnDate ? form.returnDate.toISOString() : null) : null,
        fixed_km:             parseFloat(form.fixedKm),
        fare_amount:          parseFloat(form.fareAmount),
        commission_amount:    parseFloat(form.commissionAmount),
        customer_pre_advance: parseFloat(form.customerPreAdvance) || 0,
        scheduled_at:         form.scheduledAt ? form.scheduledAt.toISOString() : new Date().toISOString(),
        passenger_name:       form.passengerName.trim(),
        passenger_phone:      form.passengerPhone.trim(),
        car_type:             form.carType,
        car_model:            form.carModel,
        seater_type:          form.seaterType,
        fuel_type:            form.fuelType,
        segment_id:           form.segment,
        package_id:           form.package || null,
        toll_included:        form.tollIncluded,
        state_tax_included:   form.stateTaxIncluded,
        pet_travelling:       form.petTravelling,
        hills_included:       form.hillsIncluded,
      };

      let error;
      
      if (editMode && editingTrip?.id) {
        // UPDATE existing trip
        const result = await supabase.from('trips').update(tripData).eq('id', editingTrip.id);
        error = result.error;
      } else {
        // INSERT new trip
        const result = await supabase.from('trips').insert({
          ...tripData,
          commission_paid:  false,
          status:           TRIP_STATUS.PENDING,
          vendor_id:        vendor?.id || null,
          created_by:       user.id,
          is_published:     false,
        });
        error = result.error;
      }

      if (error) throw error;

      const commission = parseFloat(form.commissionAmount) || 0;
      const customerPreAdvance = parseFloat(form.customerPreAdvance) || 0;
      const commissionToPay = Math.max(0, commission - customerPreAdvance);
      
      const message = editMode 
        ? '✅ Trip Updated'
        : '✅ Trip Created';
      
      const description = editMode
        ? 'Trip has been updated successfully!'
        : commissionToPay > 0
        ? `Trip created successfully!\nYou can publish it to drivers from your trips list.\nDrivers must pay ₹${commissionToPay.toFixed(2)} commission to unlock customer details.`
        : customerPreAdvance > 0
        ? `Trip created successfully!\nYou can publish it to drivers from your trips list.\nCustomer pre-advance (₹${customerPreAdvance.toFixed(2)}) covers the commission.`
        : `Trip created successfully!\nYou can publish it to drivers from your trips list.`;
      
      Alert.alert(
        message,
        description,
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

        {editMode && (
          <View style={styles.editModeBanner}>
            <Ionicons name="pencil-outline" size={16} color="#2196f3" />
            <Text style={styles.editModeBannerText}>Editing Trip - Changes will update the existing trip</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="layers-outline" size={18} color="#2196f3" />
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
          <Ionicons name="location-outline" size={18} color="#2196f3" />
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
          <>
            <Field label="Return Location *" icon="location-outline"
              placeholder="e.g. Return pickup point"
              value={form.returnLocation} onChangeText={(v) => update('returnLocation', v)} />

            <CustomDateTimePicker
              label="Return Date *"
              value={form.returnDate}
              onChange={(date) => update('returnDate', date)}
              mode="date"
              placeholder="Select return date"
            />
          </>
        )}

        <Field label="Fixed KM *" icon="map-outline"
          placeholder="e.g. 50"
          value={form.fixedKm} onChangeText={(v) => update('fixedKm', v)}
          keyboardType="decimal-pad" />

        <Field label="Trip Amount (₹) *" icon="cash-outline"
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
              <Text style={styles.breakdownLabel}>Trip Amount</Text>
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

        {/* Combined Toll - Tax - Hills Toggle Section */}
        <View style={styles.toggleWrapper}>
          <View style={styles.toggleLabel}>
            <Ionicons name="cash-outline" size={16} color="#888" />
            <Text style={styles.toggleLabelText}>Toll - Tax - Hills</Text>
          </View>
          <View style={styles.toggleButtonGroup}>
            <TouchableOpacity
              style={[styles.toggleButton, !form.tollIncluded && styles.toggleButtonActive]}
              onPress={() => {
                update('tollIncluded', false);
                update('stateTaxIncluded', false);
                update('hillsIncluded', false);
              }}
            >
              <Text style={[styles.toggleButtonText, !form.tollIncluded && styles.toggleButtonTextActive]}>
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, form.tollIncluded && styles.toggleButtonActive]}
              onPress={() => {
                update('tollIncluded', true);
                update('stateTaxIncluded', true);
                update('hillsIncluded', true);
              }}
            >
              <Text style={[styles.toggleButtonText, form.tollIncluded && styles.toggleButtonTextActive]}>
                Yes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pet Travelling Toggle */}
        <View style={styles.toggleWrapper}>
          <View style={styles.toggleLabel}>
            <Ionicons name="paw-outline" size={16} color="#888" />
            <Text style={styles.toggleLabelText}>Pet Travelling</Text>
          </View>
          <View style={styles.toggleButtonGroup}>
            <TouchableOpacity
              style={[styles.toggleButton, !form.petTravelling && styles.toggleButtonActive]}
              onPress={() => update('petTravelling', false)}
            >
              <Text style={[styles.toggleButtonText, !form.petTravelling && styles.toggleButtonTextActive]}>
                No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, form.petTravelling && styles.toggleButtonActive]}
              onPress={() => update('petTravelling', true)}
            >
              <Text style={[styles.toggleButtonText, form.petTravelling && styles.toggleButtonTextActive]}>
                Yes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Extra Charges Summary */}
        <View style={styles.chargesSummaryBox}>
          <Text style={styles.chargesSummaryTitle}>Extra Charges Summary</Text>
          <View style={styles.chargesSummaryRow}>
            <Text style={styles.chargesSummaryLabel}>Toll - Tax - Hills</Text>
            <Text style={[styles.chargesSummaryValue, form.tollIncluded ? styles.included : styles.excluded]}>
              {form.tollIncluded ? '✓ Included' : '✗ Excluded'}
            </Text>
          </View>
          <View style={styles.chargesSummaryRow}>
            <Ionicons name="paw-outline" size={14} color="#ff9800" />
            <Text style={styles.chargesSummaryLabel}>Pet Travelling</Text>
            <Text style={[styles.chargesSummaryValue, form.petTravelling ? styles.included : styles.excluded]}>
              {form.petTravelling ? '✓ Allowed' : '✗ Not Allowed'}
            </Text>
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
                <Ionicons name={editMode ? "pencil-outline" : "add-circle-outline"} size={22} color="#fff" />
                <Text style={styles.createBtnText}>{editMode ? 'Update Trip' : 'Post Trip'}</Text>
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
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  scroll: { padding: 16, paddingBottom: 60 },
  editModeBanner: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  editModeBannerText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 12 },
  sectionTitle: { color: '#333', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldWrapper: { marginBottom: 12 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabelText: { color: '#666', fontSize: 13, fontWeight: '500' },
  input: { backgroundColor: '#ffffff', color: '#333', borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 2, borderColor: '#ff9800' },
  toggleWrapper: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    borderRadius: 10, 
    padding: 14, 
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ff9800'
  },
  toggleLabel: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    flex: 1
  },
  toggleLabelText: { 
    color: '#666', 
    fontSize: 13,
    fontWeight: '500'
  },
  toggleButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 50,
    alignItems: 'center'
  },
  toggleButtonActive: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800'
  },
  toggleButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600'
  },
  toggleButtonTextActive: {
    color: '#fff'
  },
  breakdownCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 2, borderColor: '#ff9800' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { color: '#666', fontSize: 13, fontWeight: '500' },
  breakdownValue: { color: '#333', fontSize: 13, fontWeight: '600' },
  breakdownTotal: { borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 8, marginTop: 4, marginBottom: 0 },
  breakdownTotalLabel: { color: '#333', fontSize: 14, fontWeight: '700' },
  breakdownTotalValue: { color: '#4caf50', fontSize: 16, fontWeight: '700' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff3e0', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 2, borderColor: '#ff9800' },
  infoText: { color: '#ff9800', fontSize: 12, flex: 1, lineHeight: 18, fontWeight: '500' },
  createBtn: { backgroundColor: '#ff9800', borderRadius: 10, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pickerWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ff9800',
    overflow: 'hidden',
  },
  picker: {
    color: '#333',
    backgroundColor: '#ffffff',
  },
  chargesSummaryBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  chargesSummaryTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  chargesSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chargesSummaryLabel: {
    color: '#666',
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  chargesSummaryValue: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  included: {
    backgroundColor: '#4caf5033',
    color: '#4caf50',
  },
  excluded: {
    backgroundColor: '#f4433633',
    color: '#f44336',
  },
});
