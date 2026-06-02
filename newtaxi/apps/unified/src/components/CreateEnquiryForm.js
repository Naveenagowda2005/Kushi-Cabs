import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COLORS, TRIP_STATUS } from '../constants';
import { useAppSettings } from '../hooks/useAppSettings';
import { getResponsiveFontSize, getResponsivePadding } from '../utils/responsive';
import LocationPickerModal from './LocationPickerModal';
import CustomDateTimePicker from './DateTimePicker';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Geocode location name to coordinates
async function geocodeLocation(locationName) {
  if (!GOOGLE_MAPS_API_KEY || !locationName.trim()) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.status === 'OK' && json.results.length > 0) {
      const { lat, lng } = json.results[0].geometry.location;
      console.log(`✅ Geocoded "${locationName}" to:`, { lat, lng });
      return { lat, lng };
    } else {
      console.warn(`❌ Geocoding failed for "${locationName}":`, json.status);
      return null;
    }
  } catch (e) {
    console.error('Geocoding error:', e.message);
    return null;
  }
}

const CreateEnquiryForm = React.memo(({ onClose, onSuccess }) => {
  const { session } = useAuth();
  const { settings, refetch: refetchSettings } = useAppSettings();
  const [formData, setFormData] = useState({
    pickup_location: '',
    dropoff_location: '',
    pickup_lat: null,
    pickup_lng: null,
    dropoff_lat: null,
    dropoff_lng: null,
    scheduled_at: new Date(),
    passenger_name: '',
    passenger_phone: '',
    fare_amount: '',
    car_type: '',
    car_model: '',
    seater_type: '',
    fuel_type: '',
  });
  
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState('pickup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carTypes, setCarTypes] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [seaterTypes, setSeaterTypes] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);

  // Refetch settings when form mounts to ensure we have the latest values
  useEffect(() => {
    console.log('CreateEnquiryForm mounted - refetching settings');
    refetchSettings();
    fetchCarOptions();
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

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Fetch car models when car type changes
    if (field === 'car_type' && value) {
      fetchCarModelsForType(value);
    }
  }, []);

  const openLocationPicker = useCallback((type) => {
    setLocationPickerType(type);
    setLocationPickerVisible(true);
  }, []);

  const handleLocationSelect = useCallback((locationData) => {
    if (locationPickerType === 'pickup') {
      setFormData(prev => ({
        ...prev,
        pickup_location: locationData.name,
        pickup_lat: locationData.latitude,
        pickup_lng: locationData.longitude,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dropoff_location: locationData.name,
        dropoff_lat: locationData.latitude,
        dropoff_lng: locationData.longitude,
      }));
    }
    setLocationPickerVisible(false);
  }, [locationPickerType]);

  const handleSubmit = useCallback(async () => {
    if (!formData.pickup_location.trim() || !formData.dropoff_location.trim()) {
      Alert.alert('Error', 'Please select pickup and dropoff locations');
      return;
    }

    if (!formData.fare_amount.trim()) {
      Alert.alert('Error', 'Please enter fare amount');
      return;
    }

    try {
      setIsSubmitting(true);

      // If coordinates are missing, try to geocode them
      let pickupLat = formData.pickup_lat;
      let pickupLng = formData.pickup_lng;
      let dropoffLat = formData.dropoff_lat;
      let dropoffLng = formData.dropoff_lng;

      if ((!pickupLat || !pickupLng) && formData.pickup_location) {
        console.log('🔍 Geocoding pickup location:', formData.pickup_location);
        const coords = await geocodeLocation(formData.pickup_location);
        if (coords) {
          pickupLat = coords.lat;
          pickupLng = coords.lng;
        }
      }

      if ((!dropoffLat || !dropoffLng) && formData.dropoff_location) {
        console.log('🔍 Geocoding dropoff location:', formData.dropoff_location);
        const coords = await geocodeLocation(formData.dropoff_location);
        if (coords) {
          dropoffLat = coords.lat;
          dropoffLng = coords.lng;
        }
      }

      // Use the vendor window from settings (in minutes)
      const vendorWindowMinutes = settings.vendor_window_minutes || 15;
      const vendorVisibleUntil = new Date(Date.now() + vendorWindowMinutes * 60 * 1000).toISOString();
      
      console.log('CreateEnquiryForm - Settings:', settings);
      console.log('CreateEnquiryForm - Vendor window minutes:', vendorWindowMinutes);
      console.log('CreateEnquiryForm - Vendor visible until:', vendorVisibleUntil);
      console.log('CreateEnquiryForm - Form data being saved:', {
        pickup_location: formData.pickup_location,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        dropoff_location: formData.dropoff_location,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
      });

      const { error } = await supabase
        .from('trips')
        .insert({
          pickup_location: formData.pickup_location,
          dropoff_location: formData.dropoff_location,
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_lat: dropoffLat,
          dropoff_lng: dropoffLng,
          scheduled_at: formData.scheduled_at ? formData.scheduled_at.toISOString() : new Date().toISOString(),
          fare_amount: parseFloat(formData.fare_amount) || 0,
          status: TRIP_STATUS.PENDING,
          vendor_visible_until: vendorVisibleUntil,
          passenger_name: formData.passenger_name,
          passenger_phone: formData.passenger_phone,
          car_type: formData.car_type,
          car_model: formData.car_model,
          seater_type: formData.seater_type,
          fuel_type: formData.fuel_type,
          created_by: session?.user?.id,
        });

      if (error) throw error;

      Alert.alert('Success', `Enquiry created successfully\nVendor window: ${vendorWindowMinutes} minutes`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating enquiry:', error);
      Alert.alert('Error', 'Failed to create enquiry');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, settings, onSuccess, onClose]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create New Enquiry</Text>
        <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pickup Location */}
        <Text style={styles.label}>Pickup Location</Text>
        <TouchableOpacity
          style={[styles.locationButton, isSubmitting && styles.locationButtonDisabled]}
          onPress={() => {
            console.log('Pickup button pressed');
            openLocationPicker('pickup');
          }}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={20} color={COLORS.primary} />
          <Text style={[
            styles.locationButtonText,
            { color: formData.pickup_location ? COLORS.text : COLORS.textSecondary }
          ]}>
            {formData.pickup_location || 'Select pickup location'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Dropoff Location */}
        <Text style={styles.label}>Dropoff Location</Text>
        <TouchableOpacity
          style={[styles.locationButton, isSubmitting && styles.locationButtonDisabled]}
          onPress={() => {
            console.log('Dropoff button pressed');
            openLocationPicker('dropoff');
          }}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Ionicons name="flag-outline" size={20} color={COLORS.error} />
          <Text style={[
            styles.locationButtonText,
            { color: formData.dropoff_location ? COLORS.text : COLORS.textSecondary }
          ]}>
            {formData.dropoff_location || 'Select dropoff location'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Passenger Name */}
        <Text style={styles.label}>Passenger Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter passenger name"
          placeholderTextColor={COLORS.textSecondary}
          value={formData.passenger_name}
          onChangeText={(text) => updateField('passenger_name', text)}
          returnKeyType="next"
          autoCorrect={false}
          autoCapitalize="words"
          editable={!isSubmitting}
        />

        {/* Passenger Phone */}
        <Text style={styles.label}>Passenger Phone *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter passenger phone number"
          placeholderTextColor={COLORS.textSecondary}
          value={formData.passenger_phone}
          onChangeText={(text) => {
            // Allow only digits and limit to 10 digits
            const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
            updateField('passenger_phone', digitsOnly);
          }}
          keyboardType="phone-pad"
          returnKeyType="next"
          autoCorrect={false}
          editable={!isSubmitting}
          maxLength={10}
        />

        {/* Date Time Picker */}
        <CustomDateTimePicker
          label="Scheduled Date & Time"
          value={formData.scheduled_at}
          onChange={(date) => updateField('scheduled_at', date)}
          mode="datetime"
          placeholder="Select scheduled date and time"
        />

        {/* Fare Amount */}
        <Text style={styles.label}>Fare Amount *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter fare amount (₹)"
          placeholderTextColor={COLORS.textSecondary}
          value={formData.fare_amount}
          onChangeText={(text) => updateField('fare_amount', text)}
          keyboardType="numeric"
          returnKeyType="done"
          autoCorrect={false}
          editable={!isSubmitting}
        />

        {/* Car Type Selection */}
        <Text style={styles.label}>Car Type *</Text>
        <View style={styles.pickerContainer}>
          {carTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.optionButton,
                formData.car_type === type.id && styles.optionButtonActive,
              ]}
              onPress={() => updateField('car_type', type.id)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  formData.car_type === type.id && styles.optionButtonTextActive,
                ]}
              >
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Car Model Selection */}
        {formData.car_type && carModels.length > 0 && (
          <>
            <Text style={styles.label}>Car Model</Text>
            <View style={styles.pickerContainer}>
              {carModels.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.optionButton,
                    formData.car_model === model.id && styles.optionButtonActive,
                  ]}
                  onPress={() => updateField('car_model', model.id)}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      formData.car_model === model.id && styles.optionButtonTextActive,
                    ]}
                  >
                    {model.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Seater Type Selection */}
        <Text style={styles.label}>Seater Type *</Text>
        <View style={styles.pickerContainer}>
          {seaterTypes.map((seater) => (
            <TouchableOpacity
              key={seater.id}
              style={[
                styles.optionButton,
                formData.seater_type === seater.id && styles.optionButtonActive,
              ]}
              onPress={() => updateField('seater_type', seater.id)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  formData.seater_type === seater.id && styles.optionButtonTextActive,
                ]}
              >
                {seater.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fuel Type Selection */}
        <Text style={styles.label}>Fuel Type *</Text>
        <View style={styles.pickerContainer}>
          {fuelTypes.map((fuel) => (
            <TouchableOpacity
              key={fuel.id}
              style={[
                styles.optionButton,
                formData.fuel_type === fuel.id && styles.optionButtonActive,
              ]}
              onPress={() => updateField('fuel_type', fuel.id)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  formData.fuel_type === fuel.id && styles.optionButtonTextActive,
                ]}
              >
                {fuel.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Enquiry'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <LocationPickerModal
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onLocationSelect={handleLocationSelect}
        title={locationPickerType === 'pickup' ? 'Select Pickup Location' : 'Select Dropoff Location'}
      />
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(24),
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: getResponsivePadding(24),
    paddingBottom: 100,
  },
  label: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: getResponsiveFontSize(16),
    color: COLORS.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 50,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 50,
  },
  locationButtonDisabled: {
    opacity: 0.5,
  },
  locationButtonText: {
    flex: 1,
    fontSize: getResponsiveFontSize(16),
    marginLeft: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: COLORS.text,
  },
  bottomPadding: {
    height: 50,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: getResponsiveFontSize(13),
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
});

export default CreateEnquiryForm;
