import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Modal, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useActiveTrip } from '../../hooks/useTrips';
import { useAppSettings } from '../../hooks/useAppSettings';
import OdometerCapture from '../../components/OdometerCapture';
import NavigationMap from '../../components/NavigationMap';
import { uploadOdometerImage } from '../../services/uploadService';
import { startTrip } from '../../services/tripService';
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
  const [startCapture, setStartCapture] = useState(null);
  const [endCapture, setEndCapture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showNavigationMap, setShowNavigationMap] = useState(false);
  const [completedTrip, setCompletedTrip] = useState(null); // stores trip + creator info after completion
  const [endOdometerUrl, setEndOdometerUrl] = useState(null); // Store URL for payment confirmation
  const [creatorName, setCreatorName] = useState(null);
  const [creatorPhone, setCreatorPhone] = useState(null);

  useEffect(() => {
    if (!activeTrip) return;
    if (activeTrip.status === TRIP_STATUS.IN_PROGRESS) {
      setStep(STEPS.IN_PROGRESS);
      setShowNavigationMap(true);
    }
    if (activeTrip.status === TRIP_STATUS.COMPLETED) setStep(STEPS.DONE);

    // Auto-populate captured data from database if available
    if (activeTrip.start_km && activeTrip.start_odometer_url) {
      setStartCapture({
        km: activeTrip.start_km,
        imageData: activeTrip.start_odometer_url,
      });
    }
    if (activeTrip.end_km && activeTrip.end_odometer_url) {
      setEndCapture({
        km: activeTrip.end_km,
        imageData: activeTrip.end_odometer_url,
      });
      setEndOdometerUrl(activeTrip.end_odometer_url);
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
  }, [activeTrip]);

  async function handleStartTrip() {
    if (!startCapture?.imageData || !startCapture?.km) {
      Alert.alert('Required', 'Please capture the odometer image and enter the KM reading.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadOdometerImage(startCapture.imageData, activeTrip.id, 'start');
      await startTrip({
        tripId: activeTrip.id,
        startOdometerUrl: url,
        startKm: startCapture.km,
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
    if (!endCapture?.imageData || !endCapture?.km) {
      Alert.alert('Required', 'Please capture the end odometer image and enter the KM reading.');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadOdometerImage(endCapture.imageData, activeTrip.id, 'end');
      setEndOdometerUrl(url);
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
      // Mark trip completed — no wallet credit (fare collected offline)
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          status:           'completed',
          completed_at:     new Date().toISOString(),
          end_odometer_url: endOdometerUrl,
          end_km:           endCapture.km,
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
        <ActivityIndicator color="#e94560" size="large" />
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
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={80} color="#4caf50" />
        <Text style={styles.doneTitle}>Trip Completed!</Text>
        <Text style={styles.doneEarnings}>₹{driverEarning.toFixed(2)}</Text>
        <Text style={styles.doneSubtext}>Your Earning</Text>

        {/* Trip summary */}
        <View style={styles.doneTripCard}>
          <View style={styles.doneRow}>
            <Ionicons name="location" size={14} color="#4caf50" />
            <Text style={styles.doneTripText} numberOfLines={1}>{trip.pickup_location}</Text>
          </View>
          <View style={styles.doneRow}>
            <Ionicons name="flag" size={14} color="#e94560" />
            <Text style={styles.doneTripText} numberOfLines={1}>{trip.dropoff_location}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.actionBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StepIndicator current={step} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Trip summary card */}
        <View style={styles.tripCard}>
          <Row icon="location" color="#4caf50" text={activeTrip.pickup_location} />
          <View style={styles.divider} />
          <Row icon="flag" color="#e94560" text={activeTrip.dropoff_location} />
          {activeTrip.passenger_name && (
            <>
              <View style={styles.divider} />
              <Row icon="person-outline" color="#888" text={activeTrip.passenger_name} />
            </>
          )}
          <View style={styles.farePill}>
            <Text style={styles.fareText}>₹{activeTrip.fare_amount}</Text>
          </View>
        </View>

        {/* STEP: capture start odometer */}
        {step === STEPS.ACCEPTED && (
          <>
            <OdometerCapture label="Start Odometer" onCapture={setStartCapture} />
            <TouchableOpacity
              style={[styles.actionBtn, (!startCapture || uploading) && styles.actionBtnDisabled]}
              onPress={handleStartTrip}
              disabled={!startCapture || uploading}
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
            <OdometerCapture label="End Odometer" onCapture={setEndCapture} />
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnComplete, (!endCapture || uploading) && styles.actionBtnDisabled]}
              onPress={handleEndTrip}
              disabled={!endCapture || uploading}
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
                      
                      <View style={styles.creatorDetailsBox}>
                        <View style={styles.creatorDetailsHeader}>
                          <Ionicons name="alert-circle-outline" size={14} color="#ff9800" />
                          <Text style={styles.creatorDetailsTitle}>Collect from Trip Creator</Text>
                        </View>
                        <Text style={styles.creatorDetailsNote}>
                          Customer pre-advance (₹{customerPreAdvance.toFixed(2)}) exceeds commission (₹{commissionAmount.toFixed(2)})
                        </Text>
                        <View style={styles.creatorDetailRow}>
                          <Ionicons name="person-outline" size={12} color="#ff9800" />
                          <Text style={styles.creatorDetailLabel}>Trip Creator:</Text>
                          <Text style={styles.creatorDetailValue}>{creatorName || 'N/A'}</Text>
                        </View>
                        {creatorPhone && (
                          <View style={styles.creatorDetailRow}>
                            <Ionicons name="call-outline" size={12} color="#ff9800" />
                            <Text style={styles.creatorDetailLabel}>Phone:</Text>
                            <Text style={styles.creatorDetailValue}>{creatorPhone}</Text>
                            <TouchableOpacity
                              style={styles.callBtn}
                              onPress={() => Linking.openURL(`tel:${creatorPhone}`)}
                            >
                              <Ionicons name="call" size={12} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        )}
                        <View style={styles.creatorDetailRow}>
                          <Ionicons name="wallet-outline" size={12} color="#ff9800" />
                          <Text style={styles.creatorDetailLabel}>Collect:</Text>
                          <Text style={styles.creatorDetailValue}>₹{(customerPreAdvance - commissionAmount).toFixed(2)}</Text>
                        </View>
                      </View>

                      <View style={styles.paymentDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Total Fare:</Text>
                          <Text style={styles.detailValue}>₹{fareAmount.toFixed(2)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Commission Charged by Driver:</Text>
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
                          <Text style={styles.detailLabel}>Trip Distance:</Text>
                          <Text style={styles.detailValue}>
                            {endCapture?.km && startCapture?.km 
                              ? (endCapture.km - startCapture.km).toFixed(2) 
                              : activeTrip?.end_km && activeTrip?.start_km
                              ? (activeTrip.end_km - activeTrip.start_km).toFixed(2)
                              : 'N/A'} km
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Total Fare:</Text>
                          <Text style={styles.detailValue}>₹{fareAmount.toFixed(2)}</Text>
                        </View>
                        {commissionAmount > 0 && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Commission Charged by Driver:</Text>
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
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  scroll: { padding: 16 },
  stepBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#16213e', paddingHorizontal: 16, paddingVertical: 12 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333', marginBottom: 4 },
  stepDotActive: { backgroundColor: '#e94560' },
  stepLabel: { color: '#555', fontSize: 10 },
  stepLabelActive: { color: '#e94560' },
  tripCard: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  rowText: { color: '#fff', fontSize: 15, flex: 1 },
  divider: { height: 1, backgroundColor: '#0f3460', marginVertical: 8 },
  farePill: { alignSelf: 'flex-end', backgroundColor: '#e94560', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  fareText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  inProgressBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0a2a0a', borderRadius: 10, padding: 12, marginBottom: 16 },
  inProgressText: { color: '#4caf50', fontSize: 14, fontWeight: '600' },
  actionBtn: { backgroundColor: '#e94560', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  actionBtnComplete: { backgroundColor: '#4caf50' },
  actionBtnDisabled: { backgroundColor: '#444' },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  navigationBtn: { backgroundColor: '#2196f3', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8 },
  navigationBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  paymentCard: { backgroundColor: '#16213e', borderRadius: 14, padding: 24, marginBottom: 16, alignItems: 'center' },
  paymentTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  paymentSubtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  preAdvanceNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0a2a4a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
  preAdvanceText: { color: '#2196f3', fontSize: 12, fontWeight: '500', flex: 1 },
  vendorDetailsBox: { width: '100%', backgroundColor: '#2a1a00', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ff9800' },
  vendorDetailsTitle: { color: '#ff9800', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  vendorDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  vendorDetailLabel: { color: '#888', fontSize: 12, fontWeight: '600', minWidth: 50 },
  vendorDetailValue: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  callBtnVendor: { backgroundColor: '#ff9800', borderRadius: 6, padding: 6, justifyContent: 'center', alignItems: 'center' },
  paymentDetails: { width: '100%', backgroundColor: '#0f3460', borderRadius: 10, padding: 16, marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  detailRowTotal: { borderTopWidth: 1, borderTopColor: '#1a1a2e', paddingTop: 12, marginTop: 8 },
  detailLabel: { color: '#aaa', fontSize: 14 },
  detailValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  detailValueTotal: { color: '#4caf50', fontSize: 18, fontWeight: '700' },
  detailValueVendor: { color: '#ff9800', fontSize: 18, fontWeight: '700' },
  actionBtnConfirm: { backgroundColor: '#4caf50', width: '100%' },
  confirmBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  needHelpBtn: { backgroundColor: '#ff9800', borderRadius: 14, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10, width: '100%', flexDirection: 'row', gap: 8 },
  needHelpBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cancelBtn: { borderWidth: 1, borderColor: '#f44336', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#f44336', fontSize: 15, fontWeight: '600' },
  doneTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 20 },
  doneEarnings: { color: '#4caf50', fontSize: 42, fontWeight: 'bold', marginTop: 8 },
  doneSubtext: { color: '#888', fontSize: 14, marginTop: 4 },
  doneTripCard: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 8, width: '90%', gap: 6 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneTripText: { color: '#ccc', fontSize: 13, flex: 1 },
  collectQuestion: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center', marginTop: 24, marginBottom: 20, paddingHorizontal: 20 },
  collectBtns: { width: '90%', gap: 12 },
  collectYes: { backgroundColor: '#4caf50', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  collectYesText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  collectNo: { backgroundColor: '#ff9800', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  collectNoText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  creatorDetailsBox: { width: '100%', backgroundColor: '#2a1a00', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#ff9800' },
  creatorDetailsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  creatorDetailsTitle: { color: '#ff9800', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  creatorDetailsNote: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  creatorDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  creatorDetailLabel: { color: '#888', fontSize: 12, fontWeight: '600', minWidth: 80 },
  creatorDetailValue: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  callBtn: { backgroundColor: '#ff9800', borderRadius: 6, padding: 6, justifyContent: 'center', alignItems: 'center' },
});
