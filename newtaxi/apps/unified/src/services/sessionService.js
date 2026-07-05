import { supabase } from '../lib/supabase';
import { getDeviceId, getDeviceInfo } from './deviceService';

/**
 * Create or update an active session for the user
 * This also invalidates all other sessions for this user
 */
export const createActiveSession = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to create a session');
    }
    
    const deviceInfo = await getDeviceInfo();
    console.log('SessionService: Creating active session for user:', userId);
    console.log('SessionService: Device info:', deviceInfo);
    
    // Call the RPC function to create/update session and invalidate others
    const { data, error } = await supabase.rpc('create_or_update_session', {
      p_user_id: userId,
      p_device_id: deviceInfo.deviceId,
      p_device_name: deviceInfo.deviceName,
      p_device_type: deviceInfo.deviceType,
    });
    
    if (error) {
      console.error('SessionService: Error creating session:', error);
      throw error;
    }
    
    console.log('SessionService: Session created successfully:', data);
    console.log('SessionService: Was previous session invalidated:', data?.[0]?.was_previous_session_invalidated);
    
    return {
      sessionId: data?.[0]?.session_id,
      wasOtherSessionInvalidated: data?.[0]?.was_previous_session_invalidated,
      deviceInfo,
    };
  } catch (error) {
    console.error('SessionService: Exception in createActiveSession:', error.message);
    throw error;
  }
};

/**
 * Check if the current session is still active
 * Used to detect if user was logged out from another device
 */
export const isSessionStillActive = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to check session');
    }
    
    const deviceInfo = await getDeviceInfo();
    
    // Call the RPC function to check session status
    const { data, error } = await supabase.rpc('is_session_active', {
      p_user_id: userId,
      p_device_id: deviceInfo.deviceId,
    });
    
    if (error) {
      console.error('SessionService: Error checking session:', error);
      return false; // Assume session is not active if we can't check
    }
    
    console.log('SessionService: Session is active:', data);
    return data;
  } catch (error) {
    console.error('SessionService: Exception in isSessionStillActive:', error.message);
    return false;
  }
};

/**
 * Update the last activity time for the current session
 * Should be called periodically or on user interaction
 */
export const updateSessionActivity = async (userId) => {
  try {
    if (!userId) {
      return; // Silently fail if no user ID
    }
    
    const deviceInfo = await getDeviceInfo();
    
    // Call the RPC function to update activity
    const { error } = await supabase.rpc('update_session_activity', {
      p_user_id: userId,
      p_device_id: deviceInfo.deviceId,
    });
    
    if (error) {
      console.warn('SessionService: Warning updating session activity:', error);
      // Don't throw - this is not critical
      return;
    }
    
    console.log('SessionService: Session activity updated');
  } catch (error) {
    console.warn('SessionService: Warning updating session activity:', error.message);
    // Silently fail on activity update - not critical
  }
};

/**
 * End the current session (called on logout)
 */
export const endCurrentSession = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to end session');
    }
    
    const deviceInfo = await getDeviceInfo();
    console.log('SessionService: Ending session for user:', userId);
    
    // Delete the current session record
    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .match({
        user_id: userId,
        device_id: deviceInfo.deviceId,
      });
    
    if (error) {
      console.error('SessionService: Error ending session:', error);
      // Don't throw - session will expire naturally
      return;
    }
    
    console.log('SessionService: Session ended successfully');
  } catch (error) {
    console.error('SessionService: Exception in endCurrentSession:', error.message);
    // Silently fail - session will eventually timeout
  }
};

/**
 * Get all active sessions for a user (admin view)
 */
export const getActiveSessionsForUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { data, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false });
    
    if (error) {
      console.error('SessionService: Error fetching sessions:', error);
      throw error;
    }
    
    console.log('SessionService: Found', data?.length || 0, 'active sessions');
    return data || [];
  } catch (error) {
    console.error('SessionService: Exception in getActiveSessionsForUser:', error.message);
    return [];
  }
};

/**
 * Listen for session invalidation (real-time)
 * This allows us to force logout when user logs in from another device
 */
export const listenForSessionInvalidation = async (userId, onInvalidated) => {
  if (!userId) {
    console.warn('SessionService: No user ID provided for listening');
    return () => {};
  }
  
  try {
    const deviceInfo = await getDeviceInfo();
    
    // Subscribe to changes in active_sessions for this user
    const subscription = supabase
      .channel(`session_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('SessionService: Session change detected:', payload);
          
          // Check if our current session is still active
          const isStillActive = await isSessionStillActive(userId);
          
          if (!isStillActive) {
            console.warn('SessionService: Current session has been invalidated!');
            onInvalidated({
              reason: 'Session invalidated - logged in from another device',
              newSession: payload.new,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('SessionService: Real-time listener subscribed for user:', userId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('SessionService: Channel error in session listener');
        } else if (status === 'TIMED_OUT') {
          console.warn('SessionService: Session listener timed out');
        }
      });
    
    // Return unsubscribe function
    return () => {
      console.log('SessionService: Unsubscribing from session changes');
      supabase.removeChannel(subscription);
    };
  } catch (error) {
    console.error('SessionService: Error setting up session listener:', error.message);
    return () => {};
  }
};
