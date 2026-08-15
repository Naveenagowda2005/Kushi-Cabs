import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Default fallback values if table doesn't exist yet
const DEFAULTS = {
  vendor_window_minutes: 15,
  driver_window_minutes: 60,
};

let _cached = null; // module-level cache so all components share one fetch
let _cacheVersion = 0; // version counter to force refetch

export function useAppSettings() {
  const [settings, setSettings] = useState(_cached || DEFAULTS);
  const [loading, setLoading] = useState(!_cached);
  const [cacheVersion, setCacheVersion] = useState(_cacheVersion);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('vendor_window_minutes, driver_window_minutes')
        .eq('id', 'global')
        .maybeSingle();

      if (!error && data) {
        console.log('useAppSettings fetched:', data);
        _cached = data;
        setSettings(data);
      } else if (error) {
        console.warn('useAppSettings fetch error:', error.message);
      }
    } catch (err) {
      console.warn('useAppSettings fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always fetch fresh data on mount or when cache version changes
    console.log('useAppSettings: Fetching fresh data (cacheVersion:', cacheVersion, ')');
    fetch();
  }, [fetch, cacheVersion]);

  const save = useCallback(async (newSettings) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ id: 'global', ...newSettings, updated_at: new Date().toISOString() });

    if (error) throw error;
    
    // Update cache and increment version to trigger refetch in all components
    _cached = { ..._cached, ...newSettings };
    _cacheVersion += 1;
    setCacheVersion(_cacheVersion);
    setSettings(_cached);
    console.log('useAppSettings saved and cache invalidated:', _cached);
  }, []);

  return { settings, loading, refetch: fetch, save };
}

// Standalone helper — fetch settings once and return vendor/driver window ms
export async function getWindowMs() {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('vendor_window_minutes, driver_window_minutes')
      .eq('id', 'global')
      .maybeSingle();

    if (data) {
      return {
        vendorWindowMs: (data.vendor_window_minutes || 15) * 60 * 1000,
        driverWindowMs: (data.driver_window_minutes || 60) * 60 * 1000,
      };
    }
  } catch (_) {}
  return { vendorWindowMs: 15 * 60 * 1000, driverWindowMs: 60 * 60 * 1000 };
}
