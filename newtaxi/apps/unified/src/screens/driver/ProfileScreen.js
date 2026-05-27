import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function DriverProfileScreen({ navigation }) {
  const { user, refreshUserProfile, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState(null);

  // Load avatar separately so it doesn't slow down auth
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('users').select('avatar_base64').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.avatar_base64) setAvatarBase64(data.avatar_base64); });
  }, [user?.id]);

  const menuItems = [
    { icon: 'document-text-outline', label: 'Terms & Conditions', onPress: () => navigation.navigate('Terms') },
    { icon: 'warning-outline',     label: 'Cancellation Policy', onPress: () => navigation.navigate('CancellationPolicy') },
    { icon: 'help-circle-outline',  label: 'Help & Support',     onPress: () => {} },
  ];

  function handlePickPhoto() {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Camera',        onPress: () => pickAndSave(true) },
      { text: 'Photo Library', onPress: () => pickAndSave(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pickAndSave(useCamera) {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required', 'Photo library access is needed.'); return; }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4, allowsEditing: true, aspect: [1, 1], base64: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, allowsEditing: true, aspect: [1, 1], base64: true });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset.base64) { Alert.alert('Error', 'Could not read image. Try again.'); return; }

      setUploading(true);

      const ext = asset.uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      const base64String = `data:${mime};base64,${asset.base64}`;

      // Save directly to users.avatar_base64 column
      const { error } = await supabase
        .from('users')
        .update({ avatar_base64: base64String })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUserProfile();
      setAvatarBase64(base64String);  // update local state immediately
      Alert.alert('Success', 'Profile photo updated!');
    } catch (err) {
      console.error('Photo save error:', err);
      Alert.alert('Error', err.message || 'Failed to save photo');
    } finally {
      setUploading(false);
    }
  }

  const avatarSource = avatarBase64 ? { uri: avatarBase64 } : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <TouchableOpacity onPress={handlePickPhoto} disabled={uploading} style={styles.avatarContainer}>
          {avatarSource ? (
            <Image source={avatarSource} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0)?.toUpperCase() ?? 'D'}
              </Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            {uploading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={16} color="#fff" />
            }
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap to change photo</Text>
        <Text style={styles.name}>{user?.full_name || 'Driver'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Driver</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color="#aaa" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Ionicons name="log-out-outline" size={20} color="#e94560" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 24, paddingTop: 60 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#e94560' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#e94560', borderRadius: 14,
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#1a1a2e',
  },
  photoHint: { color: '#555', fontSize: 11, marginBottom: 10 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  phone: { color: '#888', fontSize: 14, marginBottom: 8 },
  roleBadge: { backgroundColor: '#e9456022', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#e94560' },
  roleText: { color: '#e94560', fontSize: 12, fontWeight: '600' },
  balanceCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginBottom: 20 },
  balanceLabel: { color: '#888', fontSize: 12 },
  balanceAmount: { color: '#4caf50', fontSize: 20, fontWeight: 'bold' },
  menu: { backgroundColor: '#16213e', borderRadius: 14, marginBottom: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  menuLabel: { color: '#fff', fontSize: 15, flex: 1 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#16213e', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e94560' },
  signOutText: { color: '#e94560', fontSize: 16, fontWeight: '600' },
});
