import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useWallet(userId) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      console.warn('⚠️ useWallet: No userId provided');
      return;
    }
    try {
      console.log('🔄 useWallet: Fetching wallet for user:', userId);
      setError(null);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ useWallet error:', error);
        throw error;
      }
      console.log('✅ useWallet: Wallet fetched:', data);
      setWallet(data);
    } catch (err) {
      console.error('❌ useWallet exception:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { wallet, loading, error, refetch };
}
