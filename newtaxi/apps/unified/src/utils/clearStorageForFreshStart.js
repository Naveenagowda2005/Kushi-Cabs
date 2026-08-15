/**
 * Utility to clear all app storage for a completely fresh start
 * Run this when switching to a new Supabase account
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export const clearAllStorage = async () => {
  try {
    console.log('🗑️  Starting complete cleanup for fresh start...');
    
    // Step 1: Sign out from Supabase (clears all Supabase session state)
    console.log('Step 1: Clearing Supabase auth session...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('- Supabase signOut error (may be expected):', error.message);
      } else {
        console.log('✓ Signed out from Supabase');
      }
    } catch (e) {
      console.log('- Exception during Supabase signOut (expected):', e.message);
    }

    // Step 2: Clear all specific keys from AsyncStorage
    console.log('Step 2: Clearing all AsyncStorage...');
    const keysToDelete = [
      'otpUserSession',
      'superAdminSession',
      'userProfile',
      'userRole',
      'authToken',
      'refreshToken',
      'selectedRole',
      'incompleteSignup',
      'sessionToken',
      'lastLocation',
      'appSettings',
      'supabase.auth.token', // Supabase auth token
      'supabase.auth.refreshToken', // Supabase refresh token
    ];
    
    for (const key of keysToDelete) {
      try {
        const exists = await AsyncStorage.getItem(key);
        if (exists) {
          await AsyncStorage.removeItem(key);
          console.log(`✓ Deleted: ${key}`);
        }
      } catch (e) {
        console.log(`- Error with key ${key}:`, e.message);
      }
    }
    
    // Step 3: Alternative - clear ALL AsyncStorage if needed
    console.log('Step 3: Final complete AsyncStorage wipe...');
    await AsyncStorage.clear();
    console.log('✓ All AsyncStorage cleared');
    
    console.log('✅ Complete cleanup finished!');
    console.log('🔄 App is now ready for fresh registration');
    
    return true;
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
};

/**
 * Check what's stored in AsyncStorage (for debugging)
 */
export const debugAsyncStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('📦 AsyncStorage keys:', keys);
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`\n📋 ${key}:`);
      try {
        const parsed = JSON.parse(value);
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        console.log(value);
      }
    }
  } catch (error) {
    console.error('Error reading AsyncStorage:', error);
  }
};
