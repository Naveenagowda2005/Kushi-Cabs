import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../hooks/useDriverWallet';
import { useTransactions } from '../../hooks/useDriverTransactions';
import TransactionRow from '../../components/TransactionRow';
import { MIN_WALLET_BALANCE } from '../../constants';

export default function DriverWalletScreen() {
  const { user } = useAuth();
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet(user?.id);
  const { transactions, loading: txLoading, refetch: refetchTx } = useTransactions(user?.id);

  const isLow = wallet && wallet.balance < MIN_WALLET_BALANCE;

  useFocusEffect(useCallback(() => {
    refetchWallet();
    refetchTx();
  }, [refetchWallet, refetchTx]));

  function onPaymentSuccess() {
    refetchWallet();
    refetchTx();
  }

  return (
    <View style={styles.container}>
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
            tintColor="#1a1a2e" colors={['#1a1a2e']}
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

    </View>
  );
}

// ── Deposit Modal ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  balanceCard: {
    backgroundColor: '#16213e', margin: 16, borderRadius: 20,
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
  historyCount: { color: '#666', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#555', fontSize: 16, marginTop: 12 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
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
