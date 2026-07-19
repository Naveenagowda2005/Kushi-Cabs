import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Linking, Image, Modal, ScrollView,
  TextInput, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants';

// Zoomable Image Component with simple zoom controls
function ZoomableImage({ imageUrl, title, onClose }) {
  const [scale, setScale] = useState(1);
  const maxScale = 3;
  const minScale = 1;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, maxScale));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, minScale));
  };

  const handleReset = () => {
    setScale(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: '100%',
            height: '100%',
            transform: [{ scale }],
          }}
          resizeMode="contain"
        />
      </View>
      
      {/* Zoom Controls + Back Button Footer - Positioned with bottom padding to avoid system buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, paddingBottom: 80, backgroundColor: 'rgba(0, 0, 0, 0.7)', gap: 8 }}>
        {/* Back Button */}
        <TouchableOpacity
          style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#555' }}
          onPress={onClose}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Zoom Controls */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, flex: 1 }}>
          <TouchableOpacity
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#555' }}
            onPress={handleZoomOut}
            disabled={scale === minScale}
          >
            <Ionicons name="remove" size={20} color={scale === minScale ? '#666' : '#fff'} />
          </TouchableOpacity>
          
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', minWidth: 50, textAlign: 'center' }}>{Math.round(scale * 100)}%</Text>
          
          <TouchableOpacity
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#555' }}
            onPress={handleZoomIn}
            disabled={scale === maxScale}
          >
            <Ionicons name="add" size={20} color={scale === maxScale ? '#666' : '#fff'} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#555', marginLeft: 8 }}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Component to handle image loading - simplified to avoid crashes
function OdometerImageThumbnail({ imageUrl, tripId, imageType, onPress, isError, isLoading, onLoad, onError }) {
  // Use the URL directly - assume URLs are already public/accessible
  const displayUrl = imageUrl || null;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Handle image load completion
  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully: ${tripId}-${imageType}`);
    setImgLoaded(true);
    onLoad?.();
  };

  // Handle image load errors
  const handleImageError = (error) => {
    console.warn(`❌ Image failed to load: ${tripId}-${imageType}`, error);
    setImgError(true);
    onError?.();
  };

  return (
    <TouchableOpacity
      style={styles.odometerImageWrapper}
      onPress={() => {
        if (displayUrl && !imgError) {
          console.log('Thumbnail pressed, opening modal with URL:', displayUrl);
          onPress?.(displayUrl);
        }
      }}
      disabled={imgError || isError}
    >
      {imgError || isError ? (
        <View style={[styles.odometerImage, styles.imageErrorPlaceholder]}>
          <Ionicons name="image-outline" size={32} color="#666" />
          <Text style={styles.errorText}>Failed to load</Text>
        </View>
      ) : !imgLoaded && !displayUrl ? (
        <View style={[styles.odometerImage, styles.imageLoadingPlaceholder]}>
          <Ionicons name="hourglass-outline" size={32} color="#888" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : displayUrl ? (
        <Image
          source={{ uri: displayUrl }}
          style={styles.odometerImage}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      ) : (
        <View style={[styles.odometerImage, styles.imageLoadingPlaceholder]}>
          <Ionicons name="hourglass-outline" size={32} color="#888" />
          <Text style={styles.loadingText}>No image</Text>
        </View>
      )}
      <Text style={styles.odometerLabel}>{imageType === 'start' ? 'Start' : 'End'}</Text>
    </TouchableOpacity>
  );
}
const STATUS_COLOR = {
  completed: '#4caf50',
  cancelled: '#f44336',
  in_progress: '#9c27b0',
  accepted: '#2196f3',
  pending: '#ff9800',
};

export default function SuperAdminTripsScreen() {
  const { forceUpdate } = useTheme();
  
  // Force re-render when theme changes
  const [themeRefresh, setThemeRefresh] = useState(0);
  useEffect(() => {
    setThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending'); // Default to pending instead of 'all'
  const [filterAdminCreated, setFilterAdminCreated] = useState('all'); // New filter
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [modalSignedUrl, setModalSignedUrl] = useState(null);
  
  // Edit trip states
  const [editingTrip, setEditingTrip] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    fare_amount: '',
    pickup_location: '',
    dropoff_location: '',
    return_location: '',
    return_date: null,
    passenger_name: '',
    passenger_phone: '',
    car_type: '',
    car_model: '',
    seater_type: '',
    fuel_type: '',
    segment: '',
    package: '',
    fixed_km: '',
    commission_amount: '',
    customer_pre_advance: '',
    toll_included: false,
    state_tax_included: false,
    pet_travelling: false,
    hills_included: false,
    notes: '',
    created_at: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [adminTripOptions, setAdminTripOptions] = useState({
    segments: [],
    packages: [],
    carTypes: [],
    carModels: [],
    seaterTypes: [],
    fuelTypes: [],
  });
  const [savingTrip, setSavingTrip] = useState(false);
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [dummyDrivers, setDummyDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [reassigningTrip, setReassigningTrip] = useState(null);
  const [loadingDummyDrivers, setLoadingDummyDrivers] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const TRIPS_PER_PAGE = 50;

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`📄 Fetching trips (status: ${filterStatus}, admin: ${filterAdminCreated}, page: ${currentPage + 1})...`);

      // Build query parameters
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterAdminCreated === 'admin') {
        params.append('is_admin_trip', 'true');
      } else if (filterAdminCreated === 'vendor') {
        params.append('is_admin_trip', 'false');
      }
      params.append('page', currentPage);
      params.append('limit', TRIPS_PER_PAGE);

      // Call backend API instead of direct Supabase query
      const response = await fetch(`http://192.168.1.114:4000/api/trips/list?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch trips');
      }

      console.log(`✅ ${result.data?.length || 0} trips loaded (page ${currentPage + 1}, total: ${result.pagination?.total})`);
      setTrips(result.data || []);
    } catch (err) {
      console.error('❌ Error fetching trips:', err.message);
      Alert.alert('Error', 'Failed to fetch trips: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterAdminCreated, currentPage]);

  useFocusEffect(useCallback(() => { fetchTrips(); }, [fetchTrips]));

  // Lazy load user details when needed (e.g., when expanding trip details)
  const loadUserDetailsForTrip = useCallback(async (trip) => {
    const userIds = [];
    if (trip.created_by) userIds.push(trip.created_by);
    if (trip.accepted_by) userIds.push(trip.accepted_by);
    if (trip.admin_assigned_drivers && Array.isArray(trip.admin_assigned_drivers)) {
      trip.admin_assigned_drivers.forEach(id => userIds.push(id));
    }

    if (userIds.length === 0) return null;

    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('id, full_name, phone, role_id')
        .in('id', userIds);

      if (error) throw error;

      const userMap = {};
      usersData?.forEach(user => {
        userMap[user.id] = user;
      });

      return {
        creator: trip.created_by ? userMap[trip.created_by] : null,
        driver: trip.accepted_by ? userMap[trip.accepted_by] : null,
        latestAdminAssignedDriver: (trip.admin_assigned_drivers && trip.admin_assigned_drivers.length > 0)
          ? userMap[trip.admin_assigned_drivers[trip.admin_assigned_drivers.length - 1]]
          : null
      };
    } catch (error) {
      console.warn('⚠️ Failed to load user details:', error.message);
      return null;
    }
  }, []);

  const fetchAdminTripOptions = useCallback(async () => {
    try {
      console.log('Fetching trip options for edit form');
      
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

      console.log('✅ Trip options fetched for edit form');
    } catch (error) {
      console.error('Error fetching trip options:', error);
    }
  }, []);

  // Fetch options on mount
  useEffect(() => {
    fetchAdminTripOptions();
  }, [fetchAdminTripOptions]);

  const fetchCarModelsForEditTrip = async (carTypeId) => {
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

  const fetchPackagesForEditTrip = async (segmentId) => {
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

  const updateEditForm = useCallback((field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));

    // Fetch car models when car type changes
    if (field === 'car_type' && value) {
      fetchCarModelsForEditTrip(value);
    }

    // Handle segment changes
    if (field === 'segment' && value) {
      fetchPackagesForEditTrip(value);
      // Reset package selection
      setEditForm((prev) => ({ ...prev, package: '' }));
      
      // If not Round trip, clear return fields
      const selectedSegment = adminTripOptions.segments.find(s => s.id === value);
      if (selectedSegment?.name !== 'Round trips') {
        setEditForm((prev) => ({ 
          ...prev, 
          return_location: '',
          return_date: null 
        }));
      }
    }
  }, [adminTripOptions.segments]);

  const openImageModal = useCallback((imageUrl, title) => {
    console.log('🖼️ Opening image modal:', { imageUrl: imageUrl?.substring(0, 50) + '...', title });
    setModalSignedUrl(imageUrl);
    setSelectedImage({ url: imageUrl, title });
    setImageModalVisible(true);
  }, []);

  const handleImageLoad = (tripId, imageType) => {
    console.log(`Image loaded successfully: ${tripId}-${imageType}`);
    setImageLoadingStates(prev => ({
      ...prev,
      [`${tripId}-${imageType}`]: 'loaded'
    }));
  };

  const handleImageLoadError = (tripId, imageType, error) => {
    console.warn(`Image failed to load: ${tripId}-${imageType}`, error);
    setImageLoadingStates(prev => ({
      ...prev,
      [`${tripId}-${imageType}`]: 'error'
    }));
    setImageLoadErrors(prev => ({
      ...prev,
      [`${tripId}-${imageType}`]: true
    }));
  };

  const openEditModal = useCallback(async (trip) => {
    console.log('✏️ Opening edit modal for trip:', trip.id);
    
    try {
      // Fetch complete trip data from database to ensure all fields are available
      const { data: fullTrip, error } = await supabase
        .from('trips')
        .select(`
          id,
          booking_id_seq,
          status,
          fare_amount,
          pickup_location,
          dropoff_location,
          return_location,
          return_date,
          passenger_name,
          passenger_phone,
          car_type,
          car_model,
          seater_type,
          fuel_type,
          segment_id,
          package_id,
          fixed_km,
          commission_amount,
          customer_pre_advance,
          toll_included,
          state_tax_included,
          pet_travelling,
          hills_included,
          notes,
          created_at
        `)
        .eq('id', trip.id)
        .single();

      if (error) {
        console.error('Error fetching trip details:', error);
        Alert.alert('Error', 'Failed to load trip details');
        return;
      }

      if (!fullTrip) {
        Alert.alert('Error', 'Trip not found');
        return;
      }

      setEditingTrip(fullTrip);
      setEditForm({
        fare_amount: fullTrip.fare_amount?.toString() || '',
        pickup_location: fullTrip.pickup_location || '',
        dropoff_location: fullTrip.dropoff_location || '',
        return_location: fullTrip.return_location || '',
        return_date: fullTrip.return_date ? new Date(fullTrip.return_date) : null,
        passenger_name: fullTrip.passenger_name || '',
        passenger_phone: fullTrip.passenger_phone || '',
        car_type: fullTrip.car_type || '',
        car_model: fullTrip.car_model || '',
        seater_type: fullTrip.seater_type || '',
        fuel_type: fullTrip.fuel_type || '',
        segment: fullTrip.segment_id || '',
        package: fullTrip.package_id || '',
        fixed_km: fullTrip.fixed_km?.toString() || '',
        commission_amount: fullTrip.commission_amount?.toString() || '',
        customer_pre_advance: fullTrip.customer_pre_advance?.toString() || '',
        toll_included: Boolean(fullTrip.toll_included),
        state_tax_included: Boolean(fullTrip.state_tax_included),
        pet_travelling: Boolean(fullTrip.pet_travelling),
        hills_included: Boolean(fullTrip.hills_included),
        notes: fullTrip.notes || '',
        created_at: new Date(fullTrip.created_at),
      });

      // Fetch car models if car type exists
      if (fullTrip.car_type) {
        fetchCarModelsForEditTrip(fullTrip.car_type);
      }

      // Fetch packages if segment exists
      if (fullTrip.segment_id) {
        fetchPackagesForEditTrip(fullTrip.segment_id);
      }

      setEditModalVisible(true);
      console.log('✅ Edit modal opened with full trip data:', fullTrip);
    } catch (err) {
      console.error('Error opening edit modal:', err);
      Alert.alert('Error', 'Failed to open edit modal');
    }
  }, []);

  const handleSaveTrip = async () => {
    if (!editingTrip) return;
    
    try {
      // Validation
      if (!editForm.segment) {
        Alert.alert('Error', 'Please select a trip segment');
        return;
      }

      if (!editForm.pickup_location.trim()) {
        Alert.alert('Error', 'Pickup location is required');
        return;
      }

      if (!editForm.dropoff_location.trim()) {
        Alert.alert('Error', 'Dropoff location is required');
        return;
      }

      const selectedSegment = adminTripOptions.segments.find(s => s.id === editForm.segment);
      if (selectedSegment?.name === 'Round trips') {
        if (!editForm.return_location.trim()) {
          Alert.alert('Error', 'Return location is required for round trips');
          return;
        }
        if (!editForm.return_date) {
          Alert.alert('Error', 'Return date is required for round trips');
          return;
        }
      }

      if (!editForm.passenger_name.trim()) {
        Alert.alert('Error', 'Passenger name is required');
        return;
      }

      if (!editForm.passenger_phone.trim()) {
        Alert.alert('Error', 'Passenger phone is required');
        return;
      }

      const fareAmount = parseFloat(editForm.fare_amount);
      if (isNaN(fareAmount) || fareAmount < 0) {
        Alert.alert('Error', 'Please enter a valid fare amount');
        return;
      }

      const fixedKm = parseFloat(editForm.fixed_km);
      if (isNaN(fixedKm) || fixedKm <= 0) {
        Alert.alert('Error', 'Please enter a valid fixed KM');
        return;
      }

      const commissionAmount = parseFloat(editForm.commission_amount);
      if (isNaN(commissionAmount) || commissionAmount < 0) {
        Alert.alert('Error', 'Please enter a valid commission amount');
        return;
      }

      if (!editForm.car_type) {
        Alert.alert('Error', 'Please select a car type');
        return;
      }

      if (!editForm.seater_type) {
        Alert.alert('Error', 'Please select a seater type');
        return;
      }

      if (!editForm.fuel_type) {
        Alert.alert('Error', 'Please select a fuel type');
        return;
      }

      setSavingTrip(true);

      const customerPreAdvance = parseFloat(editForm.customer_pre_advance) || 0;

      const updates = {
        fare_amount: fareAmount,
        pickup_location: editForm.pickup_location.trim(),
        dropoff_location: editForm.dropoff_location.trim(),
        return_location: selectedSegment?.name === 'Round trips' ? editForm.return_location.trim() : null,
        return_date: selectedSegment?.name === 'Round trips' && editForm.return_date ? editForm.return_date.toISOString() : null,
        passenger_name: editForm.passenger_name.trim(),
        passenger_phone: editForm.passenger_phone.trim(),
        car_type: editForm.car_type || null,
        car_model: editForm.car_model || null,
        seater_type: editForm.seater_type || null,
        fuel_type: editForm.fuel_type || null,
        segment_id: editForm.segment || null,
        package_id: editForm.package || null,
        fixed_km: fixedKm,
        commission_amount: commissionAmount,
        customer_pre_advance: customerPreAdvance,
        toll_included: editForm.toll_included,
        state_tax_included: editForm.state_tax_included,
        pet_travelling: editForm.pet_travelling,
        hills_included: editForm.hills_included,
        notes: editForm.notes.trim() || null,
        created_at: editForm.created_at.toISOString(),
      };

      const { error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', editingTrip.id);

      if (error) throw error;

      // Refresh trips list from backend to ensure we get the latest data
      console.log('🔄 Refreshing trips list after update');
      await fetchTrips();

      Alert.alert('✅ Success', 'Trip updated successfully');
      setEditModalVisible(false);
      setEditingTrip(null);
    } catch (err) {
      console.error('Error updating trip:', err.message);
      Alert.alert('Error', 'Failed to update trip: ' + err.message);
    } finally {
      setSavingTrip(false);
    }
  };

  // Helper function to check if a trip was created by a super admin
  const isSuperAdminCreatedTrip = useCallback((trip) => {
    // Check if trip has is_admin_trip flag set to true
    return trip.is_admin_trip === true;
  }, []);

  // Function to fetch all drivers
  const fetchAllDrivers = useCallback(async () => {
    try {
      setLoadingDummyDrivers(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, phone, avatar_base64')
        .eq('role_id', 3) // Driver role
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;

      // Show all approved drivers
      const allDriversList = data || [];
      setDummyDrivers(allDriversList);
      console.log('✅ Fetched all drivers:', allDriversList.length);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoadingDummyDrivers(false);
    }
  }, []);

  // Function to reassign trip to dummy driver
  const handleReassignTrip = useCallback(async () => {
    if (!reassigningTrip || !selectedDriver) {
      Alert.alert('Error', 'Please select a driver');
      return;
    }

    try {
      setReassigningTrip(prev => ({ ...prev, reassigning: true }));

      // First, fetch the latest trip data to ensure we have correct status and admin_assigned_drivers
      console.log('🔍 Fetching latest trip data before reassignment:', reassigningTrip.id);
      const { data: latestTrip, error: fetchError } = await supabase
        .from('trips')
        .select('id, status, accepted_by, created_by, admin_assigned_drivers')
        .eq('id', reassigningTrip.id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching latest trip data:', fetchError);
        throw new Error('Could not fetch trip data: ' + fetchError.message);
      }

      console.log('✅ Latest trip data:', latestTrip);

      // Check if trip status is still pending
      if (latestTrip.status !== 'pending') {
        Alert.alert('Cannot Reassign', `Trip status is now "${latestTrip.status}". Only pending trips can be reassigned.`);
        setReassigningTrip(prev => ({ ...prev, reassigning: false }));
        return;
      }

      // Get the driver profile ID from the drivers table
      console.log('🔍 Fetching driver profile for user:', selectedDriver.id);
      const { data: driverProfile, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', selectedDriver.id)
        .maybeSingle();

      if (driverError) {
        console.error('❌ Error fetching driver profile:', driverError);
        throw new Error('Could not fetch driver profile: ' + driverError.message);
      }

      if (!driverProfile) {
        Alert.alert('Error', 'Driver profile not found. Driver may not be verified.');
        setReassigningTrip(prev => ({ ...prev, reassigning: false }));
        return;
      }

      console.log('✅ Driver profile found');

      // Prepare updated admin_assigned_drivers array
      // Add the selected driver's user ID to the array if not already there
      const currentDrivers = latestTrip.admin_assigned_drivers || [];
      const updatedDrivers = Array.isArray(currentDrivers) 
        ? Array.from(new Set([...currentDrivers, selectedDriver.id])) 
        : [selectedDriver.id];

      console.log('🔄 Reassigning trip to driver:', selectedDriver.id);
      console.log('   Current admin_assigned_drivers:', currentDrivers);
      console.log('   Updated admin_assigned_drivers:', updatedDrivers);

      // Now perform the direct update to set:
      // 1. accepted_by - the user ID (this makes it show in Available Trips via useAvailableTrips())
      // 2. admin_assigned_drivers - for tracking all assigned drivers
      // 3. status - keep pending until driver manually accepts
      // NOTE: We DO NOT set driver_id because that moves it to "My Trips" instead of "Available Trips"
      //       The driver should see it in Available Trips and accept it first
      const { error: updateError } = await supabase
        .from('trips')
        .update({ 
          accepted_by: selectedDriver.id,  // This allows driver to see it via useAvailableTrips()
          admin_assigned_drivers: updatedDrivers,  // Add driver to the array for tracking
          status: 'pending' // Keep pending until driver accepts
        })
        .eq('id', reassigningTrip.id);

      if (updateError) throw updateError;

      // Force refresh the trips list from database
      console.log('🔄 Refreshing trips list from database');
      await fetchTrips();

      console.log('✅ Trip successfully assigned to driver with PENDING status');
      Alert.alert('✅ Success', `Trip assigned to ${selectedDriver.full_name}.\n\nStatus: PENDING\nDriver must manually accept the trip.`);
      setReassignModalVisible(false);
      setSelectedDriver(null);
      setReassigningTrip(null);
    } catch (err) {
      console.error('❌ Error reassigning trip:', err);
      Alert.alert('Error', 'Failed to reassign trip: ' + err.message);
      setReassigningTrip(prev => ({ ...prev, reassigning: false }));
    }
  }, [reassigningTrip, selectedDriver]);

  const verifyImageUrl = useCallback(async (url) => {
    if (!url) return false;
    try {
      const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
      console.log(`✅ URL verification for ${url.substring(0, 50)}...: ${response.status}`);
      return response.ok;
    } catch (err) {
      console.warn(`⚠️ URL verification failed for ${url.substring(0, 50)}...`, err.message);
      return false;
    }
  }, []);

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setEditForm({...editForm, created_at: selectedDate});
    }
    setShowDatePicker(false);
  };

  const handleReturnDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setEditForm({...editForm, return_date: selectedDate});
    }
    setShowReturnDatePicker(false);
  };

  const getImageUrl = (storagePath) => {
    if (!storagePath) return null;
    
    // URLs are already stored as complete public URLs from Supabase
    // Just return them directly
    return storagePath;
  };

  const getSignedImageUrl = async (storagePath) => {
    if (!storagePath) return null;
    
    try {
      // If it's already a full URL, try to use it as-is first
      if (storagePath.startsWith('http')) {
        return storagePath;
      }
      
      // Extract just the file path
      const filePath = storagePath.split('/odometer-images/')[1] || storagePath;
      
      // Get signed URL from Supabase
      const { data, error } = await supabase.storage
        .from('odometer-images')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        // Silently fail for missing images (404 is expected)
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.log('Image not found in storage (expected):', filePath);
        } else {
          console.error('Error creating signed URL:', error);
        }
        return storagePath; // Fallback to original
      }

      return data?.signedUrl || storagePath;
    } catch (err) {
      console.error('Error in getSignedImageUrl:', err);
      return storagePath;
    }
  };

  const renderTrip = ({ item }) => {
    const color = STATUS_COLOR[item.status] ?? '#888';
    const distance = item.end_km && item.start_km
      ? `${(item.end_km - item.start_km).toFixed(1)} km`
      : 'N/A';
    
    // Format booking ID
    const getFormattedBookingId = (bookingIdSeq) => {
      const serial = (bookingIdSeq || 1).toString();
      return `KUSH-B-${serial}`;
    };
    const bookingId = getFormattedBookingId(item.booking_id_seq);

    return (
      <View style={styles.tripCard}>
        {/* Top Info Box - Booking ID and Trip Type */}
        <View style={styles.topInfoBox}>
          <View style={styles.topInfoItem}>
            <Text style={styles.topInfoLabel}>Booking ID</Text>
            <Text style={styles.bookingIdValue}>{bookingId}</Text>
          </View>
          <View style={styles.topInfoDivider} />
          <View style={styles.topInfoItem}>
            <Text style={styles.topInfoLabel}>Trip Type</Text>
            <Text style={styles.tripTypeValue}>{item.trip_segments?.name || 'Trip'}</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.tripHeader}>
          <View style={styles.tripHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <View>
              <Text style={[styles.status, { color }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.tripHeaderRight}>
            {isSuperAdminCreatedTrip(item) && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#fff" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
            <Text style={styles.fare}>₹{item.fare_amount}</Text>
          </View>
        </View>

        {/* Locations */}
        <View style={styles.section}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#4caf50" />
            <Text style={styles.locationLabel}>Pickup:</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickup_location}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.warning} />
            <Text style={styles.locationLabel}>Scheduled Date:</Text>
            <Text style={styles.locationText}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="flag" size={14} color={COLORS.text} />
            <Text style={styles.locationLabel}>Drop:</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dropoff_location}
            </Text>
          </View>
        </View>

        {/* Return Location and Date - Only for Round Trips */}
        {item.trip_segments?.name === 'Round trips' && item.return_location && (
          <View style={styles.section}>
            <View style={styles.locationRow}>
              <Ionicons name="arrow-undo-outline" size={14} color={COLORS.warning} />
              <Text style={styles.locationLabel}>Return:</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {item.return_location}
              </Text>
            </View>
            {item.return_date && (
              <View style={styles.locationRow}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.warning} />
                <Text style={styles.locationLabel}>Return Date:</Text>
                <Text style={styles.locationText}>
                  {new Date(item.return_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Creator/Vendor Info - Only show if NOT created by super admin */}
        {item.creator && !isSuperAdminCreatedTrip(item) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Created By (Vendor)</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={16} color="#4caf50" />
              <Text style={styles.infoText}>{item.creator.full_name}</Text>
            </View>
            {item.creator.phone && (
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => Linking.openURL(`tel:${item.creator.phone}`)}
              >
                <Ionicons name="call-outline" size={14} color="#2196f3" />
                <Text style={styles.phoneText}>{item.creator.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Assigned Driver - Show only current/most recent assignment */}
        {(item.latestAdminAssignedDriver || item.driver) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Driver</Text>
            
            {/* Priority: Show accepted driver if exists, otherwise show latest admin assigned driver */}
            {item.driver ? (
              <View style={styles.infoRow}>
                <Ionicons name="person-circle-outline" size={16} color="#2196f3" />
                <Text style={styles.infoText}>{item.driver.full_name}</Text>
                {item.driver.phone && (
                  <TouchableOpacity
                    style={styles.phoneButton}
                    onPress={() => Linking.openURL(`tel:${item.driver.phone}`)}
                  >
                    <Ionicons name="call-outline" size={14} color="#2196f3" />
                    <Text style={styles.phoneText}>{item.driver.phone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : item.latestAdminAssignedDriver ? (
              <View style={styles.infoRow}>
                <Ionicons name="person-circle-outline" size={16} color="#ff9800" />
                <Text style={styles.infoText}>{item.latestAdminAssignedDriver.full_name}</Text>
                {item.latestAdminAssignedDriver.phone && (
                  <TouchableOpacity
                    style={styles.phoneButton}
                    onPress={() => Linking.openURL(`tel:${item.latestAdminAssignedDriver.phone}`)}
                  >
                    <Ionicons name="call-outline" size={14} color="#ff9800" />
                    <Text style={styles.phoneText}>{item.latestAdminAssignedDriver.phone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </View>
        )}

        {/* Trip Details */}
        <View style={styles.section}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance:</Text>
            <Text style={styles.detailValue}>{distance}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start KM:</Text>
            <Text style={styles.detailValue}>{item.start_km || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End KM:</Text>
            <Text style={styles.detailValue}>{item.end_km || 'N/A'}</Text>
          </View>
        </View>

        {/* Odometer Images */}
        {(item.start_odometer_url || item.end_odometer_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Odometer Images</Text>
            <View style={styles.odometerContainer}>
              {item.start_odometer_url && (
                <OdometerImageThumbnail
                  imageUrl={item.start_odometer_url}
                  tripId={item.id}
                  imageType="start"
                  onPress={() => openImageModal(item.start_odometer_url, 'Start Odometer')}
                  isError={imageLoadErrors[`${item.id}-start`]}
                  isLoading={imageLoadingStates[`${item.id}-start`] === 'loading'}
                  onLoad={() => handleImageLoad(item.id, 'start')}
                  onError={() => handleImageLoadError(item.id, 'start')}
                />
              )}
              {item.end_odometer_url && (
                <OdometerImageThumbnail
                  imageUrl={item.end_odometer_url}
                  tripId={item.id}
                  imageType="end"
                  onPress={() => openImageModal(item.end_odometer_url, 'End Odometer')}
                  isError={imageLoadErrors[`${item.id}-end`]}
                  isLoading={imageLoadingStates[`${item.id}-end`] === 'loading'}
                  onLoad={() => handleImageLoad(item.id, 'end')}
                  onError={() => handleImageLoadError(item.id, 'end')}
                />
              )}
            </View>
          </View>
        )}

        {/* Timestamps */}
        {(item.accepted_at || item.started_at || item.completed_at) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            {item.accepted_at && (
              <Text style={styles.timestamp}>
                ✓ Accepted: {new Date(item.accepted_at).toLocaleString()}
              </Text>
            )}
            {item.started_at && (
              <Text style={styles.timestamp}>
                ✓ Started: {new Date(item.started_at).toLocaleString()}
              </Text>
            )}
            {item.completed_at && (
              <Text style={styles.timestamp}>
                ✓ Completed: {new Date(item.completed_at).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {/* Edit Trip Button - Only for super-admin-created trips */}
        {isSuperAdminCreatedTrip(item) && (
          <View style={styles.section}>
            <View style={styles.buttonRow}>
              {item.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.editButton, { flex: 1, marginRight: 4 }]}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="pencil-outline" size={16} color="#fff" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.reassignButton, { flex: item.status === 'pending' ? 1 : 1.5, marginHorizontal: 4 }]}
                onPress={() => {
                  if (item.status !== 'pending') {
                    Alert.alert('Cannot Reassign', 'Trip can only be reassigned if it is pending');
                    return;
                  }
                  fetchAllDrivers();
                  setReassigningTrip(item);
                  setSelectedDriver(null);
                  setReassignModalVisible(true);
                }}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color="#fff" />
                <Text style={styles.reassignButtonText}>Reassign</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, { flex: item.status === 'pending' ? 1 : 1.5, marginLeft: 4 }]}
                onPress={() => {
                  Alert.alert(
                    '⚠️ Delete Trip',
                    'Are you sure you want to delete this trip? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const { error } = await supabase
                              .from('trips')
                              .delete()
                              .eq('id', item.id);

                            if (error) throw error;

                            // Remove from local state
                            setTrips(prevTrips =>
                              prevTrips.filter(trip => trip.id !== item.id)
                            );

                            Alert.alert('✅ Success', 'Trip deleted successfully');
                          } catch (err) {
                            console.error('Error deleting trip:', err.message);
                            Alert.alert('Error', 'Failed to delete trip: ' + err.message);
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Publish to Drivers Button */}
        {item.status === 'pending' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.publishButton,
                item.is_published && styles.publishButtonActive
              ]}
              onPress={() => {
                Alert.alert(
                  item.is_published ? 'Unpublish Trip' : 'Publish to All Drivers',
                  item.is_published 
                    ? 'Remove this trip from driver visibility?'
                    : 'Make this trip visible to ALL drivers? (Clears any specific driver assignments)',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: item.is_published ? 'Unpublish' : 'Publish to All',
                      onPress: async () => {
                        try {
                          // When publishing, also clear admin_assigned_drivers to make it visible to ALL drivers
                          const updateData = item.is_published
                            ? { is_published: false }
                            : { 
                                is_published: true,
                                admin_assigned_drivers: null  // Clear specific assignments = publish to ALL
                              };

                          const { error } = await supabase
                            .from('trips')
                            .update(updateData)
                            .eq('id', item.id);

                          if (error) throw error;
                          
                          // Update local state immediately for instant UI feedback
                          setTrips(prevTrips =>
                            prevTrips.map(trip =>
                              trip.id === item.id
                                ? { ...trip, ...updateData }
                                : trip
                            )
                          );
                          
                          // Show different message based on action
                          const successMsg = item.is_published 
                            ? 'Trip unpublished successfully' 
                            : '✅ Trip published to ALL drivers!';
                          Alert.alert('Success', successMsg);
                        } catch (err) {
                          Alert.alert('Error', err.message);
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons 
                name={item.is_published ? 'eye-outline' : 'eye-off-outline'} 
                size={16} 
                color={item.is_published ? '#4caf50' : '#ff9800'} 
              />
              <Text style={[
                styles.publishButtonText,
                item.is_published && styles.publishButtonTextActive
              ]}>
                {item.is_published ? 'Published ✓' : 'Publish to All'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const adminFilters = [
    { label: 'All Trips', value: 'all' },
    { label: 'Admin Created', value: 'admin' },
    { label: 'Vendor Created', value: 'vendor' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Trips</Text>
        <Text style={styles.subtitle}>Total: {trips.length}</Text>
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === item.value && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterStatus === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Admin Created Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={adminFilters}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterAdminCreated === item.value && styles.filterButtonActive,
              ]}
              onPress={() => setFilterAdminCreated(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterAdminCreated === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Trips List */}
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchTrips}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.emptyLoadingText}>Loading trips...</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No trips found</Text>
              <Text style={styles.emptySubtitle}>
                Trips will appear here once created
              </Text>
            </View>
          )
        }
      />

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setImageModalVisible(false);
          setModalSignedUrl(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedImage?.title}</Text>
            <TouchableOpacity 
              onPress={() => {
                setImageModalVisible(false);
                setModalSignedUrl(null);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          {modalSignedUrl ? (
            <ZoomableImage 
              imageUrl={modalSignedUrl} 
              title={selectedImage?.title}
              onClose={() => {
                setImageModalVisible(false);
                setModalSignedUrl(null);
              }}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <Ionicons name="hourglass-outline" size={48} color="#888" />
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Edit Trip Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setEditModalVisible(false);
          setEditingTrip(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>Edit Trip</Text>
            <TouchableOpacity onPress={() => {
              setEditModalVisible(false);
              setEditingTrip(null);
            }}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.editModalContent}>
            {/* Trip Segment Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Trip Segment *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                <Picker
                  selectedValue={editForm.segment}
                  onValueChange={(value) => updateEditForm('segment', value)}
                  enabled={!savingTrip}
                >
                  <Picker.Item label="Select Trip Segment" value="" />
                  {adminTripOptions.segments.map((seg) => (
                    <Picker.Item key={seg.id} label={seg.name} value={seg.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Pickup Location */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pickup Location *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={18} color={COLORS.success} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter pickup location"
                  value={editForm.pickup_location}
                  onChangeText={(text) => updateEditForm('pickup_location', text)}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!savingTrip}
                />
              </View>
            </View>

            {/* Dropoff Location */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Dropoff Location *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="flag-outline" size={18} color={COLORS.danger} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter dropoff location"
                  value={editForm.dropoff_location}
                  onChangeText={(text) => updateEditForm('dropoff_location', text)}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!savingTrip}
                />
              </View>
            </View>

            {/* Return Location - Only for Round Trips */}
            {adminTripOptions.segments.find(s => s.id === editForm.segment)?.name === 'Round trips' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Return Location *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={18} color={COLORS.info} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter return location"
                      value={editForm.return_location}
                      onChangeText={(text) => updateEditForm('return_location', text)}
                      multiline
                      numberOfLines={2}
                      placeholderTextColor={COLORS.textSecondary}
                      editable={!savingTrip}
                    />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Return Date *</Text>
                  <TouchableOpacity
                    style={styles.dateInputContainer}
                    onPress={() => setShowReturnDatePicker(true)}
                    disabled={savingTrip}
                  >
                    <Ionicons name="calendar-outline" size={18} color={COLORS.info} style={styles.inputIcon} />
                    <Text style={styles.dateText}>
                      {editForm.return_date?.toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) || 'Select return date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Fixed KM */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fixed KM *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="speedometer-outline" size={18} color={COLORS.info} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 50"
                  value={editForm.fixed_km}
                  onChangeText={(text) => updateEditForm('fixed_km', text)}
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!savingTrip}
                />
              </View>
            </View>

            {/* Fare Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Trip Fare Amount (₹) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={18} color={COLORS.success} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 500"
                  value={editForm.fare_amount}
                  onChangeText={(text) => updateEditForm('fare_amount', text)}
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!savingTrip}
                />
              </View>
            </View>

            {/* Commission Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Driver Commission (₹) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="wallet-outline" size={18} color={COLORS.warning} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Commission driver pays"
                  value={editForm.commission_amount}
                  onChangeText={(text) => updateEditForm('commission_amount', text)}
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!savingTrip}
                />
              </View>
            </View>

            {/* Customer Pre-Advance */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Customer Pre-Advance (₹)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={18} color={COLORS.info} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 100 (optional)"
                  value={editForm.customer_pre_advance}
                  onChangeText={(text) => updateEditForm('customer_pre_advance', text)}
                  keyboardType="decimal-pad"
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!savingTrip}
                />
              </View>
            </View>

            {/* Passenger Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Passenger Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={COLORS.info} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rahul Sharma"
                  value={editForm.passenger_name}
                  onChangeText={(text) => updateEditForm('passenger_name', text)}
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!savingTrip}
                />
              </View>
            </View>

            {/* Passenger Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Passenger Phone *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={18} color={COLORS.info} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 9876543210"
                  value={editForm.passenger_phone}
                  onChangeText={(text) => updateEditForm('passenger_phone', text)}
                  keyboardType="phone-pad"
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!savingTrip}
                />
              </View>
            </View>

            {/* Car Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Car Type *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                <Picker
                  selectedValue={editForm.car_type}
                  onValueChange={(value) => updateEditForm('car_type', value)}
                  enabled={!savingTrip}
                >
                  <Picker.Item label="Select Car Type" value="" />
                  {adminTripOptions.carTypes.map((type) => (
                    <Picker.Item key={type.id} label={type.name} value={type.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Car Model */}
            {editForm.car_type && adminTripOptions.carModels.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Car Model</Text>
                <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                  <Picker
                    selectedValue={editForm.car_model}
                    onValueChange={(value) => updateEditForm('car_model', value)}
                    enabled={!savingTrip}
                  >
                    <Picker.Item label="Select Car Model" value="" />
                    {adminTripOptions.carModels.map((model) => (
                      <Picker.Item key={model.id} label={model.name} value={model.id} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Seater Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Seater Type *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                <Picker
                  selectedValue={editForm.seater_type}
                  onValueChange={(value) => updateEditForm('seater_type', value)}
                  enabled={!savingTrip}
                >
                  <Picker.Item label="Select Seater Type" value="" />
                  {adminTripOptions.seaterTypes.map((seater) => (
                    <Picker.Item key={seater.id} label={seater.name} value={seater.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Fuel Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fuel Type *</Text>
              <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                <Picker
                  selectedValue={editForm.fuel_type}
                  onValueChange={(value) => updateEditForm('fuel_type', value)}
                  enabled={!savingTrip}
                >
                  <Picker.Item label="Select Fuel Type" value="" />
                  {adminTripOptions.fuelTypes.map((fuel) => (
                    <Picker.Item key={fuel.id} label={fuel.name} value={fuel.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Package */}
            {editForm.segment && adminTripOptions.packages.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Package</Text>
                <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
                  <Picker
                    selectedValue={editForm.package}
                    onValueChange={(value) => updateEditForm('package', value)}
                    enabled={!savingTrip}
                  >
                    <Picker.Item label="Select Package" value="" />
                    {adminTripOptions.packages.map((pkg) => (
                      <Picker.Item key={pkg.id} label={pkg.name} value={pkg.id} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Scheduled Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Scheduled Date</Text>
              <TouchableOpacity
                style={styles.dateInputContainer}
                onPress={() => setShowDatePicker(true)}
                disabled={savingTrip}
              >
                <Ionicons name="calendar-outline" size={18} color={COLORS.info} style={styles.inputIcon} />
                <Text style={styles.dateText}>
                  {editForm.created_at.toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Special Instructions (Optional)</Text>
              <View style={[styles.inputContainer, { minHeight: 80, alignItems: 'flex-start', paddingTop: 8 }]}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.info} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { textAlignVertical: 'top' }]}
                  placeholder="e.g. Special requests, additional notes"
                  value={editForm.notes}
                  onChangeText={(text) => updateEditForm('notes', text)}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={COLORS.textSecondary}
                  editable={!savingTrip}
                />
              </View>
            </View>

            {/* Toggle Options */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Extra Charges & Options</Text>
              
              {/* Combined: Toll, Tax, Hills */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}
                onPress={() => {
                  const newState = !editForm.toll_included;
                  updateEditForm('toll_included', newState);
                  updateEditForm('state_tax_included', newState);
                  updateEditForm('hills_included', newState);
                }}
                disabled={savingTrip}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: COLORS.info,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: (editForm.toll_included && editForm.state_tax_included && editForm.hills_included) ? COLORS.info : 'transparent'
                }}>
                  {(editForm.toll_included && editForm.state_tax_included && editForm.hills_included) && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={{ color: COLORS.text, fontSize: 13 }}>Toll • Tax • Hills Included</Text>
              </TouchableOpacity>

              {/* Separate: Pet Travelling */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}
                onPress={() => updateEditForm('pet_travelling', !editForm.pet_travelling)}
                disabled={savingTrip}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: COLORS.info,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: editForm.pet_travelling ? COLORS.info : 'transparent'
                }}>
                  {editForm.pet_travelling && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={{ color: COLORS.text, fontSize: 13 }}>Pet Travelling Allowed</Text>
              </TouchableOpacity>
            </View>

            {/* Date Pickers */}
            {showDatePicker && (
              <DateTimePicker
                value={editForm.created_at}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {showReturnDatePicker && (
              <DateTimePicker
                value={editForm.return_date || new Date()}
                mode="date"
                display="default"
                onChange={handleReturnDateChange}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.formButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingTrip(null);
                }}
                disabled={savingTrip}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, savingTrip && styles.buttonDisabled]}
                onPress={handleSaveTrip}
                disabled={savingTrip}
              >
                {savingTrip ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Reassign Trip Modal */}
      <Modal
        visible={reassignModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setReassignModalVisible(false);
          setReassigningTrip(null);
          setSelectedDriver(null);
        }}
      >
        <View style={styles.reassignModalOverlay}>
          <View style={styles.reassignModalContent}>
            <Text style={styles.reassignModalTitle}>Reassign Trip to Driver</Text>
            
            {loadingDummyDrivers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.warning} />
                <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading dummy drivers...</Text>
              </View>
            ) : dummyDrivers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ color: COLORS.textSecondary, marginBottom: 16 }}>No dummy drivers available</Text>
              </View>
            ) : (
              <ScrollView style={styles.driversList} showsVerticalScrollIndicator={false}>
                {dummyDrivers.map(driver => (
                  <TouchableOpacity
                    key={driver.id}
                    style={[
                      styles.driverCard,
                      selectedDriver?.id === driver.id && styles.driverCardSelected
                    ]}
                    onPress={() => setSelectedDriver(driver)}
                  >
                    <View style={styles.driverCardContent}>
                      <View style={styles.driverAvatar}>
                        {driver.avatar_base64 ? (
                          <Image
                            source={{ uri: driver.avatar_base64.startsWith('data:') ? driver.avatar_base64 : `data:image/jpeg;base64,${driver.avatar_base64}` }}
                            style={styles.driverAvatarImage}
                          />
                        ) : (
                          <Ionicons name="person-circle" size={40} color={COLORS.textSecondary} />
                        )}
                      </View>
                      <View style={styles.driverInfo}>
                        <Text style={styles.driverName}>{driver.full_name}</Text>
                        <Text style={styles.driverPhone}>{driver.phone}</Text>
                      </View>
                      {selectedDriver?.id === driver.id && (
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.reassignButtonContainer}>
              <TouchableOpacity
                style={styles.reassignCancelButton}
                onPress={() => {
                  setReassignModalVisible(false);
                  setReassigningTrip(null);
                  setSelectedDriver(null);
                }}
                disabled={reassigningTrip?.reassigning}
              >
                <Text style={styles.reassignCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reassignConfirmButton, (!selectedDriver || reassigningTrip?.reassigning) && styles.buttonDisabled]}
                onPress={handleReassignTrip}
                disabled={!selectedDriver || reassigningTrip?.reassigning}
              >
                {reassigningTrip?.reassigning ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="swap-horizontal" size={18} color="#fff" />
                    <Text style={styles.reassignConfirmButtonText}>Reassign Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: 12,
    paddingTop: 24,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.warning,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 0,
    opacity: 0.8,
  },
  filterContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
  },
  filterButtonActive: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.text,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  bookingIdBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.warning,
  },
  topInfoBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.warning,
    justifyContent: 'space-around',
  },
  topInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  topInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.warning,
    opacity: 0.3,
    marginHorizontal: 8,
  },
  topInfoLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bookingIdLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bookingIdValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.warning,
    letterSpacing: 0.8,
  },
  tripTypeValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  tripHeaderRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2196f3',
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  tripId: {
    color: COLORS.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  fare: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  locationText: {
    color: COLORS.text,
    fontSize: 13,
    flex: 1,
  },
  locationLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
  },
  tripTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripTypeText: {
    color: COLORS.info,
    fontSize: 13,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  phoneText: {
    color: COLORS.info,
    fontSize: 13,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  timestamp: {
    color: COLORS.success,
    fontSize: 12,
    marginBottom: 4,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  publishButtonActive: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  publishButtonText: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  publishButtonTextActive: {
    color: COLORS.success,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyLoadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  odometerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  odometerImageWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  odometerImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
    marginBottom: 8,
  },
  imageErrorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.textTertiary,
    fontSize: 11,
    marginTop: 4,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  odometerLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-start',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: 400,
  },
  zoomableContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#ffffff',
  },
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  // Edit Button Styles
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.info,
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Edit Modal Styles
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.info,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editModalContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 8,
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  formButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  zoomableImageWrapper: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomableImage: {
    width: '100%',
    height: '100%',
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  resetButton: {
    marginLeft: 8,
  },
  zoomLevel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 10,
    color: '#888',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },

  // Delete Button and Button Row Styles
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f44336',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  // Date Input Styles
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    marginLeft: 8,
  },

  // Reassign Modal Styles
  reassignModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  reassignModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  reassignModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  driversList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  driverCard: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  driverCardSelected: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  driverCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  driverAvatarImage: {
    width: '100%',
    height: '100%',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reassignButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  reassignCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
  },
  reassignCancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  reassignConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reassignConfirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reassignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.warning,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  reassignButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.info,
    borderWidth: 1,
    borderColor: COLORS.info,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
