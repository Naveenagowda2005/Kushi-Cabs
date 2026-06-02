import React, { useState } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickOdometerImage } from '../services/uploadService';

export default function OdometerCapture({ label, onCapture }) {
  const [imageUri, setImageUri] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [km, setKm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePick(useCamera) {
    setLoading(true);
    try {
      const result = await pickOdometerImage(useCamera);
      if (!result) return;
      setImageUri(result.uri);
      setImageResult(result);
      if (km) onCapture({ imageData: result, km: parseFloat(km) });
    } catch (err) {
      Alert.alert('Permission Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKmChange(text) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setKm(cleaned);
    if (imageResult && cleaned) {
      onCapture({ imageData: imageResult, km: parseFloat(cleaned) });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {imageUri ? (
        <View>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <TouchableOpacity style={styles.retake} onPress={() => handlePick(true)}>
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pickRow}>
          <TouchableOpacity style={styles.pickBtn} onPress={() => handlePick(true)} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="camera-outline" size={22} color="#fff" />
            }
            <Text style={styles.pickBtnText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.pickBtn, styles.pickBtnAlt]} onPress={() => handlePick(false)} disabled={loading}>
            <Ionicons name="image-outline" size={22} color="#1a1a2e" />
            <Text style={[styles.pickBtnText, { color: '#1a1a2e' }]}>Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.kmRow}>
        <Ionicons name="speedometer-outline" size={20} color="#888" />
        <Text style={styles.kmLabel}>Odometer reading (km)</Text>
      </View>
      <TextInput
        style={styles.kmTextInput}
        value={km}
        onChangeText={handleKmChange}
        placeholder="e.g. 12345"
        placeholderTextColor="#555"
        keyboardType="decimal-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginBottom: 16 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  preview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 8, resizeMode: 'cover' },
  retake: { alignSelf: 'flex-end', marginBottom: 8 },
  retakeText: { color: '#1a1a2e', fontSize: 13 },
  pickRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  pickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, gap: 8,
  },
  pickBtnAlt: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#1a1a2e' },
  pickBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  kmRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  kmLabel: { color: '#888', fontSize: 13 },
  kmTextInput: {
    backgroundColor: '#0f3460', color: '#fff', borderRadius: 10,
    padding: 12, fontSize: 18, borderWidth: 1, borderColor: '#1a1a2e',
  },
});
