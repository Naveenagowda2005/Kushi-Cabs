import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

export default function SuperAdminWalletsScreen({ navigation }) {
  const { forceUpdate } = useTheme();
  
  // Force re-render when theme changes
  const [themeRefresh, setThemeRefresh] = useState(0);
  useEffect(() => {
    setThemeRefresh(prev => prev + 1);
  }, [forceUpdate]);
  
  const [wallets, setWallets] = useState([]);
  const [filteredWallets, setFilteredWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustment, setAdjustment] = useState({ amount: '', type: 'credit', reason: '' });

  useEffect(() => { fetchWallets(); }, []);
  useEffect(() => { filterWallets(); }, [searchQuery, wallets]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallets')
        .select('*, users ( full_name, email, phone, roles (name) )')
        .order('balance', { ascending: false });
      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      Alert.alert('Error', 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (walletId) => {
    try {
      const { data, error } = await supabase
        .from('transactions').select('*').eq('wallet_id', walletId)
        .order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load transactions');
    }
  };

  const filterWallets = () => {
    if (!searchQuery.trim()) { setFilteredWallets(wallets); return; }
    setFilteredWallets(wallets.filter(w =>
      w.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.users?.phone?.includes(searchQuery)
    ));
  };

  const adjustWalletBalance = async () => {
    if (!adjustment.amount || !adjustment.reason.trim()) { Alert.alert('Error', 'Please fill in all fields'); return; }
    const amount = parseFloat(adjustment.amount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }

    try {
      const adjustmentAmount = adjustment.type === 'credit' ? amount : -amount;
      const { error: walletError } = await supabase.from('wallets')
        .update({ balance: selectedWallet.balance + adjustmentAmount, updated_at: new Date().toISOString() })
        .eq('id', selectedWallet.id);
      if (walletError) throw walletError;

      const { error: txError } = await supabase.from('transactions').insert({
        wallet_id: selectedWallet.id, amount: adjustmentAmount,
        type: adjustment.type, description: `Admin adjustment: ${adjustment.reason}`,
      });
      if (txError) throw txError;

      Alert.alert('Success', `Wallet ${adjustment.type}ed successfully`);
      setAdjustModalVisible(false);
      setAdjustment({ amount: '', type: 'credit', reason: '' });
      fetchWallets();
      fetchTransactions(selectedWallet.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to adjust wallet balance');
    }
  };

  const viewWalletDetails = async (wallet) => {
    setSelectedWallet(wallet);
    await fetchTransactions(wallet.id);
    setModalVisible(true);
  };

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case 'driver': return COLORS.info;
      case 'vendor': return COLORS.warning;
      default: return COLORS.superAdmin.primary;
    }
  };

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const driverWallets = wallets.filter(w => w.users?.roles?.name === 'driver');
  const vendorWallets = wallets.filter(w => w.users?.roles?.name === 'vendor');

  const WalletCard = ({ wallet }) => (
    <TouchableOpacity style={styles.card} onPress={() => viewWalletDetails(wallet)}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{wallet.users?.full_name || 'No Name'}</Text>
          <Text style={styles.cardSub}>{wallet.users?.phone || 'No Phone'}</Text>
        </View>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceAmount}>₹{wallet.balance.toLocaleString()}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(wallet.users?.roles?.name) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(wallet.users?.roles?.name) }]}>
              {wallet.users?.roles?.name?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.detailText}>Updated: {new Date(wallet.updated_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet Monitor</Text>
        <TouchableOpacity onPress={fetchWallets}><Ionicons name="refresh-outline" size={24} color={COLORS.superAdmin.primary} /></TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search wallets..." placeholderTextColor={COLORS.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}><Text style={styles.statValue}>₹{totalBalance.toLocaleString()}</Text><Text style={styles.statLabel}>Total Balance</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{driverWallets.length}</Text><Text style={styles.statLabel}>Driver Wallets</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{vendorWallets.length}</Text><Text style={styles.statLabel}>Vendor Wallets</Text></View>
      </View>

      <FlatList
        data={filteredWallets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WalletCard wallet={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWallets} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading && <View style={styles.emptyContainer}><Ionicons name="wallet-outline" size={64} color={COLORS.textSecondary} /><Text style={styles.emptyText}>No wallets found</Text></View>}
      />

      {/* Wallet Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Wallet Details</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={{ marginRight: 16 }} onPress={() => setAdjustModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={24} color={COLORS.superAdmin.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
          </View>
          {selectedWallet && (
            <View style={styles.modalContent}>
              <View style={styles.walletSummary}>
                <Text style={styles.walletOwner}>{selectedWallet.users?.full_name}</Text>
                <Text style={styles.walletBalance}>₹{selectedWallet.balance.toLocaleString()}</Text>
                <Text style={styles.walletRole}>{selectedWallet.users?.roles?.name?.toUpperCase()}</Text>
              </View>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.txItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txDesc}>{item.description || 'No description'}</Text>
                      <Text style={styles.txDate}>{new Date(item.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: item.type === 'credit' ? COLORS.success : COLORS.error }]}>
                      {item.type === 'credit' ? '+' : '-'}₹{Math.abs(item.amount)}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet</Text>}
              />
            </View>
          )}
        </View>
      </Modal>

      {/* Adjust Modal */}
      <Modal visible={adjustModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAdjustModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adjust Wallet Balance</Text>
            <TouchableOpacity onPress={() => setAdjustModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', marginBottom: 24 }}>
              {['credit', 'debit'].map(type => (
                <TouchableOpacity key={type} style={[styles.typeButton, adjustment.type === type && styles.typeButtonActive]} onPress={() => setAdjustment(p => ({ ...p, type }))}>
                  <Ionicons name={type === 'credit' ? 'add-circle-outline' : 'remove-circle-outline'} size={20} color={adjustment.type === type ? COLORS.textLight : (type === 'credit' ? COLORS.success : COLORS.error)} />
                  <Text style={[styles.typeButtonText, adjustment.type === type && { color: COLORS.textLight }]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={COLORS.textSecondary} value={adjustment.amount} onChangeText={t => setAdjustment(p => ({ ...p, amount: t }))} keyboardType="numeric" />
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Reason for adjustment" placeholderTextColor={COLORS.textSecondary} value={adjustment.reason} onChangeText={t => setAdjustment(p => ({ ...p, reason: t }))} multiline />
            <TouchableOpacity style={styles.submitButton} onPress={adjustWalletBalance}>
              <Text style={styles.submitButtonText}>{adjustment.type === 'credit' ? 'Credit' : 'Debit'} Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: getResponsivePadding(24), paddingTop: hp(6), backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, marginHorizontal: getResponsivePadding(24), marginVertical: 16, paddingHorizontal: 16 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: getResponsiveFontSize(16), color: COLORS.text, paddingVertical: 16 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: getResponsivePadding(24), marginBottom: 16 },
  statCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, flex: 0.32, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: getResponsiveFontSize(15), fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  statLabel: { fontSize: getResponsiveFontSize(10), color: COLORS.textSecondary, textAlign: 'center' },
  listContainer: { paddingHorizontal: getResponsivePadding(24), paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  cardSub: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary },
  balanceInfo: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: getResponsiveFontSize(18), fontWeight: 'bold', color: COLORS.superAdmin.primary, marginBottom: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  roleText: { fontSize: getResponsiveFontSize(10), fontWeight: '500' },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary, marginLeft: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: getResponsivePadding(24), paddingTop: hp(6), borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.text },
  modalContent: { flex: 1, padding: getResponsivePadding(24) },
  walletSummary: { alignItems: 'center', paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 24 },
  walletOwner: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  walletBalance: { fontSize: getResponsiveFontSize(32), fontWeight: 'bold', color: COLORS.superAdmin.primary, marginBottom: 8 },
  walletRole: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary },
  sectionTitle: { fontSize: getResponsiveFontSize(18), fontWeight: '600', color: COLORS.text, marginBottom: 16 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  txDesc: { fontSize: getResponsiveFontSize(14), color: COLORS.text, marginBottom: 4 },
  txDate: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary },
  txAmount: { fontSize: getResponsiveFontSize(16), fontWeight: 'bold' },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  typeButtonActive: { backgroundColor: COLORS.superAdmin.primary, borderColor: COLORS.superAdmin.primary },
  typeButtonText: { fontSize: getResponsiveFontSize(15), color: COLORS.textSecondary, fontWeight: '500', marginLeft: 8 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, fontSize: getResponsiveFontSize(16), color: COLORS.text, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  submitButton: { backgroundColor: COLORS.superAdmin.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  submitButtonText: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.textLight },
});
