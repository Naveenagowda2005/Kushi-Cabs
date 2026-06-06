import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useVendorProfile } from '../../hooks/useVendorProfile';
import { supabase } from '../../lib/supabase';
import { TRIP_STATUS } from '../../constants';
import TripStatusBadge from '../../components/TripStatusBadge';

export default function VendorEnquiryDetailScreen({ route, navigation }) {
  const { trip, readOnly = false } = route.params;
  const { user } = useAuth();
  const { vendor } = useVendorProfile(user?.id);
  const [accepting, setAccepting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Check if current user is the trip creator or super admin
  const isCreator = trip.created_by === user?.id;
  const isSuperAdmin = user?.role === 'super_admin';

  async function handleAccept() {
    Alert.alert(
      'Accept Enquiry',
      `Pickup: ${trip.pickup_location}\nDrop: ${trip.dropoff_location}\nFare: ₹${trip.fare_amount}\n\nAccept this trip?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAccepting(true);
            try {
              // Direct database update - no time window check
              const { error } = await supabase
                .from('trips')
                .update({
                  status: TRIP_STATUS.ACCEPTED,
                  accepted_by: user.id,
                  vendor_id: vendor.id,
                  accepted_at: new Date().toISOString(),
                })
                .eq('id', trip.id);

              if (error) throw error;

              Alert.alert('Success', 'Trip accepted successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Could Not Accept', err.message);
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
  }

  async function handleCancel() {
    Alert.alert(
      'Cancel Trip',
      'This will release the trip back to the pool so other vendors/drivers can accept it. Continue?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Release Trip', style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const { error } = await supabase
                .from('trips')
                .update({
                  status:      TRIP_STATUS.PENDING,
                  accepted_by: null,
                  vendor_id:   null,
                  driver_id:   null,
                  accepted_at: null,
                  is_published: false,
                })
                .eq('id', trip.id);

              if (error) throw error;
              Alert.alert('Released', 'Trip has been released back to the pool.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }

  function InfoRow({ icon, label, value }) {
    return (
      <View style={styles.infoRow}>
        <Ionicons name={icon} size={20} color="#1a1a2e" style={styles.infoIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value || '—'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status + fare */}
        <View style={styles.header}>
          <TripStatusBadge status={trip.status} />
          <Text style={styles.fare}>₹{trip.fare_amount}</Text>
        </View>

        {/* Trip details */}
        <View style={styles.section}>
          <InfoRow icon="location"             label="Pickup"       value={trip.pickup_location} />
          <InfoRow icon="flag"                 label="Drop-off"     value={trip.dropoff_location} />
          {trip.passenger_name && (
            <InfoRow icon="person-outline"     label="Passenger"    value={trip.passenger_name} />
          )}
          {trip.passenger_phone && (
            <InfoRow icon="call-outline"       label="Phone"        value={trip.passenger_phone} />
          )}
          <InfoRow icon="time-outline"         label="Scheduled"    value={
            trip.scheduled_at ? new Date(trip.scheduled_at).toLocaleString() : 'ASAP'
          } />
          <InfoRow icon="calendar-outline"     label="Created"      value={
            new Date(trip.created_at).toLocaleString()
          } />
          {trip.accepted_at && (
            <InfoRow icon="checkmark-circle-outline" label="Accepted at" value={
              new Date(trip.accepted_at).toLocaleString()
            } />
          )}
        </View>

        {/* No vendor window info needed anymore */}
      </ScrollView>

      {/* Accept button — only for pending trips */}
      {!readOnly && trip.status === 'pending' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.acceptBtn, accepting && styles.btnDisabled]}
            onPress={handleAccept}
            disabled={accepting}
          >
            {accepting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.acceptBtnText}>Accept Enquiry</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Delete button — for pending trips the vendor created (readOnly = My Trips view) */}
      {readOnly && trip.status === 'pending' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.deleteBtn, cancelling && styles.btnDisabled]}
            onPress={async () => {
              Alert.alert('Delete Trip', 'Permanently delete this pending trip?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete', style: 'destructive',
                  onPress: async () => {
                    setCancelling(true);
                    try {
                      // Clear related transactions first (FK constraint)
                      await supabase.from('transactions').delete().eq('trip_id', trip.id);
                      const { error } = await supabase
                        .from('trips').delete()
                        .eq('id', trip.id)
                        .eq('status', 'pending');
                      if (error) throw error;
                      Alert.alert('Deleted', 'Trip deleted successfully.', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                      ]);
                    } catch (err) {
                      Alert.alert('Error', err.message);
                    } finally {
                      setCancelling(false);
                    }
                  },
                },
              ]);
            }}
            disabled={cancelling}
          >
            {cancelling
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.deleteBtnText}>Delete Trip</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Cancel/Release button — for accepted trips the vendor owns */}
      {readOnly && (trip.status === 'accepted' || trip.status === 'in_progress') && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && styles.btnDisabled]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.cancelBtnText}>Release Trip Back to Pool</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  scroll: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fare: { color: '#1a1a2e', fontSize: 32, fontWeight: 'bold' },
  section: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { marginRight: 12, marginTop: 2 },
  infoLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
  infoValue: { color: '#fff', fontSize: 15 },
  footer: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: '#0f3460',
    borderTopWidth: 1,
    borderTopColor: '#16213e',
  },
  acceptBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  acceptBtnDisabled: { opacity: 0.6 },
  acceptBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cancelBtn: {
    borderWidth: 2,
    borderColor: '#f44336',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#f44336', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: '#f44336',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
});
