import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, ScrollView, Keyboard, Linking, Platform, AppState
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import {
  initiatePhonePePayment,
  checkPhonePePaymentStatus,
  formatPaymentAmount,
  validatePaymentAmount,
} from '../services/paymentService';

export default function PhonePePaymentModal({
  visible,
  onClose,
  userId,
  userType = 'driver',
  currentBalance = 0,
  onPaymentSuccess,
  onPaymentError,
}) {
  const theme = COLORS;
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const currentTransactionRef = useRef(null);

  const predefinedAmounts = [100, 250, 500, 1000, 2000, 5000];

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Detect app foregrounding (user returned from browser after paying)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active' &&
        currentTransactionRef.current &&
        processing
      ) {
        console.log('📱 App foregrounded — checking payment status...');
        // Small delay to let PhonePe webhook fire first
        setTimeout(async () => {
          try {
            const result = await checkPhonePePaymentStatus(currentTransactionRef.current);
            if (result.success) {
              const status = result.data.state || result.data.status;
              if (status === 'SUCCESS' || status === 'COMPLETED') {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                setPaymentStatus('SUCCESS');
                Alert.alert('✅ Payment Successful', `Amount: ₹${amount}\n\nYour wallet has been credited.`, [{
                  text: 'OK', onPress: () => {
                    if (onPaymentSuccess) onPaymentSuccess({ amount: parseFloat(amount), transactionId: currentTransactionRef.current, status: 'SUCCESS' });
                    handleClose();
                  }
                }]);
              } else if (status === 'FAILED') {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
                setPaymentStatus('FAILED');
              }
            }
          } catch (e) {
            console.warn('Status check on foreground failed:', e.message);
          }
        }, 2000);
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [processing, amount]);

  const handleClose = () => {
    // Stop polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setAmount('');
    setProcessing(false);
    setPaymentStatus(null);
    setPollCount(0);
    onClose();
  };

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount.toString());
    Keyboard.dismiss();
  };

  // Poll payment status every 2 seconds
  const startStatusPolling = (transactionId) => {
    console.log(`📊 Starting status polling for ${transactionId}`);
    setPollCount(0);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        setPollCount(prev => prev + 1);
        
        const statusResult = await checkPhonePePaymentStatus(transactionId);
        
        if (statusResult.success) {
          const currentStatus = statusResult.data.state || statusResult.data.status;
          console.log(`📊 Poll #${pollCount + 1}: Status = ${currentStatus}`);
          
          setPaymentStatus(currentStatus);
          
          // Check if payment completed
          if (currentStatus === 'SUCCESS' || currentStatus === 'COMPLETED') {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            
            console.log('✅ Payment successful!');
            Alert.alert(
              '✅ Payment Successful',
              `Amount: ₹${amount}\n\nYour wallet has been credited.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    if (onPaymentSuccess) {
                      onPaymentSuccess({
                        amount: parseFloat(amount),
                        transactionId,
                        newBalance: currentBalance + parseFloat(amount),
                        status: 'SUCCESS'
                      });
                    }
                    handleClose();
                  },
                },
              ]
            );
          } else if (currentStatus === 'FAILED') {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            
            console.log('❌ Payment failed');
            Alert.alert(
              '❌ Payment Failed',
              'Your payment was declined. Please try again.',
              [
                {
                  text: 'Try Again',
                  onPress: () => {
                    handleClose();
                  },
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error.message);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleInitiatePayment = async () => {
    try {
      // Validate amount
      const validation = validatePaymentAmount(amount);
      if (!validation.valid) {
        Alert.alert('Invalid Amount', validation.error);
        return;
      }

      Keyboard.dismiss();
      setLoading(true);
      setPaymentStatus('INITIATED');

      const paymentAmount = parseFloat(amount);

      console.log(`💳 Initiating payment for ₹${paymentAmount}`);

      // Call backend to initiate payment
      const result = await initiatePhonePePayment(
        userId,
        paymentAmount,
        userType
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log('✅ Payment order created');
      console.log(`   Transaction ID: ${result.data.transactionId}`);
      console.log(`   Order ID: ${result.data.merchantOrderId}`);
      console.log(`   Checkout URL: ${result.data.checkoutUrl}`);
      
      setProcessing(true);
      setPaymentStatus('PENDING');
      setLoading(false);
      currentTransactionRef.current = result.data.transactionId;

      // Open the PhonePe hosted checkout in the browser / PhonePe app
      try {
        const checkoutUrl = result.data.checkoutUrl;
        if (!checkoutUrl) throw new Error('No checkout URL from PhonePe');

        console.log(`🔗 Opening PhonePe checkout...`);
        const canOpen = await Linking.canOpenURL(checkoutUrl);
        if (canOpen) {
          await Linking.openURL(checkoutUrl);
        } else {
          throw new Error('Cannot open PhonePe checkout. Please ensure PhonePe app or a browser is installed.');
        }

        // Poll our backend for payment status after user returns
        startStatusPolling(result.data.transactionId);

      } catch (phonepeError) {
        console.error('❌ PhonePe checkout error:', phonepeError.message);
        Alert.alert(
          'Payment Error',
          phonepeError.message || 'Failed to open PhonePe checkout. Please try again.',
          [{text: 'OK', onPress: () => handleClose()}]
        );
      }
    } catch (error) {
      console.error('❌ Payment initiation error:', error.message);
      setLoading(false);
      setPaymentStatus(null);
      Alert.alert('Payment Failed', error.message);
      if (onPaymentError) {
        onPaymentError(error.message);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Recharge Wallet</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading || processing}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current Balance */}
            <View style={[styles.balanceCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Current Balance</Text>
              <Text style={[styles.balanceAmount, { color: theme.accent }]}>
                ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Payment Status Display (When Processing) */}
            {processing && (
              <View style={[styles.statusBox, { backgroundColor: theme.infoLight, borderColor: theme.infoBorder }]}>
                <ActivityIndicator size="small" color={theme.accent} style={{ marginBottom: 8 }} />
                <Text style={[styles.statusText, { color: theme.text }]}>
                  {paymentStatus === 'INITIATED' && '⏳ Initiating payment...'}
                  {paymentStatus === 'PENDING' && `📊 Waiting for payment confirmation...`}
                  {paymentStatus === 'SUCCESS' && '✅ Payment successful!'}
                  {paymentStatus === 'FAILED' && '❌ Payment failed'}
                </Text>
                {(paymentStatus === 'PENDING' || paymentStatus === 'INITIATED') && (
                  <>
                    <Text style={[styles.statusHint, { color: theme.textSecondary }]}>
                      Complete the payment in the browser, then return here
                    </Text>
                    <TouchableOpacity
                      style={[styles.paidButton, { backgroundColor: theme.primary, marginTop: 12 }]}
                      onPress={async () => {
                        if (!currentTransactionRef.current) return;
                        try {
                          const result = await checkPhonePePaymentStatus(currentTransactionRef.current);
                          const status = result.data?.state || result.data?.status;
                          if (status === 'SUCCESS' || status === 'COMPLETED') {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                            Alert.alert('✅ Payment Successful', `₹${amount} added to your wallet.`, [{
                              text: 'OK', onPress: () => {
                                if (onPaymentSuccess) onPaymentSuccess({ amount: parseFloat(amount), transactionId: currentTransactionRef.current, status: 'SUCCESS' });
                                handleClose();
                              }
                            }]);
                          } else {
                            Alert.alert('Payment Pending', `Status: ${status}\n\nIf you completed payment, please wait a few seconds and try again.`);
                          }
                        } catch (e) {
                          Alert.alert('Error', 'Could not check payment status. Please wait.');
                        }
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>I've Paid — Check Status</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Amount Input */}
            {!processing && (
              <>
                <View style={styles.inputSection}>
                  <Text style={[styles.label, { color: theme.text }]}>Enter Amount</Text>
                  <View style={[styles.inputContainer, { borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}>
                    <Text style={[styles.currencySymbol, { color: theme.text }]}>₹</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Enter amount"
                      placeholderTextColor={theme.inputPlaceholder}
                      keyboardType="decimal-pad"
                      value={amount}
                      onChangeText={setAmount}
                      editable={!loading}
                      maxLength={6}
                    />
                  </View>
                  <Text style={[styles.hint, { color: theme.textTertiary }]}>Minimum ₹1 • Maximum ₹100,000</Text>
                </View>

                {/* Predefined Amounts */}
                <View style={styles.predefinedSection}>
                  <Text style={[styles.label, { color: theme.text }]}>Quick Amount</Text>
                  <View style={styles.amountGrid}>
                    {predefinedAmounts.map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.amountButton,
                          {
                            backgroundColor: amount === amt.toString()
                              ? theme.buttonPrimaryBg
                              : theme.surfaceVariant,
                            borderColor: amount === amt.toString()
                              ? theme.buttonPrimaryBorder
                              : theme.border,
                          },
                        ]}
                        onPress={() => handleAmountSelect(amt)}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.amountButtonText,
                            {
                              color: amount === amt.toString()
                                ? theme.primary
                                : theme.text,
                              fontWeight: amount === amt.toString() ? '600' : '400',
                            },
                          ]}
                        >
                          ₹{amt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Info Message */}
                <View style={[styles.infoBox, { backgroundColor: theme.infoLight, borderColor: theme.infoBorder }]}>
                  <Ionicons name="information-circle" size={20} color={theme.info} />
                  <Text style={[styles.infoText, { color: theme.text }]}>
                    Your wallet will be credited immediately after successful payment. No hidden charges.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                {processing ? 'Cancel & Close' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            {!processing && (
              <TouchableOpacity
                style={[
                  styles.payButton,
                  {
                    backgroundColor: amount && parseFloat(amount) > 0
                      ? theme.primary
                      : theme.buttonDisabledBg,
                  },
                ]}
                onPress={handleInitiatePayment}
                disabled={loading || !amount || parseFloat(amount) <= 0}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="card" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.payButtonText}>Pay {formatPaymentAmount(parseFloat(amount) || 0)}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
  },
  predefinedSection: {
    marginBottom: 24,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  amountButton: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  amountButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 12,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  payButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  paidButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
});
