import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSystemSettings() {
  const [settings, setSettings] = useState({
    minimumWalletBalance: 500, // Default fallback
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      console.log('🔍 Fetching system settings from app_settings table...');
      
      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('id, minimum_wallet_balance_for_drivers')
        .eq('id', 'global')
        .single();

      console.log('📊 Fetched data:', data);
      console.log('Fetch error:', fetchError);

      if (fetchError) {
        console.error('❌ Error fetching system settings:', fetchError);
        // Use default if query fails
        setSettings({ minimumWalletBalance: 500 });
        return { minimumWalletBalance: 500 };
      } else if (data) {
        // Use data.minimum_wallet_balance_for_drivers if it exists (including 0), otherwise default to 500
        const balance = data.minimum_wallet_balance_for_drivers !== undefined && data.minimum_wallet_balance_for_drivers !== null 
          ? data.minimum_wallet_balance_for_drivers 
          : 500;
        console.log('✅ Setting minimum wallet balance to:', balance, 'Type:', typeof balance);
        const newSettings = {
          minimumWalletBalance: Number(balance), // Ensure it's a number
        };
        setSettings(newSettings);
        return newSettings;
      } else {
        console.warn('⚠️ No data returned from app_settings query, using default');
        setSettings({ minimumWalletBalance: 500 });
        return { minimumWalletBalance: 500 };
      }
    } catch (err) {
      console.error('useSystemSettings error:', err);
      setError(err.message);
      // Use default on error
      setSettings({ minimumWalletBalance: 500 });
      return { minimumWalletBalance: 500 };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, refetch: fetchSettings };
}

export async function updateMinimumWalletBalance(newBalance) {
  try {
    console.log('📝 Attempting to update minimum wallet balance to:', newBalance);
    
    // First, verify the app_settings row exists
    const { data: checkData, error: checkError } = await supabase
      .from('app_settings')
      .select('id, minimum_wallet_balance_for_drivers')
      .eq('id', 'global')
      .single();

    console.log('🔍 Current app_settings row:', checkData);
    
    if (checkError) {
      console.error('❌ Error checking app_settings:', checkError);
      throw new Error('app_settings table query failed: ' + checkError.message);
    }

    if (!checkData) {
      console.warn('⚠️ No app_settings row found with id=global, creating one...');
      const { data: insertData, error: insertError } = await supabase
        .from('app_settings')
        .insert([{ id: 'global', minimum_wallet_balance_for_drivers: newBalance }])
        .select();

      if (insertError) {
        console.error('❌ Error inserting app_settings:', insertError);
        throw insertError;
      }
      console.log('✅ Created new app_settings row:', insertData);
      return { success: true, data: insertData };
    }

    // Now update the existing row
    console.log('🔄 Updating existing app_settings row...');
    const { data: updateData, error: updateError } = await supabase
      .from('app_settings')
      .update({ minimum_wallet_balance_for_drivers: newBalance })
      .eq('id', 'global')
      .select();

    console.log('📨 Update response - Data:', updateData, 'Error:', updateError);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }
    
    if (!updateData || updateData.length === 0) {
      console.warn('⚠️ Update returned no data');
      return { success: false, error: 'Update returned no data' };
    }

    console.log('✅ Successfully updated. Data returned:', updateData);
    console.log('✅ New value in database:', updateData[0].minimum_wallet_balance_for_drivers);
    return { success: true, data: updateData };
  } catch (err) {
    console.error('❌ Error updating minimum wallet balance:', err);
    return { success: false, error: err.message };
  }
}
