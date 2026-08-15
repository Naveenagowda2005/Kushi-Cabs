import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const DEVICE_ID_KEY = 'app_device_id';

/**
 * Generate or retrieve a unique device ID
 * This is used for single-device login enforcement
 */
export const getDeviceId = async () => {
  try {
    // First, check if we already have a stored device ID
    let storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (storedDeviceId) {
      console.log('DeviceService: Using stored device ID:', storedDeviceId);
      return storedDeviceId;
    }
    
    // Generate a unique device ID from device info
    const deviceName = Device.deviceName || 'Unknown Device';
    const osName = Device.osName || Platform.OS;
    const osVersion = Device.osVersion || 'Unknown';
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    
    // Create a unique ID combining device info and timestamp (first login)
    const timestamp = new Date().getTime();
    const baseId = `${osName}-${Device.deviceYearClass || 'unknown'}-${timestamp}`;
    
    // Store for future sessions
    await AsyncStorage.setItem(DEVICE_ID_KEY, baseId);
    
    console.log('DeviceService: Generated new device ID:', baseId);
    console.log('DeviceService: Device info - Name:', deviceName, 'OS:', osName, 'Version:', osVersion);
    
    return baseId;
  } catch (error) {
    console.error('DeviceService: Error getting device ID:', error);
    // Fallback: generate a random ID if all else fails
    const fallbackId = `device-${Math.random().toString(36).substr(2, 9)}`;
    return fallbackId;
  }
};

/**
 * Get device information for logging
 */
export const getDeviceInfo = async () => {
  try {
    const deviceId = await getDeviceId();
    
    return {
      deviceId,
      deviceName: Device.deviceName || 'Unknown',
      deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
      osVersion: Device.osVersion || 'Unknown',
      manufacturer: Device.manufacturer || 'Unknown',
      modelName: Device.modelName || 'Unknown',
    };
  } catch (error) {
    console.error('DeviceService: Error getting device info:', error);
    return {
      deviceId: 'unknown',
      deviceName: 'Unknown Device',
      deviceType: Platform.OS,
      osVersion: 'Unknown',
      manufacturer: 'Unknown',
      modelName: 'Unknown',
    };
  }
};

/**
 * Clear the stored device ID (for testing or app reset)
 */
export const clearDeviceId = async () => {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    console.log('DeviceService: Device ID cleared');
  } catch (error) {
    console.error('DeviceService: Error clearing device ID:', error);
  }
};
