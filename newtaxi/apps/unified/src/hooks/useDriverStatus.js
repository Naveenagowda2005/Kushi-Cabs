import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useDriverStatus(userId) {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  // Track when driver went online so we can filter trips created before that
  const onlineSinceRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await supabase
        .from('drivers')
        .select('is_online')
        .eq('user_id', userId)
        .maybeSingle();
      const online = data?.is_online ?? false;
      setIsOnline(online);
      if (online) onlineSinceRef.current = new Date().toISOString();
    } catch (err) {
      console.error('useDriverStatus:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function toggleOnline() {
    setToggling(true);
    const newStatus = !isOnline;
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_online: newStatus })
        .eq('user_id', userId);
      if (error) throw error;
      setIsOnline(newStatus);
      // Record the exact moment driver went online
      onlineSinceRef.current = newStatus ? new Date().toISOString() : null;
    } catch (err) {
      console.error('toggleOnline:', err.message);
    } finally {
      setToggling(false);
    }
  }

  return { isOnline, loading, toggling, toggleOnline, onlineSince: onlineSinceRef };
}