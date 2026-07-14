import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';

let currentSoundRef = null;
let soundPlayingRef = false;
let currentVolumeRef = 1.0;
let isMutedRef = false;

export function useDriverStatus(userId) {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const onlineSinceRef = useRef(null);

  // Update global refs when state changes
  useEffect(() => {
    currentVolumeRef = volume;
    console.log(`🔊 Volume updated: ${volume}`);
  }, [volume]);

  // ✅ CRITICAL: When mute changes, stop sound immediately
  useEffect(() => {
    isMutedRef = isMuted;
    console.log(`🔇 Mute updated: ${isMuted}`);
    
    // If mute turned ON, stop all sounds immediately
    if (isMuted) {
      console.log('🛑 Mute ON - stopping all sounds');
      stopSoundImmediately();
    }
  }, [isMuted]);

  // ✅ NEW: Immediate stop function
  const stopSoundImmediately = useCallback(async () => {
    soundPlayingRef = false;
    
    if (currentSoundRef) {
      try {
        await currentSoundRef.stopAsync();
        await currentSoundRef.unloadAsync();
        currentSoundRef = null;
        console.log('✅ Sound stopped by mute');
      } catch (err) {
        console.warn('⚠️ Error stopping:', err.message);
      }
    }
  }, []);

  // Play 3 beeps in background
  const playGoOnlineSound = useCallback(async () => {
    try {
      // DISABLED: Don't play sound when driver goes online
      // Sound should only play when NEW trips arrive, not on status changes
      console.log('🔇 Online confirmation sound disabled - only new trips trigger alerts');
      return;
    } catch (err) {
      console.warn('❌ Error:', err.message);
      soundPlayingRef = false;
    }
  }, []);

  // Stop sound
  const stopSound = useCallback(async () => {
    console.log('🛑 Stopping sound');
    soundPlayingRef = false;
    
    if (currentSoundRef) {
      try {
        await currentSoundRef.stopAsync();
        await currentSoundRef.unloadAsync();
        currentSoundRef = null;
      } catch (err) {
        console.warn('⚠️ Error stopping:', err.message);
      }
    }
  }, []);

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
      console.error('Error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function toggleOnline() {
    const newStatus = !isOnline;
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_online: newStatus })
        .eq('user_id', userId);
      if (error) throw error;
      
      setIsOnline(newStatus);
      onlineSinceRef.current = newStatus ? new Date().toISOString() : null;
      
      if (newStatus) {
        playGoOnlineSound();
      } else {
        stopSound();
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }

  return { 
    isOnline, 
    loading, 
    toggleOnline, 
    onlineSince: onlineSinceRef,
    volume,
    setVolume,
    isMuted,
    setIsMuted
  };
}
