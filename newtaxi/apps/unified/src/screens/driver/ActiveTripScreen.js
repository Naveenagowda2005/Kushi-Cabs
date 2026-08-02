import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  TouchableOpacity, Alert, ActivityIndicator, Modal, Linking, TextInput, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useActiveTrip } from '../../hooks/useTrips';
import { useAppSettings } from '../../hooks/useAppSettings';
import NavigationMap from '../../components/NavigationMap';
import { startTrip } from '../../services/tripService';
import { uploadOdometerImage } from '../../services/uploadService';
import { TRIP_STATUS } from '../../constants';
import { supabase } from '../../lib/supabase';

const STEPS = { ACCEPTED: 0, START: 1, IN_PROGRESS: 2, END: 3, PAYMENT: 4, DONE: 5 };

export default function DriverActiveTripScreen({ route, navigation }) {
  const { user } = useAuth();
  const { trip: routeTrip } = route.params ?? {};
  const { settings } = useAppSettings();

  const { trip, refetch } = useActiveTrip(user?.id);
  const activeTrip = trip ?? routeTrip;

  const [step, setStep] = useState(STEPS.ACCEPTED);
  const [uploading, setUploading] = useState(false);
  const [showNavigationMap, setShowNavigationMap] = useState(false);
  const [completedTrip, setCompletedTrip] = useState(null); // stores trip + creator info after completion
  const [creatorName, setCreatorName] = useState(null);
  const [creatorPhone, setCreatorPhone] = useState(null);
  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');
  const [startOdometerImage, setStartOdometerImage] = useState(null);
  const [endOdometerImage, setEndOdometerImage] = useState(null);

  useEffect(() => {
    if (!activeTrip) return;
    
    // Only update step from trip status if we're in the initial states
    // Don't override if user has manually progressed to PAYMENT or DONE steps
    if (step < STEPS.PAYMENT) {
      if (activeTrip.status === TRIP_STATUS.IN_PROGRESS) {
        setStep(STEPS.IN_PROGRESS);
        setShowNavigationMap(true);
      }
      if (activeTrip.status === TRIP_STATUS.COMPLETED) setStep(STEPS.DONE);
    }

    // Fetch trip creator details
    const fetchCreatorDetails = async () => {
      try {
        console.log('🔍 Fetching creator details for trip:', {
          trip_id: activeTrip.id,
          created_by: activeTrip.created_by,
        });
        
        if (activeTrip.created_by) {
          const { data: creator, error } = await supabase
            .from('users')
            .select('full_name, phone')
            .eq('id', activeTrip.created_by)
            .maybeSingle();
          
          console.log('👤 Creator fetch result:', { creator, error });
          
          if (creator) {
            console.log('✅ Setting creator details:', { name: creator.full_name, phone: creator.phone });
            setCreatorName(creator.full_name);
            setCreatorPhone(creator.phone);
          } else {
            console.log('⚠️ No creator found for ID:', activeTrip.created_by);
          }
        } else {
          console.log('⚠️ No created_by field in trip');
        }
      } catch (error) {
        console.error('❌ Error fetching creator details:', error);
      }
    };

    fetchCreatorDetails();
  }, [activeTrip, step]);

  const captureOdometerImage = async (type) => {
    try {
      console.log('📸 Starting camera capture for:', type);
      
      // Request camera permissions
      console.log('📸 Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📸 Camera permission status:', status);
      
      if (status !== 'granted') {
        console.warn('📸 Camera permission denied');
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to capture odometer images. Please enable it in your device settings.',
          [
            { text: 'OK', onPress: () => {} },
            { text: 'Open Settings', onPress: () => Linking.openURL('app-settings:') }
          ]
        );
        return;
      }

      console.log('📸 Launching camera...');
      
      // Try with timeout to catch hanging camera
      const cameraPromise = ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        aspect: [16, 9],
        quality: 0.6,
        base64: true,
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Camera timeout - took too long to respond')), 15000)
      );

      const result = await Promise.race([cameraPromise, timeoutPromise]);

      console.log('📸 Camera result:', { canceled: result.canceled, assetsCount: result.assets?.length });

      if (!result.canceled) {
        if (result.assets && result.assets.length > 0) {
          console.log('📸 Image captured successfully:', {
            uri: result.assets[0].uri?.substring(0, 50),
            type: result.assets[0].type,
            fileName: result.assets[0].fileName,
          });
          
          if (type === 'start') {
            setStartOdometerImage(result.assets[0]);
          } else {
            setEndOdometerImage(result.assets[0]);
          }
        } else {
          console.warn('📸 No assets returned from camera');
          Alert.alert('Error', 'Failed to capture image. Please try again.');
        }
      } else {
        console.log('📸 Camera capture cancelled by user');
      }
    } catch (error) {
      console.error('📸 Camera capture error:', {
        message: error.message,
        code: error.code,
        name: error.name,
      });
      
      console.log('📸 Falling back to image library...');
      
      // Fallback: use image library instead
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is required');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          aspect: [16, 9],
          quality: 0.6,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          console.log('📸 Image selected from library successfully');
          if (type === 'start') {
            setStartOdometerImage(result.assets[0]);
          } else {
            setEndOdometerImage(result.assets[0]);
          }
          Alert.alert('✅ Image Selected', 'Image from gallery has been selected (Note: Fresh odometer photo is recommended for accuracy)');
        }
      } catch (fallbackError) {
        console.error('📸 Image library fallback also failed:', fallbackError.message);
        Alert.alert(
          'Camera Error',
          `Failed to access camera or gallery:\n\n${error.message}\n\nPlease make sure:\n• Camera/Gallery permission is granted\n• Device has a working camera\n• No other app is using the camera`,
          [
            { text: 'OK', onPress: () => {} }
          ]
        );
      }
    }
  };

  const uploadOdometerImageLocal = async (imageAsset, tripId, type) => {
    // Use the uploadService which uploads to Supabase Storage bucket
    // imageAsset has { uri, base64 } from ImagePicker
    const publicUrl = await uploadOdometerImage(imageAsset, tripId, type);
    return publicUrl;
  };

  async function handleStartTrip() {
    if (!startKm) {
      Alert.alert('Error', 'Please enter the starting odometer reading');
      return;
    }

    if (!startOdometerImage) {
      Alert.alert('Error', 'Please capture a photo of the starting odometer');
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage bucket — returns public URL
      const publicUrl = await uploadOdometerImageLocal(startOdometerImage, activeTrip.id, 'start');

      // Start trip with the bucket URL (not base64)
      await startTrip({
        tripId: activeTrip.id,
        startOdometerUrl: publicUrl,
        startKm: parseFloat(startKm),
        userId: user.id,
      });
      
      await refetch();
      setStep(STEPS.IN_PROGRESS);
      setShowNavigationMap(true);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleEndTrip() {
    if (!endKm) {
      Alert.alert('Error', 'Please enter the ending odometer reading');
      return;
    }

    if (!endOdometerImage) {
      Alert.alert('Error', 'Please capture a photo of the ending odometer');
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage bucket — returns public URL
      const publicUrl = await uploadOdometerImageLocal(endOdometerImage, activeTrip.id, 'end');

      // Update trip with end odometer URL and end KM — store URL not base64
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          end_odometer_url: publicUrl,
          end_km: parseFloat(endKm) || null,
        })
        .eq('id', activeTrip.id);

      if (updateError) throw updateError;

      // End trip — go to payment step
      setStep(STEPS.PAYMENT);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmPayment() {
    setUploading(true);
    try {
      // Calculate distance traveled
      const distance = endKm && startKm 
        ? parseFloat(endKm) - parseFloat(startKm)
        : 0;

      // Mark trip completed with end KM — no wallet credit (fare collected offline)
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          status:           'completed',
          completed_at:     new Date().toISOString(),
          end_km:           parseFloat(endKm) || null,
        })
        .eq('id', activeTrip.id);

      if (tripError) throw tripError;

      // Free the driver
      await supabase
        .from('drivers')
        .update({ is_available: true, current_trip_id: null })
        .eq('user_id', user.id);

      // Add commission to vendor's wallet
      if (activeTrip.created_by) {
        console.log('🔄 Attempting to deduct commission for vendor:', activeTrip.created_by);
        const { data: commissionResult, error: commissionError } = await supabase.rpc('deduct_commission', {
          p_trip_id: activeTrip.id,
          p_user_id: activeTrip.created_by,
        });
        
        if (commissionError) {
          console.error('❌ Commission deduction failed:', commissionError);
        } else {
          console.log('✅ Commission added to vendor wallet:', commissionResult);
        }
      } else {
        console.log('⚠️ No trip creator found - no commission to deduct');
      }

      // Fetch creator info for the "Did you collect?" screen
      let creatorInfo = null;
      if (activeTrip.created_by) {
        const { data: creator } = await supabase
          .from('users')
          .select('full_name, phone, roles(name)')
          .eq('id', activeTrip.created_by)
          .maybeSingle();
        creatorInfo = creator;
      }

      setCompletedTrip({ ...activeTrip, creatorInfo });
      setStep(STEPS.DONE);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleCancel() {
    Alert.alert('Cancel Trip', 'Are you sure you want to cancel this trip?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          try {
            // Use the vendor window from settings (in minutes)
            const vendorWindowMinutes = settings.vendor_window_minutes || 15;
            const vendorVisibleUntil = new Date(Date.now() + vendorWindowMinutes * 60 * 1000).toISOString();
            
            console.log('Driver handleCancel - Vendor window minutes:', vendorWindowMinutes);
            console.log('Driver handleCancel - Vendor visible until:', vendorVisibleUntil);
            
            // Reset trip back to pending so other drivers can pick it up
            const { error } = await supabase
              .from('trips')
              .update({
                status:               TRIP_STATUS.PENDING,
                accepted_by:          null,
                driver_id:            null,
                accepted_at:          null,
                vendor_visible_until: vendorVisibleUntil,
              })
              .eq('id', activeTrip.id);

            if (error) throw error;

            // Free the driver
            await supabase
              .from('drivers')
              .update({ is_available: true, current_trip_id: null })
              .eq('user_id', user.id);

            navigation.replace('Dashboard');
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  if (!activeTrip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1a1a2e" size="large" />
        <Text style={styles.loadingText}>Loading trip...</Text>
      </View>
    );
  }

  if (step === STEPS.DONE) {
    const trip = completedTrip || activeTrip;
    const creator = trip?.creatorInfo;
    const creatorPhone = creator?.phone;
    const creatorName = creator?.full_name || 'Trip Creator';
    const creatorRole = creator?.roles?.name || 'vendor';
    const isSuperAdmin = creatorRole === 'super_admin';

    // Calculate driver earning: Fare - Commission
    const commission = trip.commission_amount || 0;
    const driverEarning = trip.fare_amount - commission;

    function handleCollectedYes() {
      // Record fare collection in transaction history
      supabase.from('wallets').select('id').eq('user_id', user.id).maybeSingle()
        .then(({ data: wallet }) => {
          if (wallet?.id) {
            supabase.from('transactions').insert({
              wallet_id:   wallet.id,
              trip_id:     trip.id,
              type:        'credit',
              amount:      driverEarning,
              description: `Fare collected offline for trip (${trip.pickup_location} → ${trip.dropoff_location})`,
            });
          }
        });
      Alert.alert('✅ Recorded', `Fare collection recorded in your transaction history.\nAmount: ₹${driverEarning.toFixed(2)}`, [
        { text: 'OK', onPress: () => navigation.replace('Dashboard') },
      ]);
    }

    function handleCollectedNo() {
      // Show help & support with creator contact
      Alert.alert(
        'Help & Support',
        `Could not collect fare?\n\nContact the trip creator:\n\n👤 ${creatorName}\n📞 ${creatorPhone || 'Not available'}\n\nRole: ${isSuperAdmin ? 'Super Admin' : 'Vendor'}`,
        [
          creatorPhone && {
            text: `📞 Call ${creatorName}`,
            onPress: () => Linking.openURL(`tel:${creatorPhone}`),
          },
          { text: 'Go to Dashboard', onPress: () => navigation.replace('Dashboard') },
        ].filter(Boolean)
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.doneContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#4caf50" />
        <Text style={styles.doneTitle}>Trip Completed!</Text>
        <Text style={styles.doneEarnings}>₹{driverEarning.toFixed(2)}</Text>
        <Text style={styles.doneSubtext}>Your Total Earning</Text>

        {/* Trip summary */}
        <View style={styles.doneTripCard}>
          <View style={styles.doneRow}>
            <Ionicons name="location" size={14} color="#4caf50" />
            <Text style={styles.doneTripText} numberOfLines={1}>{trip.pickup_location}</Text>
          </View>
          <View style={styles.doneRow}>
            <Ionicons name="flag" size={14} color="#1a1a2e" />
            <Text style={styles.doneTripText} numberOfLines={1}>{trip.dropoff_location}</Text>
          </View>
          {trip.return_location && (
            <View style={styles.doneRow}>
              <Ionicons name="return-up-back-outline" size={14} color="#ff9800" />
              <Text style={styles.doneTripText} numberOfLines={1}>Return: {trip.return_location}</Text>
            </View>
          )}
        </View>

        {/* Payment Collection Question */}
        <View style={styles.paymentQuestionCard}>
          <Ionicons name="cash-outline" size={32} color="#4caf50" style={{ marginBottom: 12 }} />
          <Text style={styles.paymentQuestionText}>Did you collect the payment from the passenger?</Text>
          
          <View style={styles.paymentButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnYes]}
              onPress={handleCollectedYes}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Yes, Collected</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.actionBtnNo]}
              onPress={handleCollectedNo}
            >
              <Ionicons name="help-circle" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Need Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.cancelBtnText}>Skip for Now</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={require('react-native').Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <StepIndicator current={step} />

        <ScrollView contentContainerStyle={styles.scroll}>
        {/* Trip summary card */}
        <View style={styles.tripCard}>
          <Row icon="location" color="#4caf50" text={activeTrip.pickup_location} />
          <View style={styles.divider} />
          <Row icon="flag" color="#1a1a2e" text={activeTrip.dropoff_location} />
          {activeTrip.return_location && (
            <>
              <View style={styles.divider} />
              <Row icon="return-up-back-outline" color="#ff9800" text={`Return: ${activeTrip.return_location}`} />
            </>
          )}
          
          {/* Display message only when trip hasn't started */}
          {step === STEPS.ACCEPTED && (
            <>
              <View style={styles.divider} />
              <View style={styles.vendorDetailsRow}>
                <Ionicons name="information-circle-outline" size={16} color="#ff9800" />
                <Text style={styles.vendorDetailsText}>
                  Start the trip to get customer details
                </Text>
              </View>
            </>
          )}

          <View style={styles.farePill}>
            <Text style={styles.fareText}>₹{(activeTrip.fare_amount - (activeTrip.commission_amount || 0)).toFixed(2)}</Text>
          </View>
          {activeTrip.fixed_km && (
            <View style={[styles.farePill, { backgroundColor: '#1565c0', marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
              <Ionicons name="speedometer-outline" size={13} color="#fff" />
              <Text style={styles.fareText}>{activeTrip.fixed_km} km fixed</Text>
            </View>
          )}
        </View>

        {/* STEP: accept and start trip */}
        {step === STEPS.ACCEPTED && (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Enter starting odometer reading and capture photo</Text>
            </View>

            {/* Start KM Input */}
            <View style={styles.odometerCard}>
              <View style={styles.odometerHeader}>
                <Ionicons name="speedometer-outline" size={18} color="#4caf50" />
                <Text style={styles.odometerLabel}>Starting Odometer (KM)</Text>
              </View>
              <TextInput
                style={styles.odometerInput}
                placeholder="Enter starting KM"
                placeholderTextColor="#666"
                value={startKm}
                onChangeText={setStartKm}
                keyboardType="decimal-pad"
              />
              <Text style={styles.odometerHint}>Please enter the odometer reading before starting the trip</Text>

              {/* Start Odometer Image Capture */}
              <TouchableOpacity 
                style={[styles.cameraCaptureBtn, startOdometerImage && styles.cameraCaptureSuccess]}
                onPress={() => captureOdometerImage('start')}
                disabled={uploading}
              >
                <Ionicons 
                  name={startOdometerImage ? 'checkmark-circle' : 'camera'} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.cameraCaptureBtnText}>
                  {startOdometerImage ? 'Photo Captured ✓' : 'Capture Odometer Photo'}
                </Text>
              </TouchableOpacity>

              {startOdometerImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: startOdometerImage.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity 
                    style={styles.removeImageBtn}
                    onPress={() => setStartOdometerImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, uploading && styles.actionBtnDisabled]}
              onPress={handleStartTrip}
              disabled={uploading}
            >
              {uploading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.actionBtnText}>Start Trip</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel Trip</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP: in progress */}
        {step === STEPS.IN_PROGRESS && (
          <>
            <View style={styles.inProgressBadge}>
              <Ionicons name="navigate" size={16} color="#4caf50" />
              <Text style={styles.inProgressText}>Trip in progress</Text>
            </View>
            <TouchableOpacity style={styles.navigationBtn} onPress={() => setShowNavigationMap(true)}>
              <Ionicons name="map" size={20} color="#fff" />
              <Text style={styles.navigationBtnText}>Open Navigation</Text>
            </TouchableOpacity>

            {/* End KM Input */}
            <View style={styles.odometerCard}>
              <View style={styles.odometerHeader}>
                <Ionicons name="speedometer-outline" size={18} color="#ff9800" />
                <Text style={styles.odometerLabel}>Ending Odometer (KM)</Text>
              </View>
              <TextInput
                style={styles.odometerInput}
                placeholder="Enter ending KM"
                placeholderTextColor="#666"
                value={endKm}
                onChangeText={setEndKm}
                keyboardType="decimal-pad"
              />
              <Text style={styles.odometerHint}>Please enter the odometer reading before ending the trip</Text>

              {/* End Odometer Image Capture */}
              <TouchableOpacity 
                style={[styles.cameraCaptureBtn, endOdometerImage && styles.cameraCaptureSuccess]}
                onPress={() => captureOdometerImage('end')}
                disabled={uploading}
              >
                <Ionicons 
                  name={endOdometerImage ? 'checkmark-circle' : 'camera'} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.cameraCaptureBtnText}>
                  {endOdometerImage ? 'Photo Captured ✓' : 'Capture Odometer Photo'}
                </Text>
              </TouchableOpacity>

              {endOdometerImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: endOdometerImage.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity 
                    style={styles.removeImageBtn}
                    onPress={() => setEndOdometerImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnComplete, uploading && styles.actionBtnDisabled]}
              onPress={handleEndTrip}
              disabled={uploading}
            >
              {uploading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.actionBtnText}>End Trip</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {/* STEP: Payment Collection Confirmation */}
        {step === STEPS.PAYMENT && (
          <>
            {(() => {
              const fareAmount = activeTrip.fare_amount || 0;
              const commissionAmount = activeTrip.commission_amount || 0;
              const customerPreAdvance = activeTrip.customer_pre_advance || 0;
              const remainingAmount = fareAmount - customerPreAdvance;
              const isPreAdvanceExceeded = customerPreAdvance > commissionAmount;

              console.log('💳 Payment Screen Debug:', {
                fareAmount,
                commissionAmount,
                customerPreAdvance,
                remainingAmount,
                isPreAdvanceExceeded,
                creatorName,
                creatorPhone,
                created_by: activeTrip.created_by,
              });

              return (
                <View style={styles.paymentCard}>
                  <Ionicons 
                    name={isPreAdvanceExceeded ? "wallet-outline" : "cash"} 
                    size={48} 
                    color={isPreAdvanceExceeded ? "#ff9800" : "#4caf50"} 
                    style={{ marginBottom: 16 }} 
                  />
                  <Text style={styles.paymentTitle}>
                    {isPreAdvanceExceeded ? "Collect from Vendor" : "Collect Payment"}
                  </Text>
                  
                  {isPreAdvanceExceeded ? (
                    <>
                      <Text style={styles.paymentSubtitle}>
                        Customer pre-advance exceeds commission. Collect the remaining amount from the trip creator.
                      </Text>

                      <View style={styles.paymentDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Total Fare:</Text>
                          <Text style={styles.detailValue}>₹{fareAmount.toFixed(2)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Commission:</Text>
                          <Text style={[styles.detailValue, { color: '#ff6b6b' }]}>-₹{commissionAmount.toFixed(2)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Customer Pre-Advance:</Text>
                          <Text style={[styles.detailValue, { color: '#2196f3' }]}>₹{customerPreAdvance.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.detailRow, styles.detailRowTotal]}>
                          <Text style={styles.detailLabel}>Collect from Passenger:</Text>
                          <Text style={[styles.detailValue, styles.detailValueTotal]}>₹{(fareAmount - customerPreAdvance).toFixed(2)}</Text>
                        </View>
                        <View style={[styles.detailRow, styles.detailRowTotal]}>
                          <Text style={styles.detailLabel}>Collect from Trip Creator:</Text>
                          <Text style={[styles.detailValue, styles.detailValueVendor]}>₹{(customerPreAdvance - commissionAmount).toFixed(2)}</Text>
                        </View>
                        <View style={[styles.detailRow, styles.detailRowTotal]}>
                          <Text style={styles.detailLabel}>Total Driver Earnings:</Text>
                          <Text style={[styles.detailValue, styles.detailValueTotal]}>₹{(fareAmount - commissionAmount).toFixed(2)}</Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.paymentSubtitle}>
                        Please collect ₹{remainingAmount.toFixed(2)} from the passenger
                      </Text>
                      
                      {customerPreAdvance > 0 && (
                        <View style={styles.preAdvanceNote}>
                          <Ionicons name="information-circle-outline" size={14} color="#2196f3" />
                          <Text style={styles.preAdvanceText}>
                            Customer already paid ₹{customerPreAdvance.toFixed(2)} in advance
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.paymentDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Distance Travelled:</Text>
                          <Text style={styles.detailValue}>
                            {(activeTrip?.end_km || endKm) && (activeTrip?.start_km || startKm)
                              ? ((parseFloat(activeTrip?.end_km || endKm) - parseFloat(activeTrip?.start_km || startKm))).toFixed(2)
                              : 'N/A'} km
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Total Fare:</Text>
                          <Text style={styles.detailValue}>₹{fareAmount.toFixed(2)}</Text>
                        </View>
                        {commissionAmount > 0 && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Commission:</Text>
                            <Text style={[styles.detailValue, { color: '#ff6b6b' }]}>-₹{commissionAmount.toFixed(2)}</Text>
                          </View>
                        )}
                        {customerPreAdvance > 0 && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Customer Pre-Advance:</Text>
                            <Text style={[styles.detailValue, { color: '#2196f3' }]}>-₹{customerPreAdvance.toFixed(2)}</Text>
                          </View>
                        )}
                        <View style={[styles.detailRow, styles.detailRowTotal]}>
                          <Text style={styles.detailLabel}>Collect from Passenger:</Text>
                          <Text style={[styles.detailValue, styles.detailValueTotal]}>₹{remainingAmount.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.detailRow, styles.detailRowTotal]}>
                          <Text style={styles.detailLabel}>Collect from Trip Creator:</Text>
                          <Text style={[styles.detailValue, styles.detailValueVendor]}>₹0.00</Text>
                        </View>
                        <View style={[styles.detailRow, styles.detailRowTotal]}>
                          <Text style={styles.detailLabel}>Total Driver Earnings:</Text>
                          <Text style={[styles.detailValue, styles.detailValueTotal]}>₹{(fareAmount - commissionAmount).toFixed(2)}</Text>
                        </View>
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnConfirm, uploading && styles.actionBtnDisabled]}
                    onPress={handleConfirmPayment}
                    disabled={uploading}
                  >
                    {uploading
                      ? <ActivityIndicator color="#fff" />
                      : (
                        <View style={styles.confirmBtnContent}>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <Text style={styles.actionBtnText}>Yes, Money Collected</Text>
                        </View>
                      )
                    }
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setStep(STEPS.IN_PROGRESS)}
                    disabled={uploading}
                  >
                    <Text style={styles.cancelBtnText}>Go Back to Trip</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.needHelpBtn, uploading && styles.actionBtnDisabled]}
                    onPress={() => {
                      const creatorPhone = activeTrip?.created_by ? 'fetching...' : 'N/A';
                      // Fetch creator info and show alert
                      if (activeTrip?.created_by) {
                        supabase
                          .from('users')
                          .select('full_name, phone')
                          .eq('id', activeTrip.created_by)
                          .maybeSingle()
                          .then(({ data: creator }) => {
                            if (creator) {
                              Alert.alert(
                                'Help & Support',
                                `Contact the trip creator:\n\n👤 ${creator.full_name}\n📞 ${creator.phone || 'Not available'}`,
                                [
                                  creator.phone && {
                                    text: `📞 Call ${creator.full_name}`,
                                    onPress: () => Linking.openURL(`tel:${creator.phone}`),
                                  },
                                  { text: 'Cancel', style: 'cancel' },
                                  { text: 'Go to Dashboard', onPress: () => navigation.replace('Dashboard') },
                                ].filter(Boolean)
                              );
                            }
                          });
                      }
                    }}
                    disabled={uploading}
                  >
                    <Ionicons name="help-circle-outline" size={18} color="#fff" />
                    <Text style={styles.needHelpBtnText}>Need Help</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </>
        )}
      </ScrollView>

      {/* Navigation Map Modal */}
      <Modal visible={showNavigationMap} animationType="slide" presentationStyle="fullScreen">
        <NavigationMap
          pickupLocation={activeTrip?.pickup_location}
          dropoffLocation={activeTrip?.dropoff_location}
          pickupLat={activeTrip?.pickup_lat}
          pickupLng={activeTrip?.pickup_lng}
          dropoffLat={activeTrip?.dropoff_lat}
          dropoffLng={activeTrip?.dropoff_lng}
          returnLocation={activeTrip?.return_location}
          returnLat={activeTrip?.return_lat}
          returnLng={activeTrip?.return_lng}
          passengerName={activeTrip?.passenger_name}
          passengerPhone={activeTrip?.passenger_phone}
          onClose={() => setShowNavigationMap(false)}
        />
      </Modal>
    </View>
    </KeyboardAvoidingView>
  );
}

function Row({ icon, color, text }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.rowText} numberOfLines={2}>{text}</Text>
    </View>
  );
}

function StepIndicator({ current }) {
  const steps = ['Accepted', 'Start', 'In Progress', 'End', 'Payment', 'Done'];
  return (
    <View style={styles.stepBar}>
      {steps.map((label, i) => (
        <View key={label} style={styles.stepItem}>
          <View style={[styles.stepDot, i <= current && styles.stepDotActive]} />
          <Text style={[styles.stepLabel, i <= current && styles.stepLabelActive]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: '#666', marginTop: 12, fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 100 },
  stepBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingVertical: 12 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd', marginBottom: 4 },
  stepDotActive: { backgroundColor: '#4caf50' },
  stepLabel: { color: '#999', fontSize: 10 },
  stepLabelActive: { color: '#4caf50' },
  tripCard: { backgroundColor: '#f9f9f9', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  rowText: { color: '#333', fontSize: 15, flex: 1 },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 8 },
  farePill: { alignSelf: 'flex-end', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  fareText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  inProgressBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 12, marginBottom: 16 },
  inProgressText: { color: '#4caf50', fontSize: 14, fontWeight: '600' },
  actionBtn: { backgroundColor: '#f0f0f0', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#ddd' },
  actionBtnComplete: { backgroundColor: '#4caf50', borderColor: '#4caf50' },
  actionBtnDisabled: { backgroundColor: '#eee', borderColor: '#ccc' },
  actionBtnText: { color: '#333', fontSize: 18, fontWeight: '700' },
  navigationBtn: { backgroundColor: '#2196f3', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8 },
  navigationBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  paymentCard: { backgroundColor: '#f9f9f9', borderRadius: 14, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  paymentTitle: { color: '#333', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  paymentSubtitle: { color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  preAdvanceNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e3f2fd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
  preAdvanceText: { color: '#2196f3', fontSize: 12, fontWeight: '500', flex: 1 },
  vendorDetailsBox: { width: '100%', backgroundColor: '#fff8e1', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ffe0b2' },
  vendorDetailsTitle: { color: '#ff9800', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  vendorDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  vendorDetailLabel: { color: '#666', fontSize: 12, fontWeight: '600', minWidth: 50 },
  vendorDetailValue: { color: '#333', fontSize: 12, fontWeight: '600', flex: 1 },
  vendorDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, marginVertical: 4 },
  vendorDetailsText: { color: '#ff9800', fontSize: 13, fontWeight: '600', flex: 1 },
  callBtnVendor: { backgroundColor: '#ff9800', borderRadius: 6, padding: 6, justifyContent: 'center', alignItems: 'center' },
  paymentDetails: { width: '100%', backgroundColor: '#f5f5f5', borderRadius: 10, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#eee' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  detailRowTotal: { borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 12, marginTop: 8 },
  detailLabel: { color: '#666', fontSize: 13, flex: 1, flexWrap: 'wrap', paddingRight: 8 },
  detailValue: { color: '#333', fontSize: 15, fontWeight: '600', textAlign: 'right' },
  detailValueTotal: { color: '#4caf50', fontSize: 18, fontWeight: '700' },
  detailValueVendor: { color: '#ff9800', fontSize: 18, fontWeight: '700' },
  actionBtnConfirm: { backgroundColor: '#4caf50', width: '100%' },
  confirmBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  needHelpBtn: { backgroundColor: '#ff9800', borderRadius: 14, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10, width: '100%', flexDirection: 'row', gap: 8 },
  needHelpBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cancelBtn: { borderWidth: 1, borderColor: '#f44336', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#f44336', fontSize: 15, fontWeight: '600' },
  doneTitle: { color: '#333', fontSize: 28, fontWeight: 'bold', marginTop: 20 },
  doneEarnings: { color: '#4caf50', fontSize: 42, fontWeight: 'bold', marginTop: 8 },
  doneSubtext: { color: '#666', fontSize: 14, marginTop: 4, marginBottom: 16, fontWeight: '500' },
  doneTripCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 8, width: '90%', gap: 6, borderWidth: 1, borderColor: '#eee' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneTripText: { color: '#666', fontSize: 13, flex: 1 },
  collectQuestion: { color: '#333', fontSize: 17, fontWeight: '600', textAlign: 'center', marginTop: 24, marginBottom: 20, paddingHorizontal: 20 },
  collectBtns: { width: '90%', gap: 12 },
  collectYes: { backgroundColor: '#4caf50', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  collectYesText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  collectNo: { backgroundColor: '#ff9800', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  collectNoText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  creatorDetailsBox: { width: '100%', backgroundColor: '#fff8e1', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ffe0b2' },
  creatorDetailsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  creatorDetailsTitle: { color: '#ff9800', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  creatorDetailsNote: { color: '#666', fontSize: 12, marginBottom: 8 },
  creatorDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  creatorDetailLabel: { color: '#666', fontSize: 12, fontWeight: '600', minWidth: 80 },
  creatorDetailValue: { color: '#333', fontSize: 12, fontWeight: '600', flex: 1 },
  callBtn: { backgroundColor: '#ff9800', borderRadius: 6, padding: 6, justifyContent: 'center', alignItems: 'center' },
  odometerCard: { backgroundColor: '#f9f9f9', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  odometerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  odometerLabel: { color: '#333', fontSize: 16, fontWeight: '600' },
  odometerInput: { 
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2196f3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  odometerHint: { color: '#666', fontSize: 12, fontStyle: 'italic', marginBottom: 12 },
  cameraCaptureBtn: {
    backgroundColor: '#2196f3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraCaptureSuccess: {
    backgroundColor: '#4caf50',
  },
  cameraCaptureBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#0f3460',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 4,
  },
  infoBox: { backgroundColor: '#0a2a4a', borderRadius: 10, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#2196f3' },
  infoText: { color: '#2196f3', fontSize: 14, fontWeight: '600' },
  doneContainer: { flexGrow: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: 80 },
  paymentQuestionCard: { backgroundColor: '#f9f9f9', borderRadius: 14, padding: 24, marginTop: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#eee', width: '100%' },
  paymentQuestionText: { color: '#333', fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  paymentButtonsContainer: { width: '100%', gap: 12, marginTop: 20 },
  actionBtnYes: { backgroundColor: '#4caf50', borderColor: '#4caf50', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  actionBtnNo: { backgroundColor: '#ff9800', borderColor: '#ff9800', flexDirection: 'row', justifyContent: 'center', gap: 8 },
});
