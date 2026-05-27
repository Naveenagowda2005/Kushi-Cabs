import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: '#ff9800' },
  accepted:    { label: 'Accepted',    color: '#2196f3' },
  in_progress: { label: 'In Progress', color: '#9c27b0' },
  completed:   { label: 'Completed',   color: '#4caf50' },
  cancelled:   { label: 'Cancelled',   color: '#f44336' },
};

export default function TripStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: '#888' };
  return (
    <View style={[styles.badge, { backgroundColor: config.color + '22', borderColor: config.color }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: Math.max(6, screenWidth * 0.02),
    paddingVertical: 3,
    alignSelf: 'flex-start',
    minHeight: 24, // Ensure consistent height
  },
  text: { 
    fontSize: Math.max(11, screenWidth * 0.03), 
    fontWeight: '600',
    textAlign: 'center',
  },
});