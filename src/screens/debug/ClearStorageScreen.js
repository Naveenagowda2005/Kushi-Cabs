import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { clearAllStorage, debugAsyncStorage } from '../../utils/clearStorageForFreshStart';

export default function ClearStorageScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { logout } = useAuth();

  const handleClearStorage = async () => {
    Alert.alert(
      'Clear All Storage?',
      'This will delete all saved sessions and data. You will need to log in again.\n\nThis is useful when switching to a new Supabase account.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Clear & Restart',
          onPress: async () => {
            try {
              setLoading(true);
              setMessage('Clearing storage...');
              await clearAllStorage();
              setMessage('✅ Storage cleared! Restarting app...');
              
              // Wait a moment then logout
              setTimeout(async () => {
                try {
                  await logout();
                } catch (e) {
                  console.log('Logout error (expected):', e.message);
                }
              }, 1000);
            } catch (error) {
              setMessage('❌ Error: ' + error.message);
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDebugStorage = async () => {
    try {
      setLoading(true);
      setMessage('Checking AsyncStorage...');
      await debugAsyncStorage();
      setMessage('✅ Check console for storage contents');
      setLoading(false);
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧹 Storage Management</Text>
        <Text style={styles.subtitle}>For Fresh Start Setup</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearStorage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🗑️  Clear All Storage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={handleDebugStorage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📋 Debug: Check Storage</Text>
        </TouchableOpacity>
      </View>

      {message ? (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{message}</Text>
        </View>
      ) : null}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️  When to Use This</Text>
        <Text style={styles.infoText}>
          • Switched to a new Supabase account{'\n'}
          • Getting "User not found" errors{'\n'}
          • Old session data won't clear{'\n'}
          • Starting completely fresh
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>⚠️  What Gets Cleared</Text>
        <Text style={styles.infoText}>
          • OTP user sessions{'\n'}
          • Super admin sessions{'\n'}
          • Cached user profiles{'\n'}
          • Auth tokens{'\n'}
          • All app storage data
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>✅ After Clearing</Text>
        <Text style={styles.infoText}>
          1. App will restart{'\n'}
          2. You'll be logged out{'\n'}
          3. Fresh registration available{'\n'}
          4. No old data will interfere
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001a33',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#99ccff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
  },
  infoButton: {
    backgroundColor: '#1976d2',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: '#1a4d66',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
  },
  message: {
    color: '#00d4ff',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: '#1a3a52',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#99ccff',
    lineHeight: 18,
  },
});
