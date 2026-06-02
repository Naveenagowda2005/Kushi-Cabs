import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MIN_WALLET_BALANCE } from '../constants';

export default function WalletBanner({ balance }) {
  // For testing: Remove low balance warning
  const isLow = false; // balance < MIN_WALLET_BALANCE;

  return (
    <View style={[styles.banner, isLow && styles.bannerLow]}>
      <Ionicons
        name="wallet-outline"
        size={18}
        color={isLow ? '#ff9800' : '#4caf50'}
      />
      <Text style={[styles.text, isLow && styles.textLow]}>
        Balance: ₹{balance?.toFixed(2) ?? '0.00'}
        {/* Removed warning message for testing */}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  bannerLow: { backgroundColor: '#2a1a00' },
  text: { color: '#4caf50', fontSize: 13, flex: 1 },
  textLow: { color: '#ff9800' },
});
