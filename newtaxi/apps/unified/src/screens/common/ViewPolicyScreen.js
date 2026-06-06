import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppPolicies } from '../../hooks/useAppPolicies';
import { COLORS } from '../../constants';
import { hp, getResponsiveFontSize, getResponsivePadding } from '../../utils/responsive';

const POLICY_LABELS = {
  privacy_policy: 'Privacy Policy',
  terms_conditions: 'Terms & Conditions',
  cancellation_policy: 'Cancellation Policy',
  refund_policy: 'Refund Policy',
  safety_guidelines: 'Safety Guidelines',
};

export default function ViewPolicyScreen({ route }) {
  const { policyType } = route.params;
  const { policies, loading } = useAppPolicies();
  const policyContent = policies[policyType];
  const policyLabel = POLICY_LABELS[policyType] || policyType;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{policyLabel}</Text>
        <Text style={styles.subtitle}>Last updated: {new Date().toLocaleDateString()}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {policyContent ? (
          <Text style={styles.policyText}>{policyContent}</Text>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Policy not configured</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: getResponsivePadding(16),
    paddingTop: hp(4),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: getResponsiveFontSize(22),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: getResponsivePadding(16),
    paddingBottom: 40,
  },
  policyText: {
    fontSize: getResponsiveFontSize(14),
    color: COLORS.text,
    lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: getResponsiveFontSize(16),
    color: COLORS.textSecondary,
  },
});
