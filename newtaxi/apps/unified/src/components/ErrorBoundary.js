import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={64} color={COLORS.error} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  title: { 
    color: COLORS.text, 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginTop: 16, 
    marginBottom: 8 
  },
  message: { 
    color: COLORS.textSecondary, 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 32 
  },
  btn: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 12, 
    paddingHorizontal: 32, 
    paddingVertical: 14 
  },
  btnText: { 
    color: COLORS.textLight, 
    fontSize: 16, 
    fontWeight: '600' 
  },
});
