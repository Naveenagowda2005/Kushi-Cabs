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
  let localSoundObject = null;
  try {
    // Create a NEW sound object local to this function
    localSoundObject = new Audio.Sound();
    console.log('🔔 Creating new sound object for playTelephoneRing');

    try {
      console.log('🔔 Loading telephone ring audio from assets');
      
      // Direct require path to audio file
      const audioSource = require('../../assets/ring.mp3');
      console.log('📂 Audio source loaded:', typeof audioSource);
      
      const loadResult = await localSoundObject.loadAsync(audioSource);
      console.log('✅ Sound loaded successfully');
      
      // Verify load completed
      if (!loadResult || !loadResult.isLoaded) {
        console.warn('⚠️ Load returned but sound not marked as loaded, getting fresh status...');
        const freshStatus = await localSoundObject.getStatusAsync();
        if (!freshStatus.isLoaded) {
          throw new Error('Sound failed to load - status check shows not loaded');
        }
      }
      
      // CRITICAL: Set volume BEFORE playing
      await localSoundObject.setVolumeAsync(1.0);
      console.log('🔊 Volume set to maximum (1.0)');
      
      // Get status before playing
      const statusBefore = await localSoundObject.getStatusAsync();
      console.log('📊 Status before playback:', {
        isLoaded: statusBefore.isLoaded,
        volume: statusBefore.volume,
        isMuted: statusBefore.isMuted,
        shouldPlay: statusBefore.shouldPlay,
        duration: statusBefore.durationMillis,
      });
      
      // Verify sound is actually loaded before attempting playback
      if (!statusBefore.isLoaded) {
        throw new Error('Sound failed to load - cannot proceed with playback');
      }
      
      // Play with explicit options
      console.log('▶️ Starting playback...');
      const playback = await localSoundObject.playAsync();
      console.log('▶️ Playback status:', {
        isPlaying: playback.isPlaying,
        volume: playback.volume,
        positionMillis: playback.positionMillis,
        shouldPlay: playback.shouldPlay,
      });
      
      // Verify playback after 200ms
      const verifyPlayback = setTimeout(async () => {
        try {
          const status = await localSoundObject?.getStatusAsync();
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
          if (localSoundObject) {
            await localSoundObject.stopAsync();
            console.log('⏹️ Sound stopped after duration');
          }
        } catch (err) {
          console.warn('⏹️ Error stopping sound:', err.message);
        }
      }, duration);

      // Store timers for cleanup
      if (localSoundObject) {
        localSoundObject._verifyTimer = verifyPlayback;
        localSoundObject._stopTimer = stopTimer;
      }

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
  } finally {
    // Clean up after duration
    setTimeout(async () => {
      try {
        if (localSoundObject) {
          await localSoundObject.stopAsync();
          await localSoundObject.unloadAsync();
        }
      } catch (e) {
        console.warn('Cleanup error:', e.message);
      }
    }, duration + 500);
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
  let localSoundObject = null;
  
  try {
    // If already playing, don't restart
    if (isPlayingAlert) {
      console.log('🔊 Alert already playing, skipping restart');
      return;
    }

    isPlayingAlert = true;
    console.log(`📢 Starting ${loops} alert rings`);

    // STEP 1: Set audio mode ONCE at the beginning
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      console.log('🔊 Audio mode configured');
    } catch (e) {
      console.warn('⚠️ Audio mode config failed:', e.message);
    }

    // STEP 2: Load sound ONCE and reuse it
    try {
      localSoundObject = new Audio.Sound();
      const audioSource = require('../../assets/ring.mp3');
      
      console.log('📂 Loading sound asset...');
      const loadResult = await localSoundObject.loadAsync(audioSource);
      console.log(`✅ Sound loaded. Duration: ${loadResult.durationMillis}ms, isLoaded: ${loadResult.isLoaded}`);
      
      // Use the load result directly
      if (!loadResult.isLoaded) {
        throw new Error('Sound failed to load properly');
      }

      // Set volume once
      await localSoundObject.setVolumeAsync(1.0);
      console.log('🔊 Volume set to maximum');

      // STEP 3: Play the sound multiple times
      for (let i = 0; i < loops; i++) {
        try {
          console.log(`\n▶️ Playing ring ${i + 1}/${loops}`);
          
          // Check status before playing
          const preStatus = await localSoundObject.getStatusAsync();
          console.log(`Pre-play status - isLoaded: ${preStatus.isLoaded}, isPlaying: ${preStatus.isPlaying}`);
          
          // Verify sound is loaded before attempting playback
          if (!preStatus.isLoaded) {
            console.warn('⚠️ Sound not fully loaded, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 200));
            const retryStatus = await localSoundObject.getStatusAsync();
            if (!retryStatus.isLoaded) {
              throw new Error('Sound failed to load after retry');
            }
          }
          
          // If sound is still playing, wait for it to finish
          if (preStatus.isPlaying) {
            console.log('⏸️ Waiting for previous playback to finish...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Reset to beginning and play
          await localSoundObject.setPositionAsync(0);
          
          // Verify sound status one more time before playing
          const finalPrePlayStatus = await localSoundObject.getStatusAsync();
          if (!finalPrePlayStatus.isLoaded) {
            throw new Error('Sound unloaded before playback attempt');
          }
          
          const playStatus = await localSoundObject.playAsync();
          
          console.log(`✅ Ring ${i + 1} playing:`, {
            isPlaying: playStatus.isPlaying,
            volume: playStatus.volume,
            durationMillis: playStatus.durationMillis,
          });

          // Wait for ring to complete
          const ringDuration = playStatus.durationMillis || 6000;
          await new Promise(resolve => setTimeout(resolve, ringDuration));

          // Stop playback
          await localSoundObject.stopAsync();
          console.log(`⏹️ Ring ${i + 1} stopped`);

        } catch (ringErr) {
          console.error(`❌ Error on ring ${i + 1}:`, ringErr.message);
          // Fallback to haptic feedback instead of continuing with broken audio
          await playHapticFeedback().catch(() => {});
          // Don't continue to next ring if sound is broken
          break;
        }

        // Pause between rings
        if (i < loops - 1) {
          console.log('⏸️ Pause between rings...');
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      console.log(`\n✅ All ${loops} rings complete`);

    } catch (loadErr) {
      console.error('❌ Sound load/play error:', loadErr.message);
      console.log('📳 Falling back to haptic feedback');
      await playHapticFeedback().catch(() => {});
    }

  } catch (error) {
    console.error('❌ Critical error in playLoopingAlert:', error.message);
    await playHapticFeedback().catch(() => {});
  } finally {
    // Cleanup
    try {
      if (localSoundObject) {
        await localSoundObject.stopAsync();
        await localSoundObject.unloadAsync();
        localSoundObject = null;
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Cleanup error:', cleanupErr.message);
    }
    isPlayingAlert = false;
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
