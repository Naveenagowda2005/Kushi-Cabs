import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator,
  Dimensions, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../hooks/useVendorWallet';
import { useTransactions } from '../../hooks/useVendorTransactions';
import TransactionRow from '../../components/TransactionRow';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VendorWalletScreen() {
  const { user } = useAuth();
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet(user?.id);
  const { transactions, loading: txLoading, refetch: refetchTx } = useTransactions(user?.id);

  useFocusEffect(useCallback(() => {
    refetchWallet();
    refetchTx();
  }, [refetchWallet, refetchTx]));

  const credits = transactions.filter(t => ['credit','commission','refund'].includes(t.type)).reduce((s,t) => s + Number(t.amount), 0);
  const debits  = transactions.filter(t => ['debit','withdrawal'].includes(t.type)).reduce((s,t) => s + Number(t.amount), 0);

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <View style={styles.statsRow}>
          <StatItem icon="trending-up-outline" color="#4caf50" label="Total Earned" value={`₹${credits.toFixed(2)}`} />
          <View style={styles.statDivider} />
          <StatItem icon="arrow-up-circle-outline" color="#ff9800" label="Withdrawn" value={`₹${debits.toFixed(2)}`} />
        </View>
      </View>

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
            tintColor="#e94560" colors={['#e94560']}
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

function StatItem({ icon, color, label, value }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  balanceCard: { 
    backgroundColor: '#16213e', 
    margin: screenWidth * 0.04, 
    borderRadius: 20, 
    padding: screenWidth * 0.06, 
    borderWidth: 1, 
    borderColor: '#1a1a2e' 
  },
  balanceLabel: { 
    color: '#888', 
    fontSize: Math.max(13, screenWidth * 0.035), 
    marginBottom: 6 
  },
  balanceAmount: { 
    color: '#fff', 
    fontSize: Math.max(32, screenWidth * 0.1), 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  statsRow: { 
    flexDirection: 'row', 
    marginTop: 16, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#0f3460', 
    marginBottom: 16 
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: '#0f3460' },
  statValue: { 
    color: '#fff', 
    fontSize: Math.max(14, screenWidth * 0.038), 
    fontWeight: '600' 
  },
  statLabel: { 
    color: '#666', 
    fontSize: Math.max(10, screenWidth * 0.028),
    textAlign: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#e94560', 
    borderRadius: 12, 
    padding: screenWidth * 0.035,
    minHeight: 48, // Ensure touch target is large enough
  },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e94560' },
  actionBtnText: { 
    color: '#fff', 
    fontSize: Math.max(13, screenWidth * 0.035), 
    fontWeight: '600' 
  },
  historyHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: screenWidth * 0.05, 
    paddingTop: 18, 
    paddingBottom: 8 
  },
  historyTitle: { 
    color: '#fff', 
    fontSize: Math.max(15, screenWidth * 0.04), 
    fontWeight: '600' 
  },
  historyCount: { 
    color: '#666', 
    fontSize: Math.max(12, screenWidth * 0.032) 
  },
  list: { paddingBottom: 24 },
  empty: { 
    alignItems: 'center', 
    paddingTop: screenHeight * 0.1,
    paddingHorizontal: screenWidth * 0.1,
  },
  emptyText: { 
    color: '#555', 
    fontSize: Math.max(15, screenWidth * 0.04), 
    marginTop: 12,
    textAlign: 'center',
  },
});

const modal = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end' 
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  sheet: { 
    backgroundColor: '#16213e', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: screenWidth * 0.06,
    paddingBottom: Math.max(40, screenHeight * 0.05), // Safe area consideration
    maxHeight: screenHeight * 0.8, // Prevent modal from being too tall
  },
  handle: { 
    width: 40, 
    height: 4, 
    backgroundColor: '#444', 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginBottom: 20 
  },
  title: { 
    color: '#fff', 
    fontSize: Math.max(20, screenWidth * 0.055), 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  subtitle: { 
    color: '#888', 
    fontSize: Math.max(13, screenWidth * 0.035), 
    marginBottom: 20 
  },
  input: { 
    backgroundColor: '#0f3460', 
    color: '#fff', 
    borderRadius: 12, 
    padding: screenWidth * 0.035,
    fontSize: Math.max(15, screenWidth * 0.04), 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#1a1a2e',
    minHeight: 48, // Ensure touch target is large enough
  },
  quickRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 16,
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  quickBtn: { 
    flex: 1, 
    backgroundColor: '#0f3460', 
    borderRadius: 10, 
    padding: screenWidth * 0.025,
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#1a1a2e',
    minWidth: screenWidth * 0.18, // Minimum width for touch targets
    minHeight: 40,
  },
  quickBtnText: { 
    color: '#fff', 
    fontSize: Math.max(12, screenWidth * 0.032), 
    fontWeight: '600' 
  },
  methodRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 14 
  },
  methodBtn: { 
    flex: 1, 
    padding: screenWidth * 0.03,
    borderRadius: 10, 
    alignItems: 'center', 
    backgroundColor: '#0f3460', 
    borderWidth: 1, 
    borderColor: '#1a1a2e',
    minHeight: 44,
  },
  methodBtnActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  methodText: { 
    color: '#888', 
    fontWeight: '600',
    fontSize: Math.max(13, screenWidth * 0.035),
  },
  methodTextActive: { color: '#fff' },
  confirmBtn: { 
    backgroundColor: '#e94560', 
    borderRadius: 14, 
    padding: 16, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 8, 
    marginBottom: 12,
    minHeight: 52, // Larger touch target for primary action
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { 
    color: '#fff', 
    fontSize: Math.max(16, screenWidth * 0.042), 
    fontWeight: '700' 
  },
  cancelBtn: { 
    alignItems: 'center', 
    padding: 12,
    minHeight: 44, // Ensure touch target is large enough
  },
  cancelBtnText: { 
    color: '#888', 
    fontSize: Math.max(14, screenWidth * 0.038) 
  },
});