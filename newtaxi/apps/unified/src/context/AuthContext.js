import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { ROLES, API_CONFIG } from '../constants';
import { createActiveSession, isSessionStillActive, updateSessionActivity, endCurrentSession, listenForSessionInvalidation } from '../services/sessionService';
import { getDeviceInfo } from '../services/deviceService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [incompleteSignupPhone, setIncompleteSignupPhone] = useState(null);
  const [incompleteSignupUserId, setIncompleteSignupUserId] = useState(null);
  const [incompleteDriverDocuments, setIncompleteDriverDocuments] = useState(false);
  const [sessionListener, setSessionListener] = useState(null);
  const [forceResetMode, setForceResetMode] = useState(false); // NEW: For fresh start
  const fetchingRef = React.useRef(false);

  console.log('AuthProvider: Initializing...');

  // MOCK DATA FOR DEVELOPMENT (when Supabase is down)
  const mockDriver = {
    id: 'mock-driver-123',
    email: 'driver@test.local',
    full_name: 'Test Driver',
    phone: '9686314982',
    role_id: 2,
    is_active: true,
    roles: { name: 'driver' }
  };

  const mockVendor = {
    id: 'mock-vendor-123',
    email: 'vendor@test.local',
    full_name: 'Test Vendor',
    phone: '9876543210',
    role_id: 3,
    is_active: true,
    roles: { name: 'vendor' }
  };

  const mockSession = {
    user: { id: 'mock-user-123' }
  };

  useEffect(() => {
    console.log('AuthProvider: useEffect starting...');
    
    const initAuth = async () => {
      try {
        console.log('AuthProvider: initAuth starting...');
        
        // Check for super admin session in AsyncStorage first (React Native)
        try {
          const superAdminSessionStr = await AsyncStorage.getItem('superAdminSession');
          console.log('AuthProvider: Checking AsyncStorage for superAdminSession:', !!superAdminSessionStr);
          
          if (superAdminSessionStr) {
            console.log('AuthProvider: Found super admin session in AsyncStorage');
            const superAdminSession = JSON.parse(superAdminSessionStr);
            console.log('AuthProvider: Parsed session:', { 
              hasUserId: !!superAdminSession?.user?.id,
              email: superAdminSession?.user?.email 
            });
            
            // ✅ SET SESSION FIRST - this is critical!
            console.log('AuthProvider: Setting session from AsyncStorage');
            setSession(superAdminSession);
            console.log('AuthProvider: Session set, now fetching profile');
            
            if (superAdminSession?.user?.id) {
              console.log('AuthProvider: Restoring user profile from session');
              await fetchUserProfile(superAdminSession.user.id);
              console.log('AuthProvider: User profile restored');
              console.log('AuthProvider: Session persisted, hasSession will now return true');
              return; // Early return if super admin session restored
            }
          }
        } catch (e) {
          console.log('AuthProvider: Could not restore super admin session:', e.message);
        }
        
        // Check for OTP user session in AsyncStorage (vendor/driver)
        try {
          const otpSessionStr = await AsyncStorage.getItem('otpUserSession');
          console.log('AuthProvider: Checking AsyncStorage for otpUserSession:', !!otpSessionStr);
          
          if (otpSessionStr) {
            console.log('AuthProvider: Found OTP user session in AsyncStorage');
            const otpSession = JSON.parse(otpSessionStr);
            console.log('AuthProvider: Parsed OTP session:', { 
              hasUserId: !!otpSession?.user?.id,
              email: otpSession?.user?.email 
            });
            
            // ✅ SET SESSION FIRST
            console.log('AuthProvider: Setting OTP session from AsyncStorage');
            setSession(otpSession);
            console.log('AuthProvider: OTP session set, now fetching profile');
            
            if (otpSession?.user?.id) {
              console.log('AuthProvider: Restoring OTP user profile from session');
              await fetchUserProfile(otpSession.user.id);
              console.log('AuthProvider: OTP user profile restored');
              console.log('AuthProvider: OTP session persisted, hasSession will now return true');
              return; // Early return if OTP session restored
            }
          }
        } catch (e) {
          console.log('AuthProvider: Could not restore OTP user session:', e.message);
        }
        
        console.log('AuthProvider: No AsyncStorage session found, checking Supabase...');
        
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        console.log('AuthProvider: Got Supabase session result:', { hasSession: !!session, error: error?.message });
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('AuthProvider: Setting Supabase session');
        setSession(session);
        if (session?.user) {
          console.log('AuthProvider: Session found, fetching profile');
          await fetchUserProfile(session.user.id);
        } else {
          console.log('AuthProvider: No session, clearing everything');
          setUser(null);
          setSelectedRole(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('AuthProvider: Exception getting session:', err.message);
        setLoading(false);
      }
    };
    
    initAuth();

    // Listen for auth changes
    try {
      console.log('AuthProvider: Setting up auth listener...');
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, supabaseSession) => {
          console.log('AuthProvider: Auth state change:', event, !!supabaseSession);
          
          // Check if this is a Supabase session (has JWT token) or if we already have super admin mock session
          // If there's no Supabase session and event is INITIAL_SESSION, leave the super admin mock session alone
          if (!supabaseSession && event === 'INITIAL_SESSION') {
            console.log('AuthProvider: INITIAL_SESSION with no Supabase session - keeping existing session (super admin mock)');
            return; // Don't clear the existing super admin mock session
          }
          
          setSession(supabaseSession);
          
          if (supabaseSession?.user) {
            if (event === 'TOKEN_REFRESHED' && fetchingRef.current) return;
            await fetchUserProfile(supabaseSession.user.id);
          } else {
            console.log('AuthProvider: No Supabase session, clearing user and role');
            setUser(null);
            setSelectedRole(null);
            setLoading(false);
          }
        }
      );

      console.log('AuthProvider: Auth listener set up successfully');
      return () => subscription?.unsubscribe();
    } catch (err) {
      console.error('AuthProvider: Error setting up auth listener:', err);
    }
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      console.log('fetchUserProfile: Starting for user:', userId);
      fetchingRef.current = true;

      // Create timeout with longer delay and better error handling
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          console.warn('fetchUserProfile: Supabase timeout detected');
          reject(new Error('Profile fetch timed out'));
        }, 10000);
      });

      const queryPromise = supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          role_id,
          is_active,
          push_token,
          verification_status,
          created_at,
          roles (
            name
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      let data, error;
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        data = result.data;
        error = result.error;
      } catch (raceError) {
        clearTimeout(timeoutId);
        throw raceError;
      }

      console.log('fetchUserProfile: Query result:', { 
        hasData: !!data,
        error: error?.message,
        dataId: data?.id
      });

      if (error) {
        console.error('fetchUserProfile: Error fetching user profile:', error);
        setUser(null);
        setIncompleteDriverDocuments(false);
        setLoading(false);
      } else if (data) {
        console.log('fetchUserProfile: Got user data, setting user:', data.id, data.roles?.name);
        // Set user state
        setUser(data);
        
        // Check if this is a driver with incomplete documents
        if (data.roles?.name === 'driver') {
          try {
            const { data: verificationStatus, error: verifyError } = await supabase
              .from('driver_verification_status')
              .select('overall_status, all_documents_submitted')
              .eq('driver_id', data.id)
              .maybeSingle();
            
            if (verifyError && verifyError.code !== 'PGRST116') {
              console.error('fetchUserProfile: Error checking driver verification:', verifyError);
            }
            
            console.log('fetchUserProfile: Driver verification status:', verificationStatus?.overall_status);
            
            // Mark as incomplete ONLY if:
            // 1. Documents are rejected, OR
            // 2. Documents are not all submitted AND status is NOT approved
            if (verificationStatus?.overall_status === 'rejected') {
              console.log('fetchUserProfile: Driver has rejected documents, setting flag');
              setIncompleteDriverDocuments(true);
            } else if (!verificationStatus?.all_documents_submitted && verificationStatus?.overall_status !== 'approved') {
              console.log('fetchUserProfile: Driver has incomplete documents, setting flag');
              setIncompleteDriverDocuments(true);
            } else if (verificationStatus?.overall_status === 'approved') {
              console.log('fetchUserProfile: Driver is approved, clearing incomplete flag');
              setIncompleteDriverDocuments(false);
            } else {
              console.log('fetchUserProfile: Driver status is pending, clearing incomplete flag');
              setIncompleteDriverDocuments(false);
            }
          } catch (err) {
            console.log('fetchUserProfile: Could not check driver verification:', err.message);
            setIncompleteDriverDocuments(false);
          }
        } else {
          setIncompleteDriverDocuments(false);
        }
        
        if (data.roles?.name) {
          console.log('fetchUserProfile: Auto-selecting role:', data.roles.name);
          setSelectedRole(data.roles.name);
        }
        console.log('fetchUserProfile: User and role set, now setting loading to false');
        // IMPORTANT: Set loading to false AFTER user is set
        setLoading(false);
        console.log('fetchUserProfile: Loading set to false');
      } else {
        console.log('fetchUserProfile: No user profile found');
        setUser(null);
        setIncompleteDriverDocuments(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('fetchUserProfile: Exception:', err.message);
      
      // WORKAROUND: If timeout due to Supabase outage, use mock data for development
      if (err.message && err.message.includes('timed out')) {
        console.warn('⚠️ Supabase connection timeout - Using mock data for development');
        const mockUser = {
          id: 'mock-driver-dev',
          email: 'driver@test.local',
          full_name: 'Test Driver',
          phone: '+919876543210',
          role_id: 2,
          is_active: true,
          roles: { name: 'driver' }
        };
        setUser(mockUser);
        setSelectedRole('driver');
        setLoading(false);
        return;
      }
      
      setUser(null);
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  };

  const refreshUserProfile = async () => {
    if (session?.user?.id) {
      console.log('Unified refreshUserProfile called for user:', session.user.id);
      await fetchUserProfile(session.user.id);
    } else {
      console.log('Unified refreshUserProfile: No session or user ID available');
    }
  };

  const setupSessionInvalidationListener = async (userId) => {
    if (!userId) {
      console.warn('AuthContext: Cannot setup listener without user ID');
      return;
    }

    try {
      const deviceInfo = await getDeviceInfo();
      console.log('AuthContext: Setting up periodic session validation for user:', userId);

      // Check session every 5 seconds instead of relying on real-time
      const checkInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase.rpc('is_session_active', {
            p_user_id: userId,
            p_device_id: deviceInfo.deviceId,
          });

          if (error) {
            console.warn('AuthContext: Error checking session:', error.message);
            return;
          }

          console.log('AuthContext: Session check - is_active:', data);

          if (!data) {
            console.warn('AuthContext: ⚠️ Current session has been invalidated! Logging out...');
            clearInterval(checkInterval);
            
            // Force logout
            Alert.alert(
              'Session Ended',
              'You have been logged in from another device. Your session has ended.',
              [
                {
                  text: 'OK',
                  onPress: async () => {
                    await signOut();
                  },
                },
              ]
            );
          }
        } catch (err) {
          console.warn('AuthContext: Warning during session check:', err.message);
        }
      }, 5000); // Check every 5 seconds

      // Store the interval ID so we can clear it later
      setSessionListener(checkInterval);
      console.log('AuthContext: ✅ Session validation check ACTIVE');

      return () => {
        console.log('AuthContext: Clearing session validation interval');
        clearInterval(checkInterval);
      };
    } catch (error) {
      console.error('AuthContext: Error setting up session check:', error.message);
    }
  };

  const signIn = async (identifier, password, role) => {
    try {
      setLoading(true);
      console.log('Unified AuthContext: Attempting sign in - identifier:', identifier, 'role:', role);
      
      // SUPER_ADMIN uses phone-based OTP authentication (like drivers)
      if (role === ROLES.SUPER_ADMIN) {
        console.log('Super Admin login attempt with phone:', identifier);
        
        // Convert phone to digits only
        const phoneDigits = identifier.replace(/[^0-9]/g, '');
        
        if (phoneDigits.length !== 10) {
          throw new Error('Please enter a valid 10-digit phone number');
        }
        
        console.log('Super Admin: Phone digits:', phoneDigits);
        
        // OTP verification already happened (SMS was verified)
        // The 'password' parameter here is actually the OTP code from SMS
        console.log('Super Admin: OTP already verified via SMS');
        
        // For super_admin, verify phone exists in database and has super_admin role
        const { data: adminData, error: adminError } = await supabase
          .from('users')
          .select('id, email, phone, full_name, role_id, roles(name)')
          .eq('phone', phoneDigits)
          .maybeSingle();

        if (adminError && adminError.code !== 'PGRST116') {
          throw adminError;
        }

        if (!adminData) {
          throw new Error('Admin not found. Please check phone number.');
        }

        console.log('Super Admin found in database:', adminData);

        // Verify it's actually a super_admin
        if (adminData.roles?.name !== ROLES.SUPER_ADMIN) {
          throw new Error('This account is not a super admin account.');
        }

        console.log('Super Admin verified - OTP was already verified via SMS');

        // For super admin, create mock session (OTP verification is sufficient)
        // We set both session and user from database
        const mockSession = {
          user: {
            id: adminData.id,
            email: adminData.email,
            phone: adminData.phone,
          },
          access_token: 'super-admin-verified',
          token_type: 'bearer',
        };

        // Create active session for this device
        try {
          const sessionResult = await createActiveSession(adminData.id);
          console.log('Super Admin: Active session created:', sessionResult);
          
          if (sessionResult.wasOtherSessionInvalidated) {
            console.log('Super Admin: Previous sessions have been invalidated');
          }
        } catch (sessionError) {
          console.error('Super Admin: Warning - could not create session:', sessionError.message);
          // Continue anyway - session tracking is not critical for login
        }

        // Set both session and user - this allows app to navigate
        console.log('Super Admin: Setting session and user state');
        setSession(mockSession);
        setUser(adminData);
        if (adminData.roles?.name) {
          console.log('Super Admin: Setting selected role:', adminData.roles.name);
          setSelectedRole(adminData.roles.name);
        }
        
        // Setup real-time listener for session invalidation
        await setupSessionInvalidationListener(adminData.id);
        
        // Persist super admin session to AsyncStorage for persistence across reloads
        try {
          await AsyncStorage.setItem('superAdminSession', JSON.stringify(mockSession));
          console.log('Super Admin: Session persisted to AsyncStorage');
          const stored = await AsyncStorage.getItem('superAdminSession');
          console.log('Super Admin: Verification - AsyncStorage contains:', !!stored);
        } catch (e) {
          console.warn('Super Admin: Could not persist session to AsyncStorage:', e.message);
        }
        
        console.log('Super Admin: Session and user set - redirecting to dashboard');
        setLoading(false);
        
        return { data: { user: adminData, session: mockSession }, error: null };
      }
      
      // For DRIVER or VENDOR - use phone-based OTP email
      console.log('OTP-verified login with phone:', identifier, 'role:', role);
      
      const phoneDigits = identifier.replace(/[^0-9]/g, '');
      const email = `${phoneDigits}@kushicabs.phone`;
      
      console.log('OTP login email:', email);
      
      // Verify user exists in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, phone, role_id, roles(name)')
        .eq('phone', phoneDigits)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (!userData) {
        throw new Error('User not found. Please sign up first.');
      }

      console.log('User found in database:', userData);

      // ✅ CRITICAL: Validate that the requested role matches the user's actual role
      // This prevents vendors from logging in via driver login (and vice versa)
      if (userData.roles?.name !== role) {
        const actualRole = userData.roles?.name || 'unknown';
        console.error(`❌ Role mismatch: User is a ${actualRole} but trying to login as ${role}`);
        throw new Error(
          `This account is registered as a ${actualRole}. Please use the ${actualRole} login instead.`
        );
      }

      console.log('✅ Role validation passed:', role);

      // For drivers, check if documents are approved before allowing login
      if (userData.roles?.name === 'driver') {
        try {
          const { data: verificationStatus, error: verifyError } = await supabase
            .from('driver_verification_status')
            .select('overall_status, all_documents_submitted')
            .eq('driver_id', userData.id)
            .maybeSingle();
          
          if (verifyError && verifyError.code !== 'PGRST116') {
            throw verifyError;
          }
          
          // Check document verification status
          if (verificationStatus) {
            console.log('Driver verification status:', verificationStatus?.overall_status, 'documents_submitted:', verificationStatus?.all_documents_submitted);
            
            // If already approved, allow login immediately (handles dummy drivers)
            if (verificationStatus.overall_status === 'approved') {
              console.log('Driver is approved - allowing login');
            } else if (verificationStatus.overall_status === 'rejected') {
              // Documents rejected, mark as incomplete so they can re-upload
              console.log('Driver has rejected documents - marking as incomplete');
              setIncompleteDriverDocuments(true);
            } else if (!verificationStatus.all_documents_submitted) {
              // Documents not yet submitted OR incomplete, allow login but mark as incomplete
              console.log('Driver has incomplete documents - setting flag');
              setIncompleteDriverDocuments(true);
            } else {
              // Documents submitted but pending review
              setIncompleteDriverDocuments(false);
            }
            // ALL other statuses (pending_review, pending, rejected) → allow login
            // DriverNavigator will show the correct screen based on status
          } else {
            // No verification status record - new driver, must upload documents
            console.log('Driver has no verification record - marking as incomplete');
            setIncompleteDriverDocuments(true);
          }
        } catch (err) {
          console.log('Could not verify document status:', err.message);
          setIncompleteDriverDocuments(false);
        }
      }

      // Create active session for this device
      try {
        const sessionResult = await createActiveSession(userData.id);
        console.log('OTP User: Active session created:', sessionResult);
        
        if (sessionResult.wasOtherSessionInvalidated) {
          console.log('OTP User: Previous sessions have been invalidated - user will be logged out from other devices');
        }
      } catch (sessionError) {
        console.error('OTP User: Warning - could not create session:', sessionError.message);
        // Continue anyway - session tracking is not critical for login
      }

      // Authenticate OTP user with Supabase
      console.log('Authenticating OTP user with Supabase');
      
      // For OTP users, we don't use password authentication
      // Instead, we authenticate directly with the user data from database
      // since OTP verification already happened on the backend
      
      // Create a mock session for OTP-verified users
      const mockSession = {
        user: {
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
        },
        access_token: 'otp-verified-' + userData.id,
        token_type: 'bearer',
      };
      
      console.log('OTP user authenticated with mock session');
      setSession(mockSession);
      setUser(userData);
      if (userData.roles?.name) {
        setSelectedRole(userData.roles.name);
      }
      
      // Setup real-time listener for session invalidation
      await setupSessionInvalidationListener(userData.id);
      
      // Persist OTP session to AsyncStorage (like super admin)
      try {
        await AsyncStorage.setItem('otpUserSession', JSON.stringify(mockSession));
        console.log('OTP user session persisted to AsyncStorage');
      } catch (e) {
        console.warn('Could not persist OTP session to AsyncStorage:', e.message);
      }
      
      setLoading(false);
      return { data: { user: userData, session: mockSession }, error: null };
    } catch (error) {
      console.error('Unified Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (identifier, password, role) => {
    try {
      setLoading(true);
      console.log('Unified AuthContext: Attempting sign up with:', identifier, 'role:', role);

      if (role !== ROLES.SUPER_ADMIN) {
        const phoneDigits = identifier.replace(/[^0-9]/g, '');

        // Check if this phone number is already fully registered in DB
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, phone, roles(name)')
          .eq('phone', phoneDigits)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existingUser) {
          throw new Error(
            `This phone number is already registered as ${existingUser.roles?.name || 'a user'}. Please login instead.`
          );
        }

        // Use backend to create/reset the auth account with a KNOWN password
        console.log('Calling backend to create/reset auth account...');
        const response = await fetch(`${API_CONFIG.SMS_API_URL}/admin/create-driver-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneDigits }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to create account');
        }

        // Check for stuck registration recovery
        if (result.warning === 'STUCK_REGISTRATION_RECOVERED') {
          console.log('⚠️ Recovered stuck registration for:', phoneDigits);
          console.log('User will need to complete profile creation');
        }

        console.log('✅ Auth account ready. userId:', result.userId);

        // Now sign in with the known password the backend set
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: result.email,
          password: `OTP-${phoneDigits}-kushicabs`,
        });

        if (signInError) throw signInError;

        console.log('✅ Signed in successfully after account creation');

        // Store everything needed for profile creation
        setSession(signInData.session);
        setIncompleteSignupUserId(signInData.user.id);

        return { data: signInData, error: null };
      }

      // Super Admin path (email-based)
      const { data, error } = await supabase.auth.signUp({ email: identifier, password });
      if (error) throw error;
      return { data, error: null };

    } catch (error) {
      console.error('Unified Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🔄 signOut: Starting logout process');
      
      // Clear session validation interval
      if (sessionListener) {
        console.log('AuthContext: Clearing session validation interval');
        try {
          clearInterval(sessionListener);
        } catch (e) {
          console.warn('Could not clear session interval:', e.message);
        }
        setSessionListener(null);
      }
      
      // End the active session for this device
      if (user?.id) {
        try {
          await endCurrentSession(user.id);
          console.log('Session ended successfully');
        } catch (sessionError) {
          console.error('Warning - could not end session:', sessionError.message);
          // Continue anyway - not critical
        }
      }
      
      // Clear super admin session from AsyncStorage
      try {
        await AsyncStorage.removeItem('superAdminSession');
        console.log('Super admin session cleared from AsyncStorage');
      } catch (e) {
        console.warn('Could not clear super admin session from AsyncStorage:', e.message);
      }
      
      // Clear OTP user session from AsyncStorage
      try {
        await AsyncStorage.removeItem('otpUserSession');
        console.log('OTP user session cleared from AsyncStorage');
      } catch (e) {
        console.warn('Could not clear OTP user session from AsyncStorage:', e.message);
      }

      // Clear incomplete signup data
      try {
        setIncompleteSignupUserId(null);
        setIncompleteSignupPhone(null);
        console.log('Incomplete signup data cleared');
      } catch (e) {
        console.warn('Could not clear incomplete signup data:', e.message);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      setSelectedRole(null);
      setForceResetMode(true); // NEW: Enable force reset mode
      console.log('Unified: Successfully signed out and cleared state');
    } catch (error) {
      console.error('Unified Sign out error:', error);
      setForceResetMode(true); // NEW: Enable force reset mode even on error
    } finally {
      setLoading(false);
    }
  };

  // Clear stuck registration for current session
  const clearStuckRegistration = async () => {
    try {
      console.log('🔄 clearStuckRegistration: Clearing stuck registration session');
      
      // Clear incomplete signup data
      setIncompleteSignupUserId(null);
      setIncompleteSignupPhone(null);
      
      // Clear current session
      setSession(null);
      setUser(null);
      setSelectedRole(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('Warning during signOut:', error.message);
      
      console.log('✅ Stuck registration cleared - user can start fresh');
      return { success: true };
    } catch (error) {
      console.error('Error clearing stuck registration:', error);
      return { success: false, error };
    }
  };

  // NEW: Force reset function for fresh start
  const forceReset = async () => {
    try {
      console.log('🔄 forceReset: Performing complete reset');
      
      // Sign out
      await supabase.auth.signOut().catch(e => console.log('SignOut error (expected):', e.message));
      
      // Clear all state
      setSession(null);
      setUser(null);
      setSelectedRole(null);
      setIncompleteSignupPhone(null);
      setIncompleteSignupUserId(null);
      setIncompleteDriverDocuments(false);
      setForceResetMode(true);
      
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      console.log('✅ forceReset: Complete reset finished');
      setLoading(false);
    } catch (error) {
      console.error('❌ forceReset: Error:', error);
      setForceResetMode(true);
      setLoading(false);
    }
  };

  const clearRoleSelection = () => {
    console.log('Unified: Clearing role selection');
    setSelectedRole(null);
  };

  const createUserProfile = async (userData, role) => {
    try {
      console.log('Unified createUserProfile: Starting profile creation for role:', role);

      const userId = session?.user?.id || incompleteSignupUserId;
      if (!userId) throw new Error('No authenticated user - please try signing up again');

      const phone = userData.phone || incompleteSignupPhone || '';
      const email = session?.user?.email || `${phone}@kushicabs.phone`;

      console.log('Unified createUserProfile: userId:', userId, 'phone:', phone);

      // Verify we have a valid session/user context
      if (!session?.user) {
        throw new Error('No valid session. Please try signing up again.');
      }

      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleError) throw roleError;

      const { data, error } = await supabase
        .from('users')
        .upsert(
          { id: userId, email, role_id: roleData.id, full_name: userData.full_name, phone, is_active: true },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        // Check if it's a foreign key constraint error
        if (error.code === '23503' && error.message.includes('users_id_fkey')) {
          console.error('Unified createUserProfile: Foreign key error - auth user may not exist');
          throw new Error(
            'User authentication failed. The auth account was not properly created. Please try registering again.'
          );
        }
        throw error;
      }
      console.log('Unified createUserProfile: User profile upserted:', data);

      if (role === ROLES.VENDOR) {
        console.log('Unified createUserProfile: Upserting vendor profile');
        const { error: vendorError } = await supabase
          .from('vendors')
          .upsert(
            {
              user_id: userId,
              company_name: userData.business_name,
              commission_pct: 10,
            },
            { onConflict: 'user_id' }
          );

        if (vendorError) throw vendorError;
        console.log('Unified createUserProfile: Vendor profile upserted');
        await refreshUserProfile();
      } else if (role === ROLES.DRIVER) {
        console.log('Unified createUserProfile: Upserting driver profile');
        const { error: driverError } = await supabase
          .from('drivers')
          .upsert(
            {
              user_id: userId,
              license_number: userData.license_number,
              vehicle_number: userData.vehicle_number,
              is_available: true,
              is_online: false,
            },
            { onConflict: 'user_id' }
          );

        if (driverError) throw driverError;
        console.log('Unified createUserProfile: Driver profile upserted');
      }
      
      console.log('Unified createUserProfile: Profile creation completed successfully');
      
      return { data, error: null };
    } catch (error) {
      console.error('Unified createUserProfile error:', error);
      return { data: null, error };
    }
  };

  const getUserRole = () => {
    return user?.roles?.name || selectedRole;
  };

  const isSuperAdmin = () => {
    return getUserRole() === ROLES.SUPER_ADMIN;
  };

  const isVendor = () => {
    return getUserRole() === ROLES.VENDOR;
  };

  const isDriver = () => {
    return getUserRole() === ROLES.DRIVER;
  };

  const hasSession = () => {
    return !!session;
  };

  const hasUser = () => {
    return !!user;
  };

  const resetRoleSelection = () => {
    console.log('Unified: Resetting role selection');
    setSelectedRole(null);
  };

  const value = {
    session,
    user,
    loading,
    selectedRole,
    setSelectedRole,
    resetRoleSelection,
    incompleteSignupPhone,
    setIncompleteSignupPhone,
    incompleteSignupUserId,
    setIncompleteSignupUserId,
    incompleteDriverDocuments,
    setIncompleteDriverDocuments,
    signIn,
    signUp,
    signOut,
    forceReset, // NEW: For fresh start
    disableForceResetMode: () => setForceResetMode(false), // NEW: Exit force reset mode
    clearStuckRegistration, // NEW: Clear stuck registration
    createUserProfile,
    refreshUserProfile,
    getUserRole,
    isSuperAdmin,
    isVendor,
    isDriver,
    hasSession,
    hasUser,
    forceResetMode, // NEW: For fresh start
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
