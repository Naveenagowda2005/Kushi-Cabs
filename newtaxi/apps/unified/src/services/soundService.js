import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

let soundObject = null;
let isPlayingAlert = false;

/**
 * Trigger vibration that lasts for 2 seconds
 */
const triggerVibration = async () => {
  try {
    // Normal continuous vibration for 2000ms (2 seconds)
    Vibration.vibrate(2000);
    console.log('📳 2-second continuous vibration triggered');
  } catch (error) {
    return;
  }
};

/**
 * Initialize audio mode for the app - SPEAKER ROUTING FOR ANDROID
 */
export const initializeAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });
    console.log('✅ Audio mode initialized for trips');
    console.log('📢 Audio routing configured: Speaker output enabled');
  } catch (error) {
    console.error('❌ Error initializing audio mode:', error.message);
    console.warn('⚠️ Will continue with default audio settings');
  }
};

/**
 * Play telephone ringing sound from audio file
 * @param {number} duration - Duration to play in milliseconds (default: 3000ms)
 */
export const playTelephoneRing = async (duration = 3000) => {
  try {
    // Stop any currently playing sound first
    if (soundObject) {
      try {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        soundObject = null;
      } catch (e) {
        console.warn('Error stopping/unloading previous sound:', e.message);
      }
    }

    // Create fresh sound object
    soundObject = new Audio.Sound();
    console.log('🔔 Creating new sound object');

    try {
      console.log('🔔 Loading telephone ring audio from assets');
      
      // Direct require path to audio file
      const audioSource = require('../../assets/ring.mp3');
      console.log('📂 Audio source loaded:', typeof audioSource);
      
      await soundObject.loadAsync(audioSource);
      console.log('✅ Sound loaded successfully');
      
      // CRITICAL: Set volume BEFORE playing
      await soundObject.setVolumeAsync(1.0);
      console.log('🔊 Volume set to maximum (1.0)');
      
      // Get status before playing
      const statusBefore = await soundObject.getStatusAsync();
      console.log('📊 Status before playback:', {
        isLoaded: statusBefore.isLoaded,
        volume: statusBefore.volume,
        isMuted: statusBefore.isMuted,
        shouldPlay: statusBefore.shouldPlay,
        duration: statusBefore.durationMillis,
      });
      
      // Play with explicit options
      console.log('▶️ Starting playback...');
      const playback = await soundObject.playAsync();
      console.log('▶️ Playback status:', {
        isPlaying: playback.isPlaying,
        volume: playback.volume,
        positionMillis: playback.positionMillis,
        shouldPlay: playback.shouldPlay,
      });
      
      // Verify playback after 200ms
      const verifyPlayback = setTimeout(async () => {
        try {
          const status = await soundObject?.getStatusAsync();
          if (status) {
            console.log('📊 Playback verification after 200ms:', {
              isPlaying: status.isPlaying,
              positionMillis: status.positionMillis,
              volume: status.volume,
            });
            if (!status.isPlaying) {
              console.warn('⚠️ WARNING: Sound is not playing! Status:', status);
            }
          }
        } catch (e) {
          console.warn('Could not verify playback:', e.message);
        }
      }, 200);

      // Stop after duration
      const stopTimer = setTimeout(async () => {
        try {
          if (soundObject) {
            await soundObject.stopAsync();
            console.log('⏹️ Sound stopped after duration');
          }
        } catch (err) {
          console.warn('⏹️ Error stopping sound:', err.message);
        }
      }, duration);

      // Store timers for cleanup
      soundObject._verifyTimer = verifyPlayback;
      soundObject._stopTimer = stopTimer;

    } catch (loadError) {
      console.error('❌ Error loading/playing audio file:', loadError.message);
      console.error('Stack:', loadError);
      // Fallback to haptic feedback
      console.log('📳 Falling back to haptic feedback');
      await playHapticFeedback();
    }
  } catch (error) {
    console.error('❌ Error in playTelephoneRing:', error);
    // Ultimate fallback
    await playHapticFeedback().catch(() => {});
  }
};

/**
 * Play haptic feedback (vibration) for trip alerts
 */
export const playHapticFeedback = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    console.log('📳 Haptic feedback triggered');
  } catch (error) {
    console.warn('❌ Haptic feedback not available:', error.message);
  }
};

/**
 * Play multiple rings for trip alert
 * @param {number} rings - Number of rings (default: 3)
 */
export const playTripAlert = async (rings = 3) => {
  try {
    console.log(`📞 TRIP ALERT: Playing ${rings} rings!`);
    for (let i = 0; i < rings; i++) {
      console.log(`📞 Ring ${i + 1}/${rings}`);
      await playTelephoneRing(2500);
      // Wait between rings for user to perceive them as separate rings
      if (i < rings - 1) {
        console.log('⏸️ Pause between rings...');
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
    console.log('✅ Trip alert sequence complete');
  } catch (error) {
    console.error('❌ Error playing trip alert:', error);
    // Fallback to haptic
    await playHapticFeedback().catch(() => {});
  }
};

/**
 * Quick alert pattern
 */
export const playQuickAlert = async () => {
  try {
    console.log('⚡ Quick alert triggered');
    await playTelephoneRing(2500);
  } catch (error) {
    console.warn('❌ Quick alert error:', error);
  }
};

/**
 * Play fixed number of alert sounds (NOT looping indefinitely)
 * @param {number} loops - Number of times to play the sound (default: 2)
 */
export const playLoopingAlert = async (loops = 2) => {
  try {
    // If already playing, don't restart
    if (isPlayingAlert && soundObject) {
      console.log('🔊 Alert already playing, skipping restart');
      return;
    }

    isPlayingAlert = true;

    // STEP 1: Set audio mode FIRST
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      console.log('🔊 Audio mode set for speaker');
    } catch (e) {
      console.warn('⚠️ Could not set audio mode:', e.message);
    }

    console.log(`📢 Playing ${loops} rings WITHOUT looping`);

    // STEP 2: Play multiple times sequentially
    for (let i = 0; i < loops; i++) {
      if (!soundObject) {
        soundObject = new Audio.Sound();
        const audioSource = require('../../assets/ring.mp3');
        
        await soundObject.loadAsync(audioSource);
        console.log(`✅ Sound loaded for ring ${i + 1}/${loops}`);
        
        await soundObject.setVolumeAsync(1.0);
        console.log(`🔊 Volume: 1.0 (MAXIMUM)`);
        
        // CRITICAL: DO NOT set looping - play once
        const status = await soundObject.getStatusAsync();
        const ringDuration = status.durationMillis || 6000; // 6 seconds
        console.log(`⏱️ Ring duration: ${ringDuration}ms`);
      }
      
      // Play this ring
      try {
        const playback = await soundObject.playAsync();
        console.log(`▶️ SOUND PLAYING (${i + 1}/${loops}):`, {
          isPlaying: playback.isPlaying,
          isLooping: playback.isLooping,
          volume: playback.volume,
          durationMillis: playback.durationMillis,
        });
        
        // Trigger vibration for this ring
        await triggerVibration();
        
        // Wait for ring to complete (6 seconds) + 2 second vibration
        await new Promise(resolve => setTimeout(resolve, 8000));
        
      } catch (playErr) {
        console.error(`❌ Error playing ring ${i + 1}:`, playErr);
      }
      
      // Add small pause between rings (except after last ring)
      if (i < loops - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // CRITICAL: Stop and unload after all rings are done
    isPlayingAlert = false;
    if (soundObject) {
      try {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        soundObject = null;
        console.log(`✅ All ${loops} rings complete - sound stopped and unloaded`);
      } catch (cleanupErr) {
        console.warn('⚠️ Error during cleanup:', cleanupErr);
      }
    }

  } catch (error) {
    console.error('❌ Error in playLoopingAlert:', error);
    isPlayingAlert = false;
    if (soundObject) {
      try {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        soundObject = null;
      } catch (cleanupErr) {
        console.warn('⚠️ Cleanup error:', cleanupErr);
      }
    }
    console.log('⚠️ Falling back to haptic feedback');
    await playHapticFeedback().catch(() => {});
  }
};

/**
 * Stop any vibration
 */
const stopVibration = () => {
  try {
    Vibration.cancel();
    console.log('🔇 Vibration stopped');
  } catch (error) {
    return;
  }
};

/**
 * Stop any playing sound
 */
export const stopSound = async () => {
  try {
    isPlayingAlert = false;
    stopVibration();
    
    if (soundObject) {
      // Check if sound is actually loaded before trying to stop
      try {
        const status = await soundObject.getStatusAsync();
        if (status && status.isLoaded) {
          if (soundObject._vibrationInterval) {
            clearInterval(soundObject._vibrationInterval);
            console.log('🔇 Vibration interval cleared');
          }
          
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
          console.log('🔇 Sound stopped and unloaded');
        }
      } catch (statusErr) {
        console.warn('⚠️ Could not get sound status:', statusErr.message);
      }
      
      soundObject = null;
    } else {
      console.log('⚠️ No sound object to stop');
    }
  } catch (error) {
    console.error('❌ Error stopping sound:', error.message);
  }
};

/**
 * Play success sound
 */
export const playSuccessSound = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('✅ Success haptic');
  } catch (error) {
    console.warn('❌ Success error:', error.message);
  }
};

/**
 * Play error sound
 */
export const playErrorSound = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    console.log('❌ Error haptic');
  } catch (error) {
    console.warn('❌ Error haptic error:', error);
  }
};

/**
 * Clean up
 */
export const cleanup = async () => {
  try {
    // Don't unload sound here - we need it to persist during navigation
    // Only stop if explicitly called
    console.log('✅ Sound service cleanup (preserving sound for navigation)');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
};
