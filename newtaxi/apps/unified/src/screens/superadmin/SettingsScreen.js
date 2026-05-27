import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';
import { useAppSettings } from '../../hooks/useAppSettings';

export default function SuperAdminSettingsScreen() {
  const { settings, loading, save } = useAppSettings();
  const [vendorMins, setVendorMins] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setVendorMins(String(settings.vendor_window_minutes));
    }
  }, [settings]);

  async function handleSave() {
    const v = parseInt(vendorMins);

    if (!v || v < 1 || v > 1440) {
      Alert.alert('Invalid', 'Vendor window must be between 1 and 1440 minutes.');
      return;
    }

    setSaving(true);
    try {
      await save({ vendor_window_minutes: v });
      Alert.alert('✅ Saved', `Vendor window updated to ${v} minutes.\nDrivers see trips indefinitely after that.`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.superAdmin.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>App Settings</Text>
        <Text style={styles.subtitle}>Configure trip visibility windows</Text>
      </View>

      {/* Vendor Window */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.warning + '20' }]}>
            <Ionicons name="business-outline" size={24} color={COLORS.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Vendor Visibility Window</Text>
            <Text style={styles.cardDesc}>
              How long a new trip is visible ONLY to vendors before drivers can see it.
              After this time, drivers can see the trip with no expiry.
            </Text>
          </View>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={vendorMins}
            onChangeText={setVendorMins}
            keyboardType="number-pad"
            maxLength={4}
          />
          <Text style={styles.inputUnit}>minutes</Text>
        </View>

        <View style={styles.presetRow}>
          {[5, 10, 15, 30, 60].map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.preset, vendorMins === String(m) && styles.presetActive]}
              onPress={() => setVendorMins(String(m))}
            >
              <Text style={[styles.presetText, vendorMins === String(m) && styles.presetTextActive]}>
                {m}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.warning} />
          <Text style={styles.infoText}>
            Currently: <Text style={styles.infoValue}>{settings.vendor_window_minutes} minutes</Text>
          </Text>
        </View>
      </View>

      {/* Driver info card */}
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: COLORS.info }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.info + '20' }]}>
            <Ionicons name="car-outline" size={24} color={COLORS.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Driver Visibility</Text>
            <Text style={styles.cardDesc}>
              Drivers can see trips <Text style={{ color: COLORS.info, fontWeight: '700' }}>indefinitely</Text> after the vendor window expires — no time limit.
            </Text>
          </View>
        </View>
        <View style={styles.infoBox}>
          <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.info} />
          <Text style={styles.infoText}>Unlimited — trips stay visible until a driver accepts</Text>
        </View>
      </View>

      {/* Timeline preview */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Trip Visibility Timeline</Text>
        <View style={styles.timeline}>
          <View style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Trip Created</Text>
              <Text style={styles.timelineTime}>0:00</Text>
            </View>
          </View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: COLORS.warning }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Vendors only can see it</Text>
              <Text style={styles.timelineTime}>0:00 → {vendorMins || '?'} min</Text>
            </View>
          </View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: COLORS.info }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Drivers can see it</Text>
              <Text style={[styles.timelineTime, { color: COLORS.info }]}>After {vendorMins || '?'} min — unlimited ∞</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Settings</Text>
            </>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: getResponsivePadding(20), paddingTop: hp(6), paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 24 },
  title: { fontSize: getResponsiveFontSize(26), fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginTop: 4 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: getResponsiveFontSize(16), fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardDesc: { fontSize: getResponsiveFontSize(13), color: COLORS.textSecondary, lineHeight: 18 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  input: {
    backgroundColor: COLORS.background, borderRadius: 12, padding: 14,
    fontSize: getResponsiveFontSize(24), fontWeight: 'bold', color: COLORS.text,
    borderWidth: 2, borderColor: COLORS.superAdmin.primary, width: 100, textAlign: 'center',
  },
  inputUnit: { fontSize: getResponsiveFontSize(16), color: COLORS.textSecondary, fontWeight: '500' },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  preset: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  presetActive: { backgroundColor: COLORS.superAdmin.primary, borderColor: COLORS.superAdmin.primary },
  presetText: { fontSize: getResponsiveFontSize(13), color: COLORS.textSecondary, fontWeight: '600' },
  presetTextActive: { color: '#fff' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.background, borderRadius: 8, padding: 10 },
  infoText: { fontSize: getResponsiveFontSize(13), color: COLORS.textSecondary },
  infoValue: { fontWeight: '700', color: COLORS.text },
  timelineCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 24, elevation: 2 },
  timelineTitle: { fontSize: getResponsiveFontSize(16), fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  timeline: { gap: 0 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  timelineDot: { width: 14, height: 14, borderRadius: 7 },
  timelineContent: { flex: 1, paddingVertical: 8 },
  timelineLabel: { fontSize: getResponsiveFontSize(14), fontWeight: '600', color: COLORS.text },
  timelineTime: { fontSize: getResponsiveFontSize(12), color: COLORS.textSecondary, marginTop: 2 },
  timelineLine: { width: 2, height: 20, backgroundColor: COLORS.border, marginLeft: 6 },
  saveBtn: { backgroundColor: COLORS.superAdmin.primary, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: getResponsiveFontSize(17), fontWeight: '700' },
});
