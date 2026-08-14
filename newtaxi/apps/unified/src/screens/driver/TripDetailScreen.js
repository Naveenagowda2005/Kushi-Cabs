import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../hooks/useDriverWallet';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { initiateDeposit } from '../../services/paymentService';
import { acceptTrip } from '../../services/tripService';
import { stopSound } from '../../services/soundService';
import { supabase } from '../../lib/supabase';
import { PAYMENT_GATEWAYS, TRIP_STATUS, TRANSACTION_TYPES } from '../../constants';

export default function DriverTripDetailScreen({ route, navigation }) {
  const { trip } = route.params;
  const { user } = useAuth();
  const { wallet, refetch: refetchWallet } = useWallet(user?.id);
  const { settings } = useSystemSettings();
  const [paying, setPaying] = useState(false);
  const [tripData, setTripData] = useState(trip);
  const [isAcceptedRecently, setIsAcceptedRecently] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Has this driver already paid commission for this trip?
  const commissionPaid = tripData.commission_paid && tripData.accepted_by === user?.id;
  const commissionAmount = tripData.commission_amount || 0;
  const customerPreAdvance = tripData.customer_pre_advance || 0;
  
  // Commission to pay by driver = Commission - Customer Pre-Advance (minimum 0)
  const commissionToPay = Math.max(0, commissionAmount - customerPreAdvance);
  
  const hasEnoughBalance = (wallet?.balance || 0) >= commissionToPay;
  const minWalletBalance = settings.minimumWalletBalance !== undefined && settings.minimumWalletBalance !== null 
    ? settings.minimumWalletBalance 
    : 500;
  const hasMinimumBalance = (wallet?.balance || 0) >= minWalletBalance;

  // Check if trip was just accepted (seal stamp display logic)
  useEffect(() => {
    if (!tripData.accepted_at) {
      setIsAcceptedRecently(false);
      return;
    }

    const acceptedTime = new Date(tripData.accepted_at).getTime();
    const now = new Date().getTime();
    const elapsedMs = now - acceptedTime;
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    if (elapsedMs < FIVE_MINUTES_MS) {
      setIsAcceptedRecently(true);
      setTimeRemaining(Math.ceil((FIVE_MINUTES_MS - elapsedMs) / 1000));
    } else {
      setIsAcceptedRecently(false);
      setTimeRemaining(0);
    }
  }, [tripData.accepted_at]);

  // Update timer every second
  useEffect(() => {
    if (!isAcceptedRecently || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsAcceptedRecently(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAcceptedRecently, timeRemaining]);

  // ── Accept trip after payment ──────────────
  async function acceptTripAfterPayment() {
    // Mark commission as paid (payment happened via gateway, not wallet)
    const { error: markErr } = await supabase
      .from('trips')
      .update({ commission_paid: true })
      .eq('id', tripData.id);
    if (markErr) throw new Error('Failed to mark commission paid: ' + markErr.message);

    // Accept trip using atomic RPC function
    const result = await acceptTrip(tripData.id, user.id);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to accept trip');
    }

    // Update local state with acceptance info for seal stamp display
    setTripData(prev => ({
      ...prev,
      status: TRIP_STATUS.ACCEPTED,
      accepted_by: user.id,
      accepted_at: new Date().toISOString(),
      commission_paid: true,
    }));

    return result;
  }

  async function handlePayCommission() {
    if (commissionToPay <= 0) {
      // Check minimum balance before accepting
      if (!hasMinimumBalance) {
        Alert.alert(
          '⚠️ Minimum Balance Required',
          `Your wallet must have at least ₹${minWalletBalance} balance. Current balance: ₹${(wallet?.balance || 0).toFixed(2)}. Please add funds to your wallet first.`,
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Accept Trip',
        'This trip does not require a commission payment. Accept and unlock customer details?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept Trip',
            onPress: async () => {
              setPaying(true);
              try {
                await acceptTripAfterPayment();
                
                // STOP SOUND IMMEDIATELY after accept succeeds
                console.log('✅ Trip accepted - stopping sound immediately');
                await stopSound().catch(err => console.warn('Error stopping sound:', err));
                
                await refetchWallet();

                // Fetch fresh trip data
                const { data: fullTrip, error: tripErr } = await supabase
                  .from('trips').select('*').eq('id', tripData.id).single();

                if (tripErr) throw tripErr;

                Alert.alert(
                  '✅ Trip Accepted',
                  'Customer details unlocked! You can now start the trip.',
                  [{ text: 'Start Trip', onPress: () => navigation.replace('ActiveTrip', { trip: fullTrip }) }]
                );
              } catch (err) {
                console.error('Accept trip error:', err);
                Alert.alert('Error', err.message || 'Failed to accept the trip');
              } finally {
                setPaying(false);
              }
            },
          },
        ]
      );
      return;
    }

    await handlePayWithGateway();
  }

  async function handlePayWithGateway() {
    if (commissionToPay <= 0) {
      Alert.alert('Nothing to pay', 'This trip does not require a commission payment.');
      return;
    }

    // Check minimum balance before proceeding with payment
    if (!hasMinimumBalance) {
      Alert.alert(
        '⚠️ Minimum Balance Required',
        `Your wallet must have at least ₹${minWalletBalance} balance (for potential cancellation fees). Current: ₹${(wallet?.balance || 0).toFixed(2)}. Please add funds first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setPaying(true);
    try {
      console.log(`[TripPayment] Initiating PhonePe payment for ₹${commissionToPay.toFixed(2)}`);
      
      const result = await initiateDeposit({
        userId: user.id,
        amount: commissionToPay,
        userEmail: user?.email,
        userName: user?.full_name,
        gateway: PAYMENT_GATEWAYS.PHONEPE,
        minAmount: 1,
      });

      if (result.pending) {
        Alert.alert(
          '🔓 Payment App Opened',
          'Your payment app has opened with the amount pre-filled.\n\n' +
          '📱 Complete the payment in your UPI app (PhonePe, Google Pay, etc.)\n\n' +
          '✅ After successful payment, return to this app to confirm and start the trip.',
          [{ text: 'Got it', onPress: () => {} }]
        );
        setPaying(false);
        return;
      }

      // Payment successful - now accept the trip
      await acceptTripAfterPayment();
      
      // STOP SOUND IMMEDIATELY after accept succeeds
      console.log('✅ Trip accepted - stopping sound immediately');
      await stopSound().catch(err => console.warn('Error stopping sound:', err));
      
      await refetchWallet();

      const { data: fullTrip, error: tripErr } = await supabase
        .from('trips').select('*').eq('id', tripData.id).single();

      if (tripErr) throw tripErr;

      Alert.alert(
        '✅ Commission Paid & Trip Accepted',
        'Payment succeeded. Customer details are now unlocked.',
        [{ text: 'Start Trip', onPress: () => navigation.replace('ActiveTrip', { trip: fullTrip }) }]
      );
    } catch (err) {
      console.error('[TripPayment] Payment error:', err);
      
      let errorMsg = err.message || 'Failed to open payment app';
      
      if (errorMsg.includes('No UPI')) {
        errorMsg = 'No UPI app found. Please install PhonePe, Google Pay, Paytm, or any UPI app.';
      } else if (errorMsg.includes('Unable to open')) {
        errorMsg = 'Could not open UPI payment app. Make sure a UPI app is installed on your phone.';
      }
      
      Alert.alert(
        '⚠️ Payment Error',
        errorMsg,
        [
          { text: 'OK', onPress: () => {} },
          { text: 'Try Again', onPress: () => handlePayWithGateway() }
        ]
      );
    } finally {
      setPaying(false);
    }
  }

  function InfoRow({ icon, label, value, highlight }) {
    return (
      <View style={styles.infoRow}>
        <Ionicons name={icon} size={20} color="#333" style={styles.infoIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value || '—'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SEAL STAMP for Recently Accepted Trips - Visible for 5 minutes */}
      {isAcceptedRecently && (
        <View style={styles.sealStampContainer}>
          <View style={styles.sealStamp}>
            {/* Outer ring */}
            <View style={styles.sealRingOuter}>
              <Text style={styles.sealTextTop}>KUSHI CABS</Text>
            </View>
            
            {/* Center circle */}
            <View style={styles.sealCenter}>
              <Text style={styles.sealMainText}>TRIP</Text>
              <Text style={styles.sealMainText}>ACCEPTED</Text>
              <Text style={styles.sealTimerText}>{timeRemaining}s</Text>
            </View>
            
            {/* Star decorations */}
            <Text style={styles.sealStar}>✦</Text>
            <Text style={[styles.sealStar, { bottom: 8, top: 'auto' }]}>✦</Text>
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: '#ffffff' }}>

        {/* Fare card */}
        <View style={styles.fareCard}>
          <Text style={styles.fareLabel}>Driver Earning</Text>
          <Text style={styles.fareAmount}>₹{(tripData.fare_amount - commissionAmount).toFixed(2)}</Text>
          {tripData.is_admin_trip && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#fff" />
              <Text style={styles.adminBadgeText}>Admin Assigned</Text>
            </View>
          )}
          {commissionAmount > 0 && (
            <View style={styles.commissionBadge}>
              <Ionicons name="trending-up-outline" size={14} color="#fff" />
              <Text style={styles.commissionBadgeText}>
                Commission: ₹{commissionAmount.toFixed(2)}
                {customerPreAdvance > 0 && ` (₹${Math.abs(customerPreAdvance).toFixed(2)} pre-advance covers it)`}
              </Text>
            </View>
          )}
          {commissionToPay > 0 && (
            <View style={styles.paymentBadge}>
              <Ionicons name="wallet-outline" size={14} color="#fff" />
              <Text style={styles.paymentBadgeText}>
                You Pay: ₹{commissionToPay.toFixed(2)}
              </Text>
            </View>
          )}
          {commissionToPay === 0 && commissionAmount > 0 && (
            <View style={styles.coveredBadge}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#4caf50" />
              <Text style={styles.coveredBadgeText}>
                Commission fully covered by pre-advance
              </Text>
            </View>
          )}
        </View>

        {/* Trip info — always visible */}
        <View style={styles.section}>
          <InfoRow icon="location"         label="Pickup"    value={tripData.pickup_location} />
          <InfoRow icon="flag"             label="Drop-off"  value={tripData.dropoff_location} />
          <InfoRow icon="time-outline"     label="Scheduled" value={
            tripData.scheduled_at ? new Date(tripData.scheduled_at).toLocaleString() : 'ASAP'
          } />
          <InfoRow icon="calendar-outline" label="Created"   value={
            new Date(tripData.created_at).toLocaleString()
          } />
        </View>

        {/* Customer details — LOCKED until commission paid */}
        <View style={[styles.section, !commissionPaid && styles.sectionLocked]}>
          <View style={styles.lockHeader}>
            <Ionicons
              name={commissionPaid ? 'lock-open-outline' : 'lock-closed-outline'}
              size={18}
              color={commissionPaid ? '#4caf50' : '#ff9800'}
            />
            <Text style={[styles.lockTitle, commissionPaid && styles.lockTitleUnlocked]}>
              {commissionPaid ? 'Customer Details (Unlocked)' : 'Customer Details (Locked)'}
            </Text>
          </View>

          {commissionPaid ? (
            <>
              <InfoRow icon="person-outline" label="Passenger Name"  value={tripData.passenger_name} highlight />
              <InfoRow icon="call-outline"   label="Passenger Phone" value={tripData.passenger_phone} highlight />
            </>
          ) : (
            <View style={styles.lockedContent}>
              <Text style={styles.lockedText}>
                {commissionToPay > 0 
                  ? `Pay ₹${commissionToPay.toFixed(2)} commission to unlock customer name and phone number`
                  : `Commission is covered by customer pre-advance. Tap "Accept Trip" to unlock customer details.`
                }
              </Text>
            </View>
          )}
        </View>

        {/* Wallet balance */}
        <View style={[styles.walletCard, !hasMinimumBalance && styles.walletCardLow]}>
          <Ionicons name="wallet-outline" size={20} color={hasMinimumBalance ? '#4caf50' : '#ff9800'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>Your Wallet Balance</Text>
            <Text style={[styles.walletAmount, !hasMinimumBalance && styles.walletAmountLow]}>
              ₹{(wallet?.balance || 0).toFixed(2)}
            </Text>
          </View>
          {!hasMinimumBalance && (
            <Text style={styles.walletShort}>
              Need ₹{(minWalletBalance - (wallet?.balance || 0)).toFixed(2)} more
            </Text>
          )}
        </View>

      </ScrollView>

      {/* Footer action */}
      <View style={styles.footer}>
        {!commissionPaid ? (
          <>
            <TouchableOpacity
              style={[styles.payBtn, paying && styles.btnDisabled]}
              onPress={commissionToPay > 0 ? handlePayWithGateway : handlePayCommission}
              disabled={paying}
            >
              {paying
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="lock-open-outline" size={20} color="#fff" />
                    <Text style={styles.payBtnText}>
                      {commissionToPay > 0
                        ? `Pay ₹${commissionToPay.toFixed(2)} via PhonePe & Accept Trip`
                        : `Accept Trip`
                      }
                    </Text>
                  </>
              }
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => navigation.replace('ActiveTrip', { trip: tripData })}
          >
            <Ionicons name="navigate-outline" size={20} color="#fff" />
            <Text style={styles.startBtnText}>Go to Active Trip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', overflow: 'visible' },
  scroll: { padding: 20, paddingBottom: 20 },

  fareCard: { backgroundColor: '#f5f5f5', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  fareLabel: { color: '#666', fontSize: 14 },
  fareAmount: { color: '#333', fontSize: 42, fontWeight: 'bold', marginTop: 4 },
  commissionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#666', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 },
  commissionBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#64b5f6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8, borderWidth: 1.5, borderColor: '#90caf9' },
  adminBadgeText: { color: '#000', fontSize: 13, fontWeight: '700' },
  paymentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ff9800', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 },
  paymentBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  coveredBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8, borderWidth: 1, borderColor: '#4caf50' },
  coveredBadgeText: { color: '#4caf50', fontSize: 13, fontWeight: '600' },

  section: { backgroundColor: '#f5f5f5', borderRadius: 14, padding: 16, marginBottom: 14, gap: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  sectionLocked: { borderWidth: 1, borderColor: '#ff980040' },
  lockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  lockTitle: { color: '#ff9800', fontSize: 13, fontWeight: '600' },
  lockTitleUnlocked: { color: '#4caf50' },
  lockedContent: { gap: 10 },
  lockedText: { color: '#666', fontSize: 12, lineHeight: 18 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lockedValue: { color: '#aaa', fontSize: 16, letterSpacing: 4 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { marginRight: 12, marginTop: 2, color: '#333' },
  infoLabel: { color: '#666', fontSize: 12, marginBottom: 2 },
  infoValue: { color: '#333', fontSize: 15, fontWeight: '500' },
  infoValueHighlight: { color: '#4caf50', fontWeight: '600', fontSize: 16 },

  walletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 12, padding: 14, gap: 12, marginBottom: 8, borderWidth: 1, borderColor: '#c8e6c9' },
  walletCardLow: { backgroundColor: '#fff3e0', borderColor: '#ffe0b2' },
  walletLabel: { color: '#666', fontSize: 11 },
  walletAmount: { color: '#4caf50', fontSize: 18, fontWeight: 'bold' },
  walletAmountLow: { color: '#ff9800' },
  walletShort: { color: '#ff9800', fontSize: 11, textAlign: 'right' },

  footer: { padding: 20, paddingBottom: 36, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  payBtn: { backgroundColor: '#4caf50', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  gatewayBtn: { backgroundColor: '#2196f3', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 },
  payBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  startBtn: { backgroundColor: '#4caf50', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnDisabled: { backgroundColor: '#999' },
  
  // SEAL STAMP STYLES
  sealStampContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'none',
    marginTop: -100,
    marginLeft: -100,
  },
  sealStamp: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#ff9800',
    backgroundColor: '#fff8f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'solid',
    position: 'relative',
  },
  sealRingOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealTextTop: {
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    position: 'absolute',
    top: 18,
  },
  sealCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  sealMainText: {
    color: '#ff9800',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
    lineHeight: 20,
  },
  sealTimerText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  sealStar: {
    position: 'absolute',
    fontSize: 12,
    color: '#ff9800',
    top: 8,
    right: 8,
  },
});
