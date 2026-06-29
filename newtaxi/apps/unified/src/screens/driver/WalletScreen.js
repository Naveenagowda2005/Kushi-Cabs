import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../hooks/useDriverWallet';
import { useTransactions } from '../../hooks/useDriverTransactions';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import TransactionRow from '../../components/TransactionRow';
import { PAYMENT_GATEWAYS } from '../../constants';
import { initiateDeposit } from '../../services/paymentService';

export default function DriverWalletScreen() {
  const { user } = useAuth();
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet(user?.id);
  const { transactions, loading: txLoading, refetch: refetchTx } = useTransactions(user?.id);
  const { settings } = useSystemSettings();
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const minWalletBalance = settings.minimumWalletBalance || 100;
  const isLow = wallet && wallet.balance < minWalletBalance;

  useFocusEffect(useCallback(() => {
    refetchWallet();
    refetchTx();
  }, [refetchWallet, refetchTx]));

  async function handleDeposit() {
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (amount < 100) {
      Alert.alert('Minimum Amount', 'Minimum deposit is ₹100');
      return;
    }

    setIsDepositing(true);
    try {
      const result = await initiateDeposit({
        userId: user.id,
        amount: amount,
        userEmail: user?.email,
        userName: user?.full_name,
        gateway: PAYMENT_GATEWAYS.PHONEPE,
        minAmount: 100,
      });

      if (result.pending) {
        // PhonePe payment started
        setDepositAmount('');
        setDepositModalVisible(false);
        
        Alert.alert(
          '💳 Payment App Opened',
          'Complete your payment in the UPI app that opened, then return here.',
          [{ text: 'OK', onPress: async () => { await refetchWallet(); } }]
        );
      } else if (result.success) {
        // Payment completed
        setDepositAmount('');
        setDepositModalVisible(false);
        await refetchWallet();
        
        Alert.alert(
          '✅ Deposit Successful',
          `₹${amount.toFixed(2)} added to your wallet!`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Deposit error:', err);
      Alert.alert(
        '❌ Deposit Failed',
        err.message || 'Failed to process deposit. Please try again.',
        [{ text: 'Try Again' }]
      );
    } finally {
      setIsDepositing(false);
    }
  }

  function onPaymentSuccess() {
    refetchWallet();
    refetchTx();
  }

  return (
    <View style={styles.container}>
      {/* Balance Card */}
      <View style={[styles.balanceCard, isLow && styles.balanceCardLow]}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={[styles.balanceAmount, isLow && styles.balanceAmountLow]}>
          ₹{wallet?.balance?.toFixed(2) || '0.00'}
        </Text>
        {isLow && (
          <View style={styles.warningRow}>
            <Ionicons name="warning-outline" size={16} color="#ff9800" />
            <Text style={styles.warningText}>Minimum balance required: ₹{minWalletBalance}</Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => setDepositModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={18} color="#4caf50" />
            <Text style={styles.actionBtnText}>Add Funds</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transaction history */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Transaction History</Text>
        <Text style={styles.historyCount}>{transactions.length} records</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TransactionRow tx={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={walletLoading || txLoading}
            onRefresh={() => { refetchWallet(); refetchTx(); }}
            tintColor="#4caf50" colors={['#4caf50']}
          />
        }
        ListEmptyComponent={
          !walletLoading && (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color="#333" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )
        }
      />

      {/* Deposit Modal */}
      <Modal
        visible={depositModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setDepositModalVisible(false);
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={modal.overlay}
        >
          <View style={modal.overlay}>
            <ScrollView 
              contentContainerStyle={modal.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={modal.sheet}>
                <View style={modal.handle} />
                <Text style={modal.title}>Add Funds to Wallet</Text>
                <Text style={modal.subtitle}>Enter amount to deposit</Text>

                {/* Amount Input */}
                <TextInput
                  style={modal.input}
                  placeholder="Enter amount (min ₹100)"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  editable={!isDepositing}
                />

                {/* Quick Amount Buttons */}
                <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Quick amounts:</Text>
                <View style={modal.quickRow}>
                  {[100, 200, 500, 1000].map(amt => (
                    <TouchableOpacity
                      key={amt}
                      style={modal.quickBtn}
                      onPress={() => {
                        setDepositAmount(amt.toString());
                        Keyboard.dismiss();
                      }}
                      disabled={isDepositing}
                      activeOpacity={0.7}
                    >
                      <Text style={modal.quickBtnText}>₹{amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Payment Method - PhonePe Only */}
                <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Payment method:</Text>
                <View style={modal.methodRow}>
                  <View style={[modal.methodBtn, modal.methodBtnActive]}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                    <Text style={[modal.methodText, modal.methodTextActive]}>PhonePe</Text>
                  </View>
                </View>

                {/* Deposit Button */}
                <TouchableOpacity
                  style={[modal.confirmBtn, isDepositing && modal.confirmBtnDisabled]}
                  onPress={handleDeposit}
                  disabled={isDepositing}
                  activeOpacity={0.7}
                >
                  {isDepositing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="wallet-outline" size={18} color="#fff" />
                      <Text style={modal.confirmBtnText}>
                        Deposit ₹{depositAmount || '0'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={modal.cancelBtn}
                  onPress={() => {
                    Keyboard.dismiss();
                    setDepositModalVisible(false);
                    setDepositAmount('');
                  }}
                  disabled={isDepositing}
                  activeOpacity={0.7}
                >
                  <Text style={modal.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  balanceCard: {
    backgroundColor: '#ffffff', margin: 16, marginTop: 20, borderRadius: 14,
    padding: 20, borderWidth: 2, borderColor: '#ff9800',
  },
  balanceCardLow: { borderColor: '#ff9800' },
  balanceLabel: { color: '#666', fontSize: 12, marginBottom: 6, fontWeight: '500' },
  balanceAmount: { color: '#4caf50', fontSize: 36, fontWeight: 'bold' },
  balanceAmountLow: { color: '#ff9800' },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  warningText: { color: '#ff9800', fontSize: 12, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#ff9800', borderRadius: 10, padding: 12,
  },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#ff9800' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  historyTitle: { color: '#333', fontSize: 16, fontWeight: '600' },
  historyCount: { color: '#888', fontSize: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { color: '#333', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#666', fontSize: 13, marginBottom: 16 },
  input: {
    backgroundColor: '#f5f5f5', color: '#333', borderRadius: 10,
    padding: 12, fontSize: 15, marginBottom: 12,
    borderWidth: 2, borderColor: '#ff9800',
  },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickBtn: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 2, borderColor: '#ff9800' },
  quickBtnText: { color: '#333', fontSize: 12, fontWeight: '600' },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  methodBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#f5f5f5', borderWidth: 2, borderColor: '#ff9800' },
  methodBtnActive: { backgroundColor: '#ff9800', borderColor: '#ff9800' },
  methodText: { color: '#666', fontWeight: '600', fontSize: 12 },
  methodTextActive: { color: '#fff' },
  confirmBtn: {
    backgroundColor: '#ff9800', borderRadius: 10, padding: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { color: '#888', fontSize: 14, fontWeight: '500' },
});
