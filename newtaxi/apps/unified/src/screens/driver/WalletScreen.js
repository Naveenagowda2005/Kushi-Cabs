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
import TransactionRow from '../../components/TransactionRow';
import { MIN_WALLET_BALANCE, PAYMENT_GATEWAYS } from '../../constants';
import { initiateDeposit } from '../../services/paymentService';

export default function DriverWalletScreen() {
  const { user } = useAuth();
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet(user?.id);
  const { transactions, loading: txLoading, refetch: refetchTx } = useTransactions(user?.id);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const isLow = wallet && wallet.balance < MIN_WALLET_BALANCE;

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
            <Text style={styles.warningText}>Minimum balance required: ₹500</Text>
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
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  balanceCard: {
    backgroundColor: '#16213e', margin: 16, marginTop: 60, borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: '#0f3460',
  },
  balanceCardLow: { borderColor: '#ff9800' },
  balanceLabel: { color: '#888', fontSize: 14, marginBottom: 6 },
  balanceAmount: { color: '#fff', fontSize: 42, fontWeight: 'bold' },
  balanceAmountLow: { color: '#ff9800' },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  warningText: { color: '#ff9800', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14,
  },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#1a1a2e' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8,
  },
  historyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historyCount: { color: '#aaa', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#aaa', fontSize: 16, marginTop: 12 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#16213e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 14, marginBottom: 20 },
  input: {
    backgroundColor: '#0f3460', color: '#fff', borderRadius: 12,
    padding: 14, fontSize: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#1a1a2e',
  },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: { flex: 1, backgroundColor: '#0f3460', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a2e' },
  quickBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  methodBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#0f3460', borderWidth: 1, borderColor: '#1a1a2e' },
  methodBtnActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  methodText: { color: '#888', fontWeight: '600' },
  methodTextActive: { color: '#fff' },
  confirmBtn: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { color: '#888', fontSize: 15 },
});
