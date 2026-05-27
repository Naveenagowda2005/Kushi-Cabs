import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useVendorProfile(userId) {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      // Use maybeSingle — returns null if no row found instead of throwing
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setVendor(data); // null if vendor row doesn't exist yet
    } catch (err) {
      console.error('useVendorProfile:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { vendor, loading, refetch: fetch };
}