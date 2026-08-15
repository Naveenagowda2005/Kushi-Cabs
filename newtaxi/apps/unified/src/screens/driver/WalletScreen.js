import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../hooks/useDriverWallet';
import { useTransactions } from '../../hooks/useDriverTransactions';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import TransactionRow from '../../components/TransactionRow';
import PhonePePaymentModal from '../../components/PhonePePaymentModal';

export default function DriverWalletScreen() {
  const { user } = useAuth();
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet(user?.id);
  const { transactions, loading: txLoading, refetch: refetchTx } = useTransactions(user?.id);
  const { settings } = useSystemSettings();
  const [phonepeModalVisible, setPhonepeModalVisible] = useState(false);

  const minWalletBalance = settings.minimumWalletBalance !== undefined && settings.minimumWalletBalance !== null 
    ? settings.minimumWalletBalance 
    : 500;
  const isLow = wallet && wallet.balance < minWalletBalance;

  useFocusEffect(useCallback(() => {
    refetchWallet();
    refetchTx();
  }, [refetchWallet, refetchTx]));

  function handlePaymentSuccess(paymentData) {
    // Payment was successful, refetch wallet
    refetchWallet();
    refetchTx();
    Alert.alert(
      '✅ Payment Successful',
      `₹${paymentData.amount.toFixed(2)} has been added to your wallet!`
    );
  }

  function handlePaymentError(error) {
    Alert.alert('❌ Payment Failed', error || 'Failed to process payment');
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
            onPress={() => setPhonepeModalVisible(true)}
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
      <PhonePePaymentModal
        visible={phonepeModalVisible}
        onClose={() => setPhonepeModalVisible(false)}
        userId={user?.id}
        userType="driver"
        currentBalance={wallet?.balance || 0}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
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
