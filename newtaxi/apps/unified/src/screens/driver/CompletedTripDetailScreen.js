import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CompletedTripDetailScreen({ route, navigation }) {
  const { trip } = route.params;

  const fareAmount = trip.fare_amount || 0;
  const commissionAmount = trip.commission_amount || 0;
  const customerPreAdvance = trip.customer_pre_advance || 0;
  const driverEarning = fareAmount - commissionAmount;
  const collectedFromPassenger = fareAmount - customerPreAdvance;
  const collectedFromCreator = fareAmount - customerPreAdvance - commissionAmount;

  function handleCallPassenger() {
    if (!trip.passenger_phone) {
      Alert.alert('No Contact', 'Passenger phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${trip.passenger_phone}`);
  }

  function DetailRow({ label, value, color = '#fff' }) {
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, { color }]}>{value}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
            <Text style={styles.statusText}>Completed</Text>
          </View>
        </View>

        {/* Trip Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="location" size={16} color="#4caf50" />
            <Text style={styles.summaryLocation} numberOfLines={2}>{trip.pickup_location}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Ionicons name="flag" size={16} color="#1a1a2e" />
            <Text style={styles.summaryLocation} numberOfLines={2}>{trip.dropoff_location}</Text>
          </View>
        </View>

        {/* Fare Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fare Breakdown</Text>
          <DetailRow label="Total Fare" value={`₹${fareAmount.toFixed(2)}`} />
          {commissionAmount > 0 && (
            <DetailRow label="Commission:" value={`-₹${commissionAmount.toFixed(2)}`} color="#ff6b6b" />
          )}
          {customerPreAdvance > 0 && (
            <DetailRow label="Customer Pre-Advance" value={`₹${customerPreAdvance.toFixed(2)}`} color="#2196f3" />
          )}
          <View style={styles.divider} />
          <DetailRow label="Total Driver Earnings" value={`₹${driverEarning.toFixed(2)}`} color="#4caf50" />
        </View>

        {/* Trip Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Information</Text>
          <DetailRow 
            label="Trip Date" 
            value={trip.created_at ? new Date(trip.created_at).toLocaleString() : 'N/A'} 
          />
          {trip.completed_at && (
            <DetailRow 
              label="Completed At" 
              value={new Date(trip.completed_at).toLocaleString()} 
            />
          )}
          {trip.start_km && trip.end_km && (
            <DetailRow 
              label="Distance Covered" 
              value={`${(trip.end_km - trip.start_km).toFixed(2)} km`} 
            />
          )}
        </View>

        {/* Odometer Details */}
        {(trip.start_km || trip.end_km) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Odometer Reading</Text>
            {trip.start_km && <DetailRow label="Start KM" value={`${trip.start_km.toFixed(2)} km`} />}
            {trip.end_km && <DetailRow label="End KM" value={`${trip.end_km.toFixed(2)} km`} />}
            {trip.start_km && trip.end_km && (
              <DetailRow 
                label="Total Distance" 
                value={`${(trip.end_km - trip.start_km).toFixed(2)} km`} 
                color="#2196f3"
              />
            )}
          </View>
        )}

      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Back to History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 16, paddingBottom: 100 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0a2a0a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { color: '#4caf50', fontSize: 12, fontWeight: '600' },

  summaryCard: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryLocation: { color: '#fff', fontSize: 14, flex: 1, lineHeight: 20 },
  summaryDivider: { height: 1, backgroundColor: '#0f3460', marginVertical: 12 },

  section: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  detailLabel: { color: '#888', fontSize: 13 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#0f3460', marginVertical: 8 },

  phoneButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4caf50', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  phoneButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  footer: { padding: 16, paddingBottom: 32, backgroundColor: '#1a1a2e', borderTopWidth: 1, borderTopColor: '#16213e' },
  backBtn: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center' },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
