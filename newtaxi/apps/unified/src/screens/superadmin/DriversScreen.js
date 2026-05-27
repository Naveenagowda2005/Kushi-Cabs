import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

export default function SuperAdminDriversScreen({ navigation }) {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { fetchDrivers(); }, []);
  useEffect(() => { filterDrivers(); }, [searchQuery, drivers]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users').select('*').eq('role_id', 3).order('created_at', { ascending: false });
      if (error) throw error;

      const driversWithDetails = await Promise.all(
        (data || []).map(async (user) => {
          const { data: driverProfile } = await supabase.from('drivers').select('license_number, vehicle_number, is_available').eq('user_id', user.id).single();
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
          return { ...user, drivers: driverProfile ? [driverProfile] : [], wallets: wallet ? [wallet] : [] };
        })
      );
      setDrivers(driversWithDetails);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const filterDrivers = () => {
    if (!searchQuery.trim()) { setFilteredDrivers(drivers); return; }
    setFilteredDrivers(drivers.filter(d =>
      d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone?.includes(searchQuery) ||
      d.drivers?.[0]?.license_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.drivers?.[0]?.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  };

  const toggleDriverStatus = async (driverId, currentStatus) => {
    const action = currentStatus ? 'block' : 'activate';
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} Driver`, `Are you sure you want to ${action} this driver?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action.charAt(0).toUpperCase() + action.slice(1), style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('users').update({ is_active: !currentStatus }).eq('id', driverId);
            if (error) throw error;
            Alert.alert('Success', `Driver ${action}d successfully`);
            fetchDrivers();
          } catch (error) { Alert.alert('Error', `Failed to ${action} driver`); }
        },
      },
    ]);
  };

  const deleteDriver = async (driverId) => {
    Alert.alert('Delete Driver', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            // Get drivers table row id (FK target for trips.driver_id)
            const { data: driverRow } = await supabase
              .from('drivers').select('id').eq('user_id', driverId).maybeSingle();

            // Null out all trip FK references before deleting
            if (driverRow?.id) {
              await supabase.from('trips').update({ driver_id: null }).eq('driver_id', driverRow.id);
            }
            await supabase.from('trips').update({ accepted_by: null }).eq('accepted_by', driverId);
            await supabase.from('trips').update({ created_by: null }).eq('created_by', driverId);

            // Delete wallet transactions then wallet
            const { data: wallet } = await supabase.from('wallets').select('id').eq('user_id', driverId).maybeSingle();
            if (wallet?.id) await supabase.from('transactions').delete().eq('wallet_id', wallet.id);
            await supabase.from('wallets').delete().eq('user_id', driverId);

            // Delete documents, driver profile, then user
            await supabase.from('documents').delete().eq('user_id', driverId);
            await supabase.from('drivers').delete().eq('user_id', driverId);

            const { error } = await supabase.from('users').delete().eq('id', driverId);
            if (error) throw error;

            Alert.alert('Success', 'Driver deleted successfully');
            fetchDrivers();
          } catch (error) {
            console.error('Delete driver error:', error);
            Alert.alert('Error', error.message || 'Failed to delete driver');
          }
        },
      },
    ]);
  };

  const DriverCard = ({ driver }) => (
    <TouchableOpacity style={styles.card} onPress={() => { setSelectedDriver(driver); setModalVisible(true); }}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{driver.full_name || 'No Name'}</Text>
          <Text style={styles.cardSub}>{driver.phone || 'No Phone'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (driver.is_active ? COLORS.success : COLORS.error) + '20' }]}>
          <Text style={[styles.statusText, { color: driver.is_active ? COLORS.success : COLORS.error }]}>
            {driver.is_active ? 'Active' : 'Blocked'}
          </Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.detailItem}><Ionicons name="card-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.detailText}>{driver.drivers?.[0]?.license_number || 'No License'}</Text></View>
        <View style={styles.detailItem}><Ionicons name="car-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.detailText}>{driver.drivers?.[0]?.vehicle_number || 'No Vehicle'}</Text></View>
        <View style={styles.detailItem}><Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.detailText}>₹{driver.wallets?.[0]?.balance || 0}</Text></View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: (driver.is_active ? COLORS.error : COLORS.success) + '20' }]} onPress={() => toggleDriverStatus(driver.id, driver.is_active)}>
          <Ionicons name={driver.is_active ? 'ban-outline' : 'checkmark-circle-outline'} size={16} color={driver.is_active ? COLORS.error : COLORS.success} />
          <Text style={[styles.actionButtonText, { color: driver.is_active ? COLORS.error : COLORS.success }]}>{driver.is_active ? 'Block' : 'Activate'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.error + '20' }]} onPress={() => deleteDriver(driver.id)}>
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
          <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Drivers Management</Text>
        <TouchableOpacity onPress={fetchDrivers}><Ionicons name="refresh-outline" size={24} color={COLORS.superAdmin.primary} /></TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search drivers..." placeholderTextColor={COLORS.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}><Text style={styles.statValue}>{drivers.length}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{drivers.filter(d => d.is_active).length}</Text><Text style={styles.statLabel}>Active</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{drivers.filter(d => !d.is_active).length}</Text><Text style={styles.statLabel}>Blocked</Text></View>
        <View style={styles.statItem}><Text style={styles.statValue}>{drivers.filter(d => d.drivers?.[0]?.is_available).length}</Text><Text style={styles.statLabel}>Available</Text></View>
      </View>

      <FlatList
        data={filteredDrivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DriverCard driver={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDrivers} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading && <View style={styles.emptyContainer}><Ionicons name="people-outline" size={64} color={COLORS.textSecondary} /><Text style={styles.emptyText}>No drivers found</Text></View>}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Driver Details</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>
          {selectedDriver && (
            <View style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Personal Information</Text>
                <Text style={styles.modalText}>Name: {selectedDriver.full_name || 'N/A'}</Text>
                <Text style={styles.modalText}>Phone: {selectedDriver.phone || 'N/A'}</Text>
                <Text style={styles.modalText}>Status: <Text style={{ color: selectedDriver.is_active ? COLORS.success : COLORS.error }}>{selectedDriver.is_active ? 'Active' : 'Blocked'}</Text></Text>
                <Text style={styles.modalText}>Joined: {new Date(selectedDriver.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Driver Information</Text>
                <Text style={styles.modalText}>License: {selectedDriver.drivers?.[0]?.license_number || 'N/A'}</Text>
                <Text style={styles.modalText}>Vehicle: {selectedDriver.drivers?.[0]?.vehicle_number || 'N/A'}</Text>
                <Text style={styles.modalText}>Available: {selectedDriver.drivers?.[0]?.is_available ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Wallet</Text>
                <Text style={styles.modalText}>Balance: ₹{selectedDriver.wallets?.[0]?.balance || 0}</Text>
              </View>
            </View>
          )}
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
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.surface, marginHorizontal: getResponsivePadding(24), borderRadius: 12, paddingVertical: 16, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: getResponsiveFontSize(22), fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: getResponsiveFontSize(11), color: COLORS.textSecondary, marginTop: 4 },
  listContainer: { paddingHorizontal: getResponsivePadding(24), paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  cardSub: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: getResponsiveFontSize(12), fontWeight: '500' },
  cardDetails: { marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginLeft: 8 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flex: 0.48, justifyContent: 'center' },
  actionButtonText: { fontSize: getResponsiveFontSize(12), fontWeight: '500', marginLeft: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: getResponsiveFontSize(18), fontWeight: '600', color: COLORS.textSecondary, marginTop: 16 },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: getResponsivePadding(24), paddingTop: hp(6), borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: getResponsiveFontSize(20), fontWeight: 'bold', color: COLORS.text },
  modalContent: { flex: 1, padding: getResponsivePadding(24) },
  modalSection: { marginBottom: 24 },
  modalSectionTitle: { fontSize: getResponsiveFontSize(16), fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  modalText: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginBottom: 8 },
});
