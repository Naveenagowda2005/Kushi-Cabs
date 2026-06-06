import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

const POLICY_TYPES = [
  { id: 'privacy_policy', label: 'Privacy Policy', icon: 'shield-outline' },
  { id: 'terms_conditions', label: 'Terms & Conditions', icon: 'document-outline' },
  { id: 'cancellation_policy', label: 'Cancellation Policy', icon: 'close-circle-outline' },
  { id: 'refund_policy', label: 'Refund Policy', icon: 'cash-outline' },
  { id: 'safety_guidelines', label: 'Safety Guidelines', icon: 'warning-outline' },
];

export default function PolicyManagementScreen({ navigation }) {
  const [policies, setPolicies] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_policies')
        .select('*');

      if (error) throw error;

      // Convert array to object keyed by policy_type
      const policyMap = {};
      data?.forEach(policy => {
        policyMap[policy.policy_type] = policy;
      });
      setPolicies(policyMap);
    } catch (error) {
      console.error('Error loading policies:', error);
      Alert.alert('Error', 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPolicy = (policyType) => {
    const policy = policies[policyType];
    setSelectedPolicy(policyType);
    setEditText(policy?.content || '');
    setEditTitle(POLICY_TYPES.find(p => p.id === policyType)?.label || policyType);
    setEditModalVisible(true);
  };

  const handleSavePolicy = async () => {
    if (!editText.trim()) {
      Alert.alert('Error', 'Policy content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const existingPolicy = policies[selectedPolicy];

      if (existingPolicy?.id) {
        // Update existing
        const { error } = await supabase
          .from('app_policies')
          .update({
            content: editText,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPolicy.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('app_policies')
          .insert({
            policy_type: selectedPolicy,
            content: editText,
            applies_to: ['driver', 'vendor'], // Applies to both
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      // Reload policies
      await loadPolicies();
      setEditModalVisible(false);
      setEditText('');
      Alert.alert('✅ Success', `${editTitle} updated successfully`);
    } catch (error) {
      console.error('Error saving policy:', error);
      Alert.alert('Error', error.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const PolicyCard = ({ policyType }) => {
    const policyInfo = POLICY_TYPES.find(p => p.id === policyType);
    const policy = policies[policyType];
    const hasContent = !!policy?.content;

    return (
      <TouchableOpacity
        style={[styles.policyCard, !hasContent && styles.policyCardEmpty]}
        onPress={() => handleEditPolicy(policyType)}
      >
        <View style={styles.policyCardHeader}>
          <View style={[styles.policyIcon, { backgroundColor: hasContent ? COLORS.superAdmin.primary + '20' : '#ccc20' }]}>
            <Ionicons
              name={policyInfo?.icon}
              size={24}
              color={hasContent ? COLORS.superAdmin.primary : '#999'}
            />
          </View>
          <View style={styles.policyInfo}>
            <Text style={styles.policyLabel}>{policyInfo?.label}</Text>
            <Text style={[styles.policyStatus, { color: hasContent ? COLORS.success : COLORS.warning }]}>
              {hasContent ? '✓ Configured' : '⚠ Not configured'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
        </View>

        {hasContent && (
          <View style={styles.policyPreview}>
            <Text style={styles.previewLabel}>Preview:</Text>
            <Text style={styles.previewText} numberOfLines={2}>
              {policy.content}
            </Text>
          </View>
        )}

        <View style={styles.policyMeta}>
          <Text style={styles.metaText}>
            Applies to: <Text style={styles.metaValue}>Driver & Vendor</Text>
          </Text>
          {policy?.updated_at && (
            <Text style={styles.metaText}>
              Last updated: <Text style={styles.metaValue}>{new Date(policy.updated_at).toLocaleDateString()}</Text>
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>App Policies</Text>
          <Text style={styles.subtitle}>Manage policies for drivers and vendors</Text>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.superAdmin.primary} />
        <Text style={styles.infoText}>
          Updates are immediately visible to both drivers and vendors in their profile settings.
        </Text>
      </View>

      {/* Policies Grid */}
      <View style={styles.policiesContainer}>
        {POLICY_TYPES.map(policyType => (
          <PolicyCard key={policyType.id} policyType={policyType.id} />
        ))}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              disabled={saving}
            >
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editTitle}</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 100 }}>
            <Text style={styles.inputLabel}>Policy Content</Text>
            <TextInput
              style={styles.policyInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              numberOfLines={15}
              placeholder="Enter policy content..."
              placeholderTextColor={COLORS.textTertiary}
              textAlignVertical="top"
              editable={!saving}
            />

            <View style={styles.charCount}>
              <Text style={styles.charCountText}>
                {editText.length} characters
              </Text>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setEditModalVisible(false)}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSavePolicy}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Policy</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: getResponsivePadding(16), paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  backButton: {
    marginTop: 2,
    padding: 4,
  },
  title: { fontSize: getResponsiveFontSize(26), fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: getResponsiveFontSize(14), color: COLORS.textSecondary, marginTop: 4 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.superAdmin.primary + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.superAdmin.primary,
  },
  infoText: {
    flex: 1,
    fontSize: getResponsiveFontSize(13),
    color: COLORS.text,
    lineHeight: 18,
  },

  policiesContainer: { gap: 12 },

  policyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  policyCardEmpty: {
    opacity: 0.7,
  },
  policyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  policyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyInfo: { flex: 1 },
  policyLabel: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: COLORS.text,
  },
  policyStatus: {
    fontSize: getResponsiveFontSize(12),
    marginTop: 2,
    fontWeight: '500',
  },

  policyPreview: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  previewLabel: {
    fontSize: getResponsiveFontSize(11),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  previewText: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.textSecondary,
    lineHeight: 16,
  },

  policyMeta: { gap: 4 },
  metaText: {
    fontSize: getResponsiveFontSize(11),
    color: COLORS.textSecondary,
  },
  metaValue: {
    color: COLORS.text,
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: hp(4),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '700',
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  policyInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: getResponsiveFontSize(14),
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 300,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCountText: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.textSecondary,
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.superAdmin.primary,
  },
  saveButtonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
