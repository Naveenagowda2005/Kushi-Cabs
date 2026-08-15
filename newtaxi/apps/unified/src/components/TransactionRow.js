import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const TYPE_CONFIG = {
  credit:     { icon: 'arrow-down-circle-outline', color: '#4caf50', sign: '+' },
  debit:      { icon: 'arrow-up-circle-outline',   color: '#f44336', sign: '-' },
  commission: { icon: 'trending-up-outline',        color: '#4caf50', sign: '+' },
  withdrawal: { icon: 'wallet-outline',             color: '#ff9800', sign: '-' },
  refund:     { icon: 'refresh-circle-outline',     color: '#2196f3', sign: '+' },
};

export default function TransactionRow({ tx }) {
  const config = TYPE_CONFIG[tx.type] ?? { icon: 'ellipse-outline', color: '#888', sign: '' };

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: config.color + '22' }]}>
        <Ionicons name={config.icon} size={22} color={config.color} />
      </View>

      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
          {tx.description || tx.type}
        </Text>
        <Text style={styles.date} numberOfLines={1} ellipsizeMode="tail">
          {new Date(tx.created_at).toLocaleString()}
        </Text>
      </View>

      <Text style={[styles.amount, { color: config.color }]}>
        {config.sign}₹{Math.abs(tx.amount).toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: screenWidth * 0.04, // Responsive padding
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  iconWrap: {
    width: Math.max(40, screenWidth * 0.11), // Responsive icon container
    height: Math.max(40, screenWidth * 0.11),
    borderRadius: Math.max(20, screenWidth * 0.055),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { 
    flex: 1, 
    marginRight: 8, // Add margin to prevent text from touching amount
    minWidth: 0, // Allow flex shrinking
  },
  description: { 
    color: '#fff', 
    fontSize: Math.max(13, screenWidth * 0.035), 
    marginBottom: 3,
    lineHeight: Math.max(18, screenWidth * 0.045), // Better line height
  },
  date: { 
    color: '#666', 
    fontSize: Math.max(11, screenWidth * 0.03),
    lineHeight: Math.max(15, screenWidth * 0.038),
  },
  amount: { 
    fontSize: Math.max(14, screenWidth * 0.04), 
    fontWeight: '700',
    textAlign: 'right',
    minWidth: screenWidth * 0.2, // Ensure amount has enough space
  },
});
