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
        .select('*')
        .eq('id', 'global')
        .single();

      console.log('📊 Fetched data:', data);
      console.log('Fetch error:', fetchError);

      if (fetchError) {
        console.error('❌ Error fetching system settings:', fetchError);
        // Use default if query fails
        setSettings({ minimumWalletBalance: 500 });
      } else if (data) {
        // Use data.minimum_wallet_balance_for_drivers if it exists (including 0), otherwise default to 500
        const balance = data.minimum_wallet_balance_for_drivers !== undefined && data.minimum_wallet_balance_for_drivers !== null 
          ? data.minimum_wallet_balance_for_drivers 
          : 500;
        console.log('✅ Setting minimum wallet balance to:', balance);
        setSettings({
          minimumWalletBalance: balance,
        });
      }
    } catch (err) {
      console.error('useSystemSettings error:', err);
      setError(err.message);
      // Use default on error
      setSettings({ minimumWalletBalance: 500 });
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
    
    const { data, error } = await supabase
      .from('app_settings')
      .update({ minimum_wallet_balance_for_drivers: newBalance })
      .eq('id', 'global')
      .select(); // Add select to return the updated data

    console.log('Update response:', { data, error });

    if (error) {
      console.error('❌ Update error:', error);
      throw error;
    }
    
    console.log('✅ Successfully updated. Data returned:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Error updating minimum wallet balance:', err);
    return { success: false, error: err.message };
  }
}
