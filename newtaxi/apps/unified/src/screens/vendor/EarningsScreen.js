import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Dimensions 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../hooks/useVendorWallet';
import { useTransactions } from '../../hooks/useVendorTransactions';
import TransactionRow from '../../components/TransactionRow';

const { width: screenWidth } = Dimensions.get('window');

export default function VendorEarningsScreen() {
  const { user } = useAuth();
  const { wallet, loading: walletLoading, refetch: refetchWallet } = useWallet(user?.id);
  const { transactions, loading: txLoading, refetch: refetchTx } = useTransactions(user?.id);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useFocusEffect(useCallback(() => {
    refetchWallet();
    refetchTx();
  }, [refetchWallet, refetchTx]));

  // Calculate earnings
  const commissions = transactions.filter(t => t.type === 'commission').reduce((s,t) => s + Number(t.amount), 0);
  const totalEarned = transactions.filter(t => ['credit','commission','refund'].includes(t.type)).reduce((s,t) => s + Number(t.amount), 0);
  const totalWithdrawn = transactions.filter(t => ['debit','withdrawal'].includes(t.type)).reduce((s,t) => s + Number(t.amount), 0);
  const completedTrips = transactions.filter(t => t.type === 'commission').length;

  const periods = [
    { key: 'all', label: 'All Time' },
    { key: 'month', label: 'This Month' },
    { key: 'week', label: 'This Week' },
  ];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={walletLoading || txLoading}
          onRefresh={() => { refetchWallet(); refetchTx(); }}
          tintColor="#1a1a2e" colors={['#1a1a2e']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earnings & Reports</Text>
        <Text style={styles.subtitle}>Track your business performance</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[styles.periodBtn, selectedPeriod === period.key && styles.periodBtnActive]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text style={[styles.periodText, selectedPeriod === period.key && styles.periodTextActive]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="wallet-outline" size={24} color="#4caf50" />
          </View>
          <Text style={styles.statValue}>₹{wallet?.balance?.toFixed(2) ?? '0.00'}</Text>
          <Text style={styles.statLabel}>Current Balance</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trending-up-outline" size={24} color="#2196f3" />
          </View>
          <Text style={styles.statValue}>₹{commissions.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Commission</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="car-outline" size={24} color="#ff9800" />
          </View>
          <Text style={styles.statValue}>{completedTrips}</Text>
          <Text style={styles.statLabel}>Completed Trips</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="arrow-up-circle-outline" size={24} color="#9c27b0" />
          </View>
          <Text style={styles.statValue}>₹{totalWithdrawn.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Withdrawn</Text>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Earnings Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Earned</Text>
          <Text style={styles.summaryValue}>₹{totalEarned.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Withdrawn</Text>
          <Text style={[styles.summaryValue, { color: '#ff9800' }]}>₹{totalWithdrawn.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowTotal]}>
          <Text style={styles.summaryLabelTotal}>Available Balance</Text>
          <Text style={styles.summaryValueTotal}>₹{wallet?.balance?.toFixed(2) ?? '0.00'}</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.sectionCount}>{transactions.length} records</Text>
        </View>
        
        <View style={styles.transactionsList}>
          {transactions.slice(0, 10).map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </View>
        
        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#555" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Start accepting trips to see your earnings</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  header: {
    backgroundColor: '#16213e',
    padding: screenWidth * 0.05,
    paddingTop: 60,
    marginBottom: 16,
  },
  title: { 
    color: '#fff', 
    fontSize: Math.max(24, screenWidth * 0.06), 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  subtitle: { 
    color: '#888', 
    fontSize: Math.max(14, screenWidth * 0.035) 
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: screenWidth * 0.04,
    marginBottom: 20,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodBtnActive: { backgroundColor: '#1a1a2e' },
  periodText: { 
    color: '#888', 
    fontSize: Math.max(13, screenWidth * 0.035), 
    fontWeight: '600' 
  },
  periodTextActive: { color: '#fff' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: screenWidth * 0.04,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    width: (screenWidth - screenWidth * 0.08 - 12) / 2, // Two cards per row with gap
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: { 
    color: '#fff', 
    fontSize: Math.max(18, screenWidth * 0.045), 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  statLabel: { 
    color: '#888', 
    fontSize: Math.max(12, screenWidth * 0.03), 
    textAlign: 'center' 
  },
  summaryCard: {
    backgroundColor: '#16213e',
    marginHorizontal: screenWidth * 0.04,
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  summaryTitle: { 
    color: '#fff', 
    fontSize: Math.max(16, screenWidth * 0.04), 
    fontWeight: '600', 
    marginBottom: 16 
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryRowTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    marginTop: 8,
  },
  summaryLabel: { 
    color: '#888', 
    fontSize: Math.max(14, screenWidth * 0.035) 
  },
  summaryLabelTotal: { 
    color: '#fff', 
    fontSize: Math.max(14, screenWidth * 0.035), 
    fontWeight: '600' 
  },
  summaryValue: { 
    color: '#4caf50', 
    fontSize: Math.max(14, screenWidth * 0.035), 
    fontWeight: '600' 
  },
  summaryValueTotal: { 
    color: '#4caf50', 
    fontSize: Math.max(18, screenWidth * 0.045), 
    fontWeight: 'bold' 
  },
  transactionsSection: {
    marginHorizontal: screenWidth * 0.04,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { 
    color: '#fff', 
    fontSize: Math.max(16, screenWidth * 0.04), 
    fontWeight: '600' 
  },
  sectionCount: { 
    color: '#aaa', 
    fontSize: Math.max(12, screenWidth * 0.032) 
  },
  transactionsList: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: { 
    color: '#888', 
    fontSize: Math.max(16, screenWidth * 0.04), 
    marginTop: 12, 
    textAlign: 'center' 
  },
  emptySubtext: { 
    color: '#aaa', 
    fontSize: Math.max(13, screenWidth * 0.035), 
    marginTop: 4, 
    textAlign: 'center' 
  },
});
