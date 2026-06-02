import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { STORAGE_BUCKETS } from '../constants';

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
  // imageData can be { uri, base64 } from pickOdometerImage
  // or just a uri string (legacy)
  const base64 = typeof imageData === 'object' ? imageData.base64 : null;
  const uri    = typeof imageData === 'object' ? imageData.uri : imageData;

  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
  const fileName = `${tripId}/${type}_${Date.now()}.${ext}`;
  const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  let uploadData;

  if (base64) {
    // Decode base64 string to Uint8Array
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    uploadData = byteArray;
  } else {
    // Fallback: fetch from URI
    const response = await fetch(uri);
    const blob = await response.blob();
    uploadData = blob;
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.ODOMETER)
    .upload(fileName, uploadData, { contentType, upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.ODOMETER)
    .getPublicUrl(fileName);

  return data.publicUrl;
}
