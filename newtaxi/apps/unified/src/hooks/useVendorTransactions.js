import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!userId) {
      console.warn('⚠️ useTransactions: No userId provided');
      return;
    }
    try {
      console.log('🔄 useTransactions: Fetching transactions for user:', userId);
      setError(null);
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (walletError) {
        console.error('❌ useTransactions: Wallet not found:', walletError);
        return;
      }

      if (!wallet) {
        console.warn('⚠️ useTransactions: No wallet found for user');
        return;
      }

      console.log('✅ useTransactions: Wallet found:', wallet.id);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ useTransactions error:', error);
        throw error;
      }
      console.log('✅ useTransactions: Transactions fetched:', data?.length || 0, 'records');
      setTransactions(data || []);
    } catch (err) {
      console.error('❌ useTransactions exception:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { transactions, loading, error, refetch: fetch };
}