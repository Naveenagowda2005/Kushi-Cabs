import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { policyData } from './policyData';

export default function PolicyScreen({ route }) {
  const policyType = route.name === 'CancellationPolicy' ? 'cancellation' : 'terms';
  const policy = policyData[policyType];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{policy.title}</Text>
      <Text style={styles.intro}>{policy.intro}</Text>

      {policy.items && (
        <View style={styles.section}>
          {policy.items.map((item, index) => (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bullet}>{index + 1}.</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {policy.list && (
        <View style={styles.section}>
          {policy.list.map((entry) => (
            <View key={entry.label} style={styles.policyRow}>
              <Text style={styles.policyLabel}>{entry.label}</Text>
              <Text style={styles.policyAmount}>{entry.amount}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  content: { padding: 24, paddingTop: 36, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 14 },
  intro: { color: '#ccc', fontSize: 14, lineHeight: 22, marginBottom: 20 },
  section: { marginBottom: 24 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  bullet: { color: '#e94560', fontSize: 14, width: 22, fontWeight: '700' },
  bulletText: { color: '#ddd', fontSize: 14, flex: 1, lineHeight: 22 },
  policyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#16213e' },
  policyLabel: { color: '#fff', fontSize: 15 },
  policyAmount: { color: '#e94560', fontSize: 15, fontWeight: '700' },
});
