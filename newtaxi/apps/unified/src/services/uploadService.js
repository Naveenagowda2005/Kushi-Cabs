import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { STORAGE_BUCKETS, API_CONFIG } from '../constants';

export async function pickOdometerImage(useCamera = false) {
  if (useCamera) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission is required.');
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Photo library permission is required.');
    }
  }

  const options = {
    mediaTypes: ['images'],
    quality: 0.5,
    allowsEditing: false,
    base64: true,   // get base64 directly — avoids Android URI fetch issues
  };

  const result = useCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return null;

  const asset = result.assets[0];
  return { uri: asset.uri, base64: asset.base64 };
}

/**
 * Uploads an image to Supabase Storage using base64 data.
 * Returns the public URL.
 */
export async function uploadOdometerImage(imageData, tripId, type) {
  const base64 = typeof imageData === 'object' ? imageData.base64 : null;
  const uri    = typeof imageData === 'object' ? imageData.uri : imageData;

  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  // Use backend to upload (bypasses Supabase RLS — OTP users have no real JWT)
  const backendUrl = `${API_CONFIG.SMS_API_URL}/api/upload/odometer`;

  let base64Data = base64;

  // If no base64, fetch from URI
  if (!base64Data) {
    const response = await fetch(uri);
    const blob = await response.blob();
    base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  console.log(`📤 Uploading odometer via backend: ${backendUrl}`);

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripId, type, base64Data, mimeType }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(`Upload failed: ${result.error || 'Unknown error'}`);
  }

  return result.url;
}
